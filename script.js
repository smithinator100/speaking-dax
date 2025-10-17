// Base path configuration for GitHub Pages
const BASE_PATH = window.location.pathname.includes('/speaking-dax/') 
    ? '/speaking-dax/' 
    : '/';

let gentleData = null;
let audio = null;
let animationFrameId = null;
let isPlaying = false;
let lastViseme = 'X';
let currentMorphAnimation = null;

// Waveform variables
let audioContext = null;
let audioBuffer = null;
let waveformData = null;
const waveformCanvas = document.getElementById('waveformCanvas');
const waveformCtx = waveformCanvas.getContext('2d');
const playheadLine = document.getElementById('playheadLine');
const phonemeMarkersContainer = document.getElementById('phonemeMarkers');

// Zoom and Pan variables
let zoomLevel = 1; // 1 = 100%, 2 = 200%, etc.
let panOffset = 0; // Offset in percentage (0-1)
let isPanning = false;
let panStartX = 0;
let panStartOffset = 0;
let hasDragged = false;

// Runtime animation settings
let transitionSpeed = 50; // ms for dax-transition morphing
let anticipationTime = -20; // ms (negative = earlier, positive = later)

const playButton = document.getElementById('playButton');
const errorDisplay = document.getElementById('errorDisplay');
const mouthImage = document.getElementById('mouthImage');
const mouthContainer = document.getElementById('mouthContainer');
const audioSampleSelect = document.getElementById('audioSample');
const daxSvg = document.getElementById('daxSvg');
const tonguePath = document.getElementById('tongue-path');
const upperTeethPath = document.getElementById('upper-teeth-path');
const lowerTeethPath = document.getElementById('lower-teeth-path');
const beakPath = document.getElementById('beak-path');

// Eyes elements
const eyesSvg = document.getElementById('eyesSvg');
const eyeLeft = document.getElementById('eye-left');
const eyeRight = document.getElementById('eye-right');
const eyeLeftIris = document.getElementById('eye-left-iris');
const eyeRightIris = document.getElementById('eye-right-iris');
const eyeBrowLeft = document.getElementById('eye-brow-left');
const eyeBrowRight = document.getElementById('eye-brow-right');

// Blinking variables
let blinkInterval = null;
let currentBlinkAnimation = null;
let blinkOpportunities = [];
let lastBlinkTime = -10;
let nextBlinkIndex = 0;

