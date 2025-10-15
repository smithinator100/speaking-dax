# Azure Speech Service - Text to Viseme Converter

Convert text to speech with synchronized viseme data using Microsoft Azure Speech Service.

## Overview

This module uses Azure's Neural Text-to-Speech (TTS) service to generate both audio and viseme timing data. Unlike Rhubarb (which analyzes existing audio) or Gentle (which requires transcripts for alignment), Azure Speech generates audio from text and provides highly accurate viseme timing directly from the synthesis process.

## Features

✅ **Text-to-Speech with Visemes** - Generate audio and viseme data in one step  
✅ **High-Quality Neural Voices** - 400+ voices across 140+ languages  
✅ **Precise Timing** - Viseme data synchronized perfectly with generated audio  
✅ **Voice Customization** - Control speaking rate, pitch, and style  
✅ **No Local Dependencies** - Cloud-based service (no heavy local processing)  
✅ **SSML Support** - Fine-tune pronunciation and emphasis  

## Setup

### 1. Create Azure Speech Service Resource

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a new **Speech Service** resource
3. Choose a region (e.g., `eastus`, `westus2`)
4. Select pricing tier (Free tier available: 5M characters/month)
5. Get your **subscription key** and **region**

### 2. Set Environment Variables

```bash
# Add to ~/.zshrc or ~/.bashrc
export AZURE_SPEECH_KEY="your-subscription-key-here"
export AZURE_SPEECH_REGION="eastus"

# Reload shell config
source ~/.zshrc
```

### 3. Install Dependencies

```bash
npm install
```

The Azure Speech SDK (`microsoft-cognitiveservices-speech-sdk`) is included in package.json.

## Usage

### Command Line

**Basic usage:**
```bash
node lip-sync-libraries/azure/azure-to-viseme.js "Hello world" output.json
```

**With audio output:**
```bash
node lip-sync-libraries/azure/azure-to-viseme.js "Hello world" output.json output.wav
```

**Using npm script:**
```bash
npm run convert:azure "Your text here"
```

### As a Module

```javascript
import { convertTextToViseme } from './lip-sync-libraries/azure/azure-to-viseme.js';

const visemeData = await convertTextToViseme(
  'Hello, how are you today?',
  'output.json',
  {
    subscriptionKey: 'your-key',
    region: 'eastus',
    voiceName: 'en-US-JennyNeural',
    outputAudioPath: 'output.wav',
    speakingRate: 1.0,
    pitch: 0,
    style: 'cheerful',
    minDuration: 0.03
  }
);
```

## Configuration Options

### Required Options

| Option | Type | Description |
|--------|------|-------------|
| `subscriptionKey` | string | Azure Speech Service subscription key |
| `region` | string | Azure region (e.g., 'eastus', 'westus2') |

### Optional Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `voiceName` | string | `'en-US-JennyNeural'` | Voice to use for synthesis |
| `outputAudioPath` | string | `null` | Path to save generated audio (optional) |
| `speakingRate` | number | `1.0` | Speaking speed (0.5-2.0) |
| `pitch` | number | `0` | Pitch adjustment in Hz (-200 to +200) |
| `style` | string | `null` | Voice style (if supported by voice) |
| `minDuration` | number | `0.03` | Minimum viseme duration in seconds |

## Popular Voices

### English (US)

| Voice | Gender | Characteristics | Styles Available |
|-------|--------|-----------------|------------------|
| `en-US-JennyNeural` | Female | Friendly, warm | cheerful, sad, angry, excited |
| `en-US-GuyNeural` | Male | Professional, clear | newscast, angry, cheerful, sad |
| `en-US-AriaNeural` | Female | Energetic, expressive | cheerful, empathetic, angry |
| `en-US-DavisNeural` | Male | Professional, calm | angry, cheerful, excited, sad |
| `en-US-JaneNeural` | Female | Natural, casual | - |
| `en-US-JasonNeural` | Male | Energetic, youthful | - |

### Other Languages

- **Spanish:** `es-ES-ElviraNeural`, `es-MX-DaliaNeural`
- **French:** `fr-FR-DeniseNeural`, `fr-CA-SylvieNeural`
- **German:** `de-DE-KatjaNeural`, `de-DE-ConradNeural`
- **Japanese:** `ja-JP-NanamiNeural`, `ja-JP-KeitaNeural`
- **Chinese:** `zh-CN-XiaoxiaoNeural`, `zh-CN-YunxiNeural`

[See full voice list](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts)

## Voice Styles

Some neural voices support expressive styles:

```javascript
// Use cheerful style
await convertTextToViseme(
  'Hello! How are you doing today?',
  'output.json',
  {
    voiceName: 'en-US-JennyNeural',
    style: 'cheerful'
  }
);
```

Available styles (voice-dependent):
- `cheerful` - Happy, upbeat
- `sad` - Sorrowful
- `angry` - Angry, frustrated
- `excited` - Enthusiastic
- `friendly` - Warm, casual
- `terrified` - Fearful
- `shouting` - Loud, distant
- `unfriendly` - Cold, dismissive
- `newscast` - Professional narration
- `customerservice` - Professional support

## Azure Viseme Mapping

Azure uses a 22-viseme set (based on IPA phonemes) that's mapped to Rhubarb's 9-viseme Preston Blair system:

