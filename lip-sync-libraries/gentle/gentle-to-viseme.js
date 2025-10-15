import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import {
  convertGentleToVisemes,
  formatVisemeData,
  getVisemeDescription
} from '../../utilities/phoneme-to-viseme.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Converts an audio file to viseme map using GentleJS forced aligner
 * Requires both audio and transcript for accurate phoneme alignment
 * 
 * @param {string} audioPath - Path to the input audio file (MP3, WAV, OGG)
 * @param {string} transcriptPath - Path to the transcript text file
 * @param {string} outputJsonPath - Path where the JSON viseme map will be saved
 * @param {Object} options - Optional configuration
 * @param {string} options.gentleResourcesPath - Path to Gentle resources directory
 * @param {number} options.nthreads - Number of threads for alignment (default: CPU count)
 * @param {boolean} options.conservative - Use conservative alignment (default: true)
 * @param {boolean} options.disfluency - Include disfluencies (uh, um) in alignment (default: false)
 * @param {Array<string>} options.disfluencies - List of disfluency words (default: ['uh', 'um'])
 * @param {number} options.minDuration - Minimum duration for viseme cues in seconds (default: 0.03)
 * @param {boolean} options.keepTempFiles - Keep temporary WAV file (default: false)
 * @param {boolean} options.logging - Enable verbose logging (default: false)
 * @param {Function} options.progress - Progress callback function
 * @returns {Promise<Object>} The viseme map data
 */
async function convertAudioToViseme(audioPath, transcriptPath, outputJsonPath, options = {}) {
  const {
    gentleResourcesPath = process.env.GENTLE_RESOURCES_ROOT,
    nthreads = os.cpus().length,
    conservative = true,
    disfluency = false,
    disfluencies = ['uh', 'um'],
    minDuration = 0.03,
    keepTempFiles = false,
    logging = false,
    progress = null
  } = options;

  // Validate Gentle resources path
  if (!gentleResourcesPath) {
    throw new Error(
      'Gentle resources path not set. Please:\n' +
      '  1. Download Gentle from: https://github.com/lowerquality/gentle\n' +
      '  2. Set GENTLE_RESOURCES_ROOT environment variable to the Gentle directory\n' +
      '  Example: export GENTLE_RESOURCES_ROOT=/path/to/gentle'
    );
  }

  // Validate files exist
  try {
    await fs.access(audioPath);
  } catch (error) {
    throw new Error(`Input audio file not found: ${audioPath}`);
  }

  try {
    await fs.access(transcriptPath);
  } catch (error) {
    throw new Error(`Transcript file not found: ${transcriptPath}`);
  }

  // Read transcript
  const transcript = await fs.readFile(transcriptPath, 'utf-8');
  
  if (!transcript.trim()) {
    throw new Error('Transcript file is empty');
  }

  console.log('🎤 Converting audio to viseme map using GentleJS...');
  console.log(`📁 Audio: ${audioPath}`);
  console.log(`📄 Transcript: ${transcriptPath}`);
  console.log(`📁 Output: ${outputJsonPath}`);
  console.log(`🧵 Threads: ${nthreads}`);
  console.log(`🎯 Conservative: ${conservative}`);
  console.log('');

  // Convert audio to WAV if needed (Gentle prefers 16kHz mono WAV)
  const ext = path.extname(audioPath).toLowerCase();
  let wavfile = audioPath;
  let tempWavFile = null;

  if (ext !== '.wav') {
    tempWavFile = audioPath.replace(/\.[^.]+$/, '_gentle_temp.wav');
    console.log('🔄 Converting to WAV format (16kHz mono)...');
    
    try {
      await convertToWav(audioPath, tempWavFile);
      wavfile = tempWavFile;
      console.log('✅ Conversion complete!');
    } catch (error) {
      throw new Error(`Failed to convert audio to WAV: ${error.message}`);
    }
  }

  try {
    // Initialize Gentle resources (we'll use a Python subprocess approach since gentlejs 
    // requires the C++ binaries from original Gentle)
    console.log('🔍 Running Gentle forced aligner...');
    
    const gentleResult = await runGentleAlign(
      wavfile,
      transcript,
      gentleResourcesPath,
      {
        nthreads,
        conservative,
        disfluency,
        disfluencies,
        logging,
        progress
      }
    );

    console.log('✅ Alignment complete!');
    console.log('');

    // Convert Gentle phoneme data to Rhubarb viseme format
    console.log('🔄 Converting phonemes to visemes...');
    const visemeData = convertGentleToVisemes(gentleResult, { minDuration });

    // Save to JSON file
    await fs.writeFile(outputJsonPath, JSON.stringify(visemeData, null, 2));

    console.log('✅ Successfully generated viseme map!');
    console.log(`📊 Total cues: ${visemeData.mouthCues?.length || 0}`);

    return visemeData;

  } finally {
    // Clean up temp WAV file
    if (tempWavFile && !keepTempFiles) {
      try {
        await fs.unlink(tempWavFile);
      } catch (error) {
        console.warn(`Warning: Could not delete temp file: ${tempWavFile}`);
      }
    }
  }
}

/**
 * Runs Gentle forced aligner using Python align.py script
 * @param {string} audioFile - Path to audio file
 * @param {string} transcript - Transcript text
 * @param {string} gentlePath - Path to Gentle installation
 * @param {Object} options - Alignment options
 * @returns {Promise<Object>} Gentle alignment result
 */
