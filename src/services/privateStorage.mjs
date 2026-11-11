// Keeps existing synchronous screen reads while serializing durable native writes.
export async function createPrivateStorage(persistent, legacy, onError = () => {}) {
    const cache = new Map();
    for (const key of await persistent.keys()) cache.set(key, await persistent.getItem(key));
    const conflicts = [];
    const legacyKeys = Array.from({ length: legacy.length }, (_, i) => legacy.key(i));
    for (const key of legacyKeys) {
        let value = legacy.getItem(key);
        if (key === 'zakat_user') {
            try { const { accessToken, ...profile } = JSON.parse(value); value = JSON.stringify(profile); }
            catch { value = null; }
        }
        if (cache.has(key) && cache.get(key) !== value) {
            // Keep a verified protected recovery copy AND the legacy source. Never guess which is newer.
            const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${key}\u0000${value}`));
            const conflictKey = 'migration_conflict_' + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
            if (!cache.has(conflictKey)) {
                const recovery = JSON.stringify({ key, legacyValue: legacy.getItem(key), protectedValue: cache.get(key) });
                await persistent.setItem(conflictKey, recovery);
                if (await persistent.getItem(conflictKey) !== recovery) throw new Error('Conflicting storage copies could not be preserved. Legacy data was retained.');
                cache.set(conflictKey, recovery);
            }
            conflicts.push(key);
            continue;
        }
        if (!cache.has(key) && value !== null) {
            await persistent.setItem(key, value);
            if (await persistent.getItem(key) !== value) throw new Error('Secure storage migration could not be verified. Original data was retained.');
            cache.set(key, value);
        }
        await legacy.removeItem(key);
    }
    const dirty = new Map();
    let running;
    const flush = () => {
        if (running) return running;
        // Assign the runner before starting I/O, and release it in the same step as the final queue check.
        running = Promise.resolve().then(async () => {
            try {
                while (dirty.size) {
                    const [key, value] = dirty.entries().next().value;
                    if (value === null) await persistent.removeItem(key);
                    else await persistent.setItem(key, value);
                    if (dirty.get(key) === value) dirty.delete(key);
                }
            } catch (error) {
                onError(error);
                throw error;
            } finally {
                running = null;
            }
        });
        return running;
    };
    const change = (key, value) => {
        if (value === null) cache.delete(key); else cache.set(key, value);
        dirty.set(key, value);
        void flush().catch(() => {});
    };
    return {
        get migrationConflicts() { return [...conflicts]; },
        get length() { return cache.size; }, key: index => [...cache.keys()][index] ?? null,
        getItem: key => cache.get(key) ?? null,
        setItem: (key, value) => change(key, String(value)), removeItem: key => change(key, null),
        clear: () => { for (const key of cache.keys()) change(key, null); },
        // Used only after the user's explicit Delete my app data confirmation.
        async clearLegacy() {
            const keys = Array.from({ length: legacy.length }, (_, i) => legacy.key(i));
            for (const key of keys) await legacy.removeItem(key);
        },
        flush,
    };
}
