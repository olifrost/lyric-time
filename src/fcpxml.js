function isShortWord(word) {
    return word.length <= 4;
}

function splitTextIntoLines(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = [];
    let currentLength = 0;

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const nextWord = words[i + 1];
        const wordLength = word.length;
        
        // If this is a potential orphan (short last word)
        if (nextWord === undefined && isShortWord(word) && currentLine.length > 0) {
            // Check if we can fit it on the current line
            if (currentLength + wordLength + 1 <= maxChars * 1.1) { // Allow 10% overflow for orphan prevention
                currentLine.push(word);
            } else {
                // If the current line is too short, try to redistribute
                const previousWord = currentLine[currentLine.length - 1];
                if (currentLine.length > 1 && 
                    (word.length + previousWord.length + 1) <= maxChars) {
                    // Move the last word of current line to new line with orphan
                    const lastWord = currentLine.pop();
                    lines.push(currentLine.join(' '));
                    lines.push(`${lastWord} ${word}`);
                } else {
                    // Can't prevent orphan, just add it as a new line
                    lines.push(currentLine.join(' '));
                    lines.push(word);
                }
            }
            continue;
        }

        // Normal line breaking logic
        if (currentLength + wordLength + 1 <= maxChars) {
            currentLine.push(word);
            currentLength += wordLength + 1;
        } else {
            // Look ahead to prevent orphans in next line
            if (nextWord && isShortWord(nextWord) && 
                (wordLength + nextWord.length + 1) <= maxChars) {
                // Keep current word for next line
                if (currentLine.length > 0) {
                    lines.push(currentLine.join(' '));
                }
                currentLine = [word];
                currentLength = wordLength;
            } else {
                if (currentLine.length > 0) {
                    lines.push(currentLine.join(' '));
                }
                if (wordLength > maxChars) {
                    // Handle very long words by breaking them
                    currentLine = [word];
                } else {
                    currentLine = [word];
                }
                currentLength = wordLength;
            }
        }
    }

    if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
    }

    return lines.join('\n');
}

function generateFCPXML(timings, settings = {}) {
    const FPS = 25;
    const FRAME_DURATION = "100/2500s";
    
    // Use provided settings or defaults
    const fontFamily = settings.fontFamily || 'Helvetica';
    const fontSize = settings.fontSize || 60;
    const fontColor = settings.fontColor || '#ffffff';
    const charsPerLine = settings.charsPerLine || 20;
    
    // Convert hex color to RGBA (1-based)
    function hexToRGBA(hex) {
        const r = parseInt(hex.slice(1,3), 16) / 255;
        const g = parseInt(hex.slice(3,5), 16) / 255;
        const b = parseInt(hex.slice(5,7), 16) / 255;
        return `${r} ${g} ${b} 1`;
    }
    
    function secondsToFrames(seconds) {
        return Math.round(seconds * FPS);
    }
    
    function formatDuration(frames) {
        return `${frames * 100}/2500s`;
    }

    const titles = timings.map((timing, index) => {
        const startFrames = secondsToFrames(timing.start);
        const durationFrames = secondsToFrames(timing.end - timing.start);
        const wrappedText = splitTextIntoLines(timing.text, charsPerLine);
        
        return `                            <title ref="r2" lane="1" offset="${formatDuration(startFrames)}" name="${timing.text} - Basic Title" duration="${formatDuration(durationFrames)}">
                                <param name="Flatten" key="9999/999166631/999166633/2/351" value="1"/>
                                <param name="Alignment" key="9999/999166631/999166633/2/354/999169573/401" value="1 (Center)"/>
                                <param name="disableDRT" key="3733" value="1"/>
                                <text>
                                    <text-style ref="ts${index + 1}">${wrappedText}</text-style>
                                </text>
                                <text-style-def id="ts${index + 1}">
                                    <text-style font="${fontFamily}" fontSize="${fontSize}" fontFace="Regular" fontColor="${hexToRGBA(fontColor)}" alignment="center"/>
                                </text-style-def>
                                <adjust-colorConform enabled="1" autoOrManual="manual" conformType="conformNone" peakNitsOfPQSource="1000" peakNitsOfSDRToPQSource="203"/>
                            </title>`;
    }).join('\n');

    const totalDurationFrames = secondsToFrames(timings[timings.length - 1].end);
    const currentDate = new Date().toISOString().replace('T', ' ').split('.')[0] + ' +0000';

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>

<fcpxml version="1.13">
    <resources>
        <format id="r1" name="FFVideoFormat1080p25" frameDuration="${FRAME_DURATION}" width="1920" height="1080" colorSpace="1-1-1 (Rec. 709)"/>
        <effect id="r2" name="Basic Title" uid=".../Titles.localized/Bumper:Opener.localized/Basic Title.localized/Basic Title.moti"/>
    </resources>
    <library>
        <event name="Lyrics Subtitles" uid="${generateUUID()}">
            <project name="Lyrics Subtitles" uid="${generateUUID()}" modDate="${currentDate}">
                <sequence format="r1" duration="${formatDuration(totalDurationFrames)}" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">
                    <spine>
                        <gap name="Gap" offset="0s" duration="${formatDuration(totalDurationFrames)}">
${titles}
                        </gap>
                    </spine>
                </sequence>
            </project>
        </event>
    </library>
</fcpxml>`;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16).toUpperCase();
    });
}

export { generateFCPXML };
