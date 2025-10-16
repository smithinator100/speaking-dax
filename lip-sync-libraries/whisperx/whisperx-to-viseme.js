import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import {
  phonemeToViseme,
  getVisemeDescription,
  formatVisemeData
} from '../../utilities/phoneme-to-viseme.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Converts an audio file to viseme map using WhisperX
 * WhisperX provides fast, accurate transcription and phoneme-level alignment
 * 
 * @param {string} audioPath - Path to the input audio file (MP3, WAV, OGG, etc.)
 * @param {string} outputJsonPath - Path where the JSON viseme map will be saved
 * @param {Object} options - Optional configuration
 * @param {string} options.model - WhisperX model size: 'tiny', 'base', 'small', 'medium', 'large-v2' (default: 'base')
 * @param {string} options.language - Language code (e.g., 'en', 'es', 'fr') or 'auto' for auto-detection (default: 'auto')
 * @param {string} options.device - Compute device: 'cpu' or 'cuda' (default: 'cpu')
 * @param {number} options.batchSize - Batch size for processing (default: 16)
 * @param {boolean} options.computeType - Compute type: 'float32', 'float16', 'int8' (default: 'float32')
 * @param {number} options.minDuration - Minimum duration for viseme cues in seconds (default: 0.03)
 * @param {boolean} options.keepTempFiles - Keep temporary files (default: false)
 * @param {boolean} options.verbose - Enable verbose logging (default: false)
 * @returns {Promise<Object>} The viseme map data
 */
async function convertAudioToViseme(audioPath, outputJsonPath, options = {}) {
  const {
    model = 'base',
    language = 'auto',
    device = 'cpu',
    batchSize = 16,
    computeType = 'float32',
    minDuration = 0.03,
    keepTempFiles = false,
    verbose = false
  } = options;

  // Validate input file exists
  try {
    await fs.access(audioPath);
  } catch (error) {
    throw new Error(`Input audio file not found: ${audioPath}`);
  }

  console.log('🎤 Converting audio to viseme map using WhisperX...');
  console.log(`📁 Audio: ${audioPath}`);
  console.log(`📁 Output: ${outputJsonPath}`);
  console.log(`🤖 Model: ${model}`);
  console.log(`🌍 Language: ${language}`);
  console.log(`💻 Device: ${device}`);
  console.log('');

  try {
    // Run WhisperX alignment
    console.log('🔍 Running WhisperX transcription and alignment...');
    
    const whisperxResult = await runWhisperX(
      audioPath,
      {
        model,
        language,
        device,
        batchSize,
        computeType,
        verbose
      }
    );

    console.log('✅ Alignment complete!');
    console.log('');

    // Convert WhisperX phoneme data to Rhubarb viseme format
    console.log('🔄 Converting phonemes to visemes...');
    const visemeData = convertWhisperXToVisemes(whisperxResult, audioPath, { minDuration });

    // Save to JSON file
    await fs.writeFile(outputJsonPath, JSON.stringify(visemeData, null, 2));

    console.log('✅ Successfully generated viseme map!');
    console.log(`📊 Total cues: ${visemeData.mouthCues?.length || 0}`);

    return visemeData;

  } catch (error) {
    throw new Error(`WhisperX processing failed: ${error.message}`);
  }
}

/**
 * Runs WhisperX using Python script
 * @param {string} audioFile - Path to audio file
 * @param {Object} options - WhisperX options
 * @returns {Promise<Object>} WhisperX alignment result
 */
