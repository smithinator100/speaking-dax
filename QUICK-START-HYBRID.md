# Quick Start: Hybrid Pipeline

**⭐ Recommended approach for production-quality lip-sync viseme generation**

The Hybrid Pipeline combines WhisperX's auto-transcription with Gentle's precise phoneme alignment for maximum accuracy without manual transcription work.

## Why Hybrid Pipeline?

| Feature | Hybrid Pipeline | Other Approaches |
|---------|----------------|------------------|
| **Accuracy** | ⭐⭐⭐ Excellent (~95-98%) | Good to Excellent |
| **Convenience** | ⭐⭐⭐ Auto-transcribes | Varies |
| **Manual Work** | ❌ None | May require transcript |
| **Multi-language** | ✅ 90+ languages | Limited or varies |
| **Best For** | **Production quality** | Quick prototypes or specific needs |

## Prerequisites

### 1. Python 3.8+

```bash
python3 --version
```

### 2. WhisperX

```bash
pip install whisperx
```

### 3. Gentle

```bash
# Clone Gentle
git clone https://github.com/lowerquality/gentle.git
cd gentle

# Install dependencies and models
./install.sh

# Set environment variable
export GENTLE_RESOURCES_ROOT="$(pwd)"

# Add to your shell profile for persistence
echo 'export GENTLE_RESOURCES_ROOT=/path/to/gentle' >> ~/.zshrc
source ~/.zshrc
```

### 4. ffmpeg

```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt-get install ffmpeg
```

## Basic Usage

### Option 1: Direct Command (Simplest)

```bash
node lip-sync-libraries/hybrid/hybrid-to-viseme.js audio.mp3
```

This will:
- Auto-transcribe using WhisperX
- Align phonemes using Gentle
- Output `audio_visemes-hybrid.json`
- Save transcript to `audio_transcript.txt`

### Option 2: Convenience Script

```bash
./lip-sync-libraries/hybrid/convert.sh audio.mp3
```

### Option 3: NPM Script

```bash
npm run convert:hybrid audio.mp3
```

## Advanced Usage

### Custom Output Path

```bash
node lip-sync-libraries/hybrid/hybrid-to-viseme.js audio.mp3 my-output.json
```

### Better Accuracy (Larger Model)

```bash
node lip-sync-libraries/hybrid/hybrid-to-viseme.js audio.mp3 output.json --whisper-model large-v2
```

**Model Options:**
- `tiny` - Fastest, least accurate (~1 GB RAM)
- `base` - Default, good balance (~2 GB RAM)
- `small` - Better accuracy (~3 GB RAM)
- `medium` - Very good accuracy (~5 GB RAM)
- `large-v2` - Best accuracy (~7 GB RAM) ⭐

### Specify Language (Faster)

```bash
node lip-sync-libraries/hybrid/hybrid-to-viseme.js audio.mp3 output.json --whisper-language en
```

**Language Codes:** en, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi, and 80+ more

### GPU Acceleration (CUDA)

```bash
# Requires NVIDIA GPU with CUDA
node lip-sync-libraries/hybrid/hybrid-to-viseme.js audio.mp3 output.json --whisper-device cuda
```

**Performance:** 3-5x faster with GPU (3-5s per minute of audio vs 10-20s)

### Fast Mode (Less Accurate)

```bash
node lip-sync-libraries/hybrid/hybrid-to-viseme.js audio.mp3 output.json --gentle-fast
```

**Trade-off:** ~30% faster but ~5% less accurate

### Verbose Output

```bash
node lip-sync-libraries/hybrid/hybrid-to-viseme.js audio.mp3 output.json --verbose
```

### All Options

```bash
node lip-sync-libraries/hybrid/hybrid-to-viseme.js audio.mp3 output.json \
  --whisper-model large-v2 \
  --whisper-language en \
  --whisper-device cuda \
  --gentle-threads 8 \
  --verbose
```

## Output

The pipeline generates two files:

### 1. Viseme JSON (`audio_visemes-hybrid.json`)

```json
{
  "metadata": {
    "soundFile": "audio.mp3",
    "duration": 8.93,
    "transcript": "I am not interested in speech sounds as such...",
    "language": "en",
    "source": "hybrid-whisperx-gentle",
    "pipeline": {
      "step1": "WhisperX transcription",
      "step2": "Gentle forced alignment",
      "whisperModel": "base",
      "whisperLanguage": "en",
      "gentleConservative": true
    }
  },
  "mouthCues": [
    { "start": 0.00, "end": 0.07, "value": "X" },
    { "start": 0.07, "end": 0.16, "value": "C" },
    { "start": 0.16, "end": 0.30, "value": "B" },
    ...
  ]
}
```

### 2. Transcript (`audio_transcript.txt`)

```
I am not interested in speech sounds as such, but in the possibilities of their use in music.
```

## Example Session

