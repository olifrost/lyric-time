import { processLyrics } from './lyricProcessor.js';
import { WordTiming } from './wordTiming.js';

let lyrics = [];
let currentLine = 0;
let timings = [];
let isTimingActive = false;
let previousLyrics = null;
let wordTiming = null;

// Initialize word timing when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    wordTiming = new WordTiming();
    initializeTabs();
});

function initializeTabs() {
    const lineTimingTab = document.getElementById('lineTimingTab');
    const wordTimingTab = document.getElementById('wordTimingTab');
    const lineTimingMode = document.getElementById('lineTimingMode');
    const wordTimingMode = document.getElementById('wordTimingMode');
    const audioElement = document.getElementById('audio');
    const audioWordElement = document.getElementById('audioWord');

    lineTimingTab.addEventListener('click', () => {
        // Update tab appearance - Line timing active
        lineTimingTab.className = 'flex-1 py-3 px-6 text-sm font-medium text-white bg-blue-600 border-b-2 border-blue-600 rounded-tl-lg transition-all';
        wordTimingTab.className = 'flex-1 py-3 px-6 text-sm font-medium text-gray-600 bg-white border-b-2 border-transparent hover:bg-gray-50 rounded-tr-lg transition-all';

        // Switch content
        lineTimingMode.classList.remove('hidden');
        wordTimingMode.classList.add('hidden');

        // Manage audio elements - show line timing audio only when needed
        audioWordElement.classList.add('hidden');
        if (audioElement.src) {
            audioElement.classList.remove('hidden');
        }
    });

    wordTimingTab.addEventListener('click', () => {
        // Update tab appearance - Word timing active
        wordTimingTab.className = 'flex-1 py-3 px-6 text-sm font-medium text-white bg-blue-600 border-b-2 border-blue-600 rounded-tr-lg transition-all';
        lineTimingTab.className = 'flex-1 py-3 px-6 text-sm font-medium text-gray-600 bg-white border-b-2 border-transparent hover:bg-gray-50 rounded-tl-lg transition-all';

        // Switch content
        wordTimingMode.classList.remove('hidden');
        lineTimingMode.classList.add('hidden');

        // Manage audio elements - show word timing audio only when needed
        audioElement.classList.add('hidden');
        if (audioWordElement.src) {
            audioWordElement.classList.remove('hidden');
        }
    });
}

const audioElement = document.getElementById('audio');
const lyricsInput = document.getElementById('lyricsInput');
const lyricsDisplay = document.getElementById('lyricsDisplay');
const startBtn = document.getElementById('startBtn');
const downloadBtn = document.getElementById('downloadBtn');
const downloadFCPXMLBtn = document.getElementById('downloadFCPXMLBtn');
const lyricTidyBtn = document.getElementById('lyricTidyBtn');
const lyricTidyPanel = document.getElementById('lyricTidyPanel');
const audioFileInput = document.getElementById('audioFile');

let advancedSRTMode = false;
let audioBaseFilename = 'subtitles';

// Tooltip for timing keys
let timingTooltip = null;
function showTimingTooltip() {
    if (!timingTooltip) {
        timingTooltip = document.createElement('div');
        timingTooltip.id = 'timingTooltip';
        timingTooltip.style.position = 'fixed';
        timingTooltip.style.top = '70px';
        timingTooltip.style.left = '50%';
        timingTooltip.style.transform = 'translateX(-50%)';
        timingTooltip.style.background = 'rgba(30,30,30,0.92)';
        timingTooltip.style.color = '#fff';
        timingTooltip.style.padding = '6px 18px';
        timingTooltip.style.borderRadius = '6px';
        timingTooltip.style.fontSize = '0.95rem';
        timingTooltip.style.zIndex = 9999;
        timingTooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        timingTooltip.style.opacity = '0.92';
        timingTooltip.style.pointerEvents = 'none';
        document.body.appendChild(timingTooltip);
    }
    timingTooltip.textContent = 'Press Enter to time each lyric';
    timingTooltip.style.display = 'block';
}
function hideTimingTooltip() {
    if (timingTooltip) timingTooltip.style.display = 'none';
}

document.getElementById('audioFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Extract base filename (without extension)
        const name = file.name;
        const dotIdx = name.lastIndexOf('.');
        audioBaseFilename = dotIdx > 0 ? name.substring(0, dotIdx) : name;
        audioElement.src = URL.createObjectURL(file);
        startBtn.disabled = false;
    }
});

startBtn.addEventListener('click', () => {
    if (!audioElement.src) {
        alert('Please upload an audio track first');
        return;
    }
    if (isTimingActive) {
        // Reset functionality
        isTimingActive = false;
        currentLine = 0;
        timings = [];
        audioElement.pause();
        audioElement.currentTime = 0;
        startBtn.textContent = 'Start Timing';
        downloadBtn.disabled = true;
        downloadFCPXMLBtn.disabled = true;
        displayLyrics();
        hideTimingTooltip();
    } else {
        // Start timing functionality
        lyrics = lyricsInput.value.split('\n').filter(line => line.trim());
        if (lyrics.length === 0) return;
        isTimingActive = true;
        currentLine = 0;
        timings = [];
        displayLyrics();
        startBtn.textContent = 'Reset';
        audioElement.classList.remove('hidden');
        // Show first line as upcoming
        document.getElementById('line0').classList.add('next-line');
        showTimingTooltip();
    }
});

