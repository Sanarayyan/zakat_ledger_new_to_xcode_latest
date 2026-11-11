import { appStorage } from '../services/appStorage';
import { useState, useEffect } from 'react';

const TOTAL_AYAHS = 6236;
const CACHE_KEY = 'daily_ayah_cache';
const API_BASE = 'https://api.alquran.cloud/v1/ayah';

function getTodayKey() {
    // Local date in YYYY-MM-DD — consistent across the day
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function computeAyahNumber(dateKey) {
    // Convert "2026-04-29" → 20260429 as a numeric seed
    const seed = parseInt(dateKey.replace(/-/g, ''), 10);
    return (seed % TOTAL_AYAHS) + 1; // 1-indexed, always 1–6236
}

function loadCache() {
    try {
        const raw = appStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveCache(dateKey, ayahData) {
    try {
        appStorage.setItem(CACHE_KEY, JSON.stringify({ date: dateKey, ayah: ayahData }));
    } catch { /* storage full – ignore */ }
}

/**
 * useDailyAyah
 * Returns { arabic, translation, surahEnglish, surahArabic, ayahNum, surahNum, loading, error }
 * - Fetches once per day, persists in appStorage
 * - No API call on refresh if cache is fresh
 */
export function useDailyAyah(lang = 'en') {
    const [state, setState] = useState({
        arabic: '',
        translation: '',
        surahEnglish: '',
        surahArabic: '',
        ayahNum: 0,
        surahNum: 0,
        loading: true,
        error: null,
    });

    useEffect(() => {
        const todayKey = `${getTodayKey()}_${lang}`;
        const cache = loadCache();

        // If cache is valid for today, use it immediately — no network call
        if (cache && cache.date === todayKey && cache.ayah) {
            setState({ ...cache.ayah, loading: false, error: null });
            return;
        }

        // Otherwise fetch from API
        const ayahNumber = computeAyahNumber(getTodayKey());
        const translationEdition = lang === 'ml' ? 'ml.abdulhameed' : 'en.sahih';
        const url = `${API_BASE}/${ayahNumber}/editions/quran-uthmani,${translationEdition}`;

        let cancelled = false;
        setState(prev => ({ ...prev, loading: true, error: null }));

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(json => {
                if (cancelled) return;

                const editions = json?.data;
                if (!Array.isArray(editions) || editions.length < 2) {
                    throw new Error('Unexpected API response');
                }

                const arabicEdition = editions[0];
                const englishEdition = editions[1];

                const ayahData = {
                    arabic: arabicEdition.text,
                    translation: englishEdition.text,
                    surahEnglish: arabicEdition.surah?.englishName || '',
                    surahArabic: arabicEdition.surah?.name || '',
                    ayahNum: arabicEdition.numberInSurah,
                    surahNum: arabicEdition.surah?.number || 0,
                };

                saveCache(todayKey, ayahData);
                setState({ ...ayahData, loading: false, error: null });
            })
            .catch(err => {
                if (cancelled) return;
                console.error('[useDailyAyah] fetch failed:', err);
                setState(prev => ({ ...prev, loading: false, error: 'Could not load today\'s ayah.' }));
            });

        return () => { cancelled = true; };
    }, [lang]); // run once per mount and on lang change

    return state;
}
