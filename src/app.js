import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import { processLyrics } from './lyricProcessor.js';
import { generateFCPXML } from './fcpxml.js';

// Register Alpine plugins
Alpine.plugin(collapse);

// Make Alpine available globally
window.Alpine = Alpine;

// Main app component
Alpine.data('lyricApp', () => ({
    // State
    mode: 'line', // 'line' or 'word'
    lyrics: '',
    originalLyrics: null, // For undo functionality
    audioFile: null,
    audioSrc: '',
    audioBaseFilename: 'subtitles',

    // Timing state
    isActive: false,
    parsedLyrics: [], // Array of lines, each line is array of words for word mode
    currentLineIndex: 0,
    currentWordIndex: 0,
    timings: [],
    wordTimings: [],

    // UI state
    showLyricTidy: false,
    showSettings: false,
    showProgress: false,
    progressText: '',
    currentLineText: '',
    progressPercent: 0,

    // Settings
    highlightColor: '#3b82f6',
    fontFamily: 'Helvetica',
    charsPerLine: 20,
    fontSize: 60,
    fontColor: '#ffffff',

    // Lyric processing options
    lyricOptions: {
        removeHeaders: true,
        removeMarkdown: true,
        removeExtraSpaces: true,
        removePeriods: true,
        removeCommas: true,
        smartQuotes: true,
        capitalizeLines: false,
        standardizeQuotes: false,
        removeParentheses: false,
        removeEmojis: false,
        smartLineSplit: false,
        maxChars: 45,
        findText: '',
        replaceText: ''
    },

    // Computed properties
    get canStart() {
        return this.audioSrc && this.lyrics.trim();
    },

    get canDownload() {
        return this.timings.length > 0 || this.wordTimings.length > 0;
    },

    get totalWords() {
        if (this.mode === 'word' && this.parsedLyrics.length > 0) {
            return this.parsedLyrics.reduce((total, line) => total + line.length, 0);
        }
        return 0;
    },

    get completedWords() {
        return this.wordTimings.length;
    },

    // Initialize
    init() {
        this.setupAudio();
        this.setupKeyboardEvents();
        this.updateHighlightColor();

        // Auto-focus lyrics input
        this.$nextTick(() => {
            this.$refs.lyricsInput?.focus();
        });
    },

    // Mode switching
    switchMode(newMode) {
        if (this.isActive) {
            if (!confirm('This will stop the current timing session. Continue?')) {
                return;
            }
            this.resetTiming();
        }
        this.mode = newMode;
        this.clearDisplays();
    },

    // File handling
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Handle SRT files
        if (file.name.toLowerCase().endsWith('.srt')) {
            this.loadSRTFile(file);
            return;
        }

        // Handle audio files
        this.audioFile = file;
        const name = file.name;
        const dotIdx = name.lastIndexOf('.');
        this.audioBaseFilename = dotIdx > 0 ? name.substring(0, dotIdx) : name;
        this.audioSrc = URL.createObjectURL(file);
        this.$refs.audio.load();
    },

    loadSRTFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const srtText = e.target.result;
            const srtTimings = this.parseSRT(srtText);
            if (srtTimings.length === 0) {
                alert('Invalid or empty SRT file.');
                return;
            }

            this.timings = srtTimings;
            this.lyrics = srtTimings.map(t => t.text).join('\n');
            this.displayLyrics();
            this.showToast('SRT loaded successfully.');
        };
        reader.readAsText(file);
    },

    parseSRT(srtText) {
        const srtRegex = /\d+\s+([\d:,]+)\s+-->\s+([\d:,]+)\s+([\s\S]*?)(?=\n\d+\s|$)/g;
        let match;
        const timings = [];
        while ((match = srtRegex.exec(srtText)) !== null) {
            const start = this.srtTimeToSeconds(match[1]);
            const end = this.srtTimeToSeconds(match[2]);
            const text = match[3].trim().replace(/\n/g, ' ');
            timings.push({ start, end, text });
        }
        return timings;
    },

    srtTimeToSeconds(time) {
        const [h, m, sMs] = time.split(':');
        const [s, ms] = sMs.split(',');
        return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
    },

    // Audio setup
    setupAudio() {
        this.$nextTick(() => {
            const audio = this.$refs.audio;
            if (audio) {
                audio.addEventListener('play', () => this.updatePlayButton(false));
                audio.addEventListener('pause', () => this.updatePlayButton(true));
            }
        });
    },

    updatePlayButton(isPaused) {
        // This will be handled by Alpine's reactive system
    },

    // Keyboard events
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // Prevent spacebar scrolling when not in input
            if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.handleSpaceKey();
            }

            // Handle Enter for timing
            if (e.code === 'Enter' && this.isActive && !e.repeat) {
                e.preventDefault();
                this.markTiming();
            }
        });

        document.addEventListener('keyup', (e) => {
            if ((e.code === 'Space' || e.code === 'Enter') && this.isActive) {
                e.preventDefault();
                if (this.mode === 'line') {
                    this.finishLineTiming();
                }
            }
        });
    },

    handleSpaceKey() {
        const audio = this.$refs.audio;
        if (!audio) return;

        if (this.isActive) {
            // Toggle play/pause during timing
            if (audio.paused) {
                audio.play();
            } else {
                audio.pause();
            }
        } else if (this.audioSrc) {
            // Allow independent playback
            if (audio.paused) {
                audio.play();
            } else {
                audio.pause();
            }
        }
    },

    // Timing control
    startTiming() {
        if (!this.canStart) {
            alert('Please upload an audio file and enter lyrics first');
            return;
        }

        this.isActive = true;
        this.currentLineIndex = 0;
        this.currentWordIndex = 0;
        this.timings = [];
        this.wordTimings = [];

        this.parseLyrics();
        this.displayLyrics();
        this.highlightCurrent();

        if (this.mode === 'word') {
            this.showProgress = true;
            this.updateProgress();
        }

        this.showToast(`${this.mode === 'line' ? 'Press Enter to time each line' : 'Press Enter as each word starts'}`);
    },

    resetTiming() {
        this.isActive = false;
        this.currentLineIndex = 0;
        this.currentWordIndex = 0;
        this.timings = [];
        this.wordTimings = [];
        this.showProgress = false;

        const audio = this.$refs.audio;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }

        this.displayLyrics();
        this.hideToast();
    },

    parseLyrics() {
        const lines = this.lyrics.split('\n').filter(line => line.trim());

        if (this.mode === 'line') {
            this.parsedLyrics = lines.map(line => line.trim());
        } else {
            this.parsedLyrics = lines.map(line =>
                line.trim().split(/\s+/).filter(word => word)
            );
        }
    },

    markTiming() {
        const audio = this.$refs.audio;
        if (!audio || !this.isActive) return;

        if (this.mode === 'line') {
            this.markLineTiming(audio);
        } else {
            this.markWordTiming(audio);
        }
    },

    markLineTiming(audio) {
        if (this.currentLineIndex >= this.parsedLyrics.length) return;

        audio.play();
        this.timings[this.currentLineIndex] = {
            start: audio.currentTime,
            text: this.parsedLyrics[this.currentLineIndex]
        };

        this.highlightCurrent();
    },

    finishLineTiming() {
        if (this.mode !== 'line' || !this.isActive) return;

        const audio = this.$refs.audio;
        if (this.currentLineIndex < this.timings.length) {
            this.timings[this.currentLineIndex].end = audio.currentTime;
            this.currentLineIndex++;

            if (this.currentLineIndex >= this.parsedLyrics.length) {
                this.finishTiming();
            } else {
                this.highlightCurrent();
            }
        }
    },

    markWordTiming(audio) {
        if (this.currentLineIndex >= this.parsedLyrics.length) return;

        const currentLine = this.parsedLyrics[this.currentLineIndex];
        if (this.currentWordIndex >= currentLine.length) return;

        audio.play();

        this.wordTimings.push({
            lineIndex: this.currentLineIndex,
            wordIndex: this.currentWordIndex,
            word: currentLine[this.currentWordIndex],
            startTime: audio.currentTime
        });

        // Move to next word
        this.currentWordIndex++;
        if (this.currentWordIndex >= currentLine.length) {
            this.currentLineIndex++;
            this.currentWordIndex = 0;
        }

        if (this.currentLineIndex >= this.parsedLyrics.length) {
            this.finishTiming();
        } else {
            this.highlightCurrent();
            this.updateProgress();
        }
    },

    finishTiming() {
        this.isActive = false;
        const audio = this.$refs.audio;
        if (audio) audio.pause();

        this.showProgress = false;
        this.showToast('Timing complete! Download your files below.', 3000);

        // Scroll to download section
        this.$nextTick(() => {
            this.$refs.downloadSection?.scrollIntoView({ behavior: 'smooth' });
        });
    },

    // Display
    displayLyrics() {
        this.$nextTick(() => {
            const display = this.$refs.lyricsDisplay;
            if (!display || this.parsedLyrics.length === 0) {
                if (display) display.innerHTML = '';
                return;
            }

            if (this.mode === 'line') {
                display.innerHTML = this.parsedLyrics
                    .map((line, i) => `<div id="line${i}" class="lyric-line">${line}</div>`)
                    .join('');
            } else {
                display.innerHTML = this.parsedLyrics.map((line, lineIndex) => {
                    const wordsHtml = line.map((word, wordIndex) =>
                        `<span class="word" data-line="${lineIndex}" data-word="${wordIndex}">${word}</span>`
                    ).join(' ');
                    return `<div class="word-lyric-line" id="wordLine${lineIndex}">${wordsHtml}</div>`;
                }).join('');
            }
        });
    },

    clearDisplays() {
        this.$nextTick(() => {
            const display = this.$refs.lyricsDisplay;
            if (display) {
                display.innerHTML = '<div class="text-center text-gray-400 py-8"><p>Enter lyrics above to see them displayed here during timing</p></div>';
            }
        });
    },

    highlightCurrent() {
        this.$nextTick(() => {
            // Remove all highlights
            document.querySelectorAll('.lyric-line, .word-lyric-line, .word').forEach(el => {
                el.classList.remove('highlight', 'next-line', 'completed', 'current-word', 'completed-word', 'current');
            });

            if (this.mode === 'line') {
                this.highlightCurrentLine();
            } else {
                this.highlightCurrentWord();
            }
        });
    },

    highlightCurrentLine() {
        if (this.currentLineIndex >= this.parsedLyrics.length) return;

        // Mark completed lines
        for (let i = 0; i < this.currentLineIndex; i++) {
            const line = document.getElementById(`line${i}`);
            if (line) line.classList.add('completed');
        }

        // Highlight current line
        const currentLine = document.getElementById(`line${this.currentLineIndex}`);
        if (currentLine) {
            currentLine.classList.add('next-line');
            if (this.timings[this.currentLineIndex]?.start !== undefined) {
                currentLine.classList.remove('next-line');
                currentLine.classList.add('highlight');
            }
        }
    },

    highlightCurrentWord() {
        if (this.currentLineIndex >= this.parsedLyrics.length) return;

        // Mark completed lines
        for (let lineIndex = 0; lineIndex < this.currentLineIndex; lineIndex++) {
            const line = document.getElementById(`wordLine${lineIndex}`);
            if (line) line.classList.add('completed');

            const lineWords = document.querySelectorAll(`[data-line="${lineIndex}"]`);
            lineWords.forEach(word => word.classList.add('completed-word'));
        }

        // Highlight current line
        const currentLine = document.getElementById(`wordLine${this.currentLineIndex}`);
        if (currentLine) currentLine.classList.add('current');

        // Mark completed words in current line
        const currentLineWords = document.querySelectorAll(`[data-line="${this.currentLineIndex}"]`);
        currentLineWords.forEach((word, index) => {
            if (index < this.currentWordIndex) {
                word.classList.add('completed-word');
            }
        });

        // Highlight current word
        const currentWord = document.querySelector(`[data-line="${this.currentLineIndex}"][data-word="${this.currentWordIndex}"]`);
        if (currentWord) {
            currentWord.classList.add('current-word');
            currentWord.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },

    updateProgress() {
        if (this.mode !== 'word') return;

        const total = this.totalWords;
        const completed = this.completedWords;
        this.progressPercent = total > 0 ? (completed / total) * 100 : 0;
        this.progressText = `Progress: ${completed} / ${total} words`;
        this.currentLineText = `Line ${this.currentLineIndex + 1} of ${this.parsedLyrics.length}`;
    },

    // Audio controls
    togglePlayPause() {
        const audio = this.$refs.audio;
        if (!audio) return;

        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    },

    rewind() {
        const audio = this.$refs.audio;
        if (audio) {
            audio.currentTime = Math.max(0, audio.currentTime - 5);
        }
    },

    // Lyric processing
    processLyrics() {
        this.originalLyrics = this.lyrics;

        const options = {
            ...this.lyricOptions,
            removePunctuation: true,
            find: this.lyricOptions.findText,
            replace: this.lyricOptions.replaceText,
            findReplace: this.lyricOptions.findText.length > 0
        };

        this.lyrics = processLyrics(this.lyrics, options);
        this.showLyricTidy = false;
    },

    undoLyricProcessing() {
        if (this.originalLyrics !== null) {
            this.lyrics = this.originalLyrics;
            this.originalLyrics = null;
        }
    },

    // Settings
    updateHighlightColor() {
        document.documentElement.style.setProperty('--highlight-color', this.highlightColor);
    },

    // Download functions
    downloadSRT() {
        if (this.mode === 'line') {
            this.downloadLineSRT();
        } else {
            this.downloadWordSRT();
        }
    },

    downloadLineSRT() {
        const srtContent = this.generateLineSRT();
        this.downloadFile(srtContent, `${this.audioBaseFilename} Titles.srt`, 'text/plain');
    },

    downloadWordSRT() {
        const srtContent = this.generateWordSRT();
        this.downloadFile(srtContent, `${this.audioBaseFilename} Word-Timed.srt`, 'text/plain');
    },

    downloadFCPXML() {
        const xmlContent = generateFCPXML(this.timings, {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            fontColor: this.fontColor,
            charsPerLine: this.charsPerLine
        });
        this.downloadFile(xmlContent, `${this.audioBaseFilename} Titles.fcpxml`, 'text/xml');
    },

    downloadWebVTT() {
        const vttContent = this.generateWebVTT();
        this.downloadFile(vttContent, `${this.audioBaseFilename} Word-Timed.vtt`, 'text/vtt');
    },

    downloadITT() {
        const ittContent = this.generateITT();
        this.downloadFile(ittContent, `${this.audioBaseFilename} Word-Timed.itt`, 'text/plain');
    },

    downloadASS() {
        const assContent = this.generateASS();
        this.downloadFile(assContent, `${this.audioBaseFilename} Word-Timed.ass`, 'text/plain');
    },

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Format generation methods
    generateLineSRT() {
        const MIN_GAP = 0.25;
        let processedTimings = [...this.timings];

        // Process timings to handle small gaps
        for (let i = 0; i < processedTimings.length - 1; i++) {
            const currentTiming = processedTimings[i];
            const nextTiming = processedTimings[i + 1];
            const gap = nextTiming.start - currentTiming.end;

            if (gap < MIN_GAP) {
                currentTiming.end = nextTiming.start;
            }
        }

        return processedTimings
            .map((timing, index) => {
                const start = this.formatTime(timing.start);
                const end = this.formatTime(timing.end);
                return `${index + 1}\n${start} --> ${end}\n${timing.text}\n\n`;
            })
            .join('');
    },

    generateWordSRT() {
        if (this.wordTimings.length === 0) return '';

        // Group by line
        const lineGroups = {};
        this.wordTimings.forEach(timing => {
            if (!lineGroups[timing.lineIndex]) {
                lineGroups[timing.lineIndex] = [];
            }
            lineGroups[timing.lineIndex].push(timing);
        });

        let srt = '';
        let subtitleIndex = 1;

        Object.keys(lineGroups).forEach(lineIndexStr => {
            const lineIndex = parseInt(lineIndexStr);
            const lineTimings = lineGroups[lineIndex];
            const line = this.parsedLyrics[lineIndex];

            const startTime = lineTimings[0].startTime;
            const endTime = lineTimings[lineTimings.length - 1].startTime + 2.0;

            srt += `${subtitleIndex}\n`;
            srt += `${this.formatTime(startTime)} --> ${this.formatTime(endTime)}\n`;
            srt += `${line.join(' ')}\n\n`;

            subtitleIndex++;
        });

        return srt;
    },

    generateWebVTT() {
        if (this.wordTimings.length === 0) return '';

        let vtt = 'WEBVTT\n\n';
        vtt += 'STYLE\n';
        vtt += '::cue(.highlight) {\n';
        vtt += `  background-color: ${this.highlightColor};\n`;
        vtt += '  color: white;\n';
        vtt += '  font-weight: bold;\n';
        vtt += '}\n\n';

        // Group by line and create progressive highlighting
        const lineGroups = {};
        this.wordTimings.forEach(timing => {
            if (!lineGroups[timing.lineIndex]) {
                lineGroups[timing.lineIndex] = [];
            }
            lineGroups[timing.lineIndex].push(timing);
        });

        let subtitleIndex = 1;
        Object.keys(lineGroups).forEach(lineIndexStr => {
            const lineIndex = parseInt(lineIndexStr);
            const lineTimings = lineGroups[lineIndex];
            const line = this.parsedLyrics[lineIndex];

            for (let wordIndex = 0; wordIndex < lineTimings.length; wordIndex++) {
                const startTime = lineTimings[wordIndex].startTime;
                const endTime = wordIndex < lineTimings.length - 1 ?
                    lineTimings[wordIndex + 1].startTime : startTime + 2.0;

                const formattedLine = line.map((word, idx) => {
                    if (idx === wordIndex) {
                        return `<c.highlight>${word}</c>`;
                    }
                    return word;
                }).join(' ');

                vtt += `${subtitleIndex}\n`;
                vtt += `${this.formatTimeWebVTT(startTime)} --> ${this.formatTimeWebVTT(endTime)}\n`;
                vtt += `${formattedLine}\n\n`;
                subtitleIndex++;
            }
        });

        return vtt;
    },

    generateITT() {
        if (this.wordTimings.length === 0) return '';

        const highlightColor = this.highlightColor;
        // Convert hex to rgba format for Caption Burner
        const hex = highlightColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const rgbaColor = `rgba(${r},${g},${b},255)`;

        let itt = '<?xml version="1.0" encoding="UTF-8"?>';
        itt += '<tt xmlns:tt_extension="http://www.w3.org/ns/ttml/extension/" xml:lang="en" xmlns:ttp="http://www.w3.org/ns/ttml#parameter" xmlns:ittp="http://www.w3.org/ns/ttml/profile/imsc1#parameter" xmlns:tt_feature="http://www.w3.org/ns/ttml/feature/" xmlns:ttm="http://www.w3.org/ns/ttml#metadata" xmlns:tts="http://www.w3.org/ns/ttml#styling" xmlns:tt_profile="http://www.w3.org/ns/ttml/profile/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ttp:frameRateMultiplier="1 1" xmlns:tt="http://www.w3.org/ns/ttml" ttp:frameRate="25" ttp:dropMode="nonDrop" xmlns:ebutts="urn:ebu:tt:style" ttp:timeBase="smpte" xmlns:itts="http://www.w3.org/ns/ttml/profile/imsc1#styling" xmlns:vt="http://namespace.itunes.apple.com/itt/ttml-extension#vertical" xmlns="http://www.w3.org/ns/ttml" xmlns:ry="http://namespace.itunes.apple.com/itt/ttml-extension#ruby">';

        itt += '<head>';
        itt += '<styling>';
        itt += '<style tts:color="white" tts:fontFamily="sansSerif" tts:fontSize="100%" tts:fontStyle="normal" tts:fontWeight="normal" xml:id="normal"/>';
        itt += '</styling>';
        itt += '<layout>';
        itt += '<region tts:displayAlign="before" tts:extent="100% 15%" tts:origin="0% 0%" tts:textAlign="center" xml:id="top"/>';
        itt += '<region tts:displayAlign="after" tts:extent="100% 15%" tts:origin="0% 85%" tts:textAlign="center" xml:id="bottom"/>';
        itt += '</layout>';
        itt += '</head>';

        itt += '<body tts:color="white" style="normal" region="bottom">';
        itt += '<div begin="00:00:00:00">';

        // Group timings by line
        const lineGroups = {};
        this.wordTimings.forEach(timing => {
            if (!lineGroups[timing.lineIndex]) {
                lineGroups[timing.lineIndex] = [];
            }
            lineGroups[timing.lineIndex].push(timing);
        });

        Object.keys(lineGroups).forEach(lineIndexStr => {
            const lineIndex = parseInt(lineIndexStr);
            const lineTimings = lineGroups[lineIndex];
            const line = this.parsedLyrics[lineIndex];

            // Create subtitle entries for progressive highlighting
            for (let wordIndex = 0; wordIndex < lineTimings.length; wordIndex++) {
                const startTime = lineTimings[wordIndex].startTime;
                const endTime = this.calculateEndTime(lineIndex, wordIndex, lineGroups, lineTimings);

                // Build the line with current word highlighted using Caption Burner format
                const formattedLine = line.map((word, idx) => {
                    if (idx === wordIndex) {
                        return `<span tts:fontWeight="bold" tts:color="${rgbaColor}">${word}</span>`;
                    } else {
                        return word;
                    }
                }).join(' ');

                itt += `<p begin="${this.formatTimeITT(startTime)}" end="${this.formatTimeITT(endTime)}">${formattedLine}</p>`;
            }
        });

        itt += '</div>';
        itt += '</body>';
        itt += '</tt>';

        return itt;
    },

    generateASS() {
        if (this.wordTimings.length === 0) return '';

        const highlightColor = this.highlightColor;
        // Convert hex to BGR for ASS format
        const hex = highlightColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const bgrColor = ((b << 16) | (g << 8) | r).toString(16).padStart(6, '0');

        let ass = '[Script Info]\n';
        ass += 'Title: Word-Timed Subtitles\n';
        ass += 'ScriptType: v4.00+\n\n';

        ass += '[V4+ Styles]\n';
        ass += 'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n';
        ass += 'Style: Default,Arial,20,&Hffffff,&Hffffff,&H0,&H0,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n';
        ass += `Style: Highlight,Arial,20,&H${bgrColor},&H${bgrColor},&H0,&H0,1,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n\n`;

        ass += '[Events]\n';
        ass += 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';

        // Group timings by line
        const lineGroups = {};
        this.wordTimings.forEach(timing => {
            if (!lineGroups[timing.lineIndex]) {
                lineGroups[timing.lineIndex] = [];
            }
            lineGroups[timing.lineIndex].push(timing);
        });

        Object.keys(lineGroups).forEach(lineIndexStr => {
            const lineIndex = parseInt(lineIndexStr);
            const lineTimings = lineGroups[lineIndex];
            const line = this.parsedLyrics[lineIndex];

            // Create subtitle entries for progressive highlighting
            for (let wordIndex = 0; wordIndex < lineTimings.length; wordIndex++) {
                const startTime = lineTimings[wordIndex].startTime;
                const endTime = this.calculateEndTime(lineIndex, wordIndex, lineGroups, lineTimings);

                // Build the line with current word highlighted using ASS tags
                const formattedLine = line.map((word, idx) => {
                    if (idx === wordIndex) {
                        return `{\\c&H${bgrColor}&\\b1}${word}{\\c&Hffffff&\\b0}`;
                    } else {
                        return word;
                    }
                }).join(' ');

                ass += `Dialogue: 0,${this.formatTimeASS(startTime)},${this.formatTimeASS(endTime)},Default,,0,0,0,,${formattedLine}\n`;
            }
        });

        return ass;
    },

    // Utility function to calculate proper end times without overlaps
    calculateEndTime(lineIndex, wordIndex, lineGroups, lineTimings) {
        if (wordIndex < lineTimings.length - 1) {
            // End just before the next word starts
            return lineTimings[wordIndex + 1].startTime - 0.01;
        } else {
            // Last word of the line - check if there's a next line
            const nextLineIndex = lineIndex + 1;
            const nextLineTimings = lineGroups[nextLineIndex.toString()];
            if (nextLineTimings && nextLineTimings[0]) {
                // End just before the first word of next line
                return nextLineTimings[0].startTime - 0.01;
            } else {
                // Very last word - add reasonable duration
                return lineTimings[wordIndex].startTime + 1.5;
            }
        }
    },

    formatTimeITT(seconds) {
        // Caption Burner uses SMPTE timecode format: HH:MM:SS:FF (frames)
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const frames = Math.floor((seconds - totalSeconds) * 25); // 25fps

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
    },

    formatTimeASS(seconds) {
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const centiseconds = Math.floor((seconds - totalSeconds) * 100);

        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    },

    formatTime(seconds) {
        const date = new Date(seconds * 1000);
        const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        const ms = String(date.getMilliseconds()).padStart(3, '0');
        return `${hh}:${mm}:${ss},${ms}`;
    },

    formatTimeWebVTT(seconds) {
        const date = new Date(seconds * 1000);
        const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        const ms = String(date.getMilliseconds()).padStart(3, '0');
        return `${hh}:${mm}:${ss}.${ms}`;
    },

    // Toast notifications
    showToast(message, duration = null) {
        // Implementation for toast notifications
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.display = 'block';

        if (duration) {
            setTimeout(() => this.hideToast(), duration);
        }
    },

    hideToast() {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.style.display = 'none';
        }
    }
}));

// Start Alpine
Alpine.start();