document.addEventListener('keydown', (e) => {
    // Handle spacebar to prevent scrolling and enable playback
    if (e.code === 'Space') {
        // Don't prevent default if user is typing in an input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        e.preventDefault();
        if (!isTimingActive && audioElement.src) {
            // Independent playback when not actively timing
            if (audioElement.paused) {
                audioElement.play();
            } else {
                audioElement.pause();
            }
            return;
        }
    }

    if ((e.code === 'Space' || e.code === 'Enter') && isTimingActive && !e.repeat) {
        e.preventDefault();
        if (currentLine < lyrics.length) {
            audioElement.play();
            timings[currentLine] = {
                start: audioElement.currentTime,
                text: lyrics[currentLine]
            };
            // Mark previous line as completed
            if (currentLine > 0) {
                const previousElement = document.getElementById(`line${currentLine - 1}`);
                previousElement.classList.remove('highlight');
                previousElement.classList.add('completed');
            }
            // Highlight current line
            const currentElement = document.getElementById(`line${currentLine}`);
            currentElement.classList.remove('next-line');
            currentElement.classList.add('highlight');
            // Smooth scroll by the height of one lyric line
            setTimeout(() => {
                const lyricLine = document.getElementById(`line${currentLine}`);
                if (lyricLine) {
                    lyricLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 0);
        }
    }
});

document.addEventListener('keyup', (e) => {
    if ((e.code === 'Space' || e.code === 'Enter') && isTimingActive) {
        e.preventDefault();
        if (currentLine < lyrics.length) {
            timings[currentLine].end = audioElement.currentTime;
            // Keep current line highlighted and show next line as upcoming
            if (currentLine + 1 < lyrics.length) {
                document.getElementById(`line${currentLine + 1}`).classList.add('next-line');
            }
            currentLine++;
            if (currentLine >= lyrics.length) {
                isTimingActive = false;
                downloadBtn.disabled = false;
                downloadFCPXMLBtn.disabled = false;
                audioElement.pause();
                hideTimingTooltip();
            }
        }
    }
});

downloadBtn.addEventListener('click', () => {
    const srtContent = generateSRT();
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${audioBaseFilename} Titles.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

downloadFCPXMLBtn.addEventListener('click', () => {
    try {
        const xmlContent = generateFCPXML(timings);
        const blob = new Blob([xmlContent], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${audioBaseFilename} Titles.fcpxml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Failed to generate FCP XML:', error);
        alert('Failed to generate FCP XML file');
    }
});

lyricTidyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('lyricTidyPanel').classList.remove('hidden');
});

// Settings button
document.getElementById('settingsBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('settingsPanel').classList.remove('hidden');
});

// Hide panels when clicking outside
document.addEventListener('click', (e) => {
    const lyricTidyPanel = document.getElementById('lyricTidyPanel');
    const settingsPanel = document.getElementById('settingsPanel');

    if (lyricTidyPanel && !lyricTidyPanel.querySelector('.bg-white').contains(e.target) && !lyricTidyBtn.contains(e.target)) {
        lyricTidyPanel.classList.add('hidden');
    }

    if (settingsPanel && !settingsPanel.querySelector('.bg-white').contains(e.target) && !document.getElementById('settingsBtn').contains(e.target)) {
        settingsPanel.classList.add('hidden');
    }
});

function displayLyrics() {
    lyricsDisplay.innerHTML = lyrics
        .map((line, i) => `<div id="line${i}" class="lyric-line">${line}</div>`)
        .join('');
}

// Remove the highlightCurrentLine function as it's no longer needed

function generateSRT() {
    const MIN_GAP = 0.25; // minimum gap in seconds

    // Create a copy of timings to modify
    let processedTimings = [...timings];

    // Process the timings to handle small gaps
    for (let i = 0; i < processedTimings.length - 1; i++) {
        const currentTiming = processedTimings[i];
        const nextTiming = processedTimings[i + 1];

        const gap = nextTiming.start - currentTiming.end;

        if (gap < MIN_GAP) {
            // Extend the current subtitle to the start of the next one
            currentTiming.end = nextTiming.start;
        }
    }

    return processedTimings
        .map((timing, index) => {
            const start = formatTime(timing.start);
            const end = formatTime(timing.end);
            return `${index + 1}\n${start} --> ${end}\n${timing.text}\n\n`;
        })
        .join('');
}

function formatTime(seconds) {
    const date = new Date(seconds * 1000);
    const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss},${ms}`;
}

processLyricsBtn.addEventListener('click', () => {
    // Save current state before processing
    previousLyrics = lyricsInput.value;

    const options = {
        removeHeaders: document.getElementById('removeHeaders').checked,
        removeMarkdown: document.getElementById('removeMarkdown').checked,
        removeExtraSpaces: document.getElementById('removeExtraSpaces').checked,
        removePunctuation: true,
        removePeriods: document.getElementById('removePeriods').checked,
        removeCommas: document.getElementById('removeCommas').checked,
        smartQuotes: document.getElementById('smartQuotes').checked,
        capitalizeLines: document.getElementById('capitalizeLines').checked,
        standardizeQuotes: document.getElementById('standardizeQuotes').checked,
        removeParentheses: document.getElementById('removeParentheses').checked,
        removeEmojis: document.getElementById('removeEmojis').checked,
        smartLineSplit: document.getElementById('smartLineSplit').checked,
        maxChars: parseInt(document.getElementById('maxChars').value),
        findReplace: true,
        find: document.getElementById('findText').value,
        replace: document.getElementById('replaceText').value
    };

    lyricsInput.value = processLyrics(lyricsInput.value, options);
    document.getElementById('undoBtn').disabled = false;
    lyricTidyPanel.classList.add('hidden');
});

// Add new event listener for undo button
document.getElementById('undoBtn').addEventListener('click', () => {
    if (previousLyrics !== null) {
        lyricsInput.value = previousLyrics;
        previousLyrics = null;
        document.getElementById('undoBtn').disabled = true;
    }
});

// Helper: Parse SRT file to timings and lyrics
function parseSRT(srtText) {
    const srtRegex = /\d+\s+([\d:,]+)\s+-->\s+([\d:,]+)\s+([\s\S]*?)(?=\n\d+\s|$)/g;
    let match;
    const timings = [];
    while ((match = srtRegex.exec(srtText)) !== null) {
        const start = srtTimeToSeconds(match[1]);
        const end = srtTimeToSeconds(match[2]);
        const text = match[3].trim().replace(/\n/g, ' ');
        timings.push({ start, end, text });
    }
    return timings;
}
function srtTimeToSeconds(time) {
    const [h, m, sMs] = time.split(':');
    const [s, ms] = sMs.split(',');
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
}

// Advanced SRT upload: Option/Alt+file select or drop
let lastAltKey = false;
document.addEventListener('keydown', (e) => { if (e.altKey) lastAltKey = true; });
document.addEventListener('keyup', (e) => { if (!e.altKey) lastAltKey = false; });

audioFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.srt')) {
        // Advanced SRT mode
        const reader = new FileReader();
        reader.onload = function (ev) {
            const srtText = ev.target.result;
            const srtTimings = parseSRT(srtText);
            if (srtTimings.length === 0) {
                alert('Invalid or empty SRT file.');
                return;
            }
            advancedSRTMode = true;
            timings = srtTimings;
            lyrics = srtTimings.map(t => t.text);
            lyricsInput.value = lyrics.join('\n');
            displayLyrics();
            startBtn.disabled = true;
            downloadBtn.disabled = false;
            downloadFCPXMLBtn.disabled = false;
            audioElement.classList.add('hidden');
            showToast('SRT loaded in advanced mode.');
        };
        reader.readAsText(file);
        // Reset file input so user can re-upload
        e.target.value = '';
        return;
    }
    // Audio file mode
    // Extract base filename (without extension)
    const name = file.name;
    const dotIdx = name.lastIndexOf('.');
    audioBaseFilename = dotIdx > 0 ? name.substring(0, dotIdx) : name;
    audioElement.src = URL.createObjectURL(file);
    startBtn.disabled = false;
});

// Drag-and-drop SRT support (no modifier key needed)
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});
document.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
        const file = e.dataTransfer.files[0];
        if (file.name.toLowerCase().endsWith('.srt')) {
            const reader = new FileReader();
            reader.onload = function (ev) {
                const srtText = ev.target.result;
                const srtTimings = parseSRT(srtText);
                if (srtTimings.length === 0) {
                    alert('Invalid or empty SRT file.');
                    return;
                }
                advancedSRTMode = true;
                timings = srtTimings;
                lyrics = srtTimings.map(t => t.text);
                lyricsInput.value = lyrics.join('\n');
                displayLyrics();
                startBtn.disabled = true;
                downloadBtn.disabled = false;
                downloadFCPXMLBtn.disabled = false;
                audioElement.classList.add('hidden');
                showToast('SRT loaded in advanced mode.');
            };
            reader.readAsText(file);
        }
    }
});

// Toast message for advanced mode
function showToast(msg) {
    let toast = document.getElementById('srtToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'srtToast';
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = 'rgba(30,30,30,0.95)';
        toast.style.color = '#fff';
        toast.style.padding = '10px 24px';
        toast.style.borderRadius = '8px';
        toast.style.fontSize = '1rem';
        toast.style.zIndex = 9999;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2500);
}
