import { fetchJSON } from './latestRequest.mjs';
export function dailyAyahNumber(dateKey) { return Number(dateKey.replace(/-/g, '')) % 6236 + 1; }
export async function fetchDailyAyah(dateKey, lang, signal) {
    const edition = lang === 'ml' ? 'ml.abdulhameed' : 'en.sahih';
    const data = await fetchJSON(`https://api.alquran.cloud/v1/ayah/${dailyAyahNumber(dateKey)}/editions/quran-uthmani,${edition}`, { signal });
    if (data?.code !== 200 || !Array.isArray(data.data) || data.data.length !== 2 || !data.data.every(ayah => typeof ayah.text === 'string')) throw new Error('Invalid daily Ayah response');
    return data.data;
}