// Eye shape paths (open state is default in HTML)
const eyePaths = {
    open: {
        eyeLeft: "M369.618 336.987C369.618 342.258 367.243 346.977 363.5 350.136C360.491 352.675 356.598 354.206 352.345 354.206C347.014 354.206 342.241 351.792 339.07 348C336.574 345.015 335.071 341.175 335.071 336.987C335.071 332.798 336.574 328.958 339.07 325.973C342.241 322.181 347.014 319.768 352.345 319.768C357.081 319.768 361.377 321.673 364.5 324.757C367.659 327.877 369.618 332.204 369.618 336.987Z",
        eyeLeftIris: "M364.527 331.277C364.527 328.822 362.527 326.822 360.054 326.822C357.599 326.822 355.599 328.804 355.581 331.277C355.581 333.732 357.581 335.732 360.054 335.732C362.527 335.732 364.527 333.732 364.527 331.277Z",
        eyeBrowLeft: "M334.416 288.201C343.671 284.333 350.945 284.833 356.087 286.05C357.17 286.306 357.922 285.141 357.056 284.442C353.065 281.223 344.132 277.226 332.482 281.571C322.089 285.446 317.191 293.497 317.162 298.791C317.155 300.038 319.722 300.144 320.386 299.088C322.179 296.235 325.161 292.069 334.416 288.201Z",
        eyeRight: "M482 326.5C482 330.939 480.006 334.913 476.864 337.573C474.339 339.711 471.071 341 467.5 341C463.025 341 459.018 338.968 456.357 335.774C454.262 333.26 453 330.027 453 326.5C453 322.973 454.262 319.74 456.357 317.226C459.018 314.032 463.025 312 467.5 312C471.476 312 475.082 313.604 477.704 316.202C480.356 318.829 482 322.473 482 326.5Z",
        eyeRightIris: "M478.237 321.877C478.237 319.768 476.51 318.059 474.401 318.059C472.292 318.059 470.582 319.768 470.564 321.877C470.564 323.986 472.292 325.695 474.401 325.695C476.528 325.695 478.237 323.986 478.237 321.877Z",
        eyeBrowRight: "M441.723 282.698C444.349 278.398 450.173 275.078 459.705 275.078C469.236 275.078 473.72 278.871 476.824 283.1C477.455 283.96 476.499 284.973 475.519 284.55C475.284 284.448 475.045 284.344 474.803 284.238C471.317 282.715 467.037 280.846 459.705 280.742C451.862 280.63 446.917 282.594 443.803 284.287C442.754 284.857 441.1 283.718 441.723 282.698Z"
    },
    blink: {
        eyeRight: "M479.674 329.704C478.51 332.054 476.569 332.549 472.568 331.339C468.852 330.216 466.704 329.322 462.789 329.328C457.457 329.338 454.871 330.384 449.463 331.38C447.242 331.789 445.188 330.165 445.014 328.143C444.867 326.434 446.058 324.982 447.673 324.487C453.516 322.698 457.062 321.844 463.22 322.026C468.356 322.178 471.232 322.963 476.11 324.437C478.777 325.244 480.827 327.377 479.674 329.704Z",
        eyeLeft: "M370.995 335.435C370.2 338.512 368.152 339.487 363.461 338.788C359.104 338.139 356.533 337.466 352.194 338.227C346.285 339.265 343.638 341.032 337.853 343.283C335.476 344.208 332.857 342.63 332.236 340.207C331.712 338.161 332.726 336.168 334.413 335.257C340.513 331.959 344.264 330.24 351.131 329.276C356.857 328.472 360.212 328.872 365.931 329.724C369.059 330.19 371.781 332.386 370.995 335.435Z",
        eyeBrowLeft: "M341.219 315.04C350.781 312.011 357.981 313.156 362.995 314.825C364.051 315.177 364.904 314.084 364.104 313.311C360.415 309.749 351.873 304.973 339.882 308.263C329.186 311.198 323.591 318.782 323.091 324.052C322.973 325.294 325.52 325.628 326.275 324.635C328.315 321.953 331.656 318.068 341.219 315.04Z",
        eyeBrowRight: "M443 311.576C445.121 307.005 450.531 303.046 460.001 301.965C469.471 300.884 474.356 304.143 477.92 307.993C478.645 308.776 477.81 309.891 476.788 309.581C476.543 309.507 476.294 309.43 476.041 309.352C472.405 308.235 467.94 306.864 460.644 307.592C452.839 308.371 448.149 310.883 445.247 312.918C444.27 313.604 442.497 312.659 443 311.576Z"
    }
};

// Slider elements
const transitionSpeedSlider = document.getElementById('transitionSpeed');
const transitionSpeedValue = document.getElementById('transitionSpeedValue');
const anticipationTimeSlider = document.getElementById('anticipationTime');
const anticipationTimeValue = document.getElementById('anticipationTimeValue');

// Update mouth container background for dax-transition character
function updateMouthContainerBackground() {
    mouthContainer.style.backgroundImage = `url(${BASE_PATH}mouth-shapes-teeth-tongue/bg.png)`;
    mouthContainer.style.backgroundSize = 'contain';
    mouthContainer.style.backgroundPosition = 'center';
    mouthContainer.style.backgroundRepeat = 'no-repeat';
    // Show SVG, hide img
    daxSvg.style.display = 'block';
    mouthImage.style.display = 'none';
    // Show eyes
    eyesSvg.style.display = 'block';
}

// Morph eye shapes for blinking
function morphEyeShapes(fromState, toState, duration) {
    const from = eyePaths[fromState];
    const to = eyePaths[toState];
    
    // Create interpolators for each eye element
    const interpolators = {
        eyeLeft: flubber.interpolate(from.eyeLeft, to.eyeLeft),
        eyeRight: flubber.interpolate(from.eyeRight, to.eyeRight),
        eyeBrowLeft: flubber.interpolate(from.eyeBrowLeft, to.eyeBrowLeft),
        eyeBrowRight: flubber.interpolate(from.eyeBrowRight, to.eyeBrowRight)
    };
    
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease in-out
        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        // Update paths
        eyeLeft.setAttribute('d', interpolators.eyeLeft(eased));
        eyeRight.setAttribute('d', interpolators.eyeRight(eased));
        eyeBrowLeft.setAttribute('d', interpolators.eyeBrowLeft(eased));
        eyeBrowRight.setAttribute('d', interpolators.eyeBrowRight(eased));
        
        // Hide/show iris based on state
        if (toState === 'blink') {
            eyeLeftIris.style.opacity = 1 - eased;
            eyeRightIris.style.opacity = 1 - eased;
        } else {
            eyeLeftIris.style.opacity = eased;
            eyeRightIris.style.opacity = eased;
        }
        
        if (progress < 1) {
            currentBlinkAnimation = requestAnimationFrame(animate);
        }
    }
    
    currentBlinkAnimation = requestAnimationFrame(animate);
}

