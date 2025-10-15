#!/usr/bin/env node

/**
 * Helper script to generate Azure viseme data for existing audio samples
 * Reads transcript files and generates audio + viseme data
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertTextToViseme } from './azure-to-viseme.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_SAMPLES_DIR = path.join(__dirname, '../../audio-samples');

const SAMPLES = [
  {
    name: 'audio-sample-v1',
    transcriptFile: 'audio-sample.txt',
    outputJson: 'audio-sample-azure_visemes.json',
    outputAudio: 'audio-sample-azure.mp3'
  },
  {
    name: 'audio-sample-v2',
    transcriptFile: 'audio-sample-v2.txt',
    outputJson: 'audio-sample-v2-azure_visemes.json',
    outputAudio: 'audio-sample-v2-azure.mp3'
  },
  {
    name: 'audio-sample-v3',
    transcriptFile: 'audio-sample-v3.txt',
    outputJson: 'audio-sample-v3-azure_visemes.json',
    outputAudio: 'audio-sample-v3-azure.mp3'
  }
];

async function generateSamples(options = {}) {
  const {
    voiceName = 'en-US-JennyNeural',
    generateAudio = true,
    skipExisting = true
  } = options;

  console.log('🎤 Azure Speech Service - Sample Generator');
  console.log('==========================================');
  console.log('');
  console.log(`Voice: ${voiceName}`);
  console.log(`Generate audio: ${generateAudio ? 'Yes' : 'No'}`);
  console.log(`Skip existing: ${skipExisting ? 'Yes' : 'No'}`);
  console.log('');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const sample of SAMPLES) {
    console.log(`\n📁 Processing ${sample.name}...`);
    console.log('-'.repeat(50));

    const sampleDir = path.join(AUDIO_SAMPLES_DIR, sample.name);
    const transcriptPath = path.join(sampleDir, sample.transcriptFile);
    const outputJsonPath = path.join(sampleDir, sample.outputJson);
    const outputAudioPath = generateAudio ? path.join(sampleDir, sample.outputAudio) : null;

    try {
      // Check if output already exists
      if (skipExisting) {
        try {
          await fs.access(outputJsonPath);
          console.log(`⏭️  Skipping (already exists): ${sample.outputJson}`);
          skipCount++;
          continue;
        } catch {
          // File doesn't exist, continue
        }
      }

      // Read transcript
      let transcript;
      try {
        transcript = await fs.readFile(transcriptPath, 'utf-8');
      } catch (error) {
        console.error(`❌ Transcript not found: ${sample.transcriptFile}`);
        errorCount++;
        continue;
      }

      if (!transcript.trim()) {
        console.error(`❌ Transcript is empty`);
        errorCount++;
        continue;
      }

      console.log(`📄 Transcript: ${transcript.substring(0, 60)}${transcript.length > 60 ? '...' : ''}`);
      console.log('');

      // Generate viseme data
      const visemeData = await convertTextToViseme(
        transcript,
        outputJsonPath,
        {
          voiceName,
          outputAudioPath
        }
      );

      console.log(`✅ Generated: ${sample.outputJson}`);
      if (outputAudioPath) {
        console.log(`🔊 Generated: ${sample.outputAudio}`);
      }
      console.log(`📊 Viseme cues: ${visemeData.mouthCues.length}`);
      console.log(`⏱️  Duration: ${visemeData.metadata.duration.toFixed(2)}s`);

      successCount++;

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('');
  console.log('='.repeat(50));
  console.log('Summary:');
  console.log('='.repeat(50));
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total: ${SAMPLES.length}`);
  console.log('');

  if (errorCount > 0) {
    console.log('⚠️  Some samples failed to generate.');
    console.log('   Make sure AZURE_SPEECH_KEY and AZURE_SPEECH_REGION are set.');
  } else if (successCount > 0) {
    console.log('🎉 All samples generated successfully!');
  }
}

// CLI usage
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  
  // Parse options
  const options = {
    voiceName: 'en-US-JennyNeural',
    generateAudio: true,
    skipExisting: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      console.log('Azure Speech Service - Sample Generator');
      console.log('');
      console.log('Usage: node generate-samples.js [options]');
      console.log('');
      console.log('Options:');
      console.log('  --voice <name>      Voice name (default: en-US-JennyNeural)');
      console.log('  --no-audio          Skip audio generation (visemes only)');
      console.log('  --force             Overwrite existing files');
      console.log('  --help, -h          Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  node generate-samples.js');
      console.log('  node generate-samples.js --voice en-US-GuyNeural');
      console.log('  node generate-samples.js --no-audio');
      console.log('  node generate-samples.js --force');
      console.log('');
      console.log('Environment Variables:');
      console.log('  AZURE_SPEECH_KEY    Azure Speech Service subscription key (required)');
      console.log('  AZURE_SPEECH_REGION Azure region (default: eastus)');
      process.exit(0);
    } else if (arg === '--voice') {
      options.voiceName = args[++i];
    } else if (arg === '--no-audio') {
      options.generateAudio = false;
    } else if (arg === '--force') {
      options.skipExisting = false;
    }
  }

  generateSamples(options)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('');
      console.error('❌ Fatal error:', error.message);
      process.exit(1);
    });
}

export { generateSamples };

