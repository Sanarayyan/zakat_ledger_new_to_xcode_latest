import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioDir = path.join(__dirname, 'public/audio/tasbih');

if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

const dhikrList = [
    { id: 'subhanallah', arabic: 'سُبْحَانَ ٱللَّٰهِ' },
    { id: 'alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ' },
    { id: 'allahu_akbar', arabic: 'ٱللَّٰهُ أَكْبَرُ' },
    { id: 'la_ilaha_illallah', arabic: 'لَا إِلٰهَ إِلَّا ٱللَّٰهُ' },
    { id: 'astaghfirullah', arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ' },
    { id: 'subhanallahi_wa_bihamdihi', arabic: 'سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ' },
    { id: 'subhanallahil_azeem', arabic: 'سُبْحَانَ ٱللَّٰهِ ٱلْعَظِيمِ' },
    { id: 'hasbunallah', arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ' },
    { id: 'la_hawla', arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ' },
    { id: 'salawat', arabic: 'ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّദٍ' }, // Let's use pure Arabic: ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ
    { id: 'ya_rahman', arabic: 'يَا رَحْمَـٰنُ' },
    { id: 'ya_raheem', arabic: 'يَا رَحِيمُ' },
    { id: 'ya_latheef', arabic: 'يَا لَطِيفُ' },
    { id: 'ya_kareem', arabic: 'يَا كَرِيمُ' },
    { id: 'ya_allah', arabic: 'يَا أَللَّٰهُ' },
    { id: 'ayatul_kursi_short', arabic: 'ٱللَّهُ لَا إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ' },
    { id: 'istighfar_sayyid', arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي' },
    { id: 'morning_dhikr', arabic: 'بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَىْءٌ' },
    { id: 'tasbih_fatima', arabic: 'سُبْحَانَ اللَّهِ، الْحَمْدُ لِلَّهِ، اللَّهُ أَكْبَرُ' }
];

// Correct salawat arabic characters
dhikrList[9].arabic = 'ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ';

const downloadAudio = (dhikr) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(audioDir, `${dhikr.id}.mp3`);
        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
            resolve();
            return;
        }

        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(dhikr.arabic)}`;
        const file = fs.createWriteStream(filePath);
        
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
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
    console.log(`Downloading ${dhikrList.length} tasbih audio files to ${audioDir}...`);
    for (let i = 0; i < dhikrList.length; i++) {
        try {
            await downloadAudio(dhikrList[i]);
            console.log(`Downloaded ${i+1}/${dhikrList.length}: ${dhikrList[i].id}`);
            await new Promise(r => setTimeout(r, 200));
        } catch (e) {
            console.error(`Error downloading ${dhikrList[i].id}:`, e.message);
        }
    }
    console.log('Dhikr audio downloads complete!');
}

downloadAll();
