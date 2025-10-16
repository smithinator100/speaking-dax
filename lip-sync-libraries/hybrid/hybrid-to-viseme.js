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
 * Hybrid Pipeline: WhisperX → Gentle
 * 
 * Combines the best of both worlds:
 * 1. WhisperX auto-generates accurate transcripts (no manual transcription needed)
 * 2. Gentle provides superior phoneme-level timing precision with the transcript
 * 
 * This is the recommended approach for maximum accuracy + convenience.
 * 
 * @param {string} audioPath - Path to the input audio file (MP3, WAV, OGG)
 * @param {string} outputJsonPath - Path where the JSON viseme map will be saved
 * @param {Object} options - Optional configuration
 * @param {string} options.whisperModel - WhisperX model: 'tiny', 'base', 'small', 'medium', 'large-v2' (default: 'base')
 * @param {string} options.whisperLanguage - Language code or 'auto' for detection (default: 'auto')
 * @param {string} options.whisperDevice - 'cpu' or 'cuda' (default: 'cpu')
 * @param {number} options.whisperBatchSize - Batch size (default: 16)
 * @param {string} options.whisperComputeType - 'float32', 'float16', 'int8' (default: 'float32')
 * @param {string} options.gentleResourcesPath - Path to Gentle resources directory
 * @param {number} options.gentleThreads - Number of threads for Gentle (default: CPU count)
 * @param {boolean} options.gentleConservative - Use conservative alignment (default: true)
 * @param {boolean} options.gentleDisfluency - Include disfluencies (default: false)
 * @param {number} options.minDuration - Minimum duration for viseme cues in seconds (default: 0.03)
 * @param {string} options.useTranscript - Path to existing transcript file (skips WhisperX transcription)
 * @param {boolean} options.saveTranscript - Save transcript to file (default: true)
 * @param {string} options.transcriptPath - Custom transcript save path (default: auto-generated)
 * @param {boolean} options.keepTempFiles - Keep temporary files (default: false)
 * @param {boolean} options.verbose - Enable verbose logging (default: false)
 * @returns {Promise<Object>} The viseme map data with transcript
 */
