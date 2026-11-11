// Hold the guard until cooldown persistence finishes, not only the native API call.
export function createRatingTransaction() {
    let active = false;
    let disposed = false;
    return {
        dispose() { disposed = true; },
        async run(operation) {
            if (active || disposed) return;
            active = true;
            try { return await operation(() => !disposed); }
            finally { active = false; }
        },
    };
}