// Blinking animation
function blink() {
    if (currentBlinkAnimation) {
        cancelAnimationFrame(currentBlinkAnimation);
    }
    
    // Morph to blink state (50ms)
    morphEyeShapes('open', 'blink', 50);
    
    // Hold blink state for 100ms, then morph back to open (50ms)
    setTimeout(() => {
        morphEyeShapes('blink', 'open', 50);
    }, 150); // 50ms to close + 100ms hold
}

// Start random blinking
function startBlinking() {
    if (blinkInterval) {
        clearInterval(blinkInterval);
    }
    
    // Blink every 8-10 seconds randomly
    function scheduleNextBlink() {
        const delay = 8000 + Math.random() * 2000; // Random delay between 8-10 seconds
        setTimeout(() => {
            blink();
            scheduleNextBlink();
        }, delay);
    }
    
    scheduleNextBlink();
}

// Stop blinking
function stopBlinking() {
    if (blinkInterval) {
        clearInterval(blinkInterval);
        blinkInterval = null;
    }
    if (currentBlinkAnimation) {
        cancelAnimationFrame(currentBlinkAnimation);
        currentBlinkAnimation = null;
    }
    // Clear blink opportunities
    blinkOpportunities = [];
    nextBlinkIndex = 0;
    lastBlinkTime = -10;
    
    // Ensure eyes are in open state
    eyeLeft.setAttribute('d', eyePaths.open.eyeLeft);
    eyeRight.setAttribute('d', eyePaths.open.eyeRight);
    eyeBrowLeft.setAttribute('d', eyePaths.open.eyeBrowLeft);
    eyeBrowRight.setAttribute('d', eyePaths.open.eyeBrowRight);
    eyeLeftIris.style.opacity = '1';
    eyeRightIris.style.opacity = '1';
}

// Analyze viseme data to find optimal blink opportunities
function findBlinkOpportunities(visemeData) {
    if (!visemeData || !visemeData.mouthCues) return [];
    
    const opportunities = [];
    const mouthCues = visemeData.mouthCues;
    const SILENCE_THRESHOLD = 0.2; // 200ms gap threshold - only blink on significant pauses
    const MIN_BLINK_INTERVAL = 4.0; // Minimum 4 seconds between blinks during speech
    const LONG_GAP_THRESHOLD = 0.5; // 500ms+ gaps are considered long pauses
    
    let lastOpportunityTime = -MIN_BLINK_INTERVAL;
    
    // Find gaps between visemes
    for (let i = 0; i < mouthCues.length - 1; i++) {
        const currentCue = mouthCues[i];
        const nextCue = mouthCues[i + 1];
        const gap = nextCue.start - currentCue.end;
        
        // Check if this is a significant pause
        if (gap >= SILENCE_THRESHOLD) {
            // Place blink in the middle of the gap
            const blinkTime = currentCue.end + (gap / 2);
            
            // For shorter gaps, require longer interval; for long gaps, allow more frequent blinks
            const requiredInterval = gap >= LONG_GAP_THRESHOLD ? 3.0 : MIN_BLINK_INTERVAL;
            
            // Ensure minimum interval between blinks
            if (blinkTime - lastOpportunityTime >= requiredInterval) {
                opportunities.push({
                    time: blinkTime,
                    type: 'gap',
                    duration: gap,
                    gapStart: currentCue.end,
                    gapEnd: nextCue.start
                });
                lastOpportunityTime = blinkTime;
            }
        }
    }
    
    // Add blink opportunity at the end of speech
    if (mouthCues.length > 0) {
        const lastCue = mouthCues[mouthCues.length - 1];
        const finalBlinkTime = lastCue.end + 0.3; // 300ms after final viseme
        
        if (finalBlinkTime - lastOpportunityTime >= 3.0) {
            opportunities.push({
                time: finalBlinkTime,
                type: 'phrase-end',
                duration: 0,
                gapStart: lastCue.end,
                gapEnd: lastCue.end + 1.0
            });
        }
    }
    
    return opportunities;
}

// Prepare blink opportunities for playback
function prepareIntelligentBlinks() {
    if (!gentleData) return;
    
    // Find blink opportunities
    blinkOpportunities = findBlinkOpportunities(gentleData);
    nextBlinkIndex = 0;
    lastBlinkTime = -10;
    
    console.log(`Found ${blinkOpportunities.length} blink opportunities:`, blinkOpportunities);
}

