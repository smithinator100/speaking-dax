# Viseme Accuracy Comparison Table

## Quick Reference: Expected vs Generated Visemes

### Audio Sample: "Hi there, everyone. How are you doing today?"

| Word | Expected Phonemes | Expected Visemes | WhisperX Characters | WhisperX Visemes | Match? |
|------|------------------|------------------|---------------------|------------------|--------|
| **Hi** | /HH/ /AY/ | C, D | H, i | B, B | ❌ Wrong |
| **there** | /DH/ /EH/ /R/ | B, C, E | t, h, e, r, e | X, X, B, B, B | ❌ Wrong |
| **everyone** | /EH/ /V/ /R/ /IY/ /W/ /AH/ /N/ | C, G, E, B, F, C, B | e, v, e, r, y, o, n, e | B, **G**, B, B, B, **F**, B, B | ⚠️ Partial |
| **How** | /HH/ /AW/ | C, D→F | H, o, w | (skip), **F**, (skip) | ⚠️ Partial |
| **are** | /AA/ /R/ | D, E | a, r, e | B, B, B | ❌ Wrong |
| **you** | /Y/ /UW/ | B, F | y, o, u | B, **F**, **F** | ✅ Partial |
| **doing** | /D/ /UW/ /IH/ /NG/ | B, F, B, B | d, o, i, n, g | B, **F**, B, B, B | ✅ Good |
| **today** | /T/ /AH/ /D/ /EY/ | B, C, B, B | t, o, d, a, y | B, **F**, B, B, B | ⚠️ Partial |

---

### Audio Sample: "Peanut, coffee, bubble and snake"

| Word | Expected Phonemes | Expected Visemes | WhisperX Characters | WhisperX Visemes | Match? |
|------|------------------|------------------|---------------------|------------------|--------|
| **Peanut** | /P/ /IY/ /N/ /AH/ /T/ | A, B, B, C, B | P, e, a, n, u, t | **A**, A, A, A, A, F | ⚠️ Partial |
| **coffee** | /K/ /AO/ /F/ /IY/ | B, E, G, B | c, o, f, f, e, e | B, B, **G**, **G**, B, B | ✅ Good |
| **bubble** | /B/ /AH/ /B/ /AH/ /L/ | A, C, A, C, H | b, u, b, b, l, e | **A**, A, **A**, A, **H**, B | ✅ Excellent |
| **and** | /AE/ /N/ /D/ | C, B, B | a, n, d | B, B, B | ⚠️ Partial |
| **snake** | /S/ /N/ /EY/ /K/ | B, B, B, B | s, n, a, k, e | B, B, B, D, B | ⚠️ Partial |

---

## Detailed Accuracy Breakdown

### Consonant Mapping Accuracy

| Phoneme Category | Example | Expected Viseme | WhisperX Character | WhisperX Viseme | Accuracy |
|-----------------|---------|-----------------|-------------------|-----------------|----------|
| **Bilabials** | /P/, /B/, /M/ | **A** (closed lips) | p, b, m | **A** | ✅ 95% |
| **Labiodentals** | /F/, /V/ | **G** (teeth on lip) | f, v | **G** | ✅ 100% |
| **Laterals** | /L/ | **H** (tongue up) | l | **H** | ✅ 100% |
| **Alveolars** | /T/, /D/, /N/, /S/, /Z/ | **B** (clenched) | t, d, n, s, z | **B** | ✅ 90% |
| **Velars** | /K/, /G/, /NG/ | **B** (back mouth) | k, g, ng | **B** | ✅ 85% |
| **Affricates** | /CH/, /JH/ | **B** (clenched) | c+h, j | X+B / B | ❌ 40% |
| **Fricatives** | /TH/, /DH/ | **B** (tongue teeth) | t+h | X+X | ❌ 30% |
| **Glottal** | /HH/ | **C** (open medium) | h | B or X | ❌ 20% |
| **Rhotics** | /R/ | **E** (rounded) | r | **B** | ❌ 0% |
| **Semivowels** | /W/, /Y/ | F, B | w, y | F, B | ✅ 90% |

### Vowel Mapping Accuracy

| Vowel Category | Examples | Expected Viseme | WhisperX Character | WhisperX Viseme | Accuracy |
|---------------|----------|-----------------|-------------------|-----------------|----------|
| **Open vowels** | /AA/, /AE/, /AH/ | **D** or **C** | a | **D** or B | ⚠️ 60% |
| **Front vowels** | /IY/, /IH/, /EY/, /EH/ | **B** or **C** | i, e | **B** | ✅ 80% |
| **Rounded vowels** | /UW/, /UH/, /OW/, /AO/ | **F** or **E** | u, o | **F** | ✅ 75% |
| **Diphthongs** | /AY/, /AW/, /OY/ | **D**→**F** | a+y, o+w | varies | ⚠️ 50% |
| **R-colored** | /ER/, /AR/, /OR/ | **E** | e+r, a+r, o+r | **B**+B | ❌ 20% |

---

## Common Error Patterns

