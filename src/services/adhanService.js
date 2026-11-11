import { Capacitor, registerPlugin } from '@capacitor/core';
export const Adhan = registerPlugin('Adhan');
const PrayerAlerts = registerPlugin('PrayerAlerts');
export const scheduleIOSPrayerAlerts = notifications => PrayerAlerts.schedule({
    notifications: notifications.map(({ id, title, body, sound, schedule, extra }) => ({
        id, title, body, sound, at: schedule.at.getTime(), prayer: extra?.prayer,
    })),
});
export const nativeAdhanEnabled = Capacitor.getPlatform() === 'android'
    && (import.meta.env.MODE !== 'device-test' || import.meta.env.VITE_ADHAN_STOP_RELEASE !== 'false');
