import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Converts an MP3/WAV file to a JSON viseme map using Rhubarb Lip Sync
 * @param {string} inputMp3Path - Path to the input audio file (MP3, WAV, or OGG)
 * @param {string} outputJsonPath - Path where the JSON viseme map will be saved
 * @param {Object} options - Optional configuration
 * @param {string} options.rhubarbPath - Path to Rhubarb executable (defaults to 'rhubarb')
 * @param {string} options.dialogFile - Optional path to dialog text file for better accuracy
 * @param {string} options.recognizer - Recognizer engine: 'phonetic' or 'pocketSphinx' (default: 'pocketSphinx')
 * @param {boolean} options.exportFormat - Export format (json, tsv, xml, dat)
 * @param {boolean} options.keepTempFiles - Keep temporary WAV file after conversion (default: false)
 * @returns {Promise<Object>} The viseme map data
 */
async function convertMp3ToViseme(inputMp3Path, outputJsonPath, options = {}) {
  const {
    rhubarbPath = 'rhubarb',
    dialogFile = null,
    recognizer = 'pocketSphinx',
    exportFormat = 'json',
    keepTempFiles = false
  } = options;

  // Validate input file exists
  try {
    await fs.access(inputMp3Path);
  } catch (error) {
    throw new Error(`Input audio file not found: ${inputMp3Path}`);
  }

  // Check if we need to convert MP3 to WAV
  const ext = path.extname(inputMp3Path).toLowerCase();
  let audioFilePath = inputMp3Path;
  let tempWavFile = null;

  if (ext === '.mp3') {
    // Convert MP3 to WAV using ffmpeg
    tempWavFile = inputMp3Path.replace(/\.mp3$/i, '_temp.wav');
    console.log('🔄 Converting MP3 to WAV format...');
    
    try {
      await convertToWav(inputMp3Path, tempWavFile);
      audioFilePath = tempWavFile;
      console.log('✅ Conversion complete!');
    } catch (error) {
      throw new Error(`Failed to convert MP3 to WAV: ${error.message}`);
    }
  } else if (ext !== '.wav' && ext !== '.ogg') {
    throw new Error(`Unsupported audio format: ${ext}. Supported formats: .mp3, .wav, .ogg`);
  }

  // Prepare Rhubarb command arguments
  const args = [
    audioFilePath,
    '-f', exportFormat,
    '-o', outputJsonPath,
    '-r', recognizer
  ];

  // Add dialog file if provided (improves accuracy)
  if (dialogFile) {
    try {
      await fs.access(dialogFile);
      args.push('-d', dialogFile);
    } catch (error) {
      console.warn(`Dialog file not found: ${dialogFile}. Continuing without it.`);
    }
  }

  return new Promise((resolve, reject) => {
    const rhubarbProcess = spawn(rhubarbPath, args);

    let stdoutData = '';
    let stderrData = '';

    rhubarbProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
      // Only log non-empty lines
      const message = data.toString().trim();
      if (message) console.log(`Rhubarb: ${message}`);
    });

    rhubarbProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      // Rhubarb sends progress to stderr, which is normal
      // Only log if not a progress indicator
      const message = data.toString();
      if (!message.includes('[') && !message.includes('Progress') && message.trim()) {
        console.log(message.trim());
      }
    });

    rhubarbProcess.on('close', async (code) => {
      // Clean up temp WAV file if created
      if (tempWavFile && !keepTempFiles) {
        try {
          await fs.unlink(tempWavFile);
        } catch (error) {
          console.warn(`Warning: Could not delete temp file: ${tempWavFile}`);
        }
      }

      if (code !== 0) {
        reject(new Error(`Rhubarb process exited with code ${code}\n${stderrData}`));
        return;
      }

      try {
        // Read and parse the generated JSON file
        const jsonContent = await fs.readFile(outputJsonPath, 'utf-8');
        const visemeData = JSON.parse(jsonContent);
        
        console.log('✅ Successfully generated viseme map!');
        console.log(`📊 Total cues: ${visemeData.mouthCues?.length || 0}`);
        
        resolve(visemeData);
      } catch (error) {
        reject(new Error(`Failed to read or parse output file: ${error.message}`));
      }
    });

    rhubarbProcess.on('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new Error(
          'Rhubarb executable not found. Please install Rhubarb Lip Sync:\n' +
          '  - Download from: https://github.com/DanielSWolf/rhubarb-lip-sync/releases\n' +
          '  - Or install via: brew install rhubarb-lip-sync (macOS)'
        ));
      } else {
        reject(error);
      }
    });
  });
}

/**
 * Converts audio file to WAV format using ffmpeg
 * @param {string} inputPath - Path to input audio file
 * @param {string} outputPath - Path for output WAV file
 * @returns {Promise<void>}
 */
function convertToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn('ffmpeg', [
      '-i', inputPath,
      '-y', // Overwrite output file
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

/**
 * Converts viseme data to a more readable format with timestamps
 * @param {Object} visemeData - Raw viseme data from Rhubarb
 * @returns {Array} Formatted viseme array with readable timestamps
 */
function formatVisemeData(visemeData) {
  if (!visemeData.mouthCues) {
    return [];
  }

  return visemeData.mouthCues.map((cue, index) => ({
    index,
    time: cue.start,
    timeFormatted: `${cue.start.toFixed(3)}s`,
    viseme: cue.value,
    duration: index < visemeData.mouthCues.length - 1 
      ? visemeData.mouthCues[index + 1].start - cue.start 
      : null
  }));
}

/**
 * Get viseme description for a given viseme code
 * Based on Rhubarb Lip Sync documentation
 * @param {string} viseme - Viseme code (A-X)
 * @returns {string} Description of the mouth shape
 */
function getVisemeDescription(viseme) {
  const visemeDescriptions = {
    'A': 'Closed lips (M, B, P sounds)',
    'B': 'Slightly open with clenched teeth (K, S, T, EE sounds)',
    'C': 'Open mouth (EH as in men, AE as in bat)',
    'D': 'Wide open mouth (AA as in father)',
    'E': 'Slightly rounded (AO as in off, ER as in bird)',
    'F': 'Puckered lips (UW as in you, OW as in show, W)',
    'G': 'Upper teeth on lower lip (F, V sounds)',
    'H': 'Tongue raised behind upper teeth (long L sounds)',
    'X': 'Rest/idle position (relaxed closed mouth)'
  };

  return visemeDescriptions[viseme] || 'Unknown viseme';
}

// CLI usage
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node mp3-to-viseme.js <input.mp3> [output.json] [dialog.txt]');
    console.log('');
    console.log('Example:');
    console.log('  node mp3-to-viseme.js audio.mp3');
    console.log('  node mp3-to-viseme.js audio.mp3 output.json');
    console.log('  node mp3-to-viseme.js audio.mp3 output.json dialog.txt');
    console.log('');
    console.log('Recognizer: pocketSphinx (English speech recognition)');
    console.log('');
    console.log('Rhubarb Lip Sync viseme codes:');
    console.log('  A - Closed lips (M, B, P)');
    console.log('  B - Clenched teeth (K, S, T, EE)');
    console.log('  C - Open mouth (EH, AE)');
    console.log('  D - Wide open (AA as in father)');
    console.log('  E - Slightly rounded (AO, ER)');
    console.log('  F - Puckered lips (UW, OW, W)');
    console.log('  G - Teeth on lip (F, V)');
    console.log('  H - Tongue up (L)');
    console.log('  X - Rest position');
    process.exit(1);
  }

  const inputMp3 = args[0];
  const outputJson = args[1] || inputMp3.replace(/\.(mp3|wav|ogg)$/i, '_visemes.json');
  const dialogFile = args[2] || null;

  // Check for RHUBARB_PATH environment variable or use local installation
  const rhubarbPath = process.env.RHUBARB_PATH || 
                      path.join(__dirname, 'Rhubarb-Lip-Sync-1.13.0-macOS', 'rhubarb') ||
                      'rhubarb';

  console.log('🎤 Converting MP3 to viseme map...');
  console.log(`📁 Input: ${inputMp3}`);
  console.log(`📁 Output: ${outputJson}`);
  console.log(`🧠 Recognizer: pocketSphinx`);
  if (dialogFile) {
    console.log(`📝 Dialog: ${dialogFile}`);
  }
  console.log('');

  convertMp3ToViseme(inputMp3, outputJson, { dialogFile, rhubarbPath, recognizer: 'pocketSphinx' })
    .then((visemeData) => {
      console.log('');
      console.log('='.repeat(50));
      console.log('Viseme Map Summary:');
      console.log('='.repeat(50));
      console.log(`Metadata:`);
      console.log(`  - Duration: ${visemeData.metadata?.duration?.toFixed(3)}s`);
      console.log(`  - Sound file: ${visemeData.metadata?.soundFile}`);
      console.log('');
      
      const formatted = formatVisemeData(visemeData);
      console.log(`Mouth Cues (${formatted.length} total):`);
      
      // Show first 10 cues as preview
      const preview = formatted.slice(0, 10);
      preview.forEach(cue => {
        console.log(`  ${cue.timeFormatted} - ${cue.viseme} (${getVisemeDescription(cue.viseme)})`);
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

export { convertMp3ToViseme, formatVisemeData, getVisemeDescription };

