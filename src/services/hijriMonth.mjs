export function gregorianDay(date) {
    const parts = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(date ?? '');
    if (!parts) return null;
    const [, rawDay, rawMonth, rawYear] = parts;
    const [day, month, year] = [rawDay, rawMonth, rawYear].map(Number);
    const utc = new Date(Date.UTC(year, month - 1, day));
    return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day ? utc : null;
}

export function orderedHijriMonth(data, month, year) {
    if (!Array.isArray(data) || ![29, 30].includes(data.length)) throw new Error('Incomplete Hijri month');
    const days = data.map(day => ({
        day, utc: gregorianDay(day?.gregorian?.date), hijriDay: Number(day?.hijri?.day),
    }));
    if (days.some(({ day, utc }) => !utc || Number(day?.hijri?.month?.number) !== month || Number(day?.hijri?.year) !== year)) {
        throw new Error('Invalid calendar dates');
    }
    days.sort((a, b) => a.utc - b.utc);
    if (days.some(({ utc, hijriDay }, index) => hijriDay !== index + 1 || utc - days[0].utc !== index * 86400000)) {
        throw new Error('Discontinuous calendar dates');
    }
    return days.map(({ day }) => day);
}

export function shiftHijriMonth({ month, year }, direction) {
    const shifted = month - 1 + direction;
    return { month: ((shifted % 12 + 12) % 12) + 1, year: year + Math.floor(shifted / 12) };
}
