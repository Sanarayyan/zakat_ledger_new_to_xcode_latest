// Keep the original value before a screen replaces unreadable data with a default.
export function readStoredJSON(storage, key, fallback, validate = value => {
    if (Array.isArray(fallback)) return Array.isArray(value) && value.every(item => item !== null);
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}) {
    const raw = storage.getItem(key);
    if (raw === null) return fallback;
    try {
        const value = JSON.parse(raw);
        const object = item => item !== null && typeof item === 'object' && !Array.isArray(item);
        let shape = true;
        if (['tasbih_sessions', 'quran_bookmarks', 'quran_recents', 'khatamHistory', 'all_surahs_meta'].includes(key)) shape = Array.isArray(value) && value.every(object);
        if (key === 'prayer_settings') shape = object(value) && (!value.location || (object(value.location) && Number.isFinite(value.location.lat) && Number.isFinite(value.location.lng) && typeof value.location.city === 'string'));
        if (key === 'smart_prayer_tracker_data') shape = object(value) && (!('completed' in value) || (object(value.completed) && Object.values(value.completed).every(object))) && (!('streakTarget' in value) || (Number.isInteger(value.streakTarget) && value.streakTarget >= 1 && value.streakTarget <= 5));
        if (key === 'prayer_calendar_cache_v1') shape = object(value) && (!value.calendar || (Array.isArray(value.calendar) && value.calendar.every(day => object(day) && object(day.date?.gregorian) && object(day.timings))));
        if (shape && validate(value)) return value;
    } catch { /* Preserve the unreadable value below. */ }
    const recoveryKey = `data_recovery_${key}`;
    // Never replace an earlier recovery copy. An array keeps subsequent distinct originals.
    let copies = [];
    try { copies = JSON.parse(storage.getItem(recoveryKey) || '[]'); } catch { throw new Error('Saved data recovery needs attention. Original data was retained.'); }
    if (!Array.isArray(copies)) throw new Error('Saved data recovery needs attention. Original data was retained.');
    if (!copies.includes(raw)) storage.setItem(recoveryKey, JSON.stringify([...copies, raw]));
    queueMicrotask(() => globalThis.window?.dispatchEvent(new Event('storage-data-recovered')));
    return fallback;
}
