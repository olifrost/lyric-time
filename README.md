# Lyric Timing Studio

A web application for creating timed subtitles from song lyrics. Generate professional subtitle files with precise timing for videos, karaoke, or accessibility purposes.

## Features

### Two Timing Modes
- **Line Timing**: Time entire lyric lines for standard SRT subtitles
- **Word Timing**: Time individual words for highlighting effects and advanced subtitle formats

### Export Formats
- **SRT**: Standard subtitle format for video players
- **WebVTT**: Web-compatible subtitles with styling support
- **ITT**: Advanced format for Caption Burner and professional workflows
- **ASS**: Advanced SubStation Alpha format with rich styling
- **FCPXML**: Final Cut Pro titles with customizable typography

### Smart Lyric Processing
- Remove formatting, punctuation, and unwanted elements
- Smart line splitting for optimal subtitle length
- Find and replace functionality
- Preserve or modify capitalization and quotes

### User-Friendly Interface
- Responsive design that works on desktop and mobile
- Real-time progress tracking for word timing
- Customizable highlight colors for word-by-word effects
- Integrated audio playback controls

## How to Use

1. **Upload Audio**: Select your audio file or drag and drop an SRT file to import existing timings
2. **Enter Lyrics**: Paste your lyrics in the text area and optionally process them with the lyric tidy tool
3. **Choose Mode**: Select line timing for standard subtitles or word timing for highlight effects
4. **Time Your Lyrics**: Follow the on-screen instructions to time your content
5. **Download**: Export your timed subtitles in your preferred format

## Tech Stack

Built with modern web technologies for performance and maintainability:
- **Vite** - Fast build tool and development server
- **Alpine.js** - Reactive framework for interactive UI
- **Tailwind CSS** - Utility-first CSS framework
- **Modular JavaScript** - Clean, maintainable code architecture

## Future Features

- Custom audio player with cross-browser consistency
- Playback speed control for easier timing
- Undo/redo functionality for timing corrections
- Batch processing for multiple files
- Cloud sync and collaboration features