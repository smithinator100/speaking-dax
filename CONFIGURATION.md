# Lip Sync Configuration Guide

## Overview

This guide explains all configuration options available for both Rhubarb and Gentle lip-sync libraries, divided into **generation-time** options (used when creating viseme files) and **runtime** options (used to tweak animation playback).

---

## Runtime Animation Controls

These settings can be adjusted in real-time while previewing animations. Access them by clicking the **⚙️ Settings** button in the top-right corner.

### Playback Speed (0.5x - 2.0x)
- **Default:** 1.0x
- **Description:** Adjusts both audio and animation playback speed
- **Use case:** 
  - Slow down (0.5x-0.9x) to analyze lip movements
  - Speed up (1.1x-2.0x) for quick previews

### Transition Speed (0-200ms)
- **Default:** 0ms (instant)
- **Description:** Adds CSS transitions for smooth mouth shape changes
- **Use case:**
  - 0ms: Sharp, instant mouth changes (cartoon style)
  - 50-100ms: Subtle smoothing
  - 100-200ms: Smooth, natural transitions (realistic style)

### Anticipation Time (-100ms to +100ms)
- **Default:** 0ms
- **Description:** Shifts when mouth shapes appear relative to audio
- **Use case:**
  - Negative values (-50ms to -100ms): Show mouth shapes earlier (anticipation)
  - Positive values (+50ms to +100ms): Show mouth shapes later (delay)
  - Useful for compensating audio/video sync issues

### Min Duration Filter (0-100ms)
- **Default:** 0ms (show all)
- **Description:** Filters out viseme cues shorter than specified duration
- **Use case:**
  - 0ms: Show all visemes (detailed animation)
  - 20-30ms: Filter very brief mouth movements
  - 50-100ms: Simplify animation by removing quick transitions

---

## Rhubarb Lip Sync - Generation Options

These options are used when generating viseme files with Rhubarb. Configure them when running the `mp3-to-viseme.js` script.

### Recognizer
- **Options:** `phonetic` | `pocketSphinx`
- **Default:** `phonetic`
- **Description:**
  - `phonetic`: Language-independent phonetic matching (no speech recognition)
  - `pocketSphinx`: English speech recognition for better accuracy
- **When to use:**
  - Use `phonetic` for non-English audio or when no transcript is available
  - Use `pocketSphinx` for English audio with or without transcript

### Dialog File (-d option)
- **Type:** Path to text file
- **Description:** Provide transcript text for significantly improved accuracy
- **Format:** Plain text file (ASCII or UTF-8)
- **Benefit:** 
  - Improves word recognition, especially for uncommon words
  - Still works if actual audio deviates slightly from transcript
  - **Highly recommended** for best results

### Extended Shapes
- **Options:** `GHX` | `GH` | `GX` | `HX` | `G` | `H` | `X` | `""` (empty)
- **Default:** `GHX` (all extended shapes)
- **Description:**
  - `G`: F/V sounds (teeth on lower lip)
  - `H`: L sounds (tongue raised behind teeth)
  - `X`: Rest position (closed relaxed mouth)
- **When to use:**
  - Use all (`GHX`) for detailed, realistic animation
  - Omit shapes your art style doesn't support
  - Use `""` for basic 6-shape animation only

### Export Format
- **Options:** `json` | `tsv` | `xml` | `dat`
- **Default:** `json`
- **Description:**
  - `json`: JavaScript-friendly format
  - `tsv`: Tab-separated values (compact)
  - `xml`: Verbose structured format
  - `dat`: For Moho/OpenToonz integration

### Thread Count
- **Default:** CPU core count
- **Description:** Number of worker threads for processing
- **Recommendation:** Leave at default unless you need to limit resource usage

### Usage Example:
```javascript
convertMp3ToViseme(
  'audio.mp3', 
  'output.json', 
  {
    dialogFile: 'dialog.txt',     // Improve accuracy
    recognizer: 'phonetic',       // Language-independent
    extendedShapes: 'GHX'         // All extended shapes
  }
);
```