// Check for blink opportunities during playback (called from animation loop)
function checkBlinkOpportunities(currentTime) {
    if (!isPlaying || blinkOpportunities.length === 0) return;
    
    // Check if we should trigger the next blink
    while (nextBlinkIndex < blinkOpportunities.length) {
        const opportunity = blinkOpportunities[nextBlinkIndex];
        
        // Check if we've reached this blink opportunity
        if (currentTime >= opportunity.time && currentTime < opportunity.time + 0.1) {
            // Trigger the blink
            console.log(`Triggering ${opportunity.type} blink at ${currentTime.toFixed(2)}s (scheduled: ${opportunity.time.toFixed(2)}s, gap: ${(opportunity.duration * 1000).toFixed(0)}ms)`);
            blink();
            lastBlinkTime = currentTime;
            nextBlinkIndex++;
            break;
        } else if (currentTime < opportunity.time) {
            // Haven't reached this opportunity yet
            break;
        } else {
            // We've passed this opportunity, move to next
            nextBlinkIndex++;
        }
    }
}

// Get current file paths based on selections
function getFilePaths() {
    const sample = audioSampleSelect.value;
    
    // Map sample values to actual directory and file names
    const sampleMap = {
        'v1': { dir: 'audio-sample-v1', file: 'audio-sample', ext: 'wav' },
        'v2': { dir: 'audio-sample-v2', file: 'audio-sample-v2', ext: 'wav' },
        'v3': { dir: 'audio-sample-v3', file: 'audio-sample-v3', ext: 'wav' },
        'v4': { dir: 'audio-sample-v4', file: 'audio-sample-v4', ext: 'wav' },
        'v5': { dir: 'audio-sample-v5', file: 'audio-sample-v5', ext: 'mp3' },
        'v6': { dir: 'audio-sample-v6', file: 'audio-sample-v6', ext: 'mp3' }
    };
    
    const config = sampleMap[sample];
    
    return {
        gentle: `${BASE_PATH}audio-samples/${config.dir}/${config.file}-gentle_visemes.json`,
        audio: `${BASE_PATH}audio-samples/${config.dir}/${config.file}.${config.ext}`
    };
}

// Load viseme data for Gentle model
async function loadVisemeData() {
    try {
        const paths = getFilePaths();
        console.log('Loading viseme data from:', paths);
        console.log('BASE_PATH:', BASE_PATH);
        
        // Load Gentle data
        const gentleResponse = await fetch(paths.gentle);
        if (!gentleResponse.ok) throw new Error(`Failed to load Gentle viseme data (${gentleResponse.status}): ${paths.gentle}`);
        gentleData = await gentleResponse.json();
        console.log('Loaded Gentle viseme data:', gentleData);
    } catch (error) {
        console.error('Error loading viseme data:', error);
        showError('Failed to load viseme data: ' + error.message);
    }
}

// Initialize audio
function initAudio() {
    const paths = getFilePaths();
    audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    
    // Set source
    audio.src = paths.audio;
    
    audio.addEventListener('ended', () => {
        stopAnimation();
    });

    audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        console.error('Audio error code:', audio.error?.code, audio.error?.message);
        const errorMessages = {
            1: 'Audio loading aborted',
            2: 'Network error while loading audio',
            3: 'Audio decode error - format may not be supported',
            4: 'Audio source not supported or not found'
        };
        const msg = errorMessages[audio.error?.code] || 'Failed to load audio file';
        showError(`${msg}. Path: ${paths.audio}`);
        stopAnimation();
    });

    audio.addEventListener('canplaythrough', () => {
        console.log('Audio ready to play:', paths.audio);
    });

    audio.addEventListener('loadedmetadata', () => {
        console.log('Audio metadata loaded. Duration:', audio.duration);
    });
}

// Reload data when selections change
async function reloadData() {
    // Stop current playback
    if (isPlaying) {
        stopAnimation();
    }
    
    // Clean up existing audio
    if (audio) {
        audio.pause();
        audio = null;
    }
    
    // Reset zoom and pan
    zoomLevel = 1;
    panOffset = 0;
    
    // Update mouth container background
    updateMouthContainerBackground();
    
    // Reload viseme data
    await loadVisemeData();
    
    // Reload waveform
    await loadAudioForWaveform();
    
    // Reset mouth to neutral
    resetMouthToNeutral(tonguePath, upperTeethPath, lowerTeethPath, beakPath);
    lastViseme = 'X';
}

