export const RATHEEB_REMINDER_ID = 401;
export const RATHEEB_REMINDER_KEY = 'rh_reminder_enabled';

export async function updateRatheebReminder(api, storage, enabled, lang) {
    if (enabled) {
        const permission = await api.requestPermissions();
        if (permission.display !== 'granted') return false;
        await api.schedule({ notifications: [{
            id: RATHEEB_REMINDER_ID,
            title: lang === 'ml' ? 'റാത്തീബുൽ ഹദ്ദാദ് സമയം' : 'Ratheeb al-Haddad Time',
            body: lang === 'ml' ? 'ആത്മീയ ശാന്തിക്കായി ഇന്നത്തെ റാത്തീബ് ഓതാൻ സമയമായി.'
                : "Time to recite today's Ratheeb al-Haddad for peace and protection.",
            schedule: { on: { hour: 18, minute: 30 }, repeats: true, allowWhileIdle: true },
        }] });
    } else {
        await api.cancel({ notifications: [{ id: RATHEEB_REMINDER_ID }] });
    }
    storage.setItem(RATHEEB_REMINDER_KEY, String(enabled));
    return true;
}
