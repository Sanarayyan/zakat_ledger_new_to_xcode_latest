const fs = require('fs');
const path = require('path');

const appJsxPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

// 1. Add getAudioUrl helper
const helperCode = `
// --- AUDIO SYSTEM HELPERS ---
const getAudioUrl = (reciter, ayahNumber) => {
    // Abdul Basit requires 64 bitrate, others use 128
    const bitrate = reciter === 'ar.abdulsamad' ? '64' : '128';
    const url = \`https://cdn.islamic.network/quran/audio/\${bitrate}/\${reciter}/\${ayahNumber}.mp3\`;
    console.log(\`[DEBUG] Generated Audio URL for \${reciter} Ayah \${ayahNumber}: \${url}\`);
    return url;
};
`;

if (!content.includes('getAudioUrl')) {
    content = content.replace("import RatingManager from './components/rating/RatingManager';", "import RatingManager from './components/rating/RatingManager';\n" + helperCode);
}

// 2. Replace hardcoded CDN URLs
content = content.replace(/`https:\/\/cdn\.islamic\.network\/quran\/audio\/128\/\$\{reciter\}\/1\.mp3`/g, 'getAudioUrl(reciter, 1)');
content = content.replace(/`https:\/\/cdn\.islamic\.network\/quran\/audio\/128\/\$\{reciter\}\/\$\{ayah\.number\}\.mp3`/g, 'getAudioUrl(reciter, ayah.number)');
content = content.replace(/`https:\/\/cdn\.islamic\.network\/quran\/audio\/128\/\$\{reciter\}\/\$\{nextAyah\.number\}\.mp3`/g, 'getAudioUrl(reciter, nextAyah.number)');
content = content.replace(/`https:\/\/cdn\.islamic\.network\/quran\/audio\/128\/\$\{reciter\}\/\$\{firstAyah\.number\}\.mp3`/g, 'getAudioUrl(reciter, firstAyah.number)');

// 3. Replace ayah.audio usages to use getAudioUrl
content = content.replace(/handlePlayAudio\(ayah\.number,\s*ayah\.audio\)/g, 'handlePlayAudio(ayah.number, getAudioUrl(reciter, ayah.number))');
content = content.replace(/handlePlayAudio\(surah\.ayahs\[0\]\.number,\s*surah\.ayahs\[0\]\.audio\)/g, 'handlePlayAudio(surah.ayahs[0].number, getAudioUrl(reciter, surah.ayahs[0].number))');
content = content.replace(/handlePlayAudio\(firstAyah\.number,\s*firstAyah\.audio\)/g, 'handlePlayAudio(firstAyah.number, getAudioUrl(reciter, firstAyah.number))');
content = content.replace(/audio\.src = nextAyah\.audio;/g, 'audio.src = getAudioUrl(reciter, nextAyah.number);');

// 4. Add debug logging on reciter change in SurahDetail
const reciterEffect = `
    useEffect(() => {
        console.log(\`[DEBUG] Reciter selected: \${reciter}\`);
    }, [reciter]);
`;
if (!content.includes('[DEBUG] Reciter selected')) {
    content = content.replace("const audioRef = useRef(null);", "const audioRef = useRef(null);\n" + reciterEffect);
}

// 5. Add audio error and load start listeners in both places
const errorHandlingCode = `
        const handleLoadStart = () => {
            console.log(\`[DEBUG] Audio loading started for: \${audio.src}\`);
        };
        const handleError = (e) => {
            console.error(\`[DEBUG] Audio loading error for \${audio.src}: \`, e);
            if(window.showToastFn) window.showToastFn('Failed to load audio for this reciter. Please try another.');
            setPlayingAyah(null);
        };
`;

content = content.replace(/const handleLoadedMetadata = \(\) => {/g, errorHandlingCode + "\n        const handleLoadedMetadata = () => {");
content = content.replace(/audio\.addEventListener\('loadedmetadata', handleLoadedMetadata\);/g, "audio.addEventListener('loadedmetadata', handleLoadedMetadata);\n        audio.addEventListener('loadstart', handleLoadStart);\n        audio.addEventListener('error', handleError);");
content = content.replace(/audio\.removeEventListener\('loadedmetadata', handleLoadedMetadata\);/g, "audio.removeEventListener('loadedmetadata', handleLoadedMetadata);\n            audio.removeEventListener('loadstart', handleLoadStart);\n            audio.removeEventListener('error', handleError);");

// To make showToast accessible to error handler inside the effect:
content = content.replace(/const showToast = \(msg\) => {/g, "const showToast = (msg) => {\n        window.showToastFn = showToast;");


fs.writeFileSync(appJsxPath, content, 'utf8');
console.log('App.jsx modified successfully!');
