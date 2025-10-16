# Hybrid Pipeline: Transcript Correction Guide

## The Issue

WhisperX, while highly accurate, occasionally makes transcription errors:
- **Example**: "Yippee!" → "yepy!"
- **Impact**: Gentle can't align incorrect words, resulting in silence/missing mouth movements

## The Solution

The hybrid pipeline now supports using a corrected transcript via the `--use-transcript` option.

## Workflow Options

### Option 1: Review & Correct (Recommended)

1. **Run hybrid normally** (WhisperX generates transcript):
   ```bash
   node lip-sync-libraries/hybrid/hybrid-to-viseme.js audio.mp3
   ```

2. **Review the generated transcript**:
   ```bash
   cat audio_transcript.txt
   ```

3. **If you spot errors, edit the transcript file**:
   ```bash
   # Fix any transcription errors
   nano audio_transcript.txt
   ```

4. **Re-run with corrected transcript**:
   ```bash
   node lip-sync-libraries/hybrid/hybrid-to-viseme.js audio.mp3 \
     --use-transcript audio_transcript.txt
   ```

### Option 2: Pre-provided Transcript

If you already have an accurate transcript:

```bash
node lip-sync-libraries/hybrid/hybrid-to-viseme.js audio.mp3 \
  --use-transcript my-transcript.txt
```

This skips WhisperX entirely and goes straight to Gentle alignment.

## Real-World Example

### audio-sample-v2

**WhisperX Output** (incorrect):
```
Billy's purple penguin quickly chewed gooey blueberries 
while shouting, yepy! Under the moonlight...
```

**Corrected**:
```
Billy's purple penguin quickly chewed gooey blueberries 
while shouting, Yippee! Under the moonlight...
```

**Result**:
- ❌ **Before**: Silence from 4.75-6.0s (no mouth movements)
- ✅ **After**: Proper visemes at 4.74-5.80s (A and B mouth shapes)

## When to Use This

- **Always review** the generated transcript for critical projects
- **Use `--use-transcript`** when:
  - WhisperX mishears words (rare but possible)
  - You have a pre-existing accurate transcript
  - Audio quality is poor and WhisperX struggles
  - You need 100% transcript accuracy

## Benefits

- **Maintains Gentle's precision**: You still get accurate phoneme-level timing
- **Fixes transcription errors**: Correct the text, get perfect alignment
- **Best of both worlds**: Auto-transcription convenience + manual correction when needed

## Accuracy Trade-offs

| Approach | Convenience | Accuracy | Use Case |
|----------|------------|----------|----------|
| **WhisperX only** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Most audio (95%+ accurate) |
| **Hybrid (review+correct)** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | When 100% accuracy is critical |
| **Gentle (manual transcript)** | ⭐⭐ | ⭐⭐⭐⭐⭐ | When you already have transcripts |

## Tips

1. **Listen while reviewing**: Play the audio while reading the transcript
2. **Check unusual words**: Proper nouns, exclamations, technical terms
3. **Punctuation matters less**: Gentle ignores most punctuation
4. **Case insensitive**: "Yippee" and "yippee" work the same
5. **Unknown words**: If Gentle can't align a word, it may not be in its dictionary

## See Also

- [QUICK-START-HYBRID.md](QUICK-START-HYBRID.md) - Hybrid pipeline quick start
- [lip-sync-libraries/hybrid/README.md](lip-sync-libraries/hybrid/README.md) - Full hybrid documentation
- [HYBRID-ACCURACY-REPORT.md](HYBRID-ACCURACY-REPORT.md) - Accuracy benchmarks