// Update mouth shapes based on current time
function updateMouthShapes(currentTime) {
    // Apply anticipation time offset (convert ms to seconds)
    const adjustedTime = currentTime + (anticipationTime / 1000);
    
    // Get the Gentle model's data
    const visemeData = gentleData;

    if (visemeData) {
        const cue = visemeData.mouthCues.find(cue => {
            return adjustedTime >= cue.start && adjustedTime < cue.end;
        });

        if (cue) {
            const newViseme = cue.value || 'X';
            
            if (newViseme !== lastViseme) {
                // Use morphing for dax-transition
                currentMorphAnimation = morphBeak(
                    lastViseme, 
                    newViseme, 
                    transitionSpeed, 
                    tonguePath, 
                    upperTeethPath, 
                    lowerTeethPath, 
                    beakPath, 
                    currentMorphAnimation
                );
                lastViseme = newViseme;
            }
        } else {
            // Check if we're past the last cue - return to neutral position
            const lastCue = visemeData.mouthCues[visemeData.mouthCues.length - 1];
            if (lastCue && adjustedTime >= lastCue.end && lastViseme !== 'X') {
                currentMorphAnimation = morphBeak(
                    lastViseme, 
                    'X', 
                    transitionSpeed, 
                    tonguePath, 
                    upperTeethPath, 
                    lowerTeethPath, 
                    beakPath, 
                    currentMorphAnimation
                );
                lastViseme = 'X';
            }
        }
    }
}

// Animation loop
function animate() {
    if (audio && isPlaying) {
        const currentTime = audio.currentTime;
        updateMouthShapes(currentTime);
        checkBlinkOpportunities(currentTime);
        updatePlayhead();
        animationFrameId = requestAnimationFrame(animate);
    }
}

// Play audio and start animation
async function playAudio() {
    if (!gentleData) {
        showError('Viseme data not loaded');
        return;
    }

    if (!audio) {
        initAudio();
    }

    try {
        console.log('Attempting to play audio...');
        console.log('Audio ready state:', audio.readyState);
        console.log('Audio source:', audio.src);
        
        // Wait for audio to be ready
        if (audio.readyState < 2) {
            console.log('Waiting for audio to load...');
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Audio loading timeout'));
                }, 10000);
                
                audio.addEventListener('canplay', () => {
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });
                
                audio.load(); // Force load
            });
        }
        
        isPlaying = true;
        playButton.textContent = '⏸ Pause';
        playButton.disabled = false;
        
        // Stop random blinking and prepare intelligent blinks
        stopBlinking();
        prepareIntelligentBlinks();
        
        await audio.play();
        console.log('Audio playing successfully');
        animate();
    } catch (error) {
        console.error('Play error:', error);
        showError('Failed to play audio: ' + error.message);
        stopAnimation();
    }
}

// Pause audio and animation
function pauseAudio() {
    if (audio) {
        audio.pause();
    }
    isPlaying = false;
    playButton.textContent = '▶ Resume';
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

// Stop animation and reset
function stopAnimation() {
    isPlaying = false;
    playButton.textContent = '▶ Play Audio';
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    if (currentMorphAnimation) {
        cancelAnimationFrame(currentMorphAnimation);
        currentMorphAnimation = null;
    }

    // Clear blink opportunities and restart random blinking
    blinkOpportunities = [];
    nextBlinkIndex = 0;
    lastBlinkTime = -10;
    startBlinking();

    // Reset mouth to neutral
    resetMouthToNeutral(tonguePath, upperTeethPath, lowerTeethPath, beakPath);
    lastViseme = 'X';
}

// Toggle play/pause
function togglePlay() {
    if (isPlaying) {
        pauseAudio();
    } else {
        if (audio && audio.currentTime > 0 && !audio.ended) {
            playAudio();
        } else {
            // Start from beginning
            if (audio) {
                audio.currentTime = 0;
            }
            playAudio();
        }
    }
}

// Show error message
function showError(message) {
    errorDisplay.innerHTML = `<div class="error">⚠️ ${message}</div>`;
    setTimeout(() => {
        errorDisplay.innerHTML = '';
    }, 5000);
}

// Initialize waveform canvas sizing
function initWaveformCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = waveformCanvas.getBoundingClientRect();
    waveformCanvas.width = rect.width * dpr;
    waveformCanvas.height = rect.height * dpr;
    waveformCtx.scale(dpr, dpr);
}

// Load and decode audio for waveform
async function loadAudioForWaveform() {
    try {
        const paths = getFilePaths();
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const response = await fetch(paths.audio);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Extract waveform data
        extractWaveformData();
        drawWaveform();
        renderPhonemeMarkers();
    } catch (error) {
        console.error('Error loading audio for waveform:', error);
        showError('Failed to load audio for waveform');
    }
}

