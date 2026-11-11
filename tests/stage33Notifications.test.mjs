import test from 'node:test';
import assert from 'node:assert/strict';
import { syncPrayerAlarms } from '../src/services/prayerAlarmSync.mjs';
import { buildPrayerNotifications, isPrayerNotification } from '../src/services/prayerNotificationPolicy.mjs';
import { createNotificationWrites } from '../src/services/notificationScheduler.mjs';
import { RATHEEB_REMINDER_KEY, updateRatheebReminder } from '../src/services/ratheebReminder.mjs';

const now = new Date(2026, 10, 4, 8);
const calendar = [4, 5].map(day => ({
    date: { gregorian: { year: 2026, month: { number: 11 }, day } },
    timings: { Dhuhr: '12:00', Maghrib: '18:00' },
}));

function alarmFixture(platform, failure) {
    const operations = [];
    const errors = [];
    const pending = new Set([100, 198, 401, 600, 700]);
    const nativePending = new Set();
    const status = platform === 'android' ? {
        status: async () => ({ exactAllowed: true, notificationsAllowed: true }),
        schedule: async ({ alarms }) => {
            operations.push('primary');
            alarms.forEach(n => nativePending.add(n.id));
        },
    } : null;
    let permissionChecks = 0;
    const args = {
        localNotifications: {
            getPending: async () => ({ notifications: [...pending].map(id => ({ id })) }),
            cancel: async ({ notifications }) => {
                const ids = notifications.map(n => n.id);
                operations.push(`cancel:${ids.join(',')}`);
                if (ids.includes(198) && failure === 'cancel') throw new Error('renewal cancellation failed');
                ids.forEach(id => pending.delete(id));
            },
            checkPermissions: async () => {
                permissionChecks++;
                if (failure === 'permission' && (platform === 'android' || permissionChecks > 1)) {
                    throw new Error('renewal permission check failed');
                }
                return { display: failure === 'denied' ? 'denied' : 'granted' };
            },
            schedule: async ({ notifications }) => {
                const renewal = notifications[0].id === 198;
                operations.push(renewal ? 'renewal' : 'primary');
                if (renewal && failure === 'schedule') throw new Error('renewal registration failed');
                if (!renewal && failure === 'primary') throw new Error('primary registration failed');
                notifications.forEach(n => pending.add(n.id));
            },
        },
        adhan: status,
        settings: { notificationsEnabled: true, adhanEnabled: true },
        calendar, now, isStale: () => false, setScheduleError: message => errors.push(message),
        stopTitle: 'Stop Adhan', writeNotification: createNotificationWrites().run,
    };
    return { args, operations, errors, pending, nativePending };
}

for (const platform of ['android', 'ios']) {
    for (const failure of ['cancel', 'permission', 'schedule']) {
        test(`${platform} retains primary alarms when renewal ${failure} fails`, async t => {
            const fixture = alarmFixture(platform, failure);
            const warn = t.mock.method(console, 'warn', () => {});
            await syncPrayerAlarms(fixture.args);
            const registered = platform === 'android' ? fixture.nativePending : fixture.pending;
            assert.deepEqual([...registered].filter(id => id !== 198 && isPrayerNotification(id)),
                buildPrayerNotifications(calendar, now).map(({ id }) => id));
            assert.deepEqual(fixture.operations.slice(0, 3), platform === 'android'
                ? ['primary', 'cancel:100', 'cancel:198'] : ['cancel:100', 'primary', 'cancel:198']);
            assert.ok([401, 600, 700].every(id => fixture.pending.has(id)));
            assert.deepEqual(fixture.errors, []);
            assert.equal(warn.mock.callCount(), 1);
        });
    }
}

test('primary iOS registration failures propagate and prevent advisory registration', async () => {
    const { args, operations } = alarmFixture('ios', 'primary');
    await assert.rejects(syncPrayerAlarms(args), /primary registration failed/);
    assert.deepEqual(operations, ['cancel:100', 'primary']);
});

