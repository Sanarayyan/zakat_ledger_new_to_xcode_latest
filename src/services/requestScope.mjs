// A response from an old account must never populate the next account's screen.
export function createRequestScope() {
    let generation = 0;
    return {
        invalidate() { generation++; },
        async run(operation) {
            const started = generation;
            try {
                const value = await operation();
                return generation === started ? { value } : null;
            } catch (error) {
                if (generation !== started) return null;
                throw error;
            }
        },
    };
}
