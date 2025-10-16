# WhisperX Audio to Viseme Converter

Convert audio files to JSON viseme maps using [WhisperX](https://github.com/m-bain/whisperX) - a fast, accurate speech recognition and alignment tool.

## Overview

WhisperX combines OpenAI's Whisper model with phoneme-level forced alignment to provide:
- **Fast transcription** - State-of-the-art speech recognition
- **Accurate alignment** - Phoneme-level timestamps for precise lip sync
- **No transcript required** - Automatic transcription with word timestamps
- **Multi-language support** - 90+ languages supported
- **GPU acceleration** - Optional CUDA support for faster processing

## Installation

### 1. Install Python Dependencies

```bash
cd lip-sync-libraries/whisperx
pip install -r requirements.txt
```

Or install manually:

```bash
pip install whisperx torch torchaudio
```

### 2. Verify Installation

```bash
python3 -c "import whisperx; print(f'WhisperX {whisperx.__version__} installed successfully')"
```

## Usage

### Command Line

```bash
# Basic usage (no transcript required!)
node whisperx-to-viseme.js audio.mp3

# With custom output
node whisperx-to-viseme.js audio.mp3 output.json

# With larger model for better accuracy
node whisperx-to-viseme.js audio.mp3 output.json --model large-v2

# Specify language (faster than auto-detection)
node whisperx-to-viseme.js audio.mp3 output.json --language en

# With GPU acceleration (requires CUDA)
node whisperx-to-viseme.js audio.mp3 output.json --device cuda

# Enable verbose logging
node whisperx-to-viseme.js audio.mp3 output.json --verbose
```

### As a Module

```javascript
import { convertAudioToViseme } from './lip-sync-libraries/whisperx/whisperx-to-viseme.js';

const visemeData = await convertAudioToViseme(
  'audio.mp3',
  'visemes.json',
  {
    model: 'base',           // Model size: tiny, base, small, medium, large-v2
    language: 'auto',        // Language code or 'auto' for auto-detection
    device: 'cpu',           // 'cpu' or 'cuda' (requires NVIDIA GPU)
    batchSize: 16,           // Batch size for processing
    computeType: 'float32',  // 'float32', 'float16', 'int8'
    minDuration: 0.03,       // Minimum viseme duration in seconds
    verbose: false           // Enable verbose logging
  }
);
```

### NPM Script

Add to your `package.json`:

```json
{
  "scripts": {
    "convert:whisperx": "node lip-sync-libraries/whisperx/whisperx-to-viseme.js"
  }
}
```

Then run:

```bash
npm run convert:whisperx audio.mp3
```

## Model Sizes

WhisperX offers different model sizes with varying accuracy and speed:

| Model | Size | Speed | Accuracy | RAM Required |
|-------|------|-------|----------|--------------|
| **tiny** | ~40 MB | ⚡⚡⚡ Very Fast | ⭐⭐ Good | ~1 GB |
| **base** | ~75 MB | ⚡⚡ Fast | ⭐⭐⭐ Better | ~1 GB |
| **small** | ~245 MB | ⚡ Moderate | ⭐⭐⭐⭐ Great | ~2 GB |
| **medium** | ~775 MB | 🐢 Slow | ⭐⭐⭐⭐⭐ Excellent | ~5 GB |
| **large-v2** | ~1.5 GB | 🐢🐢 Very Slow | ⭐⭐⭐⭐⭐ Best | ~10 GB |

### Recommendations:
- **tiny**: Real-time applications, quick tests
- **base**: General purpose, good balance (default)
- **small**: Production quality with reasonable speed
- **medium**: High-quality production, accurate transcription
- **large-v2**: Maximum accuracy, when quality is critical

## Language Support

WhisperX supports 90+ languages including:

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Dutch (nl)
- Russian (ru)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)
- Arabic (ar)
- And many more...

**Tip**: Specifying the language explicitly (`--language en`) is faster than auto-detection and often more accurate.

## GPU Acceleration

For significantly faster processing, use CUDA with an NVIDIA GPU:

### Requirements:
- NVIDIA GPU with CUDA support
- CUDA Toolkit 11.7+ or 12.x
- PyTorch with CUDA support

### Setup:

