import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { usePrayer } from '../PrayerContext';
import { useLanguage } from '../LanguageContext';
import { createLatestRequest } from '../services/latestRequest.mjs';
import { createNotificationScheduler } from '../services/notificationScheduler.mjs';
import { fetchDailyAyah } from '../services/dailyAyah.mjs';
import { localDateKey } from '../services/prayerCalendar.mjs';

export default function DailyAyahReminders() {
    const { settings, resumeCount } = usePrayer();
    const { lang } = useLanguage();
    const requests = useRef(createLatestRequest(15000));
    const scheduler = useRef(createNotificationScheduler(LocalNotifications));
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        let disposed = false;
        async function refresh() {
            if (!settings.dailyAyahEnabled) { await scheduler.current.replace([600,601,602,603,604,605,606], []); return; }
            if ((await LocalNotifications.checkPermissions()).display !== 'granted' || disposed) return;
            const result = await requests.current.run(async signal => {
                const now = new Date();
                return Promise.all(Array.from({ length: 7 }, async (_, index) => {
                    const at = new Date(now); at.setHours(9, 0, 0, 0);
                    if (at <= now) at.setDate(at.getDate() + 1);
                    at.setDate(at.getDate() + index);
                    const ayahs = await fetchDailyAyah(localDateKey(at), lang, signal);
                    return { id: 600 + index, title: lang === 'ml' ? 'ഇന്നത്തെ ആയത്ത്' : 'Daily Ayah',
                        body: ayahs[1].text, schedule: { at } };
                }));
            });
            if (result && !disposed) await scheduler.current.replace([600,601,602,603,604,605,606], result.value);
        }
        // An offline refresh retains the already-scheduled verses.
        refresh().catch(error => console.warn('Daily Ayah reminders could not be renewed.', error.message));
        return () => { disposed = true; requests.current.cancel(); scheduler.current.cancel(); };
    }, [settings.dailyAyahEnabled, resumeCount, lang]);
    return null;
}
