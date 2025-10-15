import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sdk from 'microsoft-cognitiveservices-speech-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Azure Speech Service viseme IDs to Rhubarb viseme mapping
 * Based on Microsoft's official viseme documentation and mouth position images
 * Reference: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme
 * 
 * Azure uses 22 viseme IDs (0-21) based on IPA phonemes
 * Mapped to Rhubarb's 9 Preston Blair viseme set (A-H, X)
 */
const AZURE_VISEME_TO_RHUBARB = {
  0: 'X',   // Silence - rest position
  1: 'C',   // æ, ə, ʌ (cat, about, strut) - open medium
  2: 'D',   // ɑ (father) - wide open
  3: 'E',   // ɔ (thought) - slightly rounded
  4: 'C',   // ɛ, ʊ (bed, foot) - open medium 
  5: 'E',   // ɝ (bird) - rounded with slight opening
  6: 'B',   // j, i, ɪ (yes, see, sit) - clenched teeth/smile
  7: 'F',   // w, u (we, boot) - puckered/rounded
  8: 'F',   // o (go) - puckered/rounded
  9: 'D',   // aʊ (how) - starts wide open
  10: 'E',  // ɔɪ (boy) - rounded to front
  11: 'D',  // aɪ (ice) - wide open to closed
  12: 'C',  // h (house) - open/aspirated
  13: 'E',  // ɹ (red) - slightly rounded
  14: 'H',  // l (lee) - tongue up behind teeth
  15: 'B',  // s, z (see, zoo) - clenched teeth
  16: 'B',  // ʃ, tʃ, dʒ, ʒ (she, church, judge) - clenched/pursed
  17: 'B',  // ð (the) - tongue between teeth, closest to B
  18: 'G',  // f, v (fee, vee) - teeth on lower lip
  19: 'B',  // d, t, n, θ (dee, tea, no, thin) - tongue/teeth
  20: 'B',  // k, g, ŋ (key, go, king) - back of mouth/teeth
  21: 'A',  // p, b, m (pee, bee, me) - closed lips
};

/**
 * Converts text to speech with viseme data using Azure Speech Service
 * @param {string} text - Text to synthesize
 * @param {string} outputJsonPath - Path where the JSON viseme map will be saved
 * @param {Object} options - Configuration options
 * @param {string} options.subscriptionKey - Azure Speech Service subscription key (required)
 * @param {string} options.region - Azure region (default: 'eastus')
 * @param {string} options.voiceName - Voice name (default: 'en-US-JennyNeural')
 * @param {string} options.outputAudioPath - Optional path to save generated audio file
 * @param {number} options.speakingRate - Speaking rate multiplier 0.5-2.0 (default: 1.0)
 * @param {number} options.pitch - Pitch adjustment in Hz -200 to +200 (default: 0)
 * @param {string} options.style - Voice style if supported (e.g., 'cheerful', 'sad')
 * @param {number} options.minDuration - Minimum viseme duration in seconds (default: 0.03)
 * @returns {Promise<Object>} The viseme map data
 */
