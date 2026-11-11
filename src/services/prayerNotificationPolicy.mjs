import { prayerInstant } from './prayerCalendar.mjs';
const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export function buildPrayerNotifications(calendar, now = new Date(), sound = false, deliveryGraceMs = 0) {
    if (!Array.isArray(calendar)) return [];
    const end = new Date(now); end.setHours(0, 0, 0, 0); end.setDate(end.getDate() + 7);
    return calendar.flatMap(day => prayers.flatMap((prayer, index) => {
        const at = prayerInstant(day, prayer);
        if (!at || at.getTime() <= now.getTime() - deliveryGraceMs || at >= end) return [];
        const { year, month, day: date } = day.date.gregorian;
        const dayNumber = Math.floor(Date.UTC(Number(year), Number(month.number) - 1, Number(date)) / 86400000);
        // Keep an alarm's ID stable when earlier prayers drop out of the seven-day window.
        const slot = ((dayNumber % 9) + 9) % 9;
        return [{
            id: 100 + slot * prayers.length + index,
            title: `Time for ${prayer} Prayer`, body: `The time for ${prayer} has begun.`,
            schedule: { at, allowWhileIdle: true }, sound: sound ? 'adhan.caf' : undefined,
            actionTypeId: 'PRAYER_ALERT', extra: { prayer },
        }];
    })).sort((a, b) => a.schedule.at - b.schedule.at).slice(0, 35);
}

export const isPrayerNotification = id => (id >= 100 && id <= 144) || id === 198 || id === 999;

export const shouldKeepExistingPrayerAlarms = (notificationsEnabled, calendar, contextChanged) =>
    notificationsEnabled && !calendar && !contextChanged;

export function buildFollowUpNotifications(timings, completed, now = new Date(), day) {
    return ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].flatMap((prayer, index) => {
        if (completed?.[prayer.toLowerCase()] === true) return [];
        const raw = timings?.[prayer];
        if (!/^\d{1,2}:\d{2}(?:\s.*)?$/.test(raw || '')) return [];
        const [h, m] = raw.split(' ')[0].split(':').map(Number);
        if (h > 23 || m > 59) return [];
        const at = day ? prayerInstant(day, prayer) : new Date(now);
        if (!at) return [];
        if (day) at.setTime(at.getTime() + 45 * 60000);
        else at.setHours(h, m + 45, 0, 0);
        return at > now ? [{ id: index + 11, title: 'Prayer Reminder',
            body: `You haven't marked ${prayer.toUpperCase()} as prayed yet.`, schedule: { at } }] : [];
    });
}

export function prayerRenewalNotification(notifications, now = new Date()) {
    const last = notifications.at(-1)?.schedule.at;
    if (!last) return [];
    const at = new Date(last); at.setHours(9, 0, 0, 0);
    if (at <= now) return [];
    return [{ id: 198, title: 'Renew prayer reminders', body: 'Open Muslim Plus while online to renew the next seven days of prayer reminders.', schedule: { at } }];
}
