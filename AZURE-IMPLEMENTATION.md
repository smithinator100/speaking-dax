# Azure Speech Service Implementation

**Status:** ✅ Complete  
**Date:** October 15, 2025  
**Version:** 1.0.0

## Overview

Successfully implemented Microsoft Azure Speech Service as a third lip-sync option alongside Rhubarb and Gentle. Azure Speech provides text-to-speech with synchronized viseme data, enabling users to generate audio and lip-sync animation from text.

## What Was Added

### 1. Core Azure Module

**File:** `lip-sync-libraries/azure/azure-to-viseme.js`

- Converts text to speech with viseme timing
- Uses Azure Speech SDK (`microsoft-cognitiveservices-speech-sdk`)
- Maps Azure's 22-viseme set to Rhubarb's 9-viseme format
- Supports voice customization (pitch, rate, style)
- Generates Rhubarb-compatible JSON output

**Features:**
- ✅ Text-to-speech synthesis
- ✅ Real-time viseme events
- ✅ SSML support
- ✅ Voice style control
- ✅ Audio file output (optional)
- ✅ CLI and module usage

### 2. Helper Scripts

**File:** `lip-sync-libraries/azure/generate-samples.js`

- Batch generates Azure viseme data from existing transcripts
- Processes all audio samples automatically
- Configurable voice selection
- Skip existing files option

**Usage:**
```bash
cd lip-sync-libraries/azure
node generate-samples.js [options]

Options:
  --voice <name>      Voice name (default: en-US-JennyNeural)
  --no-audio          Skip audio generation
  --force             Overwrite existing files
  --help              Show help
```

### 3. Documentation

**File:** `lip-sync-libraries/azure/README.md`

Comprehensive documentation including:
- Setup instructions
- Usage examples
- Voice options (400+ voices)
- Configuration reference
- Troubleshooting guide
- Pricing information
- Comparison with other tools

**File:** `SETUP-GUIDE.md`

Complete setup guide for all three tools (Rhubarb, Azure, Gentle).

### 4. Updated Existing Files

#### `package.json`
- Added `microsoft-cognitiveservices-speech-sdk` dependency
- Added `convert:azure` npm script
- Updated description and keywords

#### `index.html`
- Added Azure Speech option to lip sync model selector
- Added `azureData` variable
- Updated `loadVisemeData()` to load Azure viseme files
- Updated `updateMouthShapes()` to support Azure data
- Added Azure data validation in `playAudio()`
- Updated file path mapping for Azure viseme files

#### `README.md`
- Added Azure Speech to comparison table
- Added Azure setup instructions
- Added Azure usage examples
- Updated "Which Tool Should I Use?" section
- Added Azure to overview

### 5. Sample Data

**File:** `audio-samples/audio-sample-v2/audio-sample-v2-azure_visemes.json`

Sample Azure viseme data for testing the UI without requiring Azure credentials.

## Viseme Mapping

Azure uses a 22-viseme phonetic system that's mapped to Rhubarb's 9-viseme Preston Blair set:

| Azure IDs | Sounds | Rhubarb | Description |
|-----------|--------|---------|-------------|
| 0 | Silence | X | Rest position |
| 1, 2, 11, 12 | ae, ax, ah, aa, ay, h | C, D | Open mouth |
| 4, 6, 15, 16, 17, 19, 20 | ey, eh, iy, ih, s, z, sh, th, d, t, k, g | B | Clenched teeth |
| 5, 9, 13 | er, aw, r | E | Slightly rounded |
| 3, 7, 8, 10 | ao, w, uw, ow, oy | F | Puckered |
| 14 | l | H | Tongue up |
| 18 | f, v | G | Teeth on lip |
| 21 | p, b, m | A | Closed lips |

This mapping ensures Azure visemes work seamlessly with existing mouth shape assets.

## Environment Variables

### Required

```bash
AZURE_SPEECH_KEY="your-subscription-key"
AZURE_SPEECH_REGION="eastus"  # or your region
```

### Setup

**macOS/Linux (`~/.zshrc` or `~/.bashrc`):**
```bash
export AZURE_SPEECH_KEY="your-subscription-key"
export AZURE_SPEECH_REGION="eastus"
```

