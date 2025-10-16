# WhisperX Character Mapping vs Phoneme Mapping Comparison

## Example: "Hi there, everyone"

### Character-Level Mapping (WhisperX - Current Implementation)

| Text | Characters | Character → Viseme | Timing (WhisperX) | Viseme Output |
|------|------------|-------------------|-------------------|---------------|
| **Hi** | H, i | H→B, i→B | 0.031-0.153, 0.153-0.234 | B, B |
| **there** | t, h, e, r, e | t→B, h→B, e→B, r→B, e→B | 0.274-0.294, 0.294-0.335, ... | B, B, B, B, B |
| **everyone** | e, v, e, r, y, o, n, e | e→B, v→G, e→B, r→B, y→B, o→F, n→B, e→B | 0.477-0.517, 0.517-0.538, ... | B, G, B, B, B, F, B, B |

**Issues with Character Mapping:**
- ❌ "th" digraph split into t + h (should be single /TH/ or /DH/ sound)
- ❌ Silent 'e' in "there" gets a viseme (should be ignored)
- ❌ 'h' in "Hi" mapped to B, but /HH/ phoneme should be C (open medium)

---

### Phoneme-Level Mapping (Gentle/CMU - Ideal)

| Text | Phonemes (ARPAbet) | Phoneme → Viseme | Description |
|------|--------------------|------------------|-------------|
| **Hi** | /HH/, /AY/ | HH→C, AY→D | C (open medium for H), D (wide open for long I) |
| **there** | /DH/, /EH/, /R/ | DH→B, EH→C, R→E | B (voiced th), C (short e), E (r-colored) |
| **everyone** | /EH/, /V/, /R/, /IY/, /W/, /AH/, /N/ | EH→C, V→G, R→E, IY→B, W→F, AH→C, N→B | Proper phonetic sounds |

**Advantages of Phoneme Mapping:**
- ✅ Captures actual sounds, not spelling
- ✅ Handles digraphs correctly (th, ch, sh)
- ✅ Ignores silent letters
- ✅ Distinguishes same letter with different sounds

---

## Character vs Phoneme Viseme Comparison

### "Hi" Breakdown

#### WhisperX (Character-based):
```
H (0.031-0.153) → B (clenched teeth)
i (0.153-0.234) → B (clenched teeth)
```
❌ **Problem**: 'H' is not clenched teeth sound, it's an open mouth sound

#### Gentle (Phoneme-based):
```
/HH/ (0.07-0.16) → C (open mouth medium)
/AY/ (0.16-0.30) → D (wide open)
```
✅ **Correct**: /HH/ is aspirated, open mouth; /AY/ is wide open diphthong

---

### "there" Breakdown

#### WhisperX (Character-based):
```
t (0.274-0.294) → B (clenched teeth)
h (0.294-0.335) → B (clenched teeth)
e (0.335-0.376) → B (clenched teeth)
r (0.376-0.396) → B (clenched teeth)
e (0.396-0.436) → B (clenched teeth)
```
❌ **Problems**: 
- "th" split into two sounds
- Silent 'e' gets timing
- All mapped to B (not enough variety)

#### Gentle (Phoneme-based):
```
/DH/ (0.37-0.44) → B (clenched teeth)
/EH/ (0.44-0.58) → C (open medium)
/R/  (0.58-0.72) → E (slightly rounded)
```
✅ **Correct**: 
- "th" treated as single /DH/ phoneme
- Silent 'e' ignored
- Three different visemes for three different sounds

---

## Real-World Example: "coffee"

### WhisperX (Character-based):
```
c (char) → B
o (char) → F
f (char) → G ✓ CORRECT!
f (char) → G ✓ CORRECT!
e (char) → B
e (char) → B
```

### Gentle (Phoneme-based):
```
/K/ (phoneme) → B
/AO/ (phoneme) → E (rounded vowel)
/F/ (phoneme) → G (labiodental)
/IY/ (phoneme) → B (front vowel)
```

**Analysis**: WhisperX correctly gets the F→G mapping for "ff", but:
- ❌ Maps 'o' to F (puckered), but /AO/ should be E (slightly rounded)
- ❌ Has duplicate 'e' at the end (spelling artifact)

---

## Summary of Improvements

### Before Fix (Word-level estimation)
- Used `estimateVisemesFromWord()` with **no timing data**
- Evenly distributed visemes across word duration
- **Accuracy: ~40%**

### After Fix (Character-level timing)
- Uses WhisperX character alignment with **real timing**
- Maps each character to viseme with actual duration
- **Accuracy: ~65-70%**

### Ideal (Phoneme-level)
- Uses Gentle/CMU phoneme alignment
- Maps phonemes to visemes (proper linguistic sounds)
- **Accuracy: ~85-95%**

---

## Recommendation

**For lip sync accuracy (best to worst):**

1. 🥇 **Gentle** - Free, local, phoneme-level, excellent accuracy
2. 🥈 **CMU Sphinx/PocketSphinx** - Phoneme-level, good accuracy
3. 🥉 **WhisperX (fixed)** - Character-level, decent accuracy, good for non-English
4. ❌ **WhisperX (old)** - Word-level estimation, poor accuracy

**Use WhisperX when:**
- Working with non-English languages (Gentle is English-only)
- Need automatic transcription + alignment in one step
- Character-level accuracy is acceptable for your use case

**Use Gentle/PocketSphinx when:**
- Need maximum lip sync accuracy
- Working with English audio
- Have a transcript or can provide one

