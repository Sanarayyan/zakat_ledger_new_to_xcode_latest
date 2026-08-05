import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

let versionCheckPromise = null;

const VERSION_HUB_URL =
    import.meta.env.VITE_VERSIONHUB_URL ||
    import.meta.env.VITE_PRODUCTION_VERSIONHUB_URL ||
    import.meta.env.VITE_LOCAL_VERSIONHUB_URL;
const VERSION_HUB_APP_KEY = import.meta.env.VITE_VERSIONHUB_APP_KEY;
// The latest VersionHub backend uses its configured default application
// (currently `mobile_app`) when this value is not supplied.
const APPLICATION_NAME = import.meta.env.VITE_VERSIONHUB_APPLICATION_NAME?.trim();

export const versionHubService = {
    /**
     * Checks the VersionHub API for updates.
     * Prevents duplicate requests per app launch by caching the promise.
     */
    checkVersion: async ({ force = false } = {}) => {
        if (!force && versionCheckPromise) {
            return versionCheckPromise;
        }

        versionCheckPromise = (async () => {
            try {
                const platform = Capacitor.getPlatform();
                if (platform !== 'ios' && platform !== 'android') {
                    return null;
                }

                if (!VERSION_HUB_URL || !VERSION_HUB_APP_KEY) {
                    console.warn('VersionHub URL or mobile app key is not configured.');
                    return null;
                }

                const info = await App.getInfo();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const requestBody = {
                    platform,
                    version: info.version || '1.0.0',
                };

                // Only override VersionHub's default when this installation is
                // explicitly configured for a different application.
                if (APPLICATION_NAME) {
                    requestBody.application_name = APPLICATION_NAME;
                }

                const response = await fetch(VERSION_HUB_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-Key': VERSION_HUB_APP_KEY,
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`VersionHub API returned ${response.status}`);
                }

                return response.json();
            } catch (error) {
                console.error('VersionHub check failed safely:', error);
                return null;
            }
        })();

        return versionCheckPromise;
    }
};
