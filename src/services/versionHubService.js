import { versionHubEndpoint } from './versionHubEndpoint.mjs';
import { appStorage } from './appStorage';
import { App } from '@capacitor/app';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { UPDATE_TEST_KEY, updateTestResponse } from './updateTestPolicy.mjs';

let versionCheckPromise = null;
let checkingVersion = false;

export const versionHubService = {
    /**
     * Checks the VersionHub API for updates.
     * Uses CapacitorHttp on native iOS/Android to bypass CORS.
     * Prevents duplicate requests per app launch by caching the promise.
     */
    checkVersion: async ({ retry = false } = {}) => {
        if (retry && !checkingVersion) versionCheckPromise = null;
        if (versionCheckPromise) {
            return versionCheckPromise;
        }

        checkingVersion = true;
        versionCheckPromise = (async () => {
            try {
                const platform = Capacitor.getPlatform();
                console.log('VersionHub Platform:', platform);

                let current_version = '1.0.0';
                let current_build_number = 1;

                if (platform !== 'web') {
                    try {
                        const info = await App.getInfo();
                        console.log('VersionHub App Info:', info);
                        current_version = info.version || current_version;
                        current_build_number = parseInt(info.build, 10) || current_build_number;
                    } catch (e) {
                        console.warn('Capacitor App plugin error, using default version.', e);
                    }
                }

                console.log('VersionHub current_version:', current_version);
                console.log('VersionHub current_build_number:', current_build_number);
                if (import.meta.env.MODE === 'device-test' && import.meta.env.VITE_VERSIONHUB_LIVE_TEST !== 'true') {
                    const action = appStorage.getItem(UPDATE_TEST_KEY);
                    if (action) return updateTestResponse(action, current_version);
                }

                const payload = {
                    application_name: import.meta.env.VITE_VERSIONHUB_APPLICATION_NAME || 'muslim_plus',
                    platform: platform,
                    version: current_version,
                    current_version: current_version,
                    current_build_number: current_build_number
                };

                const url = versionHubEndpoint(import.meta.env);

                if (!url) {
                    console.warn('[VersionHub] URL not configured.');
                    return null;
                }

                console.log('[VersionHub] request body:', payload);

                const headers = {
                    'Content-Type': 'application/json',
                    'X-App-Key': import.meta.env.VITE_VERSIONHUB_APP_KEY || '',
                    'x-api-key': import.meta.env.VITE_VERSIONHUB_APP_KEY || ''
                };

                let data = null;

                if (Capacitor.isNativePlatform()) {
                    // CapacitorHttp makes a true native HTTP call — bypasses CORS on iOS/Android
                    const response = await CapacitorHttp.request({
                        method: 'POST',
                        url: url,
                        headers: headers,
                        data: payload,
                        connectTimeout: 5000,
                        readTimeout: 5000,
                        disableRedirects: true,
                    });
                    console.log('[VersionHub] response status:', response.status);
                    if (response.status < 200 || response.status >= 300) {
                        throw new Error(`VersionHub API returned ${response.status}`);
                    }
                    data = response.data;
                } else {
                    // Fallback: use fetch on web browser
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    try {
                        const response = await fetch(url, {
                            method: 'POST', headers, body: JSON.stringify(payload), redirect: 'error', signal: controller.signal
                        });
                        console.log('[VersionHub] response status:', response.status);
                        if (!response.ok) throw new Error(`VersionHub API returned ${response.status}`);
                        data = await response.json();
                    } finally { clearTimeout(timeoutId); }
                }

                console.log('[VersionHub] response body:', data);
                const isAvailable = data.updateAvailable ?? data.update_available;
                const action = data.action || (data.update_required ? 'mandatory' : (isAvailable ? 'optional' : 'none'));
                console.log('[VersionHub] selected popup action:', action);
                return data;

            } catch (error) {
                console.error('[VersionHub] Check Failed:', error.message || error);
                // Safe failure: return null to continue app launch, never crash
                return null;
            } finally { checkingVersion = false; }
        })();

        return versionCheckPromise;
    }
};
