import { buildPrayerNotifications, isPrayerNotification, prayerRenewalNotification } from './prayerNotificationPolicy.mjs';

export async function syncPrayerAlarms({
    localNotifications, adhan, settings, calendar, isStale, setScheduleError, stopTitle,
    writeNotification, schedulePrimary = notifications => localNotifications.schedule({ notifications }), now = new Date(),
}) {
    const { notifications: pending } = await localNotifications.getPending();
    if (isStale()) return;
    const oldPrayers = pending.filter(n => n.id !== 198 && n.id !== 999 && isPrayerNotification(n.id));
    // A refresh at the prayer time must leave a just-due alarm available for delivery.
    const notifications = settings.notificationsEnabled
        ? buildPrayerNotifications(calendar, now, settings.adhanEnabled, 15_000) : [];
    if (isStale()) return;

    let canNotify = true;
    if (adhan) {
        const status = await adhan.status();
        if (isStale()) return;
        canNotify = status.notificationsAllowed;
        if (settings.notificationsEnabled && (!status.exactAllowed || !canNotify)) {
            setScheduleError(!canNotify
                ? 'Allow app notifications in phone settings.'
                : 'Allow Alarms & reminders below for on-time Adhan. Until then, reminders are silent and may be delayed.');
        }
        await writeNotification(() => adhan.schedule({
            alarms: notifications.map(n => ({ id: n.id, at: n.schedule.at.getTime(), title: n.title, body: n.body })),
            sound: !!settings.adhanEnabled && !!settings.notificationsEnabled && status.exactAllowed && canNotify,
            vibrate: !!settings.vibrationEnabled,
            stopTitle,
        }));
        if (!isStale() && oldPrayers.length) await localNotifications.cancel({ notifications: oldPrayers.map(({ id }) => ({ id })) });
    } else {
        if (notifications.length) {
            const permission = await localNotifications.checkPermissions();
            if (isStale()) return;
            canNotify = permission.display === 'granted';
            if (!canNotify) setScheduleError('Allow app notifications in phone settings.');
        }
        const desired = new Set(canNotify ? notifications.map(({ id }) => id) : []);
        const obsolete = oldPrayers.filter(({ id }) => !desired.has(id)).map(({ id }) => ({ id }));
        if (obsolete.length) await localNotifications.cancel({ notifications: obsolete });
        if (isStale()) return;
        if (canNotify && notifications.length) {
            const previous = new Map(oldPrayers.map(notification => [notification.id, notification]));
            const changed = notifications.filter(notification => {
                if (notification.schedule.at <= now) return false;
                const old = previous.get(notification.id);
                return !old || new Date(old.schedule?.at).getTime() !== notification.schedule.at.getTime()
                    || old.extra?.adhanSound !== (notification.sound || '');
            });
            if (changed.length) await writeNotification(() => schedulePrimary(changed));
        }
    }
    if (isStale()) return;

    // Advisory work runs after primary alarms. Either operation can fail independently.
    const renewal = canNotify ? prayerRenewalNotification(notifications, now) : [];
    try {
        if (pending.some(n => n.id === 198)) await localNotifications.cancel({ notifications: [{ id: 198 }] });
        if (!renewal.length || isStale()) return;
        const permission = await localNotifications.checkPermissions();
        if (permission.display === 'granted' && !isStale()) {
            await writeNotification(() => localNotifications.schedule({ notifications: renewal }));
        }
    } catch (error) {
        if (!isStale()) console.warn('Prayer renewal notice could not be updated.', error);
    }
}
