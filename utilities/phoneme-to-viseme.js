/**
 * Phoneme to Viseme Mapper
 * 
 * Maps ARPAbet phonemes (used by Gentle/CMU Sphinx) to Rhubarb Lip Sync viseme codes
 * Based on the Hanna-Barbera animation standard used by Rhubarb
 * 
 * Rhubarb Viseme Codes:
 * - A: Closed lips (M, B, P)
 * - B: Clenched teeth (K, S, T, EE)
 * - C: Open mouth medium (EH, AE)
 * - D: Wide open (AA, AH)
 * - E: Slightly rounded (AO, ER)
 * - F: Puckered lips (UW, OW, W)
 * - G: Teeth on lip (F, V)
 * - H: Tongue up (L)
 * - X: Rest/silence
 */

/**
 * ARPAbet phoneme to Rhubarb viseme mapping
 * Reference: http://www.speech.cs.cmu.edu/cgi-bin/cmudict
 */
const PHONEME_TO_VISEME = {
  // Vowels
  'AA': 'D',  // odd     - wide open
  'AE': 'C',  // at      - open medium
  'AH': 'C',  // hut     - open medium
  'AO': 'E',  // ought   - slightly rounded
  'AW': 'D',  // cow     - wide open to rounded
  'AY': 'D',  // hide    - wide open
  'EH': 'C',  // Ed      - open medium
  'ER': 'E',  // hurt    - slightly rounded
  'EY': 'B',  // ate     - clenched teeth
  'IH': 'B',  // it      - clenched teeth
  'IY': 'B',  // eat     - clenched teeth
  'OW': 'F',  // oat     - puckered
  'OY': 'E',  // toy     - slightly rounded
  'UH': 'E',  // hood    - slightly rounded
  'UW': 'F',  // two     - puckered
  
  // Consonants - Stops
  'B':  'A',  // be      - closed lips
  'D':  'B',  // dee     - tongue/teeth
  'G':  'B',  // green   - back of mouth
  'K':  'B',  // key     - back of mouth
  'P':  'A',  // pee     - closed lips
  'T':  'B',  // tea     - tongue/teeth
  
  // Consonants - Affricates
  'CH': 'B',  // cheese  - clenched teeth
  'JH': 'B',  // gee     - clenched teeth
  
  // Consonants - Fricatives
  'DH': 'B',  // thee    - tongue between teeth
  'F':  'G',  // fee     - teeth on lip
  'HH': 'C',  // he      - open medium
  'S':  'B',  // sea     - clenched teeth
  'SH': 'B',  // she     - clenched teeth
  'TH': 'B',  // theta   - tongue between teeth
  'V':  'G',  // vee     - teeth on lip
  'Z':  'B',  // zee     - clenched teeth
  'ZH': 'B',  // seizure - clenched teeth
  
  // Consonants - Nasals
  'M':  'A',  // me      - closed lips
  'N':  'B',  // knee    - tongue behind teeth
  'NG': 'B',  // ping    - back of mouth
  
  // Consonants - Liquids
  'L':  'H',  // lee     - tongue up
  'R':  'E',  // read    - slightly rounded
  
  // Consonants - Semivowels
  'W':  'F',  // we      - puckered
  'Y':  'B',  // yield   - clenched teeth
  
  // Special
  'SIL': 'X', // silence - rest position
  'SP':  'X', // short pause - rest position
};

/**
 * Maps a phoneme to a viseme code
 * @param {string} phoneme - ARPAbet phoneme (may include stress markers like 0,1,2)
 * @returns {string} Rhubarb viseme code (A-H, X)
 */
function phonemeToViseme(phoneme) {
  if (!phoneme) return 'X';
  
  // Remove stress markers (0, 1, 2) from vowels
  let cleanPhoneme = phoneme.replace(/[012]$/, '');
  
  // Remove Gentle's positional markers (_B=begin, _I=internal, _E=end, _S=singleton)
  cleanPhoneme = cleanPhoneme.replace(/_(B|I|E|S)$/, '');
  
  // Convert to uppercase for consistency
  cleanPhoneme = cleanPhoneme.toUpperCase();
  
  // Handle OOV (out of vocabulary) phones from Gentle
  // These are words not in the dictionary, often interjections
  if (cleanPhoneme.startsWith('OOV')) {
    // For "Shh" and similar sounds, use viseme B (clenched teeth for S/SH)
    return 'B';
  }
  
  // Look up the viseme
  const viseme = PHONEME_TO_VISEME[cleanPhoneme];
  
  if (!viseme) {
    console.warn(`Unknown phoneme: ${phoneme} (cleaned: ${cleanPhoneme}), defaulting to X`);
    return 'X';
  }
  
  return viseme;
}

