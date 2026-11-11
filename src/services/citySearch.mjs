import { fetchJSON } from './latestRequest.mjs';

export async function searchCities(query, { signal, language = 'en' } = {}) {
    const name = query.trim().replace(/\s+/g, ' ');
    if (name.length < 2) return [];
    const params = new URLSearchParams({ name, count: '12', language });
    const data = await fetchJSON(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal });
    if (!data || typeof data !== 'object' || data.error || (data.results !== undefined && !Array.isArray(data.results))) {
        throw new Error('Invalid city search response');
    }
    return (data.results || []).flatMap(result => {
        const city = typeof result?.name === 'string' ? result.name.trim() : '';
        const { latitude: lat, longitude: lng } = result || {};
        if (!city || !/\p{L}/u.test(city) || !Number.isFinite(lat) || Math.abs(lat) > 90 ||
            !Number.isFinite(lng) || Math.abs(lng) > 180) return [];
        const region = [...new Set([result.admin2, result.admin1, result.country])].filter(part => part && part !== city).join(', ');
        return [{ id: result.id, city, region, lat, lng, source: 'manual' }];
    });
}