async function runGentleAlign(audioFile, transcript, gentlePath, options = {}) {
  // Create temporary transcript file
  const tempTranscriptFile = path.join(os.tmpdir(), `gentle_transcript_${Date.now()}.txt`);
  await fs.writeFile(tempTranscriptFile, transcript);

  // Create temporary output file
  const tempOutputFile = path.join(os.tmpdir(), `gentle_output_${Date.now()}.json`);

  try {
    // Run Gentle's align.py script
    const alignScript = path.join(gentlePath, 'align.py');
    
    // Check if align.py exists
    try {
      await fs.access(alignScript);
    } catch (error) {
      throw new Error(
        `Gentle align.py not found at: ${alignScript}\n` +
        'Please ensure GENTLE_RESOURCES_ROOT points to the Gentle installation directory'
      );
    }

    const args = [
      alignScript,
      audioFile,
      tempTranscriptFile,
      '--output', tempOutputFile
    ];

    if (options.conservative) {
      args.push('--conservative');
    }

    if (options.disfluency) {
      args.push('--disfluency');
    }

    if (options.nthreads) {
      args.push('--nthreads', options.nthreads.toString());
    }

    return new Promise((resolve, reject) => {
      const gentleProcess = spawn('python3', args, {
        cwd: gentlePath
      });

      let stdoutData = '';
      let stderrData = '';

      gentleProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
        if (options.logging) {
          console.log(`Gentle: ${data.toString().trim()}`);
        }
      });

      gentleProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        if (options.logging) {
          console.error(`Gentle: ${data.toString().trim()}`);
        }
      });

      gentleProcess.on('close', async (code) => {
        // Clean up temp transcript file
        try {
          await fs.unlink(tempTranscriptFile);
        } catch (error) {
          // Ignore cleanup errors
        }

        if (code !== 0) {
          reject(new Error(`Gentle process exited with code ${code}\n${stderrData}`));
          return;
        }

        try {
          // Read the generated JSON file
          const jsonContent = await fs.readFile(tempOutputFile, 'utf-8');
          const result = JSON.parse(jsonContent);

          // Clean up temp output file
          try {
            await fs.unlink(tempOutputFile);
          } catch (error) {
            // Ignore cleanup errors
          }

          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to read Gentle output: ${error.message}`));
        }
      });

      gentleProcess.on('error', (error) => {
        if (error.code === 'ENOENT') {
          reject(new Error(
            'Python 3 not found. Please install Python 3:\n' +
            '  - macOS: brew install python3\n' +
            '  - Ubuntu: sudo apt-get install python3'
          ));
        } else {
          reject(error);
        }
      });
    });
  } catch (error) {
    // Clean up temp files
    try {
      await fs.unlink(tempTranscriptFile);
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Converts audio file to WAV format (16kHz mono) using ffmpeg
 * Gentle works best with 16kHz mono WAV files
 * @param {string} inputPath - Path to input audio file
 * @param {string} outputPath - Path for output WAV file
 * @returns {Promise<void>}
 */
function convertToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn('ffmpeg', [
      '-i', inputPath,
      '-ar', '16000',      // Sample rate: 16kHz
      '-ac', '1',          // Mono
      '-y',                // Overwrite output file
      outputPath
    ]);

    let stderrData = '';

    ffmpegProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    ffmpegProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg process exited with code ${code}\n${stderrData}`));
        return;
      }
      resolve();
    });

    ffmpegProcess.on('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new Error(
          'ffmpeg not found. Please install ffmpeg:\n' +
          '  - macOS: brew install ffmpeg\n' +
          '  - Ubuntu: sudo apt-get install ffmpeg\n' +
          '  - Windows: Download from https://ffmpeg.org/download.html'
        ));
      } else {
        reject(error);
      }
    });
  });
}

// CLI usage
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node gentle-to-viseme.js <audio.mp3> <transcript.txt> [output.json]');
    console.log('');
    console.log('Example:');
    console.log('  node gentle-to-viseme.js audio.mp3 transcript.txt');
    console.log('  node gentle-to-viseme.js audio.mp3 transcript.txt output.json');
    console.log('');
    console.log('Environment Variables:');
    console.log('  GENTLE_RESOURCES_ROOT - Path to Gentle installation directory (required)');
    console.log('');
    console.log('Setup:');
    console.log('  1. Download Gentle from: https://github.com/lowerquality/gentle');
    console.log('  2. Set environment variable: export GENTLE_RESOURCES_ROOT=/path/to/gentle');
    console.log('');
    console.log('Note: Requires Python 3 and the original Gentle C++ binaries');
    process.exit(1);
  }

  const audioPath = args[0];
  const transcriptPath = args[1];
  const outputJson = args[2] || audioPath.replace(/\.[^.]+$/, '_visemes.json');

  convertAudioToViseme(audioPath, transcriptPath, outputJson, { logging: false })
    .then((visemeData) => {
      console.log('');
      console.log('='.repeat(50));
      console.log('Viseme Map Summary:');
      console.log('='.repeat(50));
      console.log(`Metadata:`);
      console.log(`  - Duration: ${visemeData.metadata?.duration?.toFixed(3)}s`);
      console.log(`  - Sound file: ${visemeData.metadata?.soundFile}`);
      console.log(`  - Transcript: ${visemeData.metadata?.transcript?.substring(0, 60)}...`);
      console.log(`  - Source: ${visemeData.metadata?.source}`);
      console.log('');
      
      const formatted = formatVisemeData(visemeData);
      console.log(`Mouth Cues (${formatted.length} total):`);
      
      // Show first 10 cues as preview
      const preview = formatted.slice(0, 10);
      preview.forEach(cue => {
        console.log(`  ${cue.timeFormatted} - ${cue.viseme} [${cue.durationFormatted}] (${cue.description})`);
      });
      
      if (formatted.length > 10) {
        console.log(`  ... and ${formatted.length - 10} more`);
      }
      
      console.log('');
      console.log(`✅ Viseme map saved to: ${outputJson}`);
    })
    .catch((error) => {
      console.error('');
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

export { convertAudioToViseme };

