# Lyric Timing Studio

A web application for creating timed subtitles from song lyrics. Generate subtitle files with timing for videos, karaoke, or accessibility.

## Features

### Timing Modes
- **Line Timing**: Time entire lyric lines for SRT subtitles
- **Word Timing**: Time individual words for highlighting and subtitle formats

### Export Formats
- **SRT**: Subtitle format for video players
- **WebVTT**: Web-compatible subtitles
- **ITT**: Format for Caption Burner
- **ASS**: SubStation Alpha format
- **FCPXML**: Final Cut Pro titles

### Lyric Processing
- Remove formatting, punctuation, and unwanted elements
- Line splitting for subtitle length
- Find and replace
- Preserve or modify capitalization and quotes

### Interface
- Works on desktop and mobile
- Progress tracking for word timing
- Custom highlight colors for word effects
- Audio playback controls

## How to Use

1. **Upload Audio**: Select an audio file or drag and drop an SRT file to import timings
2. **Enter Lyrics**: Paste lyrics and optionally process them
3. **Choose Mode**: Select line timing or word timing
4. **Time Your Lyrics**: Follow instructions to time content
5. **Download**: Export subtitles in a selected format

## Tech Stack

- **Vite** - Build tool and development server
- **Alpine.js** - UI framework
- **Tailwind CSS** - CSS framework
- **Modular JavaScript** - Code architecture

## Future Features

- Undo/redo for timing
- Batch processing
