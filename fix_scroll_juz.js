const fs = require('fs');
const path = require('path');

const appJsxPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

const newReciterEffect = `
    useEffect(() => {
        console.log(\`[DEBUG] Juz Reciter selected: \${reciter}\`);
        if (playingAyah !== null && audioRef.current) {
            const wasPlaying = !audioRef.current.paused;
            const targetAyah = playingAyah === 0 ? 1 : playingAyah;
            const url = getAudioUrl(reciter, targetAyah);
            if (audioRef.current.src !== url) {
                audioRef.current.src = url;
                audioRef.current.load();
                audioRef.current.playbackRate = playbackRateRef.current || 1;
                if (wasPlaying) {
                    audioRef.current.play().catch(err => console.error("Audio playback error on reciter switch:", err));
                }
            }
        }
    }, [reciter]);
`;

// Insert after the second occurrence of "const audioRef = useRef(null);"
let count = 0;
content = content.replace(/const audioRef = useRef\(null\);/g, (match) => {
    count++;
    if (count === 2) {
        return match + '\n' + newReciterEffect;
    }
    return match;
});

fs.writeFileSync(appJsxPath, content, 'utf8');
console.log('Juz scroll fix applied successfully!');
