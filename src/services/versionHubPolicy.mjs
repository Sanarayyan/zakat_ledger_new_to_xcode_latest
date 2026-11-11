export function selectVersionHubAction(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return 'no_action';
    if (data.action === 'mandatory' || data.canContinue === false || data.update_required === true || data.update_type === 'mandatory') {
        return 'mandatory';
    }

    if (data.action === 'optional' || data.updateAvailable === true || data.update_available === true) {
        return 'optional';
    }

    return 'no_action';
}

export function validatedStoreUrl(value, platform) {
    if (typeof value !== 'string') return null;
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
        const android = url.hostname === 'play.google.com' && url.pathname === '/store/apps/details'
            && url.searchParams.get('id') === 'com.muslimplus.app';
        const ios = url.hostname === 'apps.apple.com' && /\/id\d+\/?$/.test(url.pathname);
        return ((platform === 'android' && android) || (platform === 'ios' && ios) || (platform === 'web' && (android || ios))) ? url.href : null;
    } catch { return null; }
}

export function versionHubPresentation(data, platform, allowSimulation = false) {
    const action = selectVersionHubAction(data);
    const simulated = allowSimulation && data?.testOnly === true;
    const storeUrl = validatedStoreUrl(data?.storeUrl || data?.store_url, platform);
    return { action, storeUrl, simulated, unavailable: action !== 'no_action' && !storeUrl && !simulated,
        mandatory: action === 'mandatory' && (!!storeUrl || simulated) };
}
