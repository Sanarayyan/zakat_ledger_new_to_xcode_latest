export const localDateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const prayerContextKey = settings => JSON.stringify([settings?.location?.lat, settings?.location?.lng, settings?.school ?? 0]);
export function calendarDay(calendar, date = new Date()) {
    return calendar?.find(day => {
        const value = day?.date?.gregorian;
        return Number(value?.year) === date.getFullYear() && Number(value?.month?.number) === date.getMonth() + 1 && Number(value?.day) === date.getDate();
    });
}
export function nextCalendarPrayer(calendar, now = new Date()) {
    let next = null;
    for (let offset = -2; offset <= 2; offset++) {
        const date = new Date(now); date.setDate(date.getDate() + offset);
        const day = calendarDay(calendar, date);
        for (const name of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
            const at = prayerInstant(day, name);
            if (at && at >= now && (!next || at < next.at)) {
                next = { name, at, time: day.timings[name].split(' ')[0], diff: (at - now) / 60000 };
            }
        }
    }
    return next;
}

// Aladhan timings are wall-clock times in the selected city's zone, not the phone's zone.
const zoneFormatters = new Map();
function zonedParts(zone, instant) {
    if (!zoneFormatters.has(zone)) {
        zoneFormatters.set(zone, new Intl.DateTimeFormat('en-US', {
            timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric',
        }));
    }
    return Object.fromEntries(zoneFormatters.get(zone).formatToParts(instant)
        .map(part => [part.type, Number(part.value)]));
}

export function prayerDateInZone(calendar, now = new Date()) {
    const zone = calendar?.[0]?.meta?.timezone;
    if (!zone) return new Date(now);
    try {
        const { year, month, day } = zonedParts(zone, now);
        return new Date(year, month - 1, day, 12);
    } catch { return new Date(now); }
}

export function prayerInstant(day, name) {
    const date = day?.date?.gregorian;
    const raw = day?.timings?.[name];
    if (!date?.month || typeof raw !== 'string' || !/^(?:[01]?\d|2[0-3]):[0-5]\d(?:\s.*)?$/.test(raw)) return null;
    const [hours, minutes] = raw.split(' ')[0].split(':').map(Number);
    const year = Number(date.year), month = Number(date.month.number) - 1, dayOfMonth = Number(date.day);
    const local = new Date(year, month, dayOfMonth, hours, minutes);
    if (local.getFullYear() !== year || local.getMonth() !== month || local.getDate() !== dayOfMonth) return null;
    const zone = day.meta?.timezone;
    if (!zone) return local; // Older cached calendars and fixtures may omit provider metadata.
    try {
        const desired = Date.UTC(year, month, dayOfMonth, hours, minutes);
        let candidate = desired;
        for (let attempt = 0; attempt < 3; attempt++) {
            const parts = zonedParts(zone, candidate);
            const actual = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
            if (desired === actual) return new Date(candidate);
            candidate += desired - actual;
        }
    } catch { /* Invalid or unresolvable time zones must not arm an alarm. */ }
    return null;
}
