// Word-by-word timing functionality
export class WordTiming {
    constructor() {
        this.lyrics = [];
        this.currentLineIndex = 0;
        this.currentWordIndex = 0;
        this.wordTimings = [];
        this.isActive = false;
        this.audioElement = document.getElementById('audioWord');
        this.lyricsInput = document.getElementById('lyricsInputWord');
        this.lyricsDisplay = document.getElementById('wordLyricsDisplay');
        this.startBtn = document.getElementById('startWordBtn');
        this.downloadVTTBtn = document.getElementById('downloadWordVTT');
        this.downloadITTBtn = document.getElementById('downloadWordITT');
        this.downloadASSBtn = document.getElementById('downloadWordASS');
        this.downloadSRTBtn = document.getElementById('downloadWordSRT');
        this.downloadSection = document.getElementById('wordDownloadButtons');
        this.audioFileInput = document.getElementById('audioFileWord');
        this.highlightColorInput = document.getElementById('highlightColor');
        this.progressElement = document.getElementById('timingProgress');
        this.progressText = document.getElementById('progressText');
        this.currentLineText = document.getElementById('currentLineText');
        this.progressFill = document.getElementById('progressFill');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.rewindBtn = document.getElementById('rewindBtn');

        this.totalWords = 0;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File upload
        this.audioFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.audioElement.src = URL.createObjectURL(file);
                this.startBtn.disabled = false;
                this.playPauseBtn.disabled = false;
                this.rewindBtn.disabled = false;
            }
        });

        // Start/Reset button
        this.startBtn.addEventListener('click', () => {
            if (this.isActive) {
                this.resetTiming();
            } else {
                this.startTiming();
            }
        });

        // Download buttons
        this.downloadVTTBtn.addEventListener('click', () => {
            this.downloadWebVTT();
        });

        this.downloadITTBtn.addEventListener('click', () => {
            this.downloadITT();
        });

        this.downloadASSBtn.addEventListener('click', () => {
            this.downloadASS();
        });

        this.downloadSRTBtn.addEventListener('click', () => {
            this.downloadSRT();
        });

        // Keyboard events for word timing
        document.addEventListener('keydown', (e) => {
            // Prevent spacebar from scrolling the page
            if (e.code === 'Space') {
                // Don't prevent default if user is typing in an input/textarea
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                
                e.preventDefault();
                if (this.isActive) {
                    // Toggle play/pause during active word timing
                    this.togglePlayPause();
                } else if (this.audioElement.src) {
                    // Allow independent playback even when not actively timing
                    this.togglePlayPause();
                }
            }

            if (e.code === 'Enter' && this.isActive && !e.repeat) {
                e.preventDefault();
                this.markWordTiming();
            }
        });

        // Update CSS variable when color changes
        this.highlightColorInput.addEventListener('change', (e) => {
            document.documentElement.style.setProperty('--highlight-color', e.target.value);
        });

        // Playback controls
        this.playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        this.rewindBtn.addEventListener('click', () => {
            this.audioElement.currentTime = Math.max(0, this.audioElement.currentTime - 5);
        });

        // Update play/pause button when audio state changes
        this.audioElement.addEventListener('play', () => {
            this.updatePlayPauseButton(false);
        });

        this.audioElement.addEventListener('pause', () => {
            this.updatePlayPauseButton(true);
        });
    }

    togglePlayPause() {
        if (this.audioElement.paused) {
            this.audioElement.play();
        } else {
            this.audioElement.pause();
        }
    }

    updatePlayPauseButton(isPaused) {
        const icon = this.playPauseBtn.querySelector('svg path');
        const textNodes = Array.from(this.playPauseBtn.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);

        if (isPaused) {
            icon.setAttribute('d', 'M8 5v14l11-7z');
            if (textNodes.length > 0) {
                textNodes[textNodes.length - 1].textContent = 'Play';
            }
        } else {
            icon.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
            if (textNodes.length > 0) {
                textNodes[textNodes.length - 1].textContent = 'Pause';
            }
        }
    }

    startTiming() {
        const lyricsText = this.lyricsInput.value.trim();
        if (!lyricsText) {
            alert('Please enter lyrics first');
            return;
        }

        if (!this.audioElement.src) {
            alert('Please upload an audio file first');
            return;
        }

        this.lyrics = lyricsText.split('\n').filter(line => line.trim()).map(line => {
            return line.trim().split(/\s+/).filter(word => word);
        });

        this.totalWords = this.lyrics.reduce((total, line) => total + line.length, 0);

        this.currentLineIndex = 0;
        this.currentWordIndex = 0;
        this.wordTimings = [];
        this.isActive = true;

        this.displayLyrics();
        this.highlightCurrentWord();
        this.updateProgress();

        this.startBtn.textContent = 'Reset';
        this.audioElement.style.display = 'block';
        this.progressElement.classList.remove('hidden');

        // Show timing tooltip
        this.showTooltip('Press Enter as each word starts');
    }

    resetTiming() {
        this.isActive = false;
        this.currentLineIndex = 0;
        this.currentWordIndex = 0;
        this.wordTimings = [];

        this.audioElement.pause();
        this.audioElement.currentTime = 0;

        this.startBtn.textContent = 'Start Word Timing';
        this.downloadSection.classList.add('hidden');
        this.progressElement.classList.add('hidden');

        this.displayLyrics();
        this.hideTooltip();
    }

    displayLyrics() {
        if (this.lyrics.length === 0) {
            this.lyricsDisplay.innerHTML = '';
            return;
        }

        this.lyricsDisplay.innerHTML = this.lyrics.map((line, lineIndex) => {
            const wordsHtml = line.map((word, wordIndex) =>
                `<span class="word" data-line="${lineIndex}" data-word="${wordIndex}">${word}</span>`
            ).join(' ');

            return `<div class="word-lyric-line" id="wordLine${lineIndex}">${wordsHtml}</div>`;
        }).join('');
    }

    highlightCurrentWord() {
        // Remove all previous highlights
        document.querySelectorAll('.word').forEach(word => {
            word.classList.remove('current-word', 'completed-word');
        });

        // Remove line highlights
        document.querySelectorAll('.word-lyric-line').forEach(line => {
            line.classList.remove('current', 'completed');
        });

        if (this.currentLineIndex >= this.lyrics.length) {
            return;
        }

        // Highlight current line
        const currentLine = document.getElementById(`wordLine${this.currentLineIndex}`);
        if (currentLine) {
            currentLine.classList.add('current');
        }

        // Mark completed lines
        for (let i = 0; i < this.currentLineIndex; i++) {
            const line = document.getElementById(`wordLine${i}`);
            if (line) {
                line.classList.add('completed');
            }
        }

        // Highlight current word
        const currentWord = document.querySelector(`[data-line="${this.currentLineIndex}"][data-word="${this.currentWordIndex}"]`);
        if (currentWord) {
            currentWord.classList.add('current-word');

            // Scroll to current word
            currentWord.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }

        // Mark completed words in current line
        const currentLineWords = document.querySelectorAll(`[data-line="${this.currentLineIndex}"]`);
        currentLineWords.forEach((word, index) => {
            if (index < this.currentWordIndex) {
                word.classList.add('completed-word');
            }
        });

        // Mark all words in completed lines
        for (let lineIndex = 0; lineIndex < this.currentLineIndex; lineIndex++) {
            const lineWords = document.querySelectorAll(`[data-line="${lineIndex}"]`);
            lineWords.forEach(word => {
                word.classList.add('completed-word');
            });
        }
    }

    markWordTiming() {
        if (this.currentLineIndex >= this.lyrics.length) {
            return;
        }

        const currentLine = this.lyrics[this.currentLineIndex];
        if (this.currentWordIndex >= currentLine.length) {
            return;
        }

        this.audioElement.play();

        const timing = {
            lineIndex: this.currentLineIndex,
            wordIndex: this.currentWordIndex,
            word: currentLine[this.currentWordIndex],
            startTime: this.audioElement.currentTime
        };

        this.wordTimings.push(timing);

        // Move to next word
        this.currentWordIndex++;

        // Check if we've reached the end of the current line
        if (this.currentWordIndex >= currentLine.length) {
            this.currentLineIndex++;
            this.currentWordIndex = 0;
        }

        // Check if we've finished all lyrics
        if (this.currentLineIndex >= this.lyrics.length) {
            this.finishTiming();
            return;
        }

        this.highlightCurrentWord();
        this.updateProgress();
    }

    updateProgress() {
        const totalWords = this.totalWords;
        const completedWords = this.wordTimings.length;
        const progressPercent = totalWords > 0 ? (completedWords / totalWords) * 100 : 0;

        this.progressText.textContent = `Progress: ${completedWords} / ${totalWords} words`;
        this.currentLineText.textContent = `Line ${this.currentLineIndex + 1} of ${this.lyrics.length}`;
        this.progressFill.style.width = `${progressPercent}%`;
    }

    finishTiming() {
        this.isActive = false;
        this.audioElement.pause();

        // Show download section
        this.downloadSection.classList.remove('hidden');

        this.hideTooltip();
        this.showTooltip('Word timing complete! Download your files below.', 3000);

        // Scroll to download section
        this.downloadSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    generateITT() {
        if (this.wordTimings.length === 0) {
            return '';
        }

        const highlightColor = this.highlightColorInput.value;
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
        itt += '<region tts:extent="15% 100%" tts:origin="85% 0%" tts:textAlign="start" tts:writingMode="tbrl" xml:id="right"/>';
        itt += '<region tts:extent="15% 100%" tts:origin="15% 0%" tts:textAlign="start" tts:writingMode="tbrl" xml:id="left"/>';
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
            const line = this.lyrics[lineIndex];

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
    }

    formatTimeITT(seconds) {
        // Caption Burner uses SMPTE timecode format: HH:MM:SS:FF (frames)
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const frames = Math.floor((seconds - totalSeconds) * 25); // 25fps

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
    }

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
    }

    generateSRT() {
        if (this.wordTimings.length === 0) {
            return '';
        }

        // Group timings by line and create single subtitles per line
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
            const line = this.lyrics[lineIndex];

            const startTime = lineTimings[0].startTime;
            const endTime = lineTimings[lineTimings.length - 1].startTime + 2.0; // Add 2 seconds to last word

            srt += `${subtitleIndex}\n`;
            srt += `${this.formatTimeSRT(startTime)} --> ${this.formatTimeSRT(endTime)}\n`;
            srt += `${line.join(' ')}\n\n`;

            subtitleIndex++;
        });

        return srt;
    }

    formatTimeSRT(seconds) {
        const date = new Date(seconds * 1000);
        const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        const ms = String(date.getMilliseconds()).padStart(3, '0');
        return `${hh}:${mm}:${ss},${ms}`;
    }

    generateWebVTT() {
        if (this.wordTimings.length === 0) {
            return '';
        }

        const highlightColor = this.highlightColorInput.value;
        let vtt = 'WEBVTT\n\n';

        // Add styles
        vtt += 'STYLE\n';
        vtt += '::cue(.highlight) {\n';
        vtt += `  background-color: ${highlightColor};\n`;
        vtt += '  color: white;\n';
        vtt += '  font-weight: bold;\n';
        vtt += '}\n\n';

        // Group timings by line
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
            const line = this.lyrics[lineIndex];

            // Create subtitle entries for progressive highlighting
            for (let wordIndex = 0; wordIndex < lineTimings.length; wordIndex++) {
                const startTime = lineTimings[wordIndex].startTime;
                const endTime = wordIndex < lineTimings.length - 1 ?
                    lineTimings[wordIndex + 1].startTime :
                    startTime + 2.0;

                // Build the line with current word highlighted
                const formattedLine = line.map((word, idx) => {
                    if (idx === wordIndex) {
                        return `<c.highlight>${word}</c>`;
                    } else {
                        return word;
                    }
                }).join(' ');

                vtt += `${subtitleIndex}\n`;
                vtt += `${this.formatTimeWebVTT(startTime)} --> ${this.formatTimeWebVTT(endTime)}\n`;
                vtt += `${formattedLine}\n\n`;

                subtitleIndex++;
            }
        });

        return vtt;
    }

    generateASS() {
        if (this.wordTimings.length === 0) {
            return '';
        }

        const highlightColor = this.highlightColorInput.value;
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
            const line = this.lyrics[lineIndex];

            // Create subtitle entries for progressive highlighting
            for (let wordIndex = 0; wordIndex < lineTimings.length; wordIndex++) {
                const startTime = lineTimings[wordIndex].startTime;
                const endTime = wordIndex < lineTimings.length - 1 ?
                    lineTimings[wordIndex + 1].startTime :
                    startTime + 2.0;

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
    }

    formatTimeASS(seconds) {
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const centiseconds = Math.floor((seconds - totalSeconds) * 100);

        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    }

    formatTimeWebVTT(seconds) {
        const date = new Date(seconds * 1000);
        const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        const ms = String(date.getMilliseconds()).padStart(3, '0');
        return `${hh}:${mm}:${ss}.${ms}`;
    }

    downloadWebVTT() {
        const vttContent = this.generateWebVTT();
        this.downloadFile(vttContent, 'word-timed-subtitles.vtt', 'text/vtt');
    }

    downloadITT() {
        const ittContent = this.generateITT();
        this.downloadFile(ittContent, 'word-timed-subtitles.itt', 'text/plain');
    }

    downloadASS() {
        const assContent = this.generateASS();
        this.downloadFile(assContent, 'word-timed-subtitles.ass', 'text/plain');
    }

    downloadSRT() {
        const srtContent = this.generateSRT();
        this.downloadFile(srtContent, 'word-timed-subtitles.srt', 'text/plain');
    }

    downloadSRT() {
        const srtContent = this.generateSRT();
        this.downloadFile(srtContent, 'word-timed-subtitles.srt', 'text/plain');
    }

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
    }

    showTooltip(message, duration = null) {
        let tooltip = document.getElementById('wordTimingTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'wordTimingTooltip';
            tooltip.style.position = 'fixed';
            tooltip.style.top = '70px';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.background = 'rgba(30,30,30,0.92)';
            tooltip.style.color = '#fff';
            tooltip.style.padding = '6px 18px';
            tooltip.style.borderRadius = '6px';
            tooltip.style.fontSize = '0.95rem';
            tooltip.style.zIndex = '9999';
            tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            tooltip.style.opacity = '0.92';
            tooltip.style.pointerEvents = 'none';
            document.body.appendChild(tooltip);
        }

        tooltip.textContent = message;
        tooltip.style.display = 'block';

        if (duration) {
            setTimeout(() => {
                this.hideTooltip();
            }, duration);
        }
    }

    hideTooltip() {
        const tooltip = document.getElementById('wordTimingTooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }
}