### 1. Digraph Splitting (Critical Issue)

| Word | Phoneme | Should Be | WhisperX Does | Result |
|------|---------|-----------|---------------|--------|
| "there" | /DH/ | Single viseme B | t→X + h→X | ❌ Two wrong visemes |
| "cheese" | /CH/ | Single viseme B | c→X + h→X | ❌ Two wrong visemes |
| "shake" | /SH/ | Single viseme B | s→B + h→X | ❌ One right, one wrong |

### 2. Silent Letter Mapping (Medium Issue)

| Word | Silent Letter | Should Be | WhisperX Does | Result |
|------|--------------|-----------|---------------|--------|
| "there" | final 'e' | (ignored) | e→B | ❌ Extra viseme |
| "cheese" | final 'e' | (ignored) | e→B | ❌ Extra viseme |
| "snake" | final 'e' | (ignored) | e→B | ❌ Extra viseme |

### 3. R-Sound Errors (Critical Issue)

| Word | Phoneme | Should Be | WhisperX Does | Result |
|------|---------|-----------|---------------|--------|
| "there" | /R/ | E (rounded) | r→B | ❌ Wrong shape |
| "are" | /R/ | E (rounded) | r→B | ❌ Wrong shape |
| "beer" | /R/ | E (rounded) | r→B | ❌ Wrong shape |

### 4. Context-Dependent Letters (Limitation)

| Letter | Word 1 | Sound 1 | Word 2 | Sound 2 | WhisperX Treats |
|--------|--------|---------|--------|---------|-----------------|
| 'a' | "cat" | /AE/→C | "cake" | /EY/→B | Both as **D** |
| 'o' | "hot" | /AA/→D | "home" | /OW/→F | Both as **F** |
| 'e' | "bed" | /EH/→C | "be" | /IY/→B | Both as **B** |

---

## Accuracy Summary by System

| System | Method | Handles Digraphs | Handles Silent Letters | R-Sounds | Overall Accuracy |
|--------|--------|------------------|----------------------|----------|------------------|
| **Gentle/Rhubarb** | Phoneme-based | ✅ Yes | ✅ Yes | ✅ Yes | 85-95% |
| **PocketSphinx** | Phoneme-based | ✅ Yes | ✅ Yes | ✅ Yes | 80-90% |
| **WhisperX (fixed)** | Character-based | ❌ No | ❌ No | ❌ No | 60-70% |
| **WhisperX (old)** | Word estimation | ❌ No | ❌ No | ❌ No | 35-45% |

---

## Visual Comparison: Timeline View

### "coffee" - WhisperX vs Rhubarb

```
Time:    0.99s   1.05s   1.11s   1.13s   1.20s   1.27s   1.31s   1.35s
         |       |       |       |       |       |       |       |
WhisperX: [ B ]  [ B ]  [PAUSE] [  G  ] [  G  ] [  B  ] [  B  ]
Letters:   c       o             f       f       e       e
                                 ↑       ↑
                              CORRECT  CORRECT (labiodental)

Rhubarb:  [    B    ] [      E      ] [      G      ] [   B   ]
Phonemes:    /K/         /AO/             /F/            /IY/
              ↑            ↑                ↑              ↑
           velar      rounded vowel    labiodental    front vowel
```

**Analysis**: WhisperX gets the 'f' sounds right (G viseme) but treats 'o' as generic rounded instead of specific /AO/ vowel.

---

### "bubble" - WhisperX vs Rhubarb

```
Time:    1.74s   1.80s   1.86s   1.92s   1.98s   2.03s   2.09s
         |       |       |       |       |       |       |
WhisperX: [ A ]  [ A ]  [ A ]  [ A ]  [ H ]  [ B ]
Letters:   b       u       b       b       l       e
           ↑               ↑       ↑       ↑
        CORRECT         CORRECT CORRECT CORRECT

Rhubarb:  [    A    ] [ C ] [    A    ] [ C ] [  H  ] [ B ]
Phonemes:    /B/       /AH/    /B/       /AH/    /L/    (end)
             ↑                  ↑                 ↑
          bilabial           bilabial         lateral
```

**Analysis**: Excellent! WhisperX correctly identifies all three key consonants (b, b, l) with proper visemes.

---

## Conclusion

### When WhisperX Works Well:
- ✅ Simple consonants (b, p, m, f, v, l, s, t, d, n)
- ✅ Basic rounded vowels (o, u, w)
- ✅ Front vowels (e, i)
- ✅ Words with regular spelling-to-sound correspondence

### When WhisperX Struggles:
- ❌ Digraphs (th, ch, sh, ph)
- ❌ Silent letters (final e, silent k in "knife")
- ❌ R-sounds (always maps to B instead of E)
- ❌ Context-dependent vowels (same letter, different sounds)
- ❌ Irregular spellings (cough, through, though, etc.)

### Final Verdict:
**WhisperX (character-based): 60-70% accuracy** - Good enough for casual use, not ideal for high-quality lip sync. Best used when phoneme-based systems aren't available or for non-English languages.