```bash
# Install PyTorch with CUDA support
# Visit: https://pytorch.org/get-started/locally/

# For CUDA 11.8
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118

# For CUDA 12.1
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### Usage:

```bash
node whisperx-to-viseme.js audio.mp3 output.json --device cuda
```

**Performance**: GPU acceleration can be 5-10x faster than CPU processing.

## Output Format

WhisperX generates the same JSON format as Rhubarb and Gentle:

```json
{
  "metadata": {
    "soundFile": "audio.mp3",
    "duration": 3.93,
    "transcript": "Hello world, this is a test",
    "language": "en",
    "source": "whisperx"
  },
  "mouthCues": [
    { "start": 0.00, "end": 0.07, "value": "X" },
    { "start": 0.07, "end": 0.16, "value": "C" },
    { "start": 0.16, "end": 0.30, "value": "B" }
  ]
}
```

## Comparison with Other Tools

| Feature | WhisperX | Rhubarb | Gentle |
|---------|----------|---------|--------|
| **Speed** | ⚡⚡ Fast | ⚡⚡⚡ Very Fast | 🐢 Moderate |
| **Accuracy** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Very Good |
| **Transcript Required** | ❌ No (auto-generates) | ❌ No | ✅ Yes |
| **GPU Acceleration** | ✅ Yes (CUDA) | ❌ No | ❌ No |
| **Setup Complexity** | 🟡 Moderate (Python) | 🟢 Simple (binary) | 🔴 Complex (Kaldi) |
| **Multi-language** | ✅ 90+ languages | ❌ English only | ✅ Multiple languages |
| **File Size** | ~75 MB - 1.5 GB | ~20 MB | ~500 MB |
| **Phoneme Alignment** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |

### When to Use WhisperX:

✅ **Best for:**
- No transcript available (auto-transcription)
- Multi-language support needed
- High accuracy required without manual transcripts
- GPU available for fast processing
- Modern ML-based approach
- Need both transcription and viseme data

⚠️ **Consider alternatives when:**
- Maximum speed is critical → Use Rhubarb
- Extremely limited resources → Use Rhubarb
- You already have an accurate transcript → Gentle might be faster

## Troubleshooting

### "Module whisperx not found"

```bash
pip install whisperx
```

### "CUDA out of memory"

Options:
1. Use smaller model: `--model tiny` or `--model base`
2. Reduce batch size: `--batch-size 8`
3. Use CPU instead: `--device cpu`
4. Use int8 compute: `--compute-type int8`

### "Model download failed"

WhisperX downloads models on first use. Ensure:
- Internet connection is stable
- Enough disk space (~1-5 GB depending on model)
- No firewall blocking Hugging Face

### Slow processing on CPU

- Use smaller model: `--model tiny` or `--model base`
- Install GPU-accelerated version if you have NVIDIA GPU
- Consider Rhubarb for faster CPU-only processing

### Poor accuracy

- Use larger model: `--model medium` or `--model large-v2`
- Specify language: `--language en` (faster and more accurate)
- Ensure audio quality is good (clear speech, low noise)
- Try different models for different audio types

## Advanced Usage

### Batch Processing

```javascript
import { convertAudioToViseme } from './lip-sync-libraries/whisperx/whisperx-to-viseme.js';
import { promises as fs } from 'fs';
import path from 'path';

async function batchProcess(audioFiles) {
  const results = [];
  
  for (const audioFile of audioFiles) {
    const outputFile = audioFile.replace(/\.[^.]+$/, '_visemes.json');
    
    try {
      console.log(`Processing: ${audioFile}`);
      const visemeData = await convertAudioToViseme(
        audioFile, 
        outputFile,
        { model: 'base', device: 'cpu' }
      );
      results.push({ 
        file: audioFile, 
        success: true, 
        cues: visemeData.mouthCues.length,
        transcript: visemeData.metadata.transcript
      });
    } catch (error) {
      results.push({ 
        file: audioFile, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return results;
}

// Usage
const files = ['audio1.mp3', 'audio2.mp3', 'audio3.mp3'];
const results = await batchProcess(files);
console.log(results);
```

### Custom Phoneme Mapping

The phoneme-to-viseme mapping can be customized in `utilities/phoneme-to-viseme.js` if you need different mouth shapes or want to adjust the mapping for your specific character design.

## Resources

- [WhisperX GitHub](https://github.com/m-bain/whisperX)
- [OpenAI Whisper](https://github.com/openai/whisper)
- [WhisperX Paper](https://arxiv.org/abs/2303.00747)
- [Supported Languages](https://github.com/openai/whisper#available-models-and-languages)

## License

WhisperX is released under the BSD-4-Clause license. See the [WhisperX repository](https://github.com/m-bain/whisperX) for details.


