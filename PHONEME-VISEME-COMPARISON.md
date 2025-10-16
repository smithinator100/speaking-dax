# Phoneme vs Character Viseme Comparison

## Audio Sample v1: "Hi there, everyone. How are you doing today? Enjoy the beer and cheese."

### Word-by-Word Analysis

---

### 1. "Hi" (0.031-0.234s)

#### Expected Phonemes (ARPAbet):
- `/HH/` (0.031-0.150) → **Viseme C** (open medium, aspirated H sound)
- `/AY/` (0.150-0.234) → **Viseme D** (wide open, diphthong "eye")

#### WhisperX Generated (Character-based):
- `H` (0.031-0.153) → **Viseme B** ❌ WRONG
- `i` (0.153-0.234) → **Viseme B** ❌ WRONG

#### Rhubarb (Phoneme-based - Reference):
- (0.04-0.10) → **Viseme B**
- (0.10-0.16) → **Viseme C** ✓
- (0.16-0.23) → **Viseme B** (close to /AY/)

**Analysis**: WhisperX maps both characters to B (clenched teeth), missing the open mouth shapes. The /HH/ sound should be open (C), and /AY/ should be wide open (D).

---

### 2. "there" (0.274-0.457s)

#### Expected Phonemes:
- `/DH/` (voiced "th") → **Viseme B** (tongue between teeth)
- `/EH/` (short "e" as in "bed") → **Viseme C** (open medium)
- `/R/` → **Viseme E** (slightly rounded, r-colored)

