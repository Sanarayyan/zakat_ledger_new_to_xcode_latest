import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

let versionCheckPromise = null;

export const versionHubService = {
    /**
     * Checks the VersionHub API for updates.
     * Prevents duplicate requests per app launch by caching the promise.
     */
    checkVersion: async () => {
        if (versionCheckPromise) {
            return versionCheckPromise;
        }

        versionCheckPromise = (async () => {
            try {
                const detectedPlatform = Capacitor.getPlatform();
                const platform =
                    detectedPlatform === 'web'
                    ? 'ios'
                    : detectedPlatform;
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

                const payload = {
                    application_name: 'muslim-plus',
                    platform: platform,
                    current_version: current_version,
                    current_build_number: current_build_number
                };
                
                const url = import.meta.env.VITE_PRODUCTION_VERSIONHUB_URL || import.meta.env.VITE_LOCAL_VERSIONHUB_URL;
                if (!url) {
                    console.warn('VersionHub URL not configured.');
                    return null;
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds max

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`VersionHub API returned ${response.status}`);
                }

                const data = await response.json();
                return data;

            } catch (error) {
                console.error('VersionHub Check Failed:', error);
                // Safe failure: return null to continue app launch, never crash
                return null;
            }
        })();

        return versionCheckPromise;
    }
};