async function convertAudioToViseme(audioPath, outputJsonPath, options = {}) {
  const {
    whisperModel = 'base',
    whisperLanguage = 'auto',
    whisperDevice = 'cpu',
    whisperBatchSize = 16,
    whisperComputeType = 'float32',
    gentleResourcesPath = process.env.GENTLE_RESOURCES_ROOT,
    gentleThreads = os.cpus().length,
    gentleConservative = true,
    gentleDisfluency = false,
    minDuration = 0.03,
    useTranscript = null,
    saveTranscript = true,
    transcriptPath = null,
    keepTempFiles = false,
    verbose = false
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

  // Validate audio file exists and resolve to absolute path
  const absoluteAudioPath = path.resolve(audioPath);
  try {
    await fs.access(absoluteAudioPath);
  } catch (error) {
    throw new Error(`Input audio file not found: ${audioPath}`);
  }

  const startTime = Date.now();
  
  console.log('');
  console.log('═'.repeat(60));
  console.log('🚀 HYBRID PIPELINE: WhisperX → Gentle');
  console.log('═'.repeat(60));
  console.log('');
  console.log('📁 Input:  ', audioPath);
  console.log('📁 Output: ', outputJsonPath);
  console.log('');
  console.log('Configuration:');
  console.log(`  WhisperX Model:    ${whisperModel}`);
  console.log(`  WhisperX Language: ${whisperLanguage}`);
  console.log(`  WhisperX Device:   ${whisperDevice}`);
  console.log(`  Gentle Threads:    ${gentleThreads}`);
  console.log(`  Gentle Mode:       ${gentleConservative ? 'Conservative (more accurate)' : 'Fast'}`);
  console.log('');

  // ========================================
  // STEP 1: Get Transcript (WhisperX or Existing)
  // ========================================
  let transcript = '';
  let detectedLanguage = 'en';
  
  if (useTranscript) {
    // Use existing transcript file
    console.log('━'.repeat(60));
    console.log('📝 STEP 1: Loading Existing Transcript');
    console.log('━'.repeat(60));
    console.log('');
    
    try {
      const transcriptFilePath = path.resolve(useTranscript);
      transcript = await fs.readFile(transcriptFilePath, 'utf-8');
      transcript = transcript.trim();
      
      console.log(`✅ Transcript loaded from: ${useTranscript}`);
      console.log(`   Transcript length: ${transcript.length} characters`);
      console.log('');
      console.log('📄 Transcript:');
      console.log('   ' + transcript.substring(0, 200) + (transcript.length > 200 ? '...' : ''));
      console.log('');
    } catch (error) {
      throw new Error(`Failed to load transcript from ${useTranscript}: ${error.message}`);
    }
  } else {
    // Run WhisperX transcription
    console.log('━'.repeat(60));
    console.log('📝 STEP 1: WhisperX Transcription');
    console.log('━'.repeat(60));
    console.log('');

    const step1Start = Date.now();
    
    try {
      console.log('🔍 Running WhisperX transcription...');
      const whisperxResult = await runWhisperX(absoluteAudioPath, {
        model: whisperModel,
        language: whisperLanguage,
        device: whisperDevice,
        batchSize: whisperBatchSize,
        computeType: whisperComputeType,
        verbose
      });

      transcript = whisperxResult.text || '';
      detectedLanguage = whisperxResult.language || 'en';
      
      const step1Duration = ((Date.now() - step1Start) / 1000).toFixed(1);
      
      console.log('✅ WhisperX transcription complete!');
      console.log(`   Time: ${step1Duration}s`);
      console.log(`   Language: ${detectedLanguage}`);
      console.log(`   Transcript length: ${transcript.length} characters`);
      console.log('');
      console.log('📄 Transcript:');
      console.log('   ' + transcript.substring(0, 200) + (transcript.length > 200 ? '...' : ''));
      console.log('');

      // Save transcript if requested
      const finalTranscriptPath = transcriptPath || absoluteAudioPath.replace(/\.[^.]+$/, '_transcript.txt');
      if (saveTranscript) {
        await fs.writeFile(finalTranscriptPath, transcript, 'utf-8');
        console.log(`💾 Transcript saved to: ${finalTranscriptPath}`);
        console.log('');
      }

    } catch (error) {
      throw new Error(`WhisperX transcription failed: ${error.message}`);
    }
  }

  // ========================================
  // STEP 2: Gentle Forced Alignment
  // ========================================
  console.log('━'.repeat(60));
  console.log('🎯 STEP 2: Gentle Forced Alignment');
  console.log('━'.repeat(60));
  console.log('');

  const step2Start = Date.now();
  
  // Convert audio to WAV if needed (Gentle prefers 16kHz mono WAV)
  const ext = path.extname(absoluteAudioPath).toLowerCase();
  let wavFile = absoluteAudioPath;
  let tempWavFile = null;

  if (ext !== '.wav') {
    tempWavFile = absoluteAudioPath.replace(/\.[^.]+$/, '_gentle_temp.wav');
    console.log('🔄 Converting to WAV format (16kHz mono)...');
    
    try {
      await convertToWav(absoluteAudioPath, tempWavFile);
      wavFile = tempWavFile;
      console.log('✅ Audio conversion complete!');
      console.log('');
    } catch (error) {
      throw new Error(`Failed to convert audio to WAV: ${error.message}`);
    }
  }

  try {
    console.log('🔍 Running Gentle forced aligner with transcript...');
    
    const gentleResult = await runGentleAlign(
      wavFile,
      transcript,
      gentleResourcesPath,
      {
        nthreads: gentleThreads,
        conservative: gentleConservative,
        disfluency: gentleDisfluency,
        logging: verbose
      }
    );

    const step2Duration = ((Date.now() - step2Start) / 1000).toFixed(1);
    
    console.log('✅ Gentle alignment complete!');
    console.log(`   Time: ${step2Duration}s`);
    console.log('');

    // ========================================
    // STEP 3: Phoneme to Viseme Conversion
    // ========================================
    console.log('━'.repeat(60));
    console.log('🗣️  STEP 3: Phoneme to Viseme Conversion');
    console.log('━'.repeat(60));
    console.log('');

    console.log('🔄 Converting phonemes to visemes...');
    const visemeData = convertGentleToVisemes(gentleResult, { minDuration });

    // Enhance metadata with hybrid pipeline info
    visemeData.metadata = {
      ...visemeData.metadata,
      source: 'hybrid-whisperx-gentle',
      pipeline: {
        step1: 'WhisperX transcription',
        step2: 'Gentle forced alignment',
        whisperModel,
        whisperLanguage: detectedLanguage,
        gentleConservative
      },
      transcript
    };

    // Save to JSON file
    await fs.writeFile(outputJsonPath, JSON.stringify(visemeData, null, 2));

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('✅ Viseme conversion complete!');
    console.log('');
    console.log('━'.repeat(60));
    console.log('📊 PIPELINE SUMMARY');
    console.log('━'.repeat(60));
    console.log('');
    console.log(`⏱️  Total time:       ${totalDuration}s`);
    console.log(`📝 Total viseme cues: ${visemeData.mouthCues?.length || 0}`);
    console.log(`📏 Duration:          ${visemeData.metadata?.duration?.toFixed(3)}s`);
    console.log(`🎤 Transcript:        "${transcript.substring(0, 60)}${transcript.length > 60 ? '...' : ''}"`);
    console.log(`🌍 Language:          ${detectedLanguage}`);
    console.log('');
    console.log('💾 Output files:');
    console.log(`   Visemes:    ${outputJsonPath}`);
    if (saveTranscript) {
      const finalTranscriptPath = transcriptPath || audioPath.replace(/\.[^.]+$/, '_transcript.txt');
      console.log(`   Transcript: ${finalTranscriptPath}`);
    }
    console.log('');
    console.log('═'.repeat(60));
    console.log('✨ SUCCESS! Hybrid pipeline complete.');
    console.log('═'.repeat(60));
    console.log('');

    return visemeData;

  } finally {
    // Clean up temp WAV file
    if (tempWavFile && !keepTempFiles) {
      try {
        await fs.unlink(tempWavFile);
        if (verbose) {
          console.log(`🗑️  Cleaned up temp file: ${tempWavFile}`);
        }
      } catch (error) {
        console.warn(`Warning: Could not delete temp file: ${tempWavFile}`);
      }
    }
  }
}

/**
 * Runs WhisperX using Python script
 * @param {string} audioFile - Path to audio file
 * @param {Object} options - WhisperX options
 * @returns {Promise<Object>} WhisperX result with transcript
 */
async function runWhisperX(audioFile, options = {}) {
  const tempOutputFile = path.join(os.tmpdir(), `whisperx_hybrid_${Date.now()}.json`);

  try {
    const pythonScript = path.join(__dirname, '../whisperx/run_whisperx.py');
    
    // Check if Python script exists
    try {
      await fs.access(pythonScript);
    } catch (error) {
      throw new Error(
        `WhisperX script not found at: ${pythonScript}\n` +
        'Please ensure the whisperx directory exists with run_whisperx.py'
      );
    }

    const args = [
      pythonScript,
      audioFile,
      '--output', tempOutputFile,
      '--model', options.model || 'base',
      '--device', options.device || 'cpu',
      '--batch-size', (options.batchSize || 16).toString(),
      '--compute-type', options.computeType || 'float32'
    ];

    if (options.language && options.language !== 'auto') {
      args.push('--language', options.language);
    }

    if (options.verbose) {
      args.push('--verbose');
    }

    return new Promise((resolve, reject) => {
      const whisperxProcess = spawn('python3', args);

      let stdoutData = '';
      let stderrData = '';

      whisperxProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
        if (options.verbose) {
          console.log(data.toString().trim());
        }
      });

      whisperxProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        if (options.verbose || data.toString().includes('Error')) {
          console.error(data.toString().trim());
        }
      });

      whisperxProcess.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(
            `WhisperX process exited with code ${code}\n${stderrData}\n\n` +
            'Make sure WhisperX is installed:\n' +
            '  pip install whisperx\n' +
            'Or see: https://github.com/m-bain/whisperX'
          ));
          return;
        }

        try {
          const jsonContent = await fs.readFile(tempOutputFile, 'utf-8');
          const result = JSON.parse(jsonContent);

          // Clean up temp file
          try {
            await fs.unlink(tempOutputFile);
          } catch (error) {
            // Ignore cleanup errors
          }

          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to read WhisperX output: ${error.message}`));
        }
      });

      whisperxProcess.on('error', (error) => {
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
    throw error;
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
  const tempTranscriptFile = path.join(os.tmpdir(), `gentle_transcript_${Date.now()}.txt`);
  await fs.writeFile(tempTranscriptFile, transcript);

  const tempOutputFile = path.join(os.tmpdir(), `gentle_output_${Date.now()}.json`);

  try {
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
          console.log(`   ${data.toString().trim()}`);
        }
      });

      gentleProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        if (options.logging) {
          console.error(`   ${data.toString().trim()}`);
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
 * @param {string} inputPath - Path to input audio file
 * @param {string} outputPath - Path for output WAV file
 * @returns {Promise<void>}
 */
function convertToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn('ffmpeg', [
      '-i', inputPath,
      '-ar', '16000',
      '-ac', '1',
      '-y',
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
  
  if (args.length < 1 || args.includes('--help')) {
    console.log('');
    console.log('🚀 Hybrid Pipeline: WhisperX → Gentle');
    console.log('   Best accuracy + convenience for lip-sync viseme generation');
    console.log('');
    console.log('Usage: node hybrid-to-viseme.js <audio.mp3> [output.json] [options]');
    console.log('');
    console.log('Example:');
    console.log('  node hybrid-to-viseme.js audio.mp3');
    console.log('  node hybrid-to-viseme.js audio.mp3 output.json');
    console.log('  node hybrid-to-viseme.js audio.mp3 output.json --whisper-model large-v2');
    console.log('');
    console.log('WhisperX Options:');
    console.log('  --whisper-model <size>      Model: tiny, base, small, medium, large-v2 (default: base)');
    console.log('  --whisper-language <code>   Language code (e.g., en, es, fr) or auto (default: auto)');
    console.log('  --whisper-device <device>   Device: cpu or cuda (default: cpu)');
    console.log('');
    console.log('Gentle Options:');
    console.log('  --gentle-fast               Use fast mode (less accurate, faster)');
    console.log('  --gentle-threads <n>        Number of threads (default: CPU count)');
    console.log('');
    console.log('General Options:');
    console.log('  --use-transcript <path>     Use existing transcript (skips WhisperX)');
    console.log('  --no-save-transcript        Don\'t save transcript to file');
    console.log('  --transcript-path <path>    Custom transcript save path');
    console.log('  --keep-temp                 Keep temporary files');
    console.log('  --verbose                   Enable verbose logging');
    console.log('');
    console.log('Environment Variables:');
    console.log('  GENTLE_RESOURCES_ROOT       Path to Gentle installation directory (required)');
    console.log('');
    console.log('Requirements:');
    console.log('  - Python 3.8+');
    console.log('  - pip install whisperx');
    console.log('  - Gentle installed and GENTLE_RESOURCES_ROOT set');
    console.log('  - ffmpeg (brew install ffmpeg)');
    console.log('');
    console.log('Pipeline:');
    console.log('  1. WhisperX auto-transcribes audio (no manual transcript needed)');
    console.log('  2. Gentle aligns phonemes with precision using the transcript');
    console.log('  3. Phonemes converted to Rhubarb viseme format');
    console.log('');
    process.exit(args.includes('--help') ? 0 : 1);
  }

  const audioPath = args[0];
  const outputJson = args[1] && !args[1].startsWith('--') 
    ? args[1] 
    : audioPath.replace(/\.[^.]+$/, '_visemes-hybrid.json');

  // Parse command line options
  const options = {
    verbose: args.includes('--verbose'),
    saveTranscript: !args.includes('--no-save-transcript'),
    keepTempFiles: args.includes('--keep-temp'),
    gentleConservative: !args.includes('--gentle-fast')
  };

  const whisperModelIndex = args.indexOf('--whisper-model');
  if (whisperModelIndex !== -1 && args[whisperModelIndex + 1]) {
    options.whisperModel = args[whisperModelIndex + 1];
  }

  const whisperLanguageIndex = args.indexOf('--whisper-language');
  if (whisperLanguageIndex !== -1 && args[whisperLanguageIndex + 1]) {
    options.whisperLanguage = args[whisperLanguageIndex + 1];
  }

  const whisperDeviceIndex = args.indexOf('--whisper-device');
  if (whisperDeviceIndex !== -1 && args[whisperDeviceIndex + 1]) {
    options.whisperDevice = args[whisperDeviceIndex + 1];
  }

  const gentleThreadsIndex = args.indexOf('--gentle-threads');
  if (gentleThreadsIndex !== -1 && args[gentleThreadsIndex + 1]) {
    options.gentleThreads = parseInt(args[gentleThreadsIndex + 1], 10);
  }

  const transcriptPathIndex = args.indexOf('--transcript-path');
  if (transcriptPathIndex !== -1 && args[transcriptPathIndex + 1]) {
    options.transcriptPath = args[transcriptPathIndex + 1];
  }

  const useTranscriptIndex = args.indexOf('--use-transcript');
  if (useTranscriptIndex !== -1 && args[useTranscriptIndex + 1]) {
    options.useTranscript = args[useTranscriptIndex + 1];
  }

  convertAudioToViseme(audioPath, outputJson, options)
    .catch((error) => {
      console.error('');
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

export { convertAudioToViseme };

