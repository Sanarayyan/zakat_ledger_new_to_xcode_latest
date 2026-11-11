export function calculationYearType(calcData, category) {
    return ['stocks', 'cattle'].includes(category) ? 'islamic' : calcData.yearType;
}

export function buildCalculationPayload(calcData, category, cashValue) {
    const fields = ['goldEntries', 'goldRate', 'goldRateSource', 'goldRateCheckedAt', 'currency', 'cattle', 'cattleType',
        'stocksShareType', 'stocksNumShares', 'stocksMarketPrice', 'stocksDividend', 'stocksNonHalalPct', 'hasHawl'];
    return { ...Object.fromEntries(fields.filter(key => calcData[key] !== undefined).map(key => [key, calcData[key]])),
        category, cash: cashValue, yearType: calculationYearType(calcData, category) };
}

export function createLedgerService(baseUrl, fetchImpl = globalThis.fetch) {
    async function request(path, { token, method = 'GET', body } = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
        const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}${path}`, {
            method,
            headers: {
                ...(body ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
            signal: controller.signal,
            cache: 'no-store',
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const error = new Error(data.error || `Request failed (${response.status})`);
            error.status = response.status;
            throw error;
        }
        return data;
        } finally { clearTimeout(timeout); }
    }

    return {
        loginChallenge: () => request('/api/auth/challenge/', { method: 'POST' }),
        login: (credential, challengeId) => request('/api/auth/google/', { method: 'POST', body: { credential, challengeId } }),
        logout: token => request('/api/auth/logout/', { token, method: 'POST' }),
        save: (token, payload) => request('/api/calculations/', { token, method: 'POST', body: payload }),
        history: token => request('/api/calculations/', { token }),
        delete: (token, id) => request(`/api/calculations/${id}/`, { token, method: 'DELETE' }),
    };
}