**Windows (System Environment Variables):**
1. Search "Environment Variables"
2. Add `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`

## Usage Examples

### Command Line

```bash
# Basic usage
node lip-sync-libraries/azure/azure-to-viseme.js "Hello world" output.json

# With audio output
node lip-sync-libraries/azure/azure-to-viseme.js "Hello world" output.json audio.wav

# Using npm script
npm run convert:azure "Your text here"
```

### As a Module

```javascript
import { convertTextToViseme } from './lip-sync-libraries/azure/azure-to-viseme.js';

const visemeData = await convertTextToViseme(
  'Hello, how are you today?',
  'output.json',
  {
    subscriptionKey: process.env.AZURE_SPEECH_KEY,
    region: 'eastus',
    voiceName: 'en-US-JennyNeural',
    outputAudioPath: 'audio.wav',
    speakingRate: 1.0,
    pitch: 0,
    style: 'cheerful',
    minDuration: 0.03
  }
);

console.log(`Generated ${visemeData.mouthCues.length} viseme cues`);
```

### Web Interface

1. Open `index.html` in browser
2. Select "Azure Speech" from "Lip Sync Model" dropdown
3. Select audio sample
4. Click ▶ Play Audio
5. Watch synchronized lip-sync animation

## Installation

### 1. Install Dependencies

```bash
npm install
```

This installs the Azure Speech SDK automatically.

### 2. Get Azure Credentials