// Extract waveform data from audio buffer
function extractWaveformData() {
    const rawData = audioBuffer.getChannelData(0); // Get first channel
    const samples = 1000; // Number of samples to display
    const blockSize = Math.floor(rawData.length / samples);
    const filteredData = [];
    
    for (let i = 0; i < samples; i++) {
        let blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j]);
        }
        filteredData.push(sum / blockSize);
    }
    
    waveformData = filteredData;
}

// Draw waveform on canvas
function drawWaveform() {
    if (!waveformData) return;
    
    const rect = waveformCanvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Clear canvas
    waveformCtx.clearRect(0, 0, width, height);
    
    // Calculate visible range based on zoom and pan
    const visibleWidth = 1 / zoomLevel; // Percentage of total waveform visible
    const maxPanOffset = Math.max(0, 1 - visibleWidth);
    const clampedPanOffset = Math.max(0, Math.min(panOffset, maxPanOffset));
    
    const startIndex = Math.floor(clampedPanOffset * waveformData.length);
    const endIndex = Math.min(
        Math.ceil((clampedPanOffset + visibleWidth) * waveformData.length),
        waveformData.length
    );
    
    const visibleSamples = endIndex - startIndex;
    const barWidth = width / visibleSamples;
    const barGap = Math.min(1, barWidth * 0.1);
    
    // Draw waveform
    waveformCtx.fillStyle = '#667eea';
    
    for (let i = 0; i < visibleSamples; i++) {
        const dataIndex = startIndex + i;
        if (dataIndex >= waveformData.length) break;
        
        const barHeight = (waveformData[dataIndex] * height * 0.8);
        const x = i * barWidth;
        const y = (height - barHeight) / 2;
        
        waveformCtx.fillRect(x, y, barWidth - barGap, barHeight);
    }
}

// Render phoneme markers on overlay
function renderPhonemeMarkers() {
    if (!audioBuffer) return;
    
    // Clear existing markers
    phonemeMarkersContainer.innerHTML = '';
    
    // Get the Gentle model's data
    const visemeData = gentleData;
    
    if (!visemeData || !visemeData.mouthCues) return;
    
    const duration = audioBuffer.duration;
    const containerWidth = phonemeMarkersContainer.offsetWidth;
    const anticipationOffset = anticipationTime / 1000; // Convert ms to seconds
    
    // Calculate visible range based on zoom and pan
    const visibleWidth = 1 / zoomLevel;
    const maxPanOffset = Math.max(0, 1 - visibleWidth);
    const clampedPanOffset = Math.max(0, Math.min(panOffset, maxPanOffset));
    
    const visibleStartTime = clampedPanOffset * duration;
    const visibleEndTime = (clampedPanOffset + visibleWidth) * duration;
    
    visemeData.mouthCues.forEach((cue, index) => {
        // Apply anticipation time offset to the positions
        const adjustedStart = cue.start - anticipationOffset;
        const adjustedEnd = cue.end - anticipationOffset;
        
        // Skip markers outside visible range
        if (adjustedEnd < visibleStartTime || adjustedStart > visibleEndTime) return;
        
        // Calculate percentages relative to visible range
        const startPercent = ((adjustedStart - visibleStartTime) / (visibleEndTime - visibleStartTime)) * 100;
        const widthPercent = ((adjustedEnd - adjustedStart) / (visibleEndTime - visibleStartTime)) * 100;
        const durationMs = ((cue.end - cue.start) * 1000).toFixed(0);
        
        const marker = document.createElement('div');
        marker.className = 'phoneme-marker';
        marker.style.left = `${startPercent}%`;
        marker.style.width = `${widthPercent}%`;
        marker.style.cursor = zoomLevel > 1 ? 'grab' : 'pointer';
        marker.dataset.index = index;
        marker.dataset.start = cue.start; // Store original time for seeking
        marker.dataset.end = cue.end;
        marker.dataset.adjustedStart = adjustedStart; // Store adjusted time for highlighting
        marker.dataset.adjustedEnd = adjustedEnd;
        
        // Add label
        const label = document.createElement('div');
        label.className = 'phoneme-label';
        label.textContent = cue.value || 'X';
        marker.appendChild(label);
        
        // Add duration label if there's enough space
        const minWidthForDuration = 3 / zoomLevel; // Adjust threshold based on zoom
        if (widthPercent > minWidthForDuration) {
            const durationLabel = document.createElement('div');
            durationLabel.className = 'phoneme-duration';
            durationLabel.textContent = `${durationMs}ms`;
            marker.appendChild(durationLabel);
        }
        
        // Click to seek (only if not dragging)
        marker.addEventListener('click', (e) => {
            e.stopPropagation();
            if (audio && !hasDragged) {
                audio.currentTime = parseFloat(marker.dataset.start);
                updatePlayhead();
            }
        });
        
        phonemeMarkersContainer.appendChild(marker);
    });
}