async function convertTextToViseme(text, outputJsonPath, options = {}) {
  const {
    subscriptionKey = process.env.AZURE_SPEECH_KEY,
    region = process.env.AZURE_SPEECH_REGION || 'eastus',
    voiceName = 'en-US-JennyNeural',
    outputAudioPath = null,
    speakingRate = 1.0,
    pitch = 0,
    style = null,
    minDuration = 0.03
  } = options;

  // Validate required credentials
  if (!subscriptionKey) {
    throw new Error(
      'Azure Speech Service subscription key not provided.\n' +
      'Please set AZURE_SPEECH_KEY environment variable or pass subscriptionKey option.\n' +
      'Get a key at: https://portal.azure.com/'
    );
  }

  if (!text || !text.trim()) {
    throw new Error('Text cannot be empty');
  }

  console.log('🎤 Converting text to viseme map using Azure Speech Service...');
  console.log(`📝 Text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
  console.log(`🗣️  Voice: ${voiceName}`);
  console.log(`🌍 Region: ${region}`);
  console.log(`📁 Output: ${outputJsonPath}`);
  console.log('');

  // Configure speech synthesizer
  const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, region);
  speechConfig.speechSynthesisVoiceName = voiceName;
  
  // Create audio config
  let audioConfig;
  if (outputAudioPath) {
    audioConfig = sdk.AudioConfig.fromAudioFileOutput(outputAudioPath);
    console.log(`🔊 Audio will be saved to: ${outputAudioPath}`);
  } else {
    // Use null output to avoid playing audio
    audioConfig = null;
  }

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  // Build SSML for better control
  const ssml = buildSSML(text, voiceName, speakingRate, pitch, style);

  return new Promise((resolve, reject) => {
    const visemeData = [];
    let audioDuration = 0;

    // Subscribe to viseme events
    synthesizer.visemeReceived = (s, e) => {
      const azureVisemeId = e.visemeId;
      const rhubarbViseme = AZURE_VISEME_TO_RHUBARB[azureVisemeId] || 'X';
      const audioOffsetMs = e.audioOffset / 10000; // Convert from 100-nanosecond units to milliseconds
      const audioOffsetSeconds = audioOffsetMs / 1000;

      visemeData.push({
        azureVisemeId,
        rhubarbViseme,
        audioOffset: audioOffsetSeconds,
        animation: e.animation
      });
    };

    // Synthesize speech
    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        synthesizer.close();

        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log('✅ Speech synthesis completed!');
          
          // Get audio duration from result
          if (result.audioDuration) {
            audioDuration = result.audioDuration / 10000000; // Convert from 100-nanosecond units to seconds
          } else if (visemeData.length > 0) {
            // Estimate duration from last viseme + some buffer
            audioDuration = visemeData[visemeData.length - 1].audioOffset + 0.3;
          }

          // Convert to Rhubarb format
          const rhubarbFormat = convertToRhubarbFormat(
            visemeData,
            audioDuration,
            text,
            outputAudioPath,
            minDuration
          );

          // Save to JSON file
          fs.writeFile(outputJsonPath, JSON.stringify(rhubarbFormat, null, 2))
            .then(() => {
              console.log('✅ Successfully generated viseme map!');
              console.log(`📊 Total cues: ${rhubarbFormat.mouthCues?.length || 0}`);
              console.log(`⏱️  Duration: ${audioDuration.toFixed(3)}s`);
              resolve(rhubarbFormat);
            })
            .catch(reject);

        } else if (result.reason === sdk.ResultReason.Canceled) {
          const cancellation = sdk.SpeechSynthesisCancellationDetails.fromResult(result);
          synthesizer.close();
          reject(new Error(
            `Speech synthesis canceled: ${cancellation.reason}\n` +
            `Error: ${cancellation.errorDetails}`
          ));
        } else {
          synthesizer.close();
          reject(new Error(`Unexpected result reason: ${result.reason}`));
        }
      },
      (error) => {
        synthesizer.close();
        reject(new Error(`Speech synthesis failed: ${error}`));
      }
    );
  });
}

/**
 * Builds SSML markup for speech synthesis
 * @param {string} text - Text to speak
 * @param {string} voiceName - Voice name
 * @param {number} speakingRate - Speaking rate multiplier
 * @param {number} pitch - Pitch adjustment in Hz
 * @param {string} style - Voice style (optional)
 * @returns {string} SSML markup
 */
function buildSSML(text, voiceName, speakingRate, pitch, style) {
  let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">`;
  ssml += `<voice name="${voiceName}">`;
  
  // Add style if provided
  if (style) {
    ssml += `<mstts:express-as style="${style}">`;
  }
  
  // Add prosody adjustments
  const prosodyAttrs = [];
  if (speakingRate !== 1.0) {
    const ratePercent = Math.round((speakingRate - 1.0) * 100);
    prosodyAttrs.push(`rate="${ratePercent >= 0 ? '+' : ''}${ratePercent}%"`);
  }
  if (pitch !== 0) {
    prosodyAttrs.push(`pitch="${pitch >= 0 ? '+' : ''}${pitch}Hz"`);
  }
  
  if (prosodyAttrs.length > 0) {
    ssml += `<prosody ${prosodyAttrs.join(' ')}>`;
  }
  
  ssml += escapeXml(text);
  
  if (prosodyAttrs.length > 0) {
    ssml += `</prosody>`;
  }
  
  if (style) {
    ssml += `</mstts:express-as>`;
  }
  
  ssml += `</voice></speak>`;
  
  return ssml;
}

/**
 * Escapes XML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts Azure viseme data to Rhubarb-compatible format
 * @param {Array} visemeData - Raw viseme data from Azure
 * @param {number} duration - Audio duration in seconds
 * @param {string} transcript - Original text
 * @param {string} audioFile - Audio file path
 * @param {number} minDuration - Minimum viseme duration
 * @returns {Object} Rhubarb-compatible viseme data
 */
function convertToRhubarbFormat(visemeData, duration, transcript, audioFile, minDuration) {
  const mouthCues = [];
  
  if (visemeData.length === 0) {
    // No viseme data, add silence
    return {
      metadata: {
        soundFile: audioFile || 'azure-generated',
        duration,
        transcript,
        source: 'azure',
        voiceEngine: 'Microsoft Azure Speech Service'
      },
      mouthCues: [
        { start: 0, end: duration, value: 'X' }
      ]
    };
  }

  // Sort by audio offset
  visemeData.sort((a, b) => a.audioOffset - b.audioOffset);

  let lastViseme = null;
  let lastEnd = 0;

  // Add initial silence if speech doesn't start at 0
  if (visemeData[0].audioOffset > 0.01) {
    mouthCues.push({
      start: 0,
      end: parseFloat(visemeData[0].audioOffset.toFixed(3)),
      value: 'X'
    });
    lastEnd = visemeData[0].audioOffset;
  }

  // Process each viseme
  for (let i = 0; i < visemeData.length; i++) {
    const current = visemeData[i];
    const next = i < visemeData.length - 1 ? visemeData[i + 1] : null;
    
    const start = current.audioOffset;
    const end = next ? next.audioOffset : duration;
    const viseme = current.rhubarbViseme;
    
    // Skip very short visemes
    if (end - start < minDuration) {
      continue;
    }

    // Merge with previous cue if same viseme
    if (mouthCues.length > 0 && lastViseme === viseme && Math.abs(start - lastEnd) < 0.001) {
      mouthCues[mouthCues.length - 1].end = parseFloat(end.toFixed(3));
    } else {
      // Add gap silence if needed
      if (start > lastEnd + 0.01) {
        mouthCues.push({
          start: parseFloat(lastEnd.toFixed(3)),
          end: parseFloat(start.toFixed(3)),
          value: 'X'
        });
      }
      
      mouthCues.push({
        start: parseFloat(start.toFixed(3)),
        end: parseFloat(end.toFixed(3)),
        value: viseme
      });
    }
    
    lastViseme = viseme;
    lastEnd = end;
  }

  // Add final silence if needed
  if (lastEnd < duration - 0.01) {
    mouthCues.push({
      start: parseFloat(lastEnd.toFixed(3)),
      end: parseFloat(duration.toFixed(3)),
      value: 'X'
    });
  }

  return {
    metadata: {
      soundFile: audioFile || 'azure-generated',
      duration: parseFloat(duration.toFixed(3)),
      transcript,
      source: 'azure',
      voiceEngine: 'Microsoft Azure Speech Service'
    },
    mouthCues
  };
}

/**
 * Formats viseme data to readable format
 * @param {Object} visemeData - Viseme data with mouthCues
 * @returns {Array} Formatted viseme array
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
    duration: cue.end - cue.start,
    durationFormatted: `${(cue.end - cue.start).toFixed(3)}s`,
    description: getVisemeDescription(cue.value)
  }));
}

/**
 * Gets viseme description
 * @param {string} viseme - Rhubarb viseme code
 * @returns {string} Description
 */
function getVisemeDescription(viseme) {
  const descriptions = {
    'A': 'Closed lips (M, B, P)',
    'B': 'Clenched teeth (K, S, T, EE)',
    'C': 'Open mouth medium (EH, AE)',
    'D': 'Wide open (AA, AH)',
    'E': 'Slightly rounded (AO, ER)',
    'F': 'Puckered lips (UW, OW, W)',
    'G': 'Teeth on lip (F, V)',
    'H': 'Tongue up (L)',
    'X': 'Rest/silence'
  };
  
  return descriptions[viseme] || 'Unknown viseme';
}

// CLI usage
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node azure-to-viseme.js <text> [output.json] [output-audio.wav]');
    console.log('');
    console.log('Example:');
    console.log('  node azure-to-viseme.js "Hello world" output.json audio.wav');
    console.log('  node azure-to-viseme.js "Hello world" output.json');
    console.log('');
    console.log('Environment Variables:');
    console.log('  AZURE_SPEECH_KEY - Azure Speech Service subscription key (required)');
    console.log('  AZURE_SPEECH_REGION - Azure region (default: eastus)');
    console.log('');
    console.log('Setup:');
    console.log('  1. Create Azure Speech Service resource at: https://portal.azure.com/');
    console.log('  2. Get subscription key and region');
    console.log('  3. Set environment variables:');
    console.log('     export AZURE_SPEECH_KEY="your-key"');
    console.log('     export AZURE_SPEECH_REGION="eastus"');
    console.log('');
    console.log('Popular voices:');
    console.log('  - en-US-JennyNeural (female, friendly)');
    console.log('  - en-US-GuyNeural (male, warm)');
    console.log('  - en-US-AriaNeural (female, energetic)');
    console.log('  - en-US-DavisNeural (male, professional)');
    process.exit(1);
  }

  const text = args[0];
  const outputJson = args[1] || 'azure_visemes.json';
  const outputAudio = args[2] || null;

  convertTextToViseme(text, outputJson, { outputAudioPath: outputAudio })
    .then((visemeData) => {
      console.log('');
      console.log('='.repeat(50));
      console.log('Viseme Map Summary:');
      console.log('='.repeat(50));
      console.log(`Metadata:`);
      console.log(`  - Duration: ${visemeData.metadata?.duration?.toFixed(3)}s`);
      console.log(`  - Sound file: ${visemeData.metadata?.soundFile}`);
      console.log(`  - Transcript: ${visemeData.metadata?.transcript}`);
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
      if (outputAudio) {
        console.log(`🔊 Audio saved to: ${outputAudio}`);
      }
    })
    .catch((error) => {
      console.error('');
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

export { 
  convertTextToViseme, 
  formatVisemeData, 
  getVisemeDescription,
  AZURE_VISEME_TO_RHUBARB 
};