1. Create free Azure account at [portal.azure.com](https://portal.azure.com/)
2. Create Speech Service resource
3. Get subscription key and region
4. Set environment variables

### 3. Test Installation

```bash
npm run convert:azure "Hello world"
```

Should generate `azure_visemes.json` if credentials are set correctly.

## Azure Speech Features

### Voices

- 400+ neural voices
- 140+ languages and dialects
- Multiple styles (cheerful, sad, angry, etc.)
- Customizable pitch and speaking rate

**Popular English Voices:**
- `en-US-JennyNeural` (female, friendly)
- `en-US-GuyNeural` (male, professional)
- `en-US-AriaNeural` (female, energetic)
- `en-US-DavisNeural` (male, calm)

[Full voice list](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts)

### Voice Styles

Supported styles (voice-dependent):
- `cheerful` - Happy, upbeat
- `sad` - Sorrowful
- `angry` - Frustrated
- `excited` - Enthusiastic
- `friendly` - Warm, casual
- `newscast` - Professional narration

### SSML Support

The converter automatically generates SSML but you can pass custom markup:

```javascript
const text = `
  I <emphasis level="strong">really</emphasis> love this!
  <break time="500ms"/>
  It's <prosody rate="slow">amazing</prosody>!
`;
```

## Pricing

### Free Tier
- 5 million characters/month
- Neural TTS with visemes
- No credit card required (first 12 months)
- Unlimited free tier after trial

### Paid Tier
- $16 per 1 million characters (Neural TTS)
- Pay only for what you use
- No minimum commitment

[Azure Pricing Details](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/)

## Comparison

| Feature | Azure | Rhubarb | Gentle |
|---------|-------|---------|--------|
| **Input** | Text | Audio | Audio + Transcript |
| **Output** | Audio + Visemes | Visemes | Visemes |
| **Accuracy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Speed** | ⚡ Fast | ⚡ Fast | 🐢 Moderate |
| **Setup** | 🟢 Simple | 🟢 Simple | 🟡 Complex |
| **Cost** | 💰 Paid | Free | Free |
| **Internet** | Required | Optional | No |
| **Languages** | 140+ | Any | English |

### When to Use Azure

**✅ Best For:**
- Generating new character dialogue
- Multi-language content
- Professional voiceovers
- Voice customization
- Perfect audio-viseme sync
- Production TTS applications

**❌ Not Ideal For:**
- Analyzing existing recordings
- Working with specific voice actors
- Offline/local-only processing
- Budget-constrained hobby projects

## File Structure

```
speaking-dax/
├── lip-sync-libraries/
│   ├── azure/
│   │   ├── azure-to-viseme.js       # Main Azure converter
│   │   ├── generate-samples.js      # Sample generator
│   │   └── README.md                # Azure documentation
│   ├── rhubarb/
│   └── gentle/
├── audio-samples/
│   ├── audio-sample-v2/
│   │   ├── audio-sample-v2.mp3
│   │   ├── audio-sample-v2.txt
│   │   ├── audio-sample-v2_visemes.json          # Rhubarb
│   │   ├── audio-sample-v2-gentle_visemes.json   # Gentle
│   │   └── audio-sample-v2-azure_visemes.json    # Azure (new)
│   └── ...
├── index.html                       # Updated with Azure support
├── package.json                     # Updated with Azure SDK
├── README.md                        # Updated with Azure info
├── SETUP-GUIDE.md                   # New comprehensive guide
└── AZURE-IMPLEMENTATION.md          # This file
```

## Testing

### Without Azure Credentials

Open `index.html` and select:
- Lip Sync Model: **Azure Speech**
- Audio Sample: **Sample V2**

This uses the pre-generated sample Azure viseme data.

### With Azure Credentials

```bash
# Set credentials
export AZURE_SPEECH_KEY="your-key"
export AZURE_SPEECH_REGION="eastus"

# Generate visemes from text
npm run convert:azure "Hello, this is a test!"

# Generate for all samples
cd lip-sync-libraries/azure
node generate-samples.js
```

## Troubleshooting

### Common Issues

**"Subscription key not provided"**
- Set `AZURE_SPEECH_KEY` environment variable
- Check with: `echo $AZURE_SPEECH_KEY`

**"Azure viseme data not available"**
- Sample files don't have Azure data yet
- Run `generate-samples.js` to create them
- Or Azure credentials not configured

**"Quota exceeded"**
- Free tier: 5M characters/month
- Upgrade to paid tier or wait for monthly reset

**"Module not found: microsoft-cognitiveservices-speech-sdk"**
- Run `npm install`
- Check `package.json` includes the dependency

## API Reference

### `convertTextToViseme(text, outputJsonPath, options)`

**Parameters:**
- `text` (string) - Text to synthesize
- `outputJsonPath` (string) - Output path for JSON
- `options` (object):
  - `subscriptionKey` (string) - Azure key
  - `region` (string) - Azure region
  - `voiceName` (string) - Voice name
  - `outputAudioPath` (string) - Audio output path
  - `speakingRate` (number) - Speed (0.5-2.0)
  - `pitch` (number) - Pitch adjustment (-200 to +200)
  - `style` (string) - Voice style
  - `minDuration` (number) - Min viseme duration

**Returns:** Promise<Object> - Viseme data

**Example:**
```javascript
const data = await convertTextToViseme(
  'Hello world',
  'output.json',
  {
    voiceName: 'en-US-JennyNeural',
    style: 'cheerful'
  }
);
```

## Output Format

Identical to Rhubarb and Gentle:

```json
{
  "metadata": {
    "soundFile": "output.wav",
    "duration": 2.45,
    "transcript": "Hello world",
    "source": "azure",
    "voiceEngine": "Microsoft Azure Speech Service"
  },
  "mouthCues": [
    { "start": 0.00, "end": 0.12, "value": "X" },
    { "start": 0.12, "end": 0.24, "value": "C" },
    { "start": 0.24, "end": 0.38, "value": "B" }
  ]
}
```

## Future Enhancements

Potential additions:
- [ ] Batch processing UI
- [ ] Voice preview in UI
- [ ] Custom SSML editor
- [ ] Azure emotion detection
- [ ] Real-time TTS streaming
- [ ] Voice cloning support

## Resources

- [Azure Speech Service](https://azure.microsoft.com/en-us/services/cognitive-services/speech-services/)
- [Voice Gallery](https://speech.microsoft.com/portal/voicegallery)
- [SSML Reference](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup)
- [Viseme Documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme)
- [SDK Documentation](https://learn.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/)

## Support

For issues or questions:
1. Check [Azure README](./lip-sync-libraries/azure/README.md)
2. Check [SETUP-GUIDE.md](./SETUP-GUIDE.md)
3. Check [CONFIGURATION.md](./CONFIGURATION.md)
4. Review main [README.md](./README.md)

---

**Implementation Complete!** 🎉

Azure Speech Service is fully integrated and ready to use.

