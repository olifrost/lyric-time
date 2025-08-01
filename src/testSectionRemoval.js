// Test for section heading removal
import { processLyrics } from './lyricProcessor.js';

const testLyrics = `Verse
This is the first line
Chorus
This is the chorus line
Bridge
This is the bridge line
A bridge over troubled water
Verse
`;

const options = {
    removeHeaders: true,
    removeMarkdown: false,
    removeExtraSpaces: false,
    removePunctuation: false,
    smartQuotes: false,
    capitalizeLines: false,
    standardizeQuotes: false,
    removeParentheses: false,
    removeEmojis: false,
    smartLineSplit: false
};

const result = processLyrics(testLyrics, options);
console.log('Processed Lyrics:\n' + result);
