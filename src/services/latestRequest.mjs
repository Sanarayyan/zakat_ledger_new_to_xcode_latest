import { createRequestScope } from './requestScope.mjs';

export async function fetchJSON(url, { signal } = {}) {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error('Service unavailable. Please retry.');
    return response.json();
}

// Cancellation and timeout cover both headers and body parsing.
export function createLatestRequest(timeoutMs = 10000) {
    const scope = createRequestScope();
    let active;
    function cancel() { scope.invalidate(); active?.abort(); active = null; }
    return {
        cancel,
        async run(operation) {
            cancel();
            const controller = new AbortController();
            active = controller;
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                return await scope.run(async () => {
                    try { return await operation(controller.signal); }
                    catch (error) {
                        if (controller.signal.aborted) throw new Error('Request timed out. Please retry.');
                        throw error;
                    }
                });
            } finally {
                clearTimeout(timer);
                if (active === controller) active = null;
            }
        },
    };
}
