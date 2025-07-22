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
        this.downloadITTBtn = document.getElementById('downloadWordBtn');
        this.downloadSRTBtn = document.getElementById('downloadWordSRTBtn');
        this.audioFileInput = document.getElementById('audioFileWord');
        this.highlightColorInput = document.getElementById('highlightColor');
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // File upload
        this.audioFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.audioElement.src = URL.createObjectURL(file);
                this.startBtn.disabled = false;
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
        this.downloadITTBtn.addEventListener('click', () => {
            this.downloadITT();
        });
        
        this.downloadSRTBtn.addEventListener('click', () => {
            this.downloadSRT();
        });
        
        // Keyboard events for word timing
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Enter' && this.isActive && !e.repeat) {
                e.preventDefault();
                this.markWordTiming();
            }
        });
        
        // Update CSS variable when color changes
        this.highlightColorInput.addEventListener('change', (e) => {
            document.documentElement.style.setProperty('--highlight-color', e.target.value);
        });
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
        
        this.currentLineIndex = 0;
        this.currentWordIndex = 0;
        this.wordTimings = [];
        this.isActive = true;
        
        this.displayLyrics();
        this.highlightCurrentWord();
        
        this.startBtn.textContent = 'Reset';
        this.audioElement.style.display = 'block';
        
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
        this.downloadITTBtn.disabled = true;
        this.downloadSRTBtn.disabled = true;
        
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
    }
    
    finishTiming() {
        this.isActive = false;
        this.audioElement.pause();
        
        this.downloadITTBtn.disabled = false;
        this.downloadSRTBtn.disabled = false;
        
        this.hideTooltip();
        this.showTooltip('Word timing complete! Download your files.', 3000);
    }
    
    generateITT() {
        if (this.wordTimings.length === 0) {
            return '';
        }
        
        const highlightColor = this.highlightColorInput.value;
        let itt = '';
        
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
            
            // Create multiple subtitle entries for progressive highlighting
            for (let wordIndex = 0; wordIndex < lineTimings.length; wordIndex++) {
                const startTime = lineTimings[wordIndex].startTime;
                const endTime = wordIndex < lineTimings.length - 1 ? 
                    lineTimings[wordIndex + 1].startTime : 
                    startTime + 2.0; // Default 2 second duration for last word
                
                // Build the line with current word highlighted
                const formattedLine = line.map((word, idx) => {
                    if (idx === wordIndex) {
                        return `<font color="${highlightColor}">${word}</font>`;
                    } else if (idx < wordIndex) {
                        return word; // Previous words shown normally
                    } else {
                        return word; // Future words shown normally
                    }
                }).join(' ');
                
                itt += `${subtitleIndex}\n`;
                itt += `${this.formatTime(startTime)} --> ${this.formatTime(endTime)}\n`;
                itt += `${formattedLine}\n\n`;
                
                subtitleIndex++;
            }
        });
        
        return itt;
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
            srt += `${this.formatTime(startTime)} --> ${this.formatTime(endTime)}\n`;
            srt += `${line.join(' ')}\n\n`;
            
            subtitleIndex++;
        });
        
        return srt;
    }
    
    formatTime(seconds) {
        const date = new Date(seconds * 1000);
        const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        const ms = String(date.getMilliseconds()).padStart(3, '0');
        return `${hh}:${mm}:${ss},${ms}`;
    }
    
    downloadITT() {
        const ittContent = this.generateITT();
        this.downloadFile(ittContent, 'word-timed-subtitles.itt', 'text/plain');
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