| Azure ID | IPA Phonemes | Example Words | Rhubarb | Description |
|----------|--------------|---------------|---------|-------------|
| 0 | Silence | - | X | Rest position |
| 1 | æ, ə, ʌ | cat, about, strut | C | Open medium |
| 2 | ɑ | father | D | Wide open |
| 3 | ɔ | thought | E | Slightly rounded |
| 4 | ɛ, ʊ | bed, foot | C | Open medium |
| 5 | ɝ | bird | E | Rounded with slight opening |
| 6 | j, i, ɪ | yes, see, sit | B | Clenched teeth/smile |
| 7 | w, u | we, boot | F | Puckered/rounded |
| 8 | o | go | F | Puckered/rounded |
| 9 | aʊ | how | D | Starts wide open |
| 10 | ɔɪ | boy | E | Rounded to front |
| 11 | aɪ | ice | D | Wide open to closed |
| 12 | h | house | C | Open/aspirated |
| 13 | ɹ | red | E | Slightly rounded |
| 14 | l | lee | H | Tongue up behind teeth |
| 15 | s, z | see, zoo | B | Clenched teeth |
| 16 | ʃ, tʃ, dʒ, ʒ | she, church, judge | B | Clenched/pursed |
| 17 | ð | the | B | Tongue between teeth |
| 18 | f, v | fee, vee | G | Teeth on lower lip |
| 19 | d, t, n, θ | dee, tea, no, thin | B | Tongue/teeth |
| 20 | k, g, ŋ | key, go, king | B | Back of mouth/teeth |
| 21 | p, b, m | pee, bee, me | A | Closed lips |

**Note:** This mapping is based on Microsoft's official viseme mouth position images. See [Azure's viseme documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme) for reference images of each viseme.

## Output Format

Generates the same JSON format as Rhubarb and Gentle:

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

## Comparison with Other Tools

| Feature | Azure Speech | Rhubarb | Gentle |
|---------|--------------|---------|--------|
| **Input** | Text | Audio | Audio + Transcript |
| **Output** | Audio + Visemes | Visemes | Visemes |
| **Accuracy** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| **Speed** | ⚡ Fast (cloud) | ⚡ Fast | 🐢 Moderate |
| **Setup** | Cloud API key | Local binary | Python + models |
| **Cost** | $16/1M chars* | Free | Free |
| **Voices** | 400+ languages | N/A | N/A |
| **Use Case** | Generate new audio | Analyze existing audio | Align with script |

\* Azure Free tier: 5M characters/month for Neural TTS

## Use Cases

### ✅ Best For:

1. **Generating New Character Dialogue**
   - Create voiceovers for animations
   - Prototype character voices
   - Generate placeholder audio

2. **Multi-language Content**
   - 140+ languages and dialects
   - Native speaker quality
   - Consistent voice across languages

3. **Rapid Prototyping**
   - No recording equipment needed
   - Instant audio generation
   - Quick iteration on scripts

4. **Voice Customization**
   - Control speaking rate and pitch
   - Apply emotional styles
   - Fine-tune with SSML

5. **Production TTS**
   - High-quality neural voices
   - Professional narration
   - Accessible content

### ❌ Not Ideal For:

- Analyzing pre-recorded audio (use Rhubarb)
- Working with specific voice actors (use Gentle)
- Offline/local-only processing
- Budget-constrained hobby projects

## Advanced Usage

### SSML for Fine Control

The converter automatically wraps text in SSML, but you can customize it:

```javascript
// Emphasize words
const text = `I <emphasis level="strong">really</emphasis> love this!`;

// Add pauses
const text = `Hello <break time="500ms"/> how are you?`;

// Phonetic pronunciation
const text = `<phoneme alphabet="ipa" ph="təˈmeɪtoʊ">tomato</phoneme>`;
```

### Batch Processing

```javascript
import { convertTextToViseme } from './lip-sync-libraries/azure/azure-to-viseme.js';

const dialogues = [
  { text: 'Hello there!', file: 'line1' },
  { text: 'How are you?', file: 'line2' },
  { text: 'Nice to meet you!', file: 'line3' }
];

for (const dialogue of dialogues) {
  await convertTextToViseme(
    dialogue.text,
    `${dialogue.file}.json`,
    {
      outputAudioPath: `${dialogue.file}.wav`,
      voiceName: 'en-US-JennyNeural'
    }
  );
}
```

## Troubleshooting

### Error: "Subscription key not provided"

**Solution:**
```bash
export AZURE_SPEECH_KEY="your-key-here"
export AZURE_SPEECH_REGION="eastus"
```

### Error: "Subscription key is invalid"

**Causes:**
1. Incorrect key
2. Wrong region
3. Resource not active

**Solution:**
- Verify key in Azure Portal
- Check region matches resource location
- Ensure resource is active and not deleted

### Error: "Quota exceeded"

**Cause:** Free tier limit reached (5M characters/month)

**Solutions:**
- Wait for quota reset (monthly)
- Upgrade to paid tier
- Use shorter text for testing

### Poor Viseme Quality

**Solutions:**
- Use Neural voices (end with "Neural")
- Adjust `minDuration` to filter brief visemes
- Try different voices
- Use SSML for pronunciation control

## Pricing

**Free Tier:**
- 5 million characters/month for Neural TTS
- Includes viseme data
- No credit card required for first 12 months

**Pay-as-you-go:**
- Neural: $16 per 1M characters
- Standard: $4 per 1M characters
- Real-time: $0.07 per hour (audio output)

[See Azure pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/)

## Resources

- [Azure Speech Service Documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/)
- [Voice Gallery](https://speech.microsoft.com/portal/voicegallery)
- [SSML Reference](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup)
- [Viseme Documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme)
- [SDK Documentation](https://learn.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/)

## License

MIT

---

**Next Steps:**
1. Get Azure Speech Service key
2. Test with example text
3. Experiment with different voices
4. Integrate into your animation pipeline