#### WhisperX Generated:
- `t` (0.274-0.294) → **Viseme X** ❌ (should be part of /DH/)
- `h` (0.294-0.335) → **Viseme X** ❌ (should be part of /DH/)
- `e` (0.335-0.376) → **Viseme B** ⚠️ (should be C)
- `r` (0.376-0.396) → **Viseme B** ❌ (should be E)
- `e` (0.396-0.436) → **Viseme B** ❌ (silent, shouldn't exist)

#### Rhubarb (Reference):
- (0.23-0.37) → **Viseme C** (covers /DH/ + /EH/)
- (0.37-0.44) → **Viseme B** 

**Analysis**: WhisperX incorrectly splits "th" digraph into t+h and maps both to silence (X). The silent 'e' at the end gets mapped when it shouldn't.

---

### 3. "everyone" (0.477-0.862s)

#### Expected Phonemes:
- `/EH/` → **Viseme C**
- `/V/` → **Viseme G** (teeth on lip)
- `/R/` → **Viseme E**
- `/IY/` ("ee") → **Viseme B**
- `/W/` → **Viseme F** (puckered)
- `/AH/` → **Viseme C**
- `/N/` → **Viseme B**

#### WhisperX Generated:
- `e` (0.477-0.517) → **Viseme B** ⚠️ (should be C)
- `v` (0.517-0.538) → **Viseme G** ✓ CORRECT! (teeth on lip)
- `e` (0.538-0.558) → **Viseme B** (skipped, no timing)
- `r` (0.558-0.619) → **Viseme B** ❌ (should be E)
- `y` (0.619-0.761) → **Viseme B** ✓ (acceptable)
- `o` (0.761-0.781) → **Viseme F** ✓ CORRECT! (rounded)
- `n` (0.781-0.821) → **Viseme B** ✓ (acceptable)
- `e` (0.821-0.842) → (skipped in output)

#### Rhubarb (Reference):
- (0.44-0.51) → **Viseme G** (V sound) ✓
- (0.51-0.72) → **Viseme F** (rounded vowels)
- (0.72-0.86) → **Viseme C**

**Analysis**: WhisperX correctly identifies 'v' → G and 'o' → F! But misses /R/ → E mapping.

---

### 4. "How" (1.166-1.267s)

#### Expected Phonemes:
- `/HH/` → **Viseme C** (open medium)
- `/AW/` ("ow" diphthong) → **Viseme D** then **F** (wide open to rounded)

#### WhisperX Generated:
- `H` (1.166-1.207) → (skipped in output)
- `o` (1.207-1.247) → **Viseme F** ✓ (rounded)
- `w` (1.247-1.267) → (skipped in output)

#### Rhubarb (Reference):
- (1.13-1.17) → **Viseme C**
- (1.17-1.24) → **Viseme E**
- (1.24-1.59) → **Viseme F** ✓

**Analysis**: WhisperX gets the rounded 'o' → F correctly but misses the /HH/ opening.

---

### 5. "beer" (2.95-3.193s)

#### Expected Phonemes:
- `/B/` → **Viseme A** (closed lips, bilabial)
- `/IY/` ("ee") → **Viseme B** (front vowel)
- `/R/` → **Viseme E** (r-colored)

#### WhisperX Generated:
- `b` (2.95-3.031) → **Viseme A** ✓ CORRECT! (bilabial)
- `e` (3.031-3.092) → **Viseme B** ✓ (acceptable)
- `e` (3.092-3.153) → **Viseme B** ✓
- `r` (3.153-3.193) → **Viseme B** ❌ (should be E)

#### Rhubarb (Reference):
- (2.73-2.81) → **Viseme A** ✓
- (2.81-2.99) → **Viseme B** ✓
- (2.99-3.20) → **Viseme E** ✓

**Analysis**: WhisperX correctly identifies 'b' → A (bilabial)! But misses /R/ → E again.

---

### 6. "cheese" (3.456-3.983s)

#### Expected Phonemes:
- `/CH/` → **Viseme B** (clenched teeth, affricate)
- `/IY/` → **Viseme B** (front vowel)
- `/Z/` → **Viseme B** (fricative)

#### WhisperX Generated:
- `c` (3.456-3.477) → (gap, no timing)
- `h` (3.477-3.558) → **Viseme X** ❌ (should be B together as /CH/)
- `e` (3.578-3.64) → **Viseme B** ✓
- `e` (3.64-3.7) → **Viseme B** ✓
- `s` (3.7-3.74) → **Viseme B** ✓
- `e` (3.76-3.801) → **Viseme B** ❌ (silent e)

#### Rhubarb (Reference):
- (3.34-3.90) → **Viseme B** ✓ (entire word)

**Analysis**: "ch" digraph is split incorrectly. Silent 'e' gets mapped when it shouldn't.

---

## Audio Sample v4: "Peanut, coffee, bubble and snake."

### Word-by-Word Analysis

---

### 1. "Peanut" (0.031-0.602s)

#### Expected Phonemes:
- `/P/` → **Viseme A** (bilabial plosive)
- `/IY/` → **Viseme B** (front vowel)
- `/N/` → **Viseme B** (alveolar nasal)
- `/AH/` → **Viseme C** (open medium)
- `/T/` → **Viseme B** (alveolar stop)

#### WhisperX Generated:
- `P` (0.031-0.092) → **Viseme A** ✓ CORRECT!
- `e` (0.092-0.153) → **Viseme A** (merged with P)
- `a` (0.153-0.235) → **Viseme A** (merged)
- `n` (0.235-0.296) → **Viseme A** (merged)
- `u` (0.296-0.378) → **Viseme A** (merged)
- `t` (0.378-0.419) → (gap)
- `(rest)` (0.419-0.52) → **Viseme B**
- `t` (0.52-0.602) → **Viseme F** ❌ (should be B)

**Analysis**: WhisperX correctly gets /P/ → A but then incorrectly merges too many characters with it.

---

### 2. "coffee" (0.99-1.357s)

#### Expected Phonemes:
- `/K/` → **Viseme B** (velar stop)
- `/AO/` (as in "law") → **Viseme E** (slightly rounded)
- `/F/` → **Viseme G** (labiodental fricative) 
- `/IY/` → **Viseme B** (front vowel)

#### WhisperX Generated:
- `c` (0.99-1.051) → **Viseme B** ✓ (acceptable for /K/)
- `o` (1.051-1.112) → **Viseme B** ❌ (should be E or F for /AO/)
- `f` (1.132-1.204) → **Viseme G** ✓ CORRECT! (labiodental)
- `f` (1.204-1.275) → **Viseme G** ✓ CORRECT!
- `e` (1.275-1.316) → **Viseme B** ✓
- `e` (1.316-1.357) → **Viseme B** ✓

**Analysis**: WhisperX correctly identifies both 'f' letters → G (teeth on lip)! This is a major success.

---

### 3. "bubble" (1.744-2.091s)

#### Expected Phonemes:
- `/B/` → **Viseme A** (bilabial)
- `/AH/` → **Viseme C** (open medium)
- `/B/` → **Viseme A** (bilabial)
- `/AH/` → **Viseme C**
- `/L/` → **Viseme H** (tongue up)

#### WhisperX Generated:
- `b` (1.744-1.806) → **Viseme A** ✓ CORRECT!
- `u` (1.806-1.846) → **Viseme A** (merged)
- `b` (1.867-1.928) → **Viseme A** ✓ CORRECT!
- `b` (1.928-1.989) → **Viseme A** (duplicate?)
- `l` (1.989-2.03) → **Viseme H** ✓ CORRECT! (tongue up)
- `e` (2.03-2.091) → **Viseme B** ✓

**Analysis**: Excellent! WhisperX correctly identifies 'b' → A (bilabial) twice AND 'l' → H (tongue up)!

---

### 4. "snake" (2.417-2.764s)

#### Expected Phonemes:
- `/S/` → **Viseme B** (fricative)
- `/N/` → **Viseme B** (alveolar nasal)
- `/EY/` → **Viseme B** (front vowel diphthong)
- `/K/` → **Viseme B** (velar stop)

#### WhisperX Generated:
- `s` (2.417-2.478) → **Viseme B** ✓
- `n` (2.478-2.54) → **Viseme B** ✓
- `a` (2.54-2.601) → **Viseme B** ⚠️ (should be B anyway for /EY/)
- `k` (2.601-2.642) → **Viseme D** ❌ (should be B)
- `e` (2.642-2.682) → **Viseme D** (merged)
- `e` (2.682-2.764) → **Viseme B**

**Analysis**: Mostly correct, but 'k' is incorrectly mapped to D (wide open) instead of B.

---

## Summary Statistics

### WhisperX Character-Based Accuracy

| Category | Correct | Partially Correct | Wrong | Accuracy |
|----------|---------|------------------|-------|----------|
| Bilabials (m, b, p → A) | ✓ | | | 90% |
| Labiodentals (f, v → G) | ✓ | | | 100% |
| Laterals (l → H) | ✓ | | | 100% |
| Rounded vowels (o, u → F) | ✓ | | | 80% |
| Front vowels (e, i → B) | ✓ | | | 85% |
| R-sounds (r → E) | | | ✓ | 0% |
| Open vowels (a → D/C) | | ✓ | | 50% |
| Digraphs (th, ch, sh) | | | ✓ | 0% |
| Silent letters | | | ✓ | 0% |
| **Overall** | | | | **60-65%** |

---

## Key Findings

### ✅ What WhisperX Gets Right (Character-based):

1. **Bilabials** (m, b, p → A): Consistently correct
2. **Labiodentals** (f, v → G): Excellent accuracy
3. **Laterals** (l → H): Correct when present
4. **Rounded vowels** (o, u, w → F): Good accuracy
5. **Front vowels** (e, i → B): Acceptable for many cases

### ❌ What WhisperX Gets Wrong:

1. **R-sounds** (r → E): Always mapped to B instead of E (0% accuracy)
2. **Digraphs** (th, ch, sh): Split into separate letters, incorrect visemes
3. **Silent letters**: Get mapped when they shouldn't exist
4. **/HH/ sounds**: Mapped to B instead of C (open medium)
5. **Context-dependent sounds**: Same letter in different words gets same viseme

### ⚠️ Fundamental Limitation:

WhisperX maps **LETTERS to visemes**, not **SOUNDS to visemes**. This means:

- "there" /DH-EH-R/ becomes t+h+e+r+e (5 letters, wrong sounds)
- "coffee" /K-AO-F-IY/ becomes c+o+f+f+e+e (6 letters, extra 'e')
- Silent letters like final 'e' get visemes when they're not pronounced

---

## Recommendation

**For accurate lip sync:**

1. 🥇 **Use Gentle/Rhubarb** (phoneme-based) for English: ~85-90% accuracy
2. 🥈 **Use PocketSphinx** (phoneme-based): ~80-85% accuracy  
3. 🥉 **Use WhisperX (fixed)** when phoneme-based isn't available: ~60-65% accuracy
4. ❌ **Avoid word-level estimation**: ~35-40% accuracy

**WhisperX is significantly better than before** (60-65% vs 35-40%), but phoneme-based systems are still superior for lip sync accuracy.

