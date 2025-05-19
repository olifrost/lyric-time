const lyricProcessors = {
    removeHeaders: (text) => text.replace(/^##.*$/gm, ''),
    
    removeMarkdown: (text) => text.replace(/[*_~`#\[\]()]|>\s/g, ''),
    
    removeExtraSpaces: (text) => {
        return text
            .split('\n')
            .filter(line => line.trim())
            .join('\n');
    },
    
    removePunctuation: (text, options = { periods: true, commas: true }) => {
        let result = text;
        if (options.periods) result = result.replace(/\./g, '');
        if (options.commas) result = result.replace(/,/g, '');
        return result;
    },
    
    smartQuotes: (text) => text.replace(/'/g, '’'),
    
    capitalizeLines: (text) => {
        return text
            .split('\n')
            .map(line => {
                if (line.trim()) {
                    return line.charAt(0).toUpperCase() + line.slice(1);
                }
                return line;
            })
            .join('\n');
    },
    
    standardizeQuotes: (text) => text.replace(/[""]/g, '"'),
    
    removeParentheses: (text) => text.replace(/[()]/g, ''),
    
    removeEmojis: (text) => text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ''),
    
    smartLineSplit: (text, maxChars = 40) => {
        return text.split('\n').map(line => {
            if (line.length <= maxChars) return line;
            
            // Find the best splitting point near the middle
            const middle = Math.floor(line.length / 2);
            let splitIndex = middle;
            
            // Look for a space within 10 characters of the middle
            for (let i = 0; i < 10; i++) {
                if (line[middle - i] === ' ') {
                    splitIndex = middle - i;
                    break;
                }
                if (line[middle + i] === ' ') {
                    splitIndex = middle + i;
                    break;
                }
            }
            
            // Split and trim any extra spaces
            return line.slice(0, splitIndex).trim() + '\n' + line.slice(splitIndex).trim();
        }).join('\n');
    },
    
    findReplace: (text, find, replace) => {
        if (!find || !replace) return text;
        const regex = new RegExp(find, 'g');
        return text.replace(regex, replace);
    }
};

function processLyrics(text, options) {
    let result = text;
    
    if (options.removeHeaders) result = lyricProcessors.removeHeaders(result);
    if (options.removeMarkdown) result = lyricProcessors.removeMarkdown(result);
    if (options.removeExtraSpaces) result = lyricProcessors.removeExtraSpaces(result);
    if (options.removePunctuation) {
        result = lyricProcessors.removePunctuation(result, {
            periods: options.removePeriods,
            commas: options.removeCommas
        });
    }
    if (options.smartQuotes) result = lyricProcessors.smartQuotes(result);
    if (options.capitalizeLines) result = lyricProcessors.capitalizeLines(result);
    if (options.standardizeQuotes) result = lyricProcessors.standardizeQuotes(result);
    if (options.removeParentheses) result = lyricProcessors.removeParentheses(result);
    if (options.removeEmojis) result = lyricProcessors.removeEmojis(result);
    if (options.smartLineSplit) {
        result = lyricProcessors.smartLineSplit(result, options.maxChars);
    }
    if (options.findReplace) {
        result = lyricProcessors.findReplace(result, options.find, options.replace);
    }
    
    return result;
}

export { processLyrics, lyricProcessors };
