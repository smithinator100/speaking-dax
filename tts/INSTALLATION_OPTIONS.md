# Orpheus TTS Installation Options

The local installation of Orpheus TTS can be challenging due to heavy dependencies (vllm, CUDA, GPU requirements). Here are your options:

## Option 1: Use Baseten (Recommended for Production)
Baseten provides optimized, hosted inference with one-click deployment.

```python
# Install Baseten client
pip3 install baseten

# Use their API (see: https://docs.baseten.co/)
```

**Pros:**
- No local GPU needed
- Fast inference (~200ms latency)
- No installation headaches
- Production-ready

**Cons:**
- Requires API key
- Usage costs

---

## Option 2: Use Google Colab
Run Orpheus TTS in a free GPU environment.

1. Open: [Orpheus TTS Colab Notebook](https://github.com/canopyai/Orpheus-TTS#simple-setup-on-colab)
2. Generate audio files
3. Download and use in your project

**Pros:**
- Free GPU access
- No local installation
- Easy to test

**Cons:**
- Manual workflow
- Not automated
- Session time limits

---

## Option 3: Local Installation (Advanced)
If you have a CUDA-compatible GPU and want to run locally:

### Requirements:
- CUDA-compatible NVIDIA GPU
- Python 3.8-3.11
- 16GB+ VRAM recommended

### Installation:
```bash
# Create a virtual environment
python3 -m venv orpheus-env
source orpheus-env/bin/activate

# Install dependencies
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install orpheus-speech

# If vllm fails, try specific version
pip install vllm==0.7.3
```

---

## Option 4: Use Alternative TTS (Simpler)
Consider these lighter-weight alternatives:

### A. Coqui TTS (Local, Open Source)
```bash
pip3 install TTS
```

```python
from TTS.api import TTS

# Initialize
tts = TTS("tts_models/en/ljspeech/tacotron2-DDC")

# Generate
tts.tts_to_file(text="Hello world!", file_path="output.wav")
```

### B. OpenAI TTS (API)
```bash
pip3 install openai
```

```python
from openai import OpenAI

client = OpenAI(api_key="your-api-key")
response = client.audio.speech.create(
    model="tts-1",
    voice="alloy",
    input="Hello world!"
)
response.stream_to_file("output.mp3")
```

### C. ElevenLabs (API - High Quality)
```bash
pip3 install elevenlabs
```

```python
from elevenlabs import generate, save

audio = generate(
    text="Hello world!",
    voice="Adam",
    api_key="your-api-key"
)
save(audio, "output.mp3")
```

---

## Recommended Approach for Your Project

For the **speaking-dax** lip sync project, I recommend:

1. **For Development/Testing:** Use **Coqui TTS** locally (simple installation, works without GPU)
2. **For Production:** Use **Baseten** or **ElevenLabs API** (high quality, reliable)
3. **For Experimentation:** Use **Google Colab** with Orpheus TTS

Would you like me to set up one of the simpler alternatives instead?