// Update playhead position
function updatePlayhead() {
    if (!audio || !audioBuffer) return;
    
    const duration = audioBuffer.duration;
    const currentTime = audio.currentTime;
    
    // Calculate visible range based on zoom and pan
    const visibleWidth = 1 / zoomLevel;
    const maxPanOffset = Math.max(0, 1 - visibleWidth);
    const clampedPanOffset = Math.max(0, Math.min(panOffset, maxPanOffset));
    
    const visibleStartTime = clampedPanOffset * duration;
    const visibleEndTime = (clampedPanOffset + visibleWidth) * duration;
    
    // Calculate playhead position relative to visible range
    const relativeProgress = (currentTime - visibleStartTime) / (visibleEndTime - visibleStartTime);
    playheadLine.style.left = `${relativeProgress * 100}%`;
    
    // Hide playhead if outside visible range
    if (currentTime < visibleStartTime || currentTime > visibleEndTime) {
        playheadLine.style.opacity = '0';
    } else {
        playheadLine.style.opacity = '1';
    }
    
    // Highlight active phoneme marker using adjusted times
    const visemeData = gentleData;
    
    if (visemeData) {
        const markers = phonemeMarkersContainer.querySelectorAll('.phoneme-marker');
        markers.forEach(marker => {
            const adjustedStart = parseFloat(marker.dataset.adjustedStart);
            const adjustedEnd = parseFloat(marker.dataset.adjustedEnd);
            
            // Check if current time is within the adjusted phoneme range
            if (audio.currentTime >= adjustedStart && audio.currentTime < adjustedEnd) {
                marker.classList.add('active');
            } else {
                marker.classList.remove('active');
            }
        });
    }
}

// Update zoom level and redraw
function setZoom(newZoom) {
    const oldZoom = zoomLevel;
    zoomLevel = Math.max(1, Math.min(newZoom, 10)); // Clamp between 1x and 10x
    
    // Adjust pan offset to keep centered content roughly in view
    const visibleWidth = 1 / zoomLevel;
    const maxPanOffset = Math.max(0, 1 - visibleWidth);
    panOffset = Math.max(0, Math.min(panOffset, maxPanOffset));
    
    // Update zoom indicator
    const zoomIndicator = document.getElementById('zoomLevel');
    if (zoomIndicator) {
        zoomIndicator.textContent = `Zoom: ${zoomLevel.toFixed(1)}x`;
    }
    
    // Update cursor
    waveformCanvas.style.cursor = zoomLevel > 1 ? 'grab' : 'pointer';
    
    // Update phoneme marker cursors
    const markers = document.querySelectorAll('.phoneme-marker');
    markers.forEach(marker => {
        marker.style.cursor = zoomLevel > 1 ? 'grab' : 'pointer';
    });
    
    drawWaveform();
    renderPhonemeMarkers();
    updatePlayhead();
}

// Mouse wheel zoom on waveform - attach to container to capture events even over markers
const waveformContainer = document.querySelector('.waveform-container');
waveformContainer.addEventListener('wheel', (e) => {
    if (!audioBuffer) return;
    
    // Check if mouse is over the canvas area
    const canvasRect = waveformCanvas.getBoundingClientRect();
    const mouseY = e.clientY;
    if (mouseY < canvasRect.top || mouseY > canvasRect.bottom) return;
    
    e.preventDefault();
    
    const zoomSpeed = 0.001;
    const delta = -e.deltaY * zoomSpeed;
    const newZoom = zoomLevel + delta;
    
    // Zoom towards mouse position
    const mouseX = e.clientX - canvasRect.left;
    const mousePercent = mouseX / canvasRect.width;
    
    // Calculate what time the mouse is pointing at
    const visibleWidth = 1 / zoomLevel;
    const clampedPanOffset = Math.max(0, Math.min(panOffset, Math.max(0, 1 - visibleWidth)));
    const mouseTime = clampedPanOffset + mousePercent * visibleWidth;
    
    // Update zoom
    const oldZoom = zoomLevel;
    setZoom(newZoom);
    
    // Adjust pan to keep mouse position stable
    const newVisibleWidth = 1 / zoomLevel;
    panOffset = mouseTime - mousePercent * newVisibleWidth;
    panOffset = Math.max(0, Math.min(panOffset, Math.max(0, 1 - newVisibleWidth)));
    
    drawWaveform();
    renderPhonemeMarkers();
    updatePlayhead();
}, { passive: false });