---

## Gentle Forced Aligner - Generation Options

These options are used when generating viseme files with Gentle. Configure them when running the `gentle-to-viseme.js` script.

### Conservative Mode
- **Options:** `true` | `false`
- **Default:** `false`
- **Description:** Uses more conservative phoneme alignment
- **When to use:**
  - `false`: Normal mode, faster processing
  - `true`: More careful alignment for better accuracy (slower)

### Min Duration
- **Default:** 30ms (0.03 seconds)
- **Description:** Minimum duration for viseme cues in the output
- **Use case:**
  - 20ms: More detailed animation with very brief visemes
  - 30ms (default): Balanced detail
  - 50-100ms: Simplified animation, filters very short phonemes

### Disfluency Detection
- **Options:** `true` | `false`
- **Default:** `false`
- **Description:** Include filler words like "uh", "um" in alignment
- **When to use:**
  - `false`: Clean speech without fillers
  - `true`: Natural speech with hesitations

### Disfluencies List
- **Default:** `['uh', 'um']`
- **Description:** Custom list of filler words to detect
- **Customization:** Add language-specific fillers

### Thread Count (nthreads)
- **Default:** CPU core count
- **Description:** Number of threads for Kaldi alignment
- **Recommendation:** Leave at default for optimal performance

### Logging
- **Options:** `true` | `false`
- **Default:** `false`
- **Description:** Enable verbose console logging
- **When to use:** Enable for debugging alignment issues

### Usage Example:
```javascript
convertAudioToViseme(
  'audio.mp3',
  'transcript.txt',
  'output.json',
  {
    conservative: false,          // Normal alignment
    minDuration: 0.03,           // 30ms minimum
    disfluency: false,           // No filler words
    nthreads: 4                  // 4 threads
  }
);
```

---

## Comparison: Rhubarb vs Gentle

### Rhubarb Lip Sync
**Strengths:**
- ✅ Works without transcript
- ✅ Language-independent (phonetic mode)
- ✅ Fast processing
- ✅ Simple setup

**Best for:**
- Non-English audio
- Quick prototyping
- When transcript is unavailable

### Gentle Forced Aligner
**Strengths:**
- ✅ Requires transcript for alignment
- ✅ More precise phoneme timing
- ✅ Better for known dialog
- ✅ Professional quality alignment

**Best for:**
- English audio with known transcript
- High-quality productions
- When precision is critical

---

## Tips & Best Practices

### For Best Results:
1. **Always provide transcript text** when possible (improves both libraries)
2. **Use high-quality audio** (16-bit, 16kHz or higher)
3. **Clean audio** without background noise works best
4. **Test both libraries** to see which produces better results for your use case

### Runtime Tuning:
1. Start with **default settings** (0ms transition, 0ms anticipation)
2. Add **50-100ms transition speed** for smoother animation
3. Adjust **anticipation** if mouth movements feel early or late
4. Use **min duration filter** (20-30ms) to simplify busy animations

### Performance Optimization:
- Lower **min duration** (generation-time) creates fewer viseme cues
- Higher **min duration filter** (runtime) simplifies playback
- Disable **transition speed** (0ms) for better performance with many characters

---

## Environment Variables

### Rhubarb
```bash
export RHUBARB_PATH=/path/to/rhubarb
```

### Gentle
```bash
export GENTLE_RESOURCES_ROOT=/path/to/gentle
```

---

## Command Line Examples

### Rhubarb:
```bash
rhubarb audio.wav -o output.json -f json -r phonetic -d dialog.txt --extendedShapes GHX
```

### Gentle (via align.py):
```bash
python3 align.py audio.wav transcript.txt --output output.json --conservative --nthreads 4
```

---

## Additional Resources

- **Rhubarb Documentation:** [GitHub](https://github.com/DanielSWolf/rhubarb-lip-sync)
- **Gentle Documentation:** [GitHub](https://github.com/lowerquality/gentle)
- **Mouth Shape Reference:** See README.md for Preston Blair mouth shapes

---

Last updated: October 2025