/**
 * Gets a human-readable description of a viseme
 * @param {string} viseme - Rhubarb viseme code
 * @returns {string} Description of the mouth shape
 */
function getVisemeDescription(viseme) {
  const descriptions = {
    'A': 'Closed lips (M, B, P)',
    'B': 'Clenched teeth (K, S, T, EE)',
    'C': 'Open mouth medium (EH, AE)',
    'D': 'Wide open (AA, AH)',
    'E': 'Slightly rounded (AO, ER)',
    'F': 'Puckered lips (UW, OW, W)',
    'G': 'Teeth on lip (F, V)',
    'H': 'Tongue up (L)',
    'X': 'Rest/silence'
  };
  
  return descriptions[viseme] || 'Unknown viseme';
}

/**
 * Converts Gentle alignment result to Rhubarb-compatible viseme format
 * @param {Object} gentleResult - Result from Gentle forced aligner
 * @param {Object} options - Configuration options
 * @param {number} options.minDuration - Minimum duration for a viseme cue in seconds (default: 0.03)
 * @returns {Object} Rhubarb-compatible viseme data
 */
function convertGentleToVisemes(gentleResult, options = {}) {
  const { minDuration = 0.03 } = options;
  
  if (!gentleResult || !gentleResult.words) {
    throw new Error('Invalid Gentle result: missing words array');
  }
  
  const mouthCues = [];
  let lastViseme = null;
  let lastEnd = 0;
  
  // Process each word
  for (const word of gentleResult.words) {
    if (word.case === 'not-found-in-audio' || !word.phones) {
      // Add silence for words not found
      if (word.start && word.end) {
        addCue('X', word.start, word.end);
      }
      continue;
    }
    
    // Add silence gap before this word if needed
    if (word.start && word.start > lastEnd + 0.01) {
      addCue('X', lastEnd, word.start);
    }
    
    // Process each phone in the word
    if (word.phones && word.phones.length > 0) {
      // Gentle provides phone durations but not absolute start times
      // Calculate absolute times based on word start time
      let phoneStart = word.start;
      
      for (const phone of word.phones) {
        if (!phone.phone) continue;
        
        const viseme = phonemeToViseme(phone.phone);
        const duration = phone.duration || minDuration;
        const phoneEnd = phoneStart + duration;
        
        addCue(viseme, phoneStart, phoneEnd);
        phoneStart = phoneEnd;
      }
      
      lastEnd = word.end || phoneStart;
    } else if (word.start && word.end) {
      // No phone data, use word timing
      const viseme = phonemeToViseme(word.phone || 'SIL');
      addCue(viseme, word.start, word.end);
      lastEnd = word.end;
    }
  }
  
  // Add final silence if needed
  if (gentleResult.end && lastEnd < gentleResult.end) {
    addCue('X', lastEnd, gentleResult.end);
  }
  
  function addCue(viseme, start, end) {
    const duration = end - start;
    
    // Skip very short cues
    if (duration < minDuration) return;
    
    // Merge with previous cue if same viseme
    if (mouthCues.length > 0 && lastViseme === viseme) {
      mouthCues[mouthCues.length - 1].end = end;
    } else {
      mouthCues.push({
        start: parseFloat(start.toFixed(3)),
        end: parseFloat(end.toFixed(3)),
        value: viseme
      });
      lastViseme = viseme;
    }
  }
  
  return {
    metadata: {
      soundFile: gentleResult.audioFile || 'unknown',
      duration: gentleResult.end || (mouthCues.length > 0 ? mouthCues[mouthCues.length - 1].end : 0),
      transcript: gentleResult.transcript || '',
      source: 'gentlejs'
    },
    mouthCues
  };
}

/**
 * Formats viseme data for display
 * @param {Object} visemeData - Viseme data with mouthCues
 * @returns {Array} Formatted array of cues
 */
function formatVisemeData(visemeData) {
  if (!visemeData.mouthCues) {
    return [];
  }
  
  return visemeData.mouthCues.map((cue, index) => ({
    index,
    time: cue.start,
    timeFormatted: `${cue.start.toFixed(3)}s`,
    viseme: cue.value,
    duration: cue.end - cue.start,
    durationFormatted: `${(cue.end - cue.start).toFixed(3)}s`,
    description: getVisemeDescription(cue.value)
  }));
}

export {
  phonemeToViseme,
  getVisemeDescription,
  convertGentleToVisemes,
  formatVisemeData,
  PHONEME_TO_VISEME
};

