export function versionHubEndpoint(env) {
    const value = env.VITE_PRODUCTION_VERSIONHUB_URL || env.VITE_LOCAL_VERSIONHUB_URL || env.VITE_VERSIONHUB_URL;
    if (!value) return null;
    const url = new URL(value);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    const production = env.MODE === 'production';
    if (url.username || url.password || (url.protocol !== 'https:' && !(local && !production && url.protocol === 'http:')) || (production && local)) {
        throw new Error('VersionHub requires an HTTPS endpoint; HTTP is allowed only for local developer tests.');
    }
    return url.href;
}
