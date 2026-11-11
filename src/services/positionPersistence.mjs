export function createPositionPersistence(save, intervalMs = 5000, now = Date.now) {
    let last = -Infinity;
    let latest;
    return {
        update(position) {
            latest = position;
            if (now() - last >= intervalMs) { save(position); last = now(); }
        },
        flush() { if (latest !== undefined) { save(latest); latest = undefined; last = now(); } },
    };
}
