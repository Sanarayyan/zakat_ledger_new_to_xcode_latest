/**
 * Compares two semantic version strings (e.g. "1.0.0", "1.2.3").
 * Returns:
 *  1 if v1 > v2
 * -1 if v1 < v2
 *  0 if v1 === v2
 */
export function compareVersions(v1, v2) {
    if (v1 === v2) return 0;
    
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    const len = Math.max(parts1.length, parts2.length);
    
    for (let i = 0; i < len; i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;
        
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    
    return 0;
}

/**
 * Fetches the remote update configuration with a timeout to prevent hanging.
 * Fallbacks to localStorage cache if fetch fails or network is offline.
 */
export async function fetchUpdateConfig(url) {
    const CACHE_KEY = 'zakat_update_config';
    const TIMEOUT_MS = 5000;
    
    const fetchWithTimeout = async (resource, options) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), options.timeout);
        const response = await fetch(resource, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    };

    try {
        const response = await fetchWithTimeout(url, { timeout: TIMEOUT_MS });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const config = await response.json();
        
        // Validate basic expected fields
        if (config.latestVersion && config.updateMode) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(config));
            return config;
        } else {
            throw new Error('Malformed configuration JSON');
        }
    } catch (error) {
        console.warn('Failed to fetch remote update config, attempting cache...', error);
        
        // Attempt to load from cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                console.error('Failed to parse cached update config', e);
            }
        }
        
        // Failsafe default
        return {
            latestVersion: "1.0.0",
            minimumSupportedVersion: "1.0.0",
            updateMode: "none",
            title: "",
            message: "",
            changelog: [],
            updateUrl: ""
        };
    }
}
