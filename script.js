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
        'v5': { dir: 'audio-sample-v5', file: 'audio-sample-v5', ext: 'mp3' }
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
        updateMouthShapes(audio.currentTime);
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