// Mouse drag to pan - attach to both canvas and overlay
function handleMouseDown(e) {
    if (!audioBuffer || zoomLevel <= 1) return;
    
    // Check if mouse is over the waveform area
    const canvasRect = waveformCanvas.getBoundingClientRect();
    const mouseY = e.clientY;
    if (mouseY < canvasRect.top || mouseY > canvasRect.bottom) return;
    
    isPanning = true;
    hasDragged = false;
    panStartX = e.clientX;
    panStartOffset = panOffset;
    waveformCanvas.style.cursor = 'grabbing';
    e.preventDefault();
}

waveformCanvas.addEventListener('mousedown', handleMouseDown);
phonemeMarkersContainer.addEventListener('mousedown', handleMouseDown);

window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    
    const rect = waveformCanvas.getBoundingClientRect();
    const deltaX = e.clientX - panStartX;
    const deltaPercent = deltaX / rect.width;
    const visibleWidth = 1 / zoomLevel;
    
    // Mark as dragged if moved more than a few pixels
    if (Math.abs(deltaX) > 3) {
        hasDragged = true;
    }
    
    panOffset = panStartOffset - deltaPercent * visibleWidth;
    panOffset = Math.max(0, Math.min(panOffset, Math.max(0, 1 - visibleWidth)));
    
    drawWaveform();
    renderPhonemeMarkers();
    updatePlayhead();
});

window.addEventListener('mouseup', () => {
    if (isPanning) {
        isPanning = false;
        waveformCanvas.style.cursor = zoomLevel > 1 ? 'grab' : 'pointer';
        // Reset hasDragged after a short delay to prevent click event
        setTimeout(() => {
            hasDragged = false;
        }, 50);
    }
});

// Click on waveform to seek
waveformCanvas.addEventListener('click', (e) => {
    if (!audio || !audioBuffer || isPanning || hasDragged) return;
    
    const rect = waveformCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPercent = x / rect.width;
    
    // Calculate visible range
    const visibleWidth = 1 / zoomLevel;
    const maxPanOffset = Math.max(0, 1 - visibleWidth);
    const clampedPanOffset = Math.max(0, Math.min(panOffset, maxPanOffset));
    
    // Convert click position to time
    const visibleStartTime = clampedPanOffset * audioBuffer.duration;
    const visibleEndTime = (clampedPanOffset + visibleWidth) * audioBuffer.duration;
    const clickTime = visibleStartTime + clickPercent * (visibleEndTime - visibleStartTime);
    
    audio.currentTime = clickTime;
    updatePlayhead();
});

// Zoom reset button
document.getElementById('zoomReset').addEventListener('click', () => {
    zoomLevel = 1;
    panOffset = 0;
    setZoom(1);
});

// Keyboard shortcuts for zoom
window.addEventListener('keydown', (e) => {
    if (!audioBuffer) return;
    
    // + or = key to zoom in
    if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(zoomLevel + 0.5);
    }
    // - key to zoom out
    else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom(zoomLevel - 0.5);
    }
    // 0 key to reset zoom
    else if (e.key === '0') {
        e.preventDefault();
        zoomLevel = 1;
        panOffset = 0;
        setZoom(1);
    }
});

// Initialize
playButton.addEventListener('click', togglePlay);
audioSampleSelect.addEventListener('change', reloadData);

// Slider event listeners
transitionSpeedSlider.addEventListener('input', (e) => {
    transitionSpeed = parseInt(e.target.value);
    transitionSpeedValue.textContent = `${transitionSpeed}ms`;
});

anticipationTimeSlider.addEventListener('input', (e) => {
    anticipationTime = parseInt(e.target.value);
    anticipationTimeValue.textContent = `${anticipationTime}ms`;
    // Re-render phoneme markers with new anticipation offset
    renderPhonemeMarkers();
});

// Initialize on page load
async function initializePage() {
    updateMouthContainerBackground(); // Set initial background
    
    // Set initial mouth to neutral
    resetMouthToNeutral(tonguePath, upperTeethPath, lowerTeethPath, beakPath);
    daxSvg.style.display = 'block';
    
    // Start blinking animation
    startBlinking();
    
    // Initialize waveform
    initWaveformCanvas();
    
    // Load data
    await loadVisemeData();
    await loadAudioForWaveform();
}

// Handle window resize
window.addEventListener('resize', () => {
    initWaveformCanvas();
    drawWaveform();
});

initializePage();


