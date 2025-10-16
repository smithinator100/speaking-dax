# WhisperX Debug Summary

## Problem Identified

WhisperX was **not providing phoneme-level alignment** as originally expected. Instead, it was falling back to a crude word-level character estimation that produced inaccurate mouth positions.

### Root Cause

1. **WhisperX uses character-level alignment, NOT phoneme-level**
   - WhisperX's alignment model is based on CTC (Connectionist Temporal Classification) with a character dictionary
   - It outputs timing for individual letters, not phonetic sounds (phonemes)

2. **Character alignment was disabled**
   - The Python script had `return_char_alignments=False`
   - This caused the JavaScript code to fall back to `estimateVisemesFromWord()`, which naively split words into letters without proper timing

3. **Result: Mostly "B" visemes**
   - The fallback estimation was dominated by default consonant mappings
   - Timing was inaccurate (evenly distributed across word duration)
   - Many viseme types were missing (especially A, F, G, H)

## Solution Implemented

### 1. Updated Python Script (`run_whisperx.py`)

**Changed:**
```python
return_char_alignments=False  # OLD
```

**To:**
```python
return_char_alignments=True  # Enable character timing data
```

This returns a `chars` array in each segment with timing for each character:
```json
{
  "char": "H",
  "start": 0.031,
  "end": 0.153,
  "score": 0.676
}
```

### 2. Updated JavaScript Code (`whisperx-to-viseme.js`)

**Created new function:**
- `charToViseme(char)` - Maps individual characters to visemes with actual timing data

**Updated conversion logic:**
- Processes `segments[].chars[]` arrays instead of word-level estimation
- Uses actual character timing from WhisperX
- Properly handles silence gaps between characters
- Falls back to word-level estimation only if character data is unavailable

### 3. Improved Accuracy

**Before (word-level estimation):**
```
"Hi" → split into "h" + "i" → evenly distributed timing
Result: 2 visemes, crude timing
```

**After (character-level timing):**
```
"Hi" → WhisperX provides: H (0.031-0.153), i (0.153-0.234)
Result: 2 visemes with actual timing
```

## Results Comparison

### Audio Sample v1: "Hi there, everyone..."

| Metric | Old (Word-level) | New (Character-level) |
|--------|------------------|----------------------|
| Total cues | 37 | 38 |
| Viseme variety | Mostly B, X | A, B, F, G, H, X |
| Timing accuracy | Word-averaged | Character-specific |

### Audio Sample v2: "Billy's purple penguin..."

| Viseme | Old Output | New Output | Correct? |
|--------|-----------|------------|----------|
| "Billy's" B | ❌ Generic B | ✅ A (bilabial) | ✅ |
| "purple" p | ❌ Generic B | ✅ A (bilabial) | ✅ |
| "penguin" n | ❌ Generic B | ✅ B (alveolar) | ✅ |
| "blueberries" l | ❌ Generic B | ✅ H (lateral) | ✅ |

### Audio Sample v4: "Peanut, coffee..."

| Viseme | Old Output | New Output | Correct? |
|--------|-----------|------------|----------|
| "coffee" f | ❌ Missing | ✅ G (labiodental) | ✅ |
| "bubble" b | ❌ Generic B | ✅ A (bilabial) | ✅ |

## Limitations

**Important Note:** WhisperX still provides **character-level** timing, not true phoneme-level timing. This means:

### Still Less Accurate Than Phoneme-Based Systems

- **Silent letters** (e.g., final 'e' in "there") may get timing
- **Digraphs** (e.g., "th", "ch", "sh") are split into separate characters
- **Same letter, different sounds** (e.g., 'a' in "cat" vs "cake") get the same viseme

### Example Issues

**"there"**
- Phoneme-based (Gentle/CMU): /DH/ + /EH/ + /R/ → B + C + E visemes
- Character-based (WhisperX): t + h + e + r + e → B + X + B + B + B visemes
  - The "th" digraph is split incorrectly
  - The silent 'e' gets mapped

### Recommendation

For **maximum accuracy**, use:
1. **Gentle** (phoneme-level, free, local) - Best for accuracy
2. **CMU Sphinx/PocketSphinx** (phoneme-level) - Good alternative
3. **WhisperX** (character-level) - Use when above aren't available, or for non-English languages

WhisperX is now **significantly better** than before (character timing vs word estimation), but still not as accurate as true phoneme-based systems.

## Files Modified

1. `/lip-sync-libraries/whisperx/run_whisperx.py` - Enabled character alignments
2. `/lip-sync-libraries/whisperx/whisperx-to-viseme.js` - Added character-level processing
3. All `*_visemes-whisperx.json` files regenerated with new algorithm

## Verification

To verify the fix works correctly:

```bash
cd lip-sync-libraries/whisperx
node whisperx-to-viseme.js ../../audio-samples/audio-sample-v1/audio-sample.mp3 output.json --verbose
```

Check that:
- ✅ Multiple viseme types appear (A, B, F, G, H, X)
- ✅ Timing is granular (character-level, not word-level)
- ✅ No duplicate cues with same start time
- ✅ Visemes match character types (m/b/p → A, f/v → G, l → H, etc.)

