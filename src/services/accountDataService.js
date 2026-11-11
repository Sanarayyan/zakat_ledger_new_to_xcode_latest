import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Adhan, nativeAdhanEnabled } from './adhanService';
import { appStorage, flushStorage } from './appStorage';
import { clearSession, signOutGoogle } from './authService';
import { API_BASE_URL } from '../config/api';
import { notificationWrites } from './notificationScheduler.mjs';
import { createDataDeletion } from './dataDeletion.mjs';

const journal = {
    getItem: async key => (await Preferences.get({ key })).value,
    setItem: async (key, value) => { await Preferences.set({ key, value }); },
    removeItem: async key => { await Preferences.remove({ key }); },
};

export const accountDataDeletion = createDataDeletion({
    journal,
    async deleteCloud(token, deletionId) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(`${API_BASE_URL}/api/account/data/`, {
                method: 'DELETE', cache: 'no-store', signal: controller.signal,
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ deletionId }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(response.status === 401
                ? 'Cloud deletion is not confirmed. Sign in again to retry. Local data has been retained.'
                : data.error || 'Cloud deletion is unavailable. Retry when connected.');
            return data;
        } finally { clearTimeout(timer); }
    },
    async cleanupReminders() {
        await notificationWrites.stop();
        if (Capacitor.isNativePlatform()) {
            const pending = await LocalNotifications.getPending();
            if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map(({ id }) => ({ id })) });
            await LocalNotifications.removeAllDeliveredNotifications();
        }
        if (nativeAdhanEnabled) {
            await Adhan.configure({ sound: false, vibrate: false });
            await Adhan.schedule({ alarms: [], sound: false, vibrate: false });
            await Adhan.stop();
        }
    },
    async clearLocal() {
        await signOutGoogle().catch(() => {});
        await clearSession();
        // Remove the rating preference before clearing browser storage, which can also contain the journal.
        await Preferences.remove({ key: 'zakat_app_rating_data' });
        appStorage.clear();
        await flushStorage();
        await appStorage.clearLegacy?.();
    },
});
