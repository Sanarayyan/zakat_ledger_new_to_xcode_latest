import { fetchJSON } from './latestRequest.mjs';

const api = 'https://api.alquran.cloud/v1';
const isText = value => typeof value === 'string' && value.trim().length > 0;

export async function loadQuranIndex(controller, timeoutMs = 10000) {
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const options = { signal: controller.signal };
        const [surahData, metaData] = await Promise.all([
            fetchJSON(`${api}/surah`, options),
            fetchJSON(`${api}/meta`, options),
        ]);
        const surahs = surahData?.data;
        const juz = metaData?.data?.juzs?.references;
        if (!Array.isArray(surahs) || surahs.length !== 114 || !surahs.every((surah, index) =>
            surah?.number === index + 1 && isText(surah.name) && isText(surah.englishName) &&
            isText(surah.englishNameTranslation) && Number.isInteger(surah.numberOfAyahs) && surah.numberOfAyahs > 0
        ) || !Array.isArray(juz) || juz.length !== 30 || !juz.every(ref =>
            Number.isInteger(ref?.surah) && Number.isInteger(ref?.ayah) &&
            ref.ayah > 0 && ref.ayah <= (surahs[ref.surah - 1]?.numberOfAyahs ?? 0)
        )) {
            throw new Error('Invalid Quran index response.');
        }
        return { surahs, juz };
    } finally {
        clearTimeout(timer);
        controller.abort(); // Cancel the other request if one fails first.
    }
}