async function runWhisperX(audioFile, options = {}) {
  // Create temporary output file
  const tempOutputFile = path.join(os.tmpdir(), `whisperx_output_${Date.now()}.json`);

  try {
    // Create Python script to run WhisperX
    const pythonScript = path.join(__dirname, 'run_whisperx.py');
    
    // Check if Python script exists, if not create it
    try {
      await fs.access(pythonScript);
    } catch (error) {
      // Create the Python script
      await createWhisperXScript(pythonScript);
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
        // WhisperX sends progress to stderr
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
 * Creates the Python script to run WhisperX
 * @param {string} scriptPath - Path where to create the script
 */
async function createWhisperXScript(scriptPath) {
  const script = `#!/usr/bin/env python3
"""
WhisperX Audio to Phoneme Alignment Script
Transcribes audio and provides phoneme-level alignment for viseme generation
"""

import argparse
import json
import sys
import os

try:
    import whisperx
    import torch
except ImportError as e:
    print(f"Error: Missing required package: {e}", file=sys.stderr)
    print("Please install WhisperX:", file=sys.stderr)
    print("  pip install whisperx", file=sys.stderr)
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description='Run WhisperX for phoneme alignment')
    parser.add_argument('audio_file', help='Path to audio file')
    parser.add_argument('--output', required=True, help='Output JSON file path')
    parser.add_argument('--model', default='base', help='Whisper model size')
    parser.add_argument('--language', default=None, help='Language code (auto-detect if not specified)')
    parser.add_argument('--device', default='cpu', help='Device: cpu or cuda')
    parser.add_argument('--batch-size', type=int, default=16, help='Batch size')
    parser.add_argument('--compute-type', default='float32', help='Compute type')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if args.verbose:
        print(f"Loading WhisperX model: {args.model}", file=sys.stderr)
    
    # Load audio
    audio = whisperx.load_audio(args.audio_file)
    
    # Load Whisper model
    model = whisperx.load_model(
        args.model,
        args.device,
        compute_type=args.compute_type,
        language=args.language
    )
    
    if args.verbose:
        print("Transcribing audio...", file=sys.stderr)
    
    # Transcribe
    result = model.transcribe(audio, batch_size=args.batch_size)
    
    if args.verbose:
        print(f"Detected language: {result.get('language', 'unknown')}", file=sys.stderr)
        print("Aligning phonemes...", file=sys.stderr)
    
    # Load alignment model
    model_a, metadata = whisperx.load_align_model(
        language_code=result["language"],
        device=args.device
    )
    
    # Align phonemes
    result_aligned = whisperx.align(
        result["segments"],
        model_a,
        metadata,
        audio,
        args.device,
        return_char_alignments=False
    )
    
    # Prepare output data
    output_data = {
        'language': result.get('language', 'unknown'),
        'segments': result_aligned.get('segments', []),
        'word_segments': result_aligned.get('word_segments', []),
        'text': ' '.join([seg.get('text', '') for seg in result_aligned.get('segments', [])]).strip()
    }
    
    # Write to output file
    with open(args.output, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    if args.verbose:
        print(f"Results saved to: {args.output}", file=sys.stderr)


if __name__ == '__main__':
    main()
`;

  await fs.writeFile(scriptPath, script, { mode: 0o755 });
}

/**
 * Converts WhisperX alignment result to Rhubarb-compatible viseme format
 * WhisperX provides character-level timing (not phoneme-level)
 * @param {Object} whisperxResult - Result from WhisperX aligner
 * @param {string} audioFile - Original audio file path
 * @param {Object} options - Configuration options
 * @param {number} options.minDuration - Minimum duration for a viseme cue in seconds (default: 0.03)
 * @returns {Object} Rhubarb-compatible viseme data
 */
function convertWhisperXToVisemes(whisperxResult, audioFile, options = {}) {
  const { minDuration = 0.03 } = options;
  
  if (!whisperxResult || !whisperxResult.segments) {
    throw new Error('Invalid WhisperX result: missing segments');
  }
  
  const mouthCues = [];
  let lastViseme = null;
  let lastEnd = 0;
  let duration = 0;
  
  // Process each segment
  for (const segment of whisperxResult.segments) {
    if (!segment.start || !segment.end) continue;
    
    // Use character-level timing if available (WhisperX provides this when return_char_alignments=True)
    if (segment.chars && segment.chars.length > 0) {
      // Process character-level timing
      for (const charData of segment.chars) {
        // Skip characters without timing (like some leading spaces or punctuation)
        if (!charData.start || !charData.end) continue;
        
        // Add silence gap before this character if there's a gap
        if (charData.start > lastEnd + 0.01) {
          addCue('X', lastEnd, charData.start);
        }
        
        const char = charData.char;
        const viseme = charToViseme(char);
        
        addCue(viseme, charData.start, charData.end);
        lastEnd = charData.end;
      }
    } else if (segment.words && segment.words.length > 0) {
      // Fallback to word-level timing if no character data
      for (const word of segment.words) {
        if (!word.start || !word.end) continue;
        
        // Add silence gap before this word if needed
        if (word.start > lastEnd + 0.01) {
          addCue('X', lastEnd, word.start);
        }
        
        // Estimate visemes from word characters
        const wordText = word.word || '';
        const visemes = estimateVisemesFromWord(wordText);
        const visemeDuration = (word.end - word.start) / Math.max(visemes.length, 1);
        
        let visemeStart = word.start;
        for (const viseme of visemes) {
          const visemeEnd = visemeStart + visemeDuration;
          addCue(viseme, visemeStart, visemeEnd);
          visemeStart = visemeEnd;
        }
        
        lastEnd = word.end;
      }
    }
    
    duration = Math.max(duration, segment.end);
  }
  
  // Add final silence if needed
  if (duration > lastEnd) {
    addCue('X', lastEnd, duration);
  }
  
  function addCue(viseme, start, end) {
    const cueDuration = end - start;
    
    // Skip very short cues
    if (cueDuration < minDuration) return;
    
    // Merge with previous cue if same viseme
    if (mouthCues.length > 0 && lastViseme === viseme && 
        Math.abs(mouthCues[mouthCues.length - 1].end - start) < 0.001) {
      mouthCues[mouthCues.length - 1].end = parseFloat(end.toFixed(3));
    } else {
      mouthCues.push({
        start: parseFloat(start.toFixed(3)),
        end: parseFloat(end.toFixed(3)),
        value: viseme
      });
      lastViseme = viseme;
    }
  }
  
  return {
    metadata: {
      soundFile: path.basename(audioFile),
      duration: duration || (mouthCues.length > 0 ? mouthCues[mouthCues.length - 1].end : 0),
      transcript: whisperxResult.text || '',
      language: whisperxResult.language || 'unknown',
      source: 'whisperx'
    },
    mouthCues
  };
}

/**
 * Maps a single character to a viseme code
 * This is a simplified character-to-viseme mapping for WhisperX character-level timing
 * Note: This is less accurate than phoneme-based mapping but better than word-level estimation
 * @param {string} char - Single character
 * @returns {string} Viseme code (A-H, X)
 */
function charToViseme(char) {
  if (!char || char === ' ') return 'X';
  
  const c = char.toLowerCase();
  
  // Character-to-viseme mapping (approximation)
  switch (c) {
    // Bilabial sounds - closed lips
    case 'm': case 'b': case 'p':
      return 'A';
    
    // Labiodental sounds - teeth on lip
    case 'f': case 'v':
      return 'G';
    
    // Lateral approximant - tongue up
    case 'l':
      return 'H';
    
    // Rounded vowels - puckered lips
    case 'o': case 'u': case 'w':
      return 'F';
    
    // Open vowel - wide open
    case 'a':
      return 'D';
    
    // Front vowels and most consonants - clenched teeth
    case 'e': case 'i': case 'y':
    case 'c': case 'd': case 'g': case 'j': case 'k':
    case 'n': case 'q': case 'r': case 's': case 't':
    case 'x': case 'z':
      return 'B';
    
    // Punctuation and other characters - rest
    default:
      return 'X';
  }
}

/**
 * Estimates visemes from word text when character timing is not available
 * This is a simplified fallback method
 * @param {string} word - Word text
 * @returns {Array<string>} Array of viseme codes
 */
function estimateVisemesFromWord(word) {
  if (!word) return ['X'];
  
  const visemes = [];
  const text = word.toLowerCase();
  
  // Convert each character to a viseme
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const viseme = charToViseme(char);
    if (viseme !== 'X') {  // Skip spaces and punctuation in word estimation
      visemes.push(viseme);
    }
  }
  
  return visemes.length > 0 ? visemes : ['X'];
}

// CLI usage
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node whisperx-to-viseme.js <audio.mp3> [output.json] [options]');
    console.log('');
    console.log('Example:');
    console.log('  node whisperx-to-viseme.js audio.mp3');
    console.log('  node whisperx-to-viseme.js audio.mp3 output.json');
    console.log('  node whisperx-to-viseme.js audio.mp3 output.json --model large-v2');
    console.log('');
    console.log('Options:');
    console.log('  --model <size>      Model size: tiny, base, small, medium, large-v2 (default: base)');
    console.log('  --language <code>   Language code (e.g., en, es, fr) or auto (default: auto)');
    console.log('  --device <device>   Device: cpu or cuda (default: cpu)');
    console.log('  --verbose           Enable verbose logging');
    console.log('');
    console.log('Requirements:');
    console.log('  pip install whisperx');
    console.log('');
    console.log('WhisperX provides fast, accurate transcription and phoneme alignment');
    process.exit(1);
  }

  const audioPath = args[0];
  const outputJson = args[1] && !args[1].startsWith('--') 
    ? args[1] 
    : audioPath.replace(/\.[^.]+$/, '_visemes.json');

  // Parse command line options
  const options = {
    verbose: args.includes('--verbose')
  };

  const modelIndex = args.indexOf('--model');
  if (modelIndex !== -1 && args[modelIndex + 1]) {
    options.model = args[modelIndex + 1];
  }

  const languageIndex = args.indexOf('--language');
  if (languageIndex !== -1 && args[languageIndex + 1]) {
    options.language = args[languageIndex + 1];
  }

  const deviceIndex = args.indexOf('--device');
  if (deviceIndex !== -1 && args[deviceIndex + 1]) {
    options.device = args[deviceIndex + 1];
  }

  convertAudioToViseme(audioPath, outputJson, options)
    .then((visemeData) => {
      console.log('');
      console.log('='.repeat(50));
      console.log('Viseme Map Summary:');
      console.log('='.repeat(50));
      console.log(`Metadata:`);
      console.log(`  - Duration: ${visemeData.metadata?.duration?.toFixed(3)}s`);
      console.log(`  - Sound file: ${visemeData.metadata?.soundFile}`);
      console.log(`  - Transcript: ${visemeData.metadata?.transcript?.substring(0, 60)}...`);
      console.log(`  - Language: ${visemeData.metadata?.language}`);
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

export { convertAudioToViseme, convertWhisperXToVisemes, charToViseme, estimateVisemesFromWord };