test('iOS denial reports a primary permission issue and never registers the renewal notice', async () => {
    const { args, operations, errors, pending } = alarmFixture('ios', 'denied');
    await syncPrayerAlarms(args);
    assert.deepEqual(operations, ['cancel:100', 'cancel:198']);
    assert.deepEqual(errors, ['Allow app notifications in phone settings.']);
    assert.deepEqual([...pending], [401, 600, 700]);
});

test('an iOS refresh leaves matching alarms and an in-flight test alert alone', async () => {
    const { args, operations } = alarmFixture('ios');
    args.localNotifications.getPending = async () => ({
        notifications: [...buildPrayerNotifications(calendar, now, true).map(notification => ({
            ...notification, schedule: { at: notification.schedule.at.toISOString() },
            extra: { ...notification.extra, adhanSound: notification.sound },
        })), { id: 999 }],
    });
    await syncPrayerAlarms(args);
    assert.deepEqual(operations, ['renewal']);
});

test('a refresh just after the prayer minute does not cancel its pending delivery', async () => {
    const { args, operations } = alarmFixture('ios');
    const pending = buildPrayerNotifications(calendar, now, true);
    args.now = new Date(pending[0].schedule.at.getTime() + 1000);
    args.localNotifications.getPending = async () => ({
        notifications: pending.map(notification => ({
            ...notification, extra: { ...notification.extra, adhanSound: notification.sound },
        })),
    });
    await syncPrayerAlarms(args);
    assert.deepEqual(operations, ['renewal']);
});

test('deletion waits for in-flight notification writes and rejects later registrations', async () => {
    const writes = createNotificationWrites();
    let finish;
    const pending = new Set();
    const registration = writes.run(async () => {
        await new Promise(resolve => { finish = resolve; });
        pending.add(198);
    });
    const removal = writes.stop().then(() => {
        assert.deepEqual([...pending], [198]);
        pending.clear();
    });
    await assert.rejects(writes.run(() => pending.add(401)), /data is being deleted/);
    assert.equal(pending.size, 0);
    finish();
    await Promise.all([registration, removal]);
    assert.equal(pending.size, 0);
    await assert.rejects(writes.run(() => pending.add(700)), /data is being deleted/);
});

test('Ratheeb leaves the enabled preference off after permission denial or a failed schedule', async () => {
    const storage = new Map();
    const saved = { setItem: storage.set.bind(storage) };
    const api = {
        requestPermissions: async () => ({ display: 'denied' }),
        schedule: async () => { throw new Error('registration failed'); },
    };
    assert.equal(await updateRatheebReminder(api, saved, true, 'en'), false);
    assert.equal(storage.has(RATHEEB_REMINDER_KEY), false);
    api.requestPermissions = async () => ({ display: 'granted' });
    await assert.rejects(updateRatheebReminder(api, saved, true, 'en'), /registration failed/);
    assert.equal(storage.has(RATHEEB_REMINDER_KEY), false);
});

test('Ratheeb persists changes after native success and keeps the fixed local schedule', async () => {
    const storage = new Map();
    const saved = { setItem: storage.set.bind(storage) };
    const api = {
        requestPermissions: async () => ({ display: 'granted' }),
        schedule: async ({ notifications: [notice] }) => {
            assert.equal(notice.id, 401);
            assert.equal(notice.title, 'റാത്തീബുൽ ഹദ്ദാദ് സമയം');
            assert.deepEqual(notice.schedule, { on: { hour: 18, minute: 30 }, repeats: true, allowWhileIdle: true });
            assert.equal(storage.has(RATHEEB_REMINDER_KEY), false);
        },
        cancel: async () => { throw new Error('cancellation failed'); },
    };
    assert.equal(await updateRatheebReminder(api, saved, true, 'ml'), true);
    await assert.rejects(updateRatheebReminder(api, saved, false, 'ml'), /cancellation failed/);
    assert.equal(storage.get(RATHEEB_REMINDER_KEY), 'true');
    api.cancel = async ({ notifications }) => assert.deepEqual(notifications, [{ id: 401 }]);
    assert.equal(await updateRatheebReminder(api, saved, false, 'ml'), true);
    assert.equal(storage.get(RATHEEB_REMINDER_KEY), 'false');
});
