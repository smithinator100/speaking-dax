# Complete Setup Guide

Quick setup guide for all three lip-sync tools: Rhubarb, Gentle, and Azure Speech.

## Prerequisites

- **Node.js** 14+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)

## Step 1: Install Node Dependencies

```bash
# Clone or navigate to the project
cd speaking-dax

# Install dependencies
npm install
```

## Step 2: Choose Your Tool(s)

You can install just one, two, or all three tools depending on your needs.

---

## Option A: Rhubarb Lip Sync (Recommended for Beginners)

**Best for:** Quick lip sync from existing audio, no transcript needed

### Install

**macOS (Homebrew):**
```bash
brew install rhubarb-lip-sync
```

**Linux/Windows or Manual Install:**
1. Download from [GitHub Releases](https://github.com/DanielSWolf/rhubarb-lip-sync/releases)
2. Extract the `rhubarb` executable
3. Add to PATH or place in `lip-sync-libraries/rhubarb/`

### Verify Installation

```bash
rhubarb --version
# Should output: Rhubarb Lip Sync version 1.13.0
```

### Quick Test

```bash
# Basic usage (no transcript)
node lip-sync-libraries/rhubarb/mp3-to-viseme.js audio-samples/audio-sample-v2/audio-sample-v2.mp3

# With transcript (better accuracy)
node lip-sync-libraries/rhubarb/mp3-to-viseme.js \
  audio-samples/audio-sample-v2/audio-sample-v2.mp3 \
  output.json \
  audio-samples/audio-sample-v2/audio-sample-v2.txt
```

### Usage

```bash
# Convert audio to visemes
npm run convert path/to/audio.mp3
```

**✅ Pros:**
- Fast (5-10 seconds)
- No transcript needed
- Simple setup
- Works offline

**❌ Cons:**
- Less accurate (~85-90%)
- Only analyzes existing audio

---

## Option B: Azure Speech Service (Recommended for New Audio)

**Best for:** Generating new audio from text with perfect lip sync

### Setup

#### 1. Create Azure Account

- Go to [Azure Portal](https://portal.azure.com/)
- Sign up for free (includes $200 credit for 30 days)
- Free tier includes 5M characters/month forever

#### 2. Create Speech Service Resource

1. In Azure Portal, click **"Create a resource"**
2. Search for **"Speech"**
3. Click **"Create"** → **"Speech"**
4. Fill in:
   - **Subscription:** Your subscription
   - **Resource group:** Create new or use existing
   - **Region:** Choose nearest (e.g., `eastus`, `westus2`)
   - **Name:** Any name (e.g., `my-speech-service`)
   - **Pricing tier:** Free F0 (5M chars/month) or paid
5. Click **"Review + create"** → **"Create"**
6. Wait for deployment (1-2 minutes)

#### 3. Get Credentials

1. Go to your Speech resource
2. Click **"Keys and Endpoint"** (left sidebar)
3. Copy:
   - **Key 1** (subscription key)
   - **Location/Region** (e.g., `eastus`)

#### 4. Set Environment Variables

**macOS/Linux (add to `~/.zshrc` or `~/.bashrc`):**
```bash
export AZURE_SPEECH_KEY="your-subscription-key-here"
export AZURE_SPEECH_REGION="eastus"
```

**Then reload:**
```bash
source ~/.zshrc
```

**Windows (PowerShell):**
```powershell
$env:AZURE_SPEECH_KEY="your-subscription-key-here"
$env:AZURE_SPEECH_REGION="eastus"
```

**Or set permanently in System Environment Variables**

### Verify Installation

```bash
# Test with simple text
node lip-sync-libraries/azure/azure-to-viseme.js "Hello world" test-output.json test-audio.wav

# Should generate:
# - test-output.json (viseme data)
# - test-audio.wav (generated audio)
```

### Quick Test

```bash
# Generate visemes and audio from text
npm run convert:azure "Hello, this is a test"

# Or specify output files
node lip-sync-libraries/azure/azure-to-viseme.js \
  "Your text here" \
  output.json \
  output.wav
```

### Generate Sample Data

To create Azure visemes for existing audio samples:

```bash
cd lip-sync-libraries/azure
node generate-samples.js
```

This reads the transcript files and generates Azure viseme data.

**Options:**
```bash
# Use different voice
node generate-samples.js --voice en-US-GuyNeural

# Skip audio generation (visemes only)
node generate-samples.js --no-audio

# Force overwrite existing files
node generate-samples.js --force

# Show help
node generate-samples.js --help
```

### Popular Voices

- `en-US-JennyNeural` - Female, friendly (default)
- `en-US-GuyNeural` - Male, professional
- `en-US-AriaNeural` - Female, energetic
- `en-US-DavisNeural` - Male, calm

[See all 400+ voices](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts)

**✅ Pros:**
- Generates audio from text
- Perfect synchronization
- 400+ voices, 140+ languages
- High quality neural TTS
- Voice customization

**❌ Cons:**
- Requires internet
- Costs money (after free tier)
- Requires Azure account

---

## Option C: Gentle (For Production Quality)

**Best for:** Precise alignment of existing audio with known transcript

### Prerequisites

```bash
# macOS
brew install python3 ffmpeg

# Ubuntu/Debian
sudo apt-get install python3 python3-pip ffmpeg

# Verify
python3 --version  # Should be 3.7+
ffmpeg -version
```

### Install Gentle

```bash
# Clone Gentle repository
cd /path/to/projects
git clone https://github.com/lowerquality/gentle.git
cd gentle

# Install dependencies
pip3 install -r requirements.txt

# Install models and build
./install.sh

# This takes 5-10 minutes
```

### Set Environment Variable

**Add to `~/.zshrc` or `~/.bashrc`:**
```bash
export GENTLE_RESOURCES_ROOT="/path/to/gentle"
```

**Reload:**
```bash
source ~/.zshrc
```

### Verify Installation

```bash
# Test with Gentle's example files
cd $GENTLE_RESOURCES_ROOT
python3 align.py examples/data/lucier.mp3 examples/data/lucier.txt

# Should output JSON with word/phoneme alignment
```

### Quick Test

```bash
# Convert audio + transcript to visemes
node lip-sync-libraries/gentle/gentle-to-viseme.js \
  audio-samples/audio-sample-v2/audio-sample-v2.mp3 \
  audio-samples/audio-sample-v2/audio-sample-v2.txt
```

### Usage

```bash
# Convert with transcript
npm run convert:gentle path/to/audio.mp3 path/to/transcript.txt
```

**✅ Pros:**
- Excellent accuracy (~95-98%)
- Word-level alignment
- Production quality
- Free and offline

**❌ Cons:**
- Complex setup
- Requires transcript
- Slower processing (30-60s per minute)
- Large file size (~500MB)

---

## Step 3: Test the Web Demo

1. **Open** `index.html` in your browser
2. **Select** a lip sync model (Rhubarb, Gentle, or Azure)
3. **Click** ▶ Play Audio
4. **Watch** the synchronized mouth animation!

### UI Features

- **Lip Sync Model:** Switch between Rhubarb, Gentle, Azure
- **Audio Sample:** Test with different audio files
- **Character:** Choose mouth style
- **Playback Speed:** Adjust audio/animation speed
- **Transition Speed:** Control mouth shape smoothness
- **Anticipation Time:** Shift mouth timing
- **Min Duration:** Filter brief visemes

---

## Troubleshooting

### Rhubarb Issues

**"rhubarb: command not found"**
- Install: `brew install rhubarb-lip-sync`
- Or download manually and add to PATH

**"Poor accuracy"**
- Provide transcript file with `-d` flag
- Use WAV format instead of MP3
- Reduce background noise

### Azure Issues

**"Subscription key not provided"**
```bash
# Check environment variables
echo $AZURE_SPEECH_KEY
echo $AZURE_SPEECH_REGION

# If empty, set them
export AZURE_SPEECH_KEY="your-key"
export AZURE_SPEECH_REGION="eastus"
```

**"Subscription key is invalid"**
- Verify key in Azure Portal
- Check region matches resource location
- Ensure resource is active

**"Quota exceeded"**
- Free tier: 5M characters/month
- Wait for monthly reset or upgrade

### Gentle Issues

**"GENTLE_RESOURCES_ROOT not set"**
```bash
# Set the environment variable
export GENTLE_RESOURCES_ROOT="/path/to/gentle"

# Verify
echo $GENTLE_RESOURCES_ROOT
ls $GENTLE_RESOURCES_ROOT/align.py
```

**"python3: command not found"**
- Install Python 3: `brew install python3`
- Verify: `python3 --version`

**"align.py not found"**
- Check GENTLE_RESOURCES_ROOT path
- Ensure you ran `./install.sh`

**"Gentle process exited with code 1"**
- Run `./install.sh` again
- Check audio format (use WAV)
- Verify transcript matches audio

---

## Comparison Summary

| Feature | Rhubarb | Azure | Gentle |
|---------|---------|-------|--------|
| **Setup** | ⚡ Easy | ⚡ Easy | 🐢 Complex |
| **Speed** | ⚡ Fast | ⚡ Fast | 🐢 Slow |
| **Accuracy** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Input** | Audio | Text | Audio + Transcript |
| **Output** | Visemes | Audio + Visemes | Visemes |
| **Internet** | No | Yes | No |
| **Cost** | Free | Free tier + paid | Free |
| **Best For** | Quick prototypes | New content | Production quality |

### Recommendation

**Starting out?** → Use **Rhubarb** (easiest setup)

**Need new voiceovers?** → Use **Azure** (generate audio from text)

**Have existing audio + script?** → Use **Gentle** (highest accuracy)

**Professional project?** → Use **all three** (compare results)

---

## Next Steps

1. ✅ Install at least one tool
2. ✅ Test with sample audio
3. ✅ Open `index.html` and play with settings
4. ✅ Generate visemes for your own audio
5. 📖 Read `CONFIGURATION.md` for advanced options
6. 📖 Read `README.md` for full documentation

---

## Quick Reference

### Rhubarb
```bash
npm run convert audio.mp3
```

### Azure
```bash
npm run convert:azure "Your text here"
```

### Gentle
```bash
npm run convert:gentle audio.mp3 transcript.txt
```

### Test Demo
```bash
open index.html
```

---

**Need help?** See the full [README.md](./README.md) or check [CONFIGURATION.md](./CONFIGURATION.md) for advanced options.

