export const ISLAMIC_EVENTS = {
    "1-1": { key: "hijri_new_year", type: "festival" },
    "10-1": { key: "ashura", type: "special_day" },
    "12-3": { key: "mawlid", type: "special_day" },
    "1-9": { key: "start_ramadan", type: "special_day" },
    "27-9": { key: "laylat_al_qadr", type: "special_day" },
    "1-10": { key: "eid_al_fitr", type: "festival" },
    "9-12": { key: "day_arafah", type: "special_day" },
    "10-12": { key: "eid_al_adha", type: "festival" }
};

export const EVENT_MESSAGES = {
    "hijri_new_year": { title: "✨ Islamic New Year", body: "Welcome the new Hijri year with reflection and prayers." },
    "ashura": { title: "🌙 Day of Ashura", body: "A blessed day for fasting and remembrance." },
    "mawlid": { title: "✨ Mawlid al-Nabi", body: "Remembering the birth and life of the Prophet ﷺ." },
    "start_ramadan": { title: "🌙 Ramadan Mubarak", body: "The blessed month of fasting has arrived." },
    "laylat_al_qadr": { title: "✨ Laylat al-Qadr", body: "Seek the Night of Decree with abundant prayers." },
    "eid_al_fitr": { title: "🌙 Eid al-Fitr Mubarak!", body: "May Allah accept your fasting and worship." },
    "day_arafah": { title: "🕋 Day of Arafah Today", body: "A beautiful day for dua and reflection." },
    "eid_al_adha": { title: "🕋 Eid al-Adha Mubarak!", body: "May Allah accept your sacrifices and prayers." }
};


export function eventNotifications(days, now = new Date()) {
    return days.flatMap((day, index) => {
        const key = `${Number(day.hijri?.day)}-${Number(day.hijri?.month?.number)}`;
        const event = ISLAMIC_EVENTS[key];
        if (!event) return [];
        const message = EVENT_MESSAGES[event.key];
        return [false, true].flatMap((tomorrow, offset) => {
            const at = new Date(day.at); at.setHours(9, 0, 0, 0);
            if (tomorrow) at.setDate(at.getDate() - 1);
            return at > now ? [{ id: 700 + index * 2 + offset, title: `${tomorrow ? 'Tomorrow: ' : ''}${message.title}`,
                body: message.body, schedule: { at } }] : [];
        });
    });
}
