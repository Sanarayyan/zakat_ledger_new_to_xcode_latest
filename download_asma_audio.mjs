import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const namesFile = path.join(__dirname, 'src/constants/asmaulhusna.json');
const audioDir = path.join(__dirname, 'public/audio/asma');

if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

const names = JSON.parse(fs.readFileSync(namesFile, 'utf8'));

const downloadAudio = (name, index) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(audioDir, `${name.id}.mp3`);
        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
            resolve();
            return;
        }

        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(name.arabic)}`;
        
        const file = fs.createWriteStream(filePath);
        
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => {});
            reject(err);
        });
    });
};

async function downloadAll() {
    console.log(`Downloading 99 audio files to ${audioDir}...`);
    for (let i = 0; i < names.length; i++) {
        try {
            await downloadAudio(names[i], i);
            if (i % 10 === 0) console.log(`Downloaded ${i+1}/${names.length}`);
            // Small delay to prevent rate limiting
            await new Promise(r => setTimeout(r, 200));
        } catch (e) {
            console.error(`Error on ID ${names[i].id}:`, e.message);
        }
    }
    console.log('All downloads complete!');
}

downloadAll();