```bash
$ node lip-sync-libraries/hybrid/hybrid-to-viseme.js audio.mp3

═══════════════════════════════════════════════════════════
🚀 HYBRID PIPELINE: WhisperX → Gentle
═══════════════════════════════════════════════════════════

📁 Input:   audio.mp3
📁 Output:  audio_visemes-hybrid.json

Configuration:
  WhisperX Model:    base
  WhisperX Language: auto
  WhisperX Device:   cpu
  Gentle Threads:    8
  Gentle Mode:       Conservative (more accurate)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 STEP 1: WhisperX Transcription
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Running WhisperX transcription...
✅ WhisperX transcription complete!
   Time: 12.3s
   Language: en
   Transcript length: 156 characters

📄 Transcript:
   I am not interested in speech sounds as such, but in the possibilities of their use in music.

💾 Transcript saved to: audio_transcript.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 STEP 2: Gentle Forced Alignment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Running Gentle forced aligner with transcript...
✅ Gentle alignment complete!
   Time: 34.7s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗣️  STEP 3: Phoneme to Viseme Conversion
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 Converting phonemes to visemes...
✅ Viseme conversion complete!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PIPELINE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️  Total time:       47.0s
📝 Total viseme cues: 189
📏 Duration:          8.930s
🎤 Transcript:        "I am not interested in speech sounds as such, but in the..."
🌍 Language:          en

💾 Output files:
   Visemes:    audio_visemes-hybrid.json
   Transcript: audio_transcript.txt

═══════════════════════════════════════════════════════════
✨ SUCCESS! Hybrid pipeline complete.
═══════════════════════════════════════════════════════════
```

## Using as a Module

```javascript
import { convertAudioToViseme } from './lip-sync-libraries/hybrid/hybrid-to-viseme.js';

// Basic usage
const visemeData = await convertAudioToViseme('audio.mp3', 'output.json');

console.log(`Transcript: ${visemeData.metadata.transcript}`);
console.log(`Language: ${visemeData.metadata.language}`);
console.log(`Viseme cues: ${visemeData.mouthCues.length}`);
console.log(`Duration: ${visemeData.metadata.duration}s`);

// Advanced usage with options
const visemeDataAdvanced = await convertAudioToViseme('audio.mp3', 'output.json', {
  // WhisperX options
  whisperModel: 'large-v2',         // Better accuracy
  whisperLanguage: 'en',            // Faster if known
  whisperDevice: 'cuda',            // GPU acceleration
  
  // Gentle options
  gentleConservative: true,         // Maximum precision
  gentleThreads: 8,                 // Parallel processing
  
  // General options
  saveTranscript: true,             // Save transcript
  verbose: true                     // Detailed logging
});
```

## Performance Tips

### For Speed

1. **Use smaller WhisperX model:**
   ```bash
   --whisper-model tiny
   ```

2. **Enable fast Gentle mode:**
   ```bash
   --gentle-fast
   ```

3. **Use GPU acceleration:**
   ```bash
   --whisper-device cuda
   ```

4. **Specify language:**
   ```bash
   --whisper-language en
   ```

5. **Increase threads:**
   ```bash
   --gentle-threads 16
   ```

**Fastest configuration:**
```bash
node hybrid-to-viseme.js audio.mp3 \
  --whisper-model tiny \
  --whisper-language en \
  --whisper-device cuda \
  --gentle-fast \
  --gentle-threads 16
```

**Result:** ~20-30s per minute of audio (vs ~40-65s default)

### For Accuracy

1. **Use larger WhisperX model:**
   ```bash
   --whisper-model large-v2
   ```

2. **Use conservative Gentle mode (default):**
   ```bash
   # Already default, but explicit:
   # (Don't use --gentle-fast)
   ```

3. **Specify language if known:**
   ```bash
   --whisper-language en
   ```

**Best accuracy configuration:**
```bash
node hybrid-to-viseme.js audio.mp3 \
  --whisper-model large-v2 \
  --whisper-language en
```

**Result:** ~95-98% accuracy

## Troubleshooting

### "WhisperX not installed"

```bash
pip install whisperx
```

### "Gentle resources path not set"

```bash
export GENTLE_RESOURCES_ROOT=/path/to/gentle
echo 'export GENTLE_RESOURCES_ROOT=/path/to/gentle' >> ~/.zshrc
source ~/.zshrc
```

### "ffmpeg not found"

```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt-get install ffmpeg
```

### Slow processing

- Use smaller model: `--whisper-model tiny`
- Enable fast mode: `--gentle-fast`
- Use GPU: `--whisper-device cuda`
- Specify language: `--whisper-language en`

### Poor accuracy

- Use larger model: `--whisper-model large-v2`
- Don't use fast mode (use default conservative mode)
- Ensure high-quality audio

## Batch Processing

Process multiple files:

```javascript
import { convertAudioToViseme } from './lip-sync-libraries/hybrid/hybrid-to-viseme.js';

const files = ['audio1.mp3', 'audio2.mp3', 'audio3.mp3'];

for (const file of files) {
  const output = file.replace('.mp3', '_visemes.json');
  await convertAudioToViseme(file, output, {
    whisperModel: 'base',
    gentleConservative: true
  });
  console.log(`✅ Processed: ${file}`);
}
```

## Next Steps

1. **Test the visualization:**
   ```bash
   open index.html
   ```

2. **Read detailed documentation:**
   - [Hybrid Pipeline README](lip-sync-libraries/hybrid/README.md)
   - [Main README](README.md)

3. **Integrate with your application:**
   - Use the generated JSON to drive mouth animations
   - Load in Three.js, Unity, or web applications
   - Map viseme codes to your character's mouth shapes

## Resources

- [Hybrid Pipeline Documentation](lip-sync-libraries/hybrid/README.md)
- [WhisperX Documentation](https://github.com/m-bain/whisperX)
- [Gentle Documentation](https://github.com/lowerquality/gentle)
- [Rhubarb Viseme Reference](https://github.com/DanielSWolf/rhubarb-lip-sync)

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Read the detailed [Hybrid Pipeline README](lip-sync-libraries/hybrid/README.md)
3. Verify prerequisites are installed correctly
4. Try with verbose mode: `--verbose`

---

**Ready to get started?**

```bash
# Just run this:
node lip-sync-libraries/hybrid/hybrid-to-viseme.js audio.mp3
```

That's it! 🎉

