import { prayerDateInZone } from './prayerCalendar.mjs';
import { createRequestScope } from './requestScope.mjs';

const PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const validTime = value => typeof value === 'string' && /^(?:[01]?\d|2[0-3]):[0-5]\d(?:\s.*)?$/.test(value);

function validatedMonth(body, year, month) {
    const count = new Date(year, month + 1, 0).getDate();
    if (body?.code !== 200 || !Array.isArray(body.data) || body.data.length !== count ||
        !body.data.every((day, index) => {
            const date = day?.date?.gregorian;
            return Number(date?.year) === year && Number(date?.month?.number) === month + 1 &&
                Number(date?.day) === index + 1 && PRAYERS.every(prayer => validTime(day?.timings?.[prayer]));
        })) throw new Error('Prayer times service returned incomplete or invalid data. Please retry.');
    return body.data;
}

export function createPrayerTimesService({ endpoint = 'https://api.aladhan.com/v1/calendar', timeoutMs = 10000 } = {}) {
    const scope = createRequestScope();
    let active;
    function cancel() {
        scope.invalidate();
        active?.abort();
        active = null;
    }
    return {
        cancel,
        async load(settings, now = new Date()) {
            cancel();
            const controller = new AbortController();
            active = controller;
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                return await scope.run(async () => {
                    const { lat, lng } = settings.location || {};
                    const school = settings.school ?? 0;
                    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180 || ![0, 1].includes(school)) {
                        throw new Error('Select a valid prayer location and school.');
                    }
                    const url = new URL(endpoint);
                    // Omit the method so AlAdhan picks the closest authority for these coordinates.
                    url.search = new URLSearchParams({ latitude: String(lat), longitude: String(lng), school: String(school),
                        month: String(now.getMonth() + 1), year: String(now.getFullYear()) }).toString();
                    async function loadMonth(date) {
                        url.searchParams.set('month', String(date.getMonth() + 1));
                        url.searchParams.set('year', String(date.getFullYear()));
                        const response = await fetch(url, { signal: controller.signal });
                        if (!response.ok) throw new Error('Prayer times service is unavailable. Please retry.');
                        return validatedMonth(await response.json(), date.getFullYear(), date.getMonth());
                    }
                    const deviceMonth = await loadMonth(now);
                    const selectedDate = prayerDateInZone(deviceMonth, now);
                    const monthDifference = (selectedDate.getFullYear() - now.getFullYear()) * 12 +
                        selectedDate.getMonth() - now.getMonth();
                    const current = monthDifference ? await loadMonth(selectedDate) : deviceMonth;
                    const timings = current[selectedDate.getDate() - 1].timings;
                    let calendar = monthDifference > 0 ? deviceMonth.concat(current) : current;
                    if (current.length - selectedDate.getDate() < 7) {
                        const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
                        try {
                            calendar = calendar.concat(monthDifference < 0 ? deviceMonth : await loadMonth(next));
                        } catch {
                            return { calendar, timings, warning: 'Prayer times are available through the end of this month. Reopen online or retry to renew them.' };
                        }
                    }
                    return { calendar, timings };
                });
            } catch (error) {
                if (error.name === 'AbortError') throw new Error('Prayer times request timed out. Please retry.');
                throw error;
            } finally {
                clearTimeout(timer);
                if (active === controller) active = null;
            }
        },
    };
}
