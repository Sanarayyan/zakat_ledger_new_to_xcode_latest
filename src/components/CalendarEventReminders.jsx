import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { appStorage } from '../services/appStorage';
import { usePrayer } from '../PrayerContext';
import { createLatestRequest, fetchJSON } from '../services/latestRequest.mjs';
import { createNotificationScheduler } from '../services/notificationScheduler.mjs';
import { eventNotifications } from '../services/calendarEvents.mjs';

export default function CalendarEventReminders() {
    const { resumeCount } = usePrayer();
    const [revision, setRevision] = useState(0);
    const requests = useRef(createLatestRequest(15000));
    const scheduler = useRef(createNotificationScheduler(LocalNotifications));
    useEffect(() => {
        const changed = () => setRevision(value => value + 1);
        window.addEventListener('event-reminders-change', changed);
        return () => window.removeEventListener('event-reminders-change', changed);
    }, []);
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        let disposed = false;
        const ids = Array.from({ length: 14 }, (_, i) => 700 + i);
        async function refresh() {
            if (appStorage.getItem('event_notifications') !== 'true') { await scheduler.current.replace(ids, []); return; }
            if ((await LocalNotifications.checkPermissions()).display !== 'granted' || disposed) return;
            const result = await requests.current.run(signal => Promise.all(Array.from({ length: 7 }, async (_, index) => {
                const at = new Date(); at.setDate(at.getDate() + index);
                const date = `${at.getDate()}-${at.getMonth() + 1}-${at.getFullYear()}`;
                const data = await fetchJSON(`https://api.aladhan.com/v1/gToH?date=${date}`, { signal });
                const hijri = data.data?.hijri;
                if (data.code !== 200 || !hijri || !Number(hijri.day) || !Number(hijri.month?.number) || !Number(hijri.year)) throw new Error('Invalid event calendar');
                return { at, hijri };
            })));
            if (result && !disposed) await scheduler.current.replace(ids, eventNotifications(result.value));
        }
        refresh().catch(error => console.warn('Event reminders could not be renewed.', error.message));
        return () => { disposed = true; requests.current.cancel(); scheduler.current.cancel(); };
    }, [resumeCount, revision]);
    return null;
}
