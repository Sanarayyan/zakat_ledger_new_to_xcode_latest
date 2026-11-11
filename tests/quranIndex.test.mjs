import test from 'node:test';
import assert from 'node:assert/strict';
import { loadQuranIndex } from '../src/services/quranIndex.mjs';

const surahs = Array.from({ length: 114 }, (_, i) => ({
    number: i + 1, name: 'العربية', englishName: 'Surah', englishNameTranslation: 'Translation', numberOfAyahs: 7,
}));
const juz = Array.from({ length: 30 }, (_, i) => ({ surah: i + 1, ayah: 1 }));
const validSurahResponse = { data: surahs };
const validMetaResponse = { data: { juzs: { references: juz } } };
const json = data => Response.json(data);

test('Quran index rejects HTTP, JSON, and schema failures and a new attempt can recover', async t => {
    const failures = [
        [new Response('', { status: 503 }), json(validMetaResponse)],
        [json(validSurahResponse), new Response('{')],
        [json({ data: {} }), json(validMetaResponse)],
        [json({ data: [{ ...surahs[0], englishName: null }, ...surahs.slice(1)] }), json(validMetaResponse)],
        [json(validSurahResponse), json({ data: { juzs: { references: [{ surah: 115, ayah: 1 }, ...juz.slice(1)] } } })],
    ];
    const originalFetch = globalThis.fetch;
    t.after(() => { globalThis.fetch = originalFetch; });
    for (const [surahResponse, metaResponse] of failures) {
        globalThis.fetch = async url => url.endsWith('/surah') ? surahResponse : metaResponse;
        await assert.rejects(loadQuranIndex(new AbortController()));
        globalThis.fetch = async url => json(url.endsWith('/surah') ? validSurahResponse : validMetaResponse);
        assert.deepEqual(await loadQuranIndex(new AbortController()), { surahs, juz });
    }
});

test('Quran index bounds both a stalled fetch and a stalled response body', async t => {
    const originalFetch = globalThis.fetch;
    t.after(() => { globalThis.fetch = originalFetch; });
    for (const stallBody of [false, true]) {
        globalThis.fetch = async (url, { signal }) => {
            if (url.endsWith('/surah')) return json(validSurahResponse);
            const stall = () => new Promise((_, reject) => {
                signal.addEventListener('abort', () => reject(signal.reason), { once: true });
            });
            return stallBody ? { ok: true, json: stall } : stall();
        };
        await assert.rejects(loadQuranIndex(new AbortController(), 20), { name: 'AbortError' });
    }
});
