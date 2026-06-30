const fs = require('fs');
const path = require('path');

const appJsxPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

// 1. Remove reciter from SurahDetail fetch URL and dependency array
content = content.replace(
    /fetch\(\`https:\/\/api\.alquran\.cloud\/v1\/surah\/\$\{id\}\/editions\/quran-uthmani,\$\{translationEdition\},\$\{reciter\}\`\)/g,
    'fetch(`https://api.alquran.cloud/v1/surah/${id}/editions/quran-uthmani,${translationEdition}`)'
);

// We need to remove audio parsing from the SurahDetail fetch response since we removed it from the fetch URL
// It looks like:
/*
                const arabic = data.data[0];
                const translation = data.data[1];
                const audio = data.data[2];
                
                const structuredAyahs = arabic.ayahs.map((ayah, index) => ({
                    number: ayah.number,
                    numberInSurah: ayah.numberInSurah,
                    text: ayah.text,
                    translation: translation.ayahs[index].text,
                    audio: audio.ayahs[index].audio,
*/
content = content.replace(
    /const audio = data\.data\[2\];/g,
    '// const audio = data.data[2]; // Removed'
);
content = content.replace(
    /audio:\s*audio\.ayahs\[index\]\.audio,/g,
    '// audio mapping removed since we use getAudioUrl'
);

content = content.replace(
    /}, \[id, lang, reciter, location\.state\]\);/g,
    '}, [id, lang, location.state]);'
);

// 2. Update the reciter useEffect to seamlessly switch audio
const newReciterEffect = `
    useEffect(() => {
        console.log(\`[DEBUG] Reciter selected: \${reciter}\`);
        if (playingAyah !== null && audioRef.current) {
            const wasPlaying = !audioRef.current.paused;
            // The Ayah number to fetch (if 0, it means we are playing the Bismillah preamp which corresponds to Ayah 1's audio file)
            const targetAyah = playingAyah === 0 ? 1 : playingAyah;
            
            // Only update if we're actually changing reciters while an ayah is active
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

content = content.replace(
    /useEffect\(\(\) => \{\s*console\.log\(`\[DEBUG\] Reciter selected: \$\{reciter\}`\);\s*\}, \[reciter\]\);/g,
    newReciterEffect.trim()
);

fs.writeFileSync(appJsxPath, content, 'utf8');
console.log('Scroll preservation fix applied successfully!');
