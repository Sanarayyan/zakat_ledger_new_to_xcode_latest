import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPrayerNotifications, isPrayerNotification, shouldKeepExistingPrayerAlarms } from '../src/services/prayerNotificationPolicy.mjs';
import { nextCalendarPrayer } from '../src/services/prayerCalendar.mjs';

test('ordinary offline startup preserves saved alarms, while changed location or disabled reminders allow cleanup', () => {
    assert.equal(shouldKeepExistingPrayerAlarms(true, null, false), true);
    assert.equal(shouldKeepExistingPrayerAlarms(true, null, true), false);
    assert.equal(shouldKeepExistingPrayerAlarms(false, null, false), false);
    assert.equal(shouldKeepExistingPrayerAlarms(true, [{ timings: {} }], false), false);
});
import { updateTestResponse } from '../src/services/updateTestPolicy.mjs';

const day = number => ({ date: { gregorian: { year: '2026', month: { number: 11 }, day: String(number) } },
    timings: { Fajr: '05:00', Sunrise: '06:30', Dhuhr: '12:00', Asr: '15:00', Maghrib: '18:00', Isha: '19:30' } });

test('prayer schedule skips past prayers and Sunrise and stays within seven days', () => {
    const alarms = buildPrayerNotifications(Array.from({ length: 30 }, (_, i) => day(i + 1)), new Date(2026, 10, 4, 13), true);
    assert.equal(alarms.length, 33);
    assert.equal(alarms[0].extra.prayer, 'Asr');
    assert.equal(alarms.at(-1).schedule.at.getDate(), 10);
    assert.equal(new Set(alarms.map(a => a.id)).size, alarms.length);
    assert.ok(alarms.every(a => a.extra.prayer !== 'Sunrise' && a.schedule.at > new Date(2026, 10, 4, 13)));
});

test('muting audio keeps the same future reminder times', () => {
    const now = new Date(2026, 10, 1, 0);
    const loud = buildPrayerNotifications([day(1)], now, true);
    const quiet = buildPrayerNotifications([day(1)], now, false);
    assert.deepEqual(quiet.map(a => a.schedule.at), loud.map(a => a.schedule.at));
    assert.ok(quiet.every(a => a.sound === undefined));
    assert.ok(loud.every(a => a.sound === 'adhan.caf'));
    assert.ok(!isPrayerNotification(900));
    assert.ok(isPrayerNotification(100));
});

test('the remaining prayers retain the same IDs and exact times after the first prayer passes', () => {
    const calendar = [day(1), day(2)];
    const first = buildPrayerNotifications(calendar, new Date(2026, 10, 1, 4, 59, 59), true);
    const refreshed = buildPrayerNotifications(calendar, new Date(2026, 10, 1, 5, 0, 1), true);
    assert.deepEqual(refreshed, first.slice(1));
    assert.ok(refreshed.every(notification => notification.schedule.at.getSeconds() === 0));
});

test('the countdown and Adhan agree on the exact instant in the selected city timezone', () => {
    const calendar = [{ ...day(1), meta: { timezone: 'Asia/Kolkata' } }];
    const now = new Date('2026-11-01T06:29:00Z');
    const next = nextCalendarPrayer(calendar, now);
    assert.equal(next.time, '12:00');
    assert.equal(next.at.toISOString(), '2026-11-01T06:30:00.000Z');
    assert.deepEqual(buildPrayerNotifications(calendar, now, true)[0].schedule.at, next.at);
});

test('month end schedules only supplied dates and malformed times are skipped', () => {
    const calendar = Array.from({ length: 30 }, (_, i) => day(i + 1));
    calendar[29].timings.Asr = 'invalid';
    assert.equal(buildPrayerNotifications(calendar, new Date(2026, 10, 30, 0)).length, 4);
    assert.deepEqual(buildPrayerNotifications(null), []);
});

test('the old version can preview optional and mandatory update responses', () => {
    assert.equal(updateTestResponse('optional', '1.0.1').canContinue, true);
    assert.equal(updateTestResponse('mandatory', '1.0.1').canContinue, false);
    assert.equal(updateTestResponse('mandatory', '1.0.1').latestVersion, '1.0.2');
    assert.equal(updateTestResponse('mandatory', '1.0.1').testOnly, true);
});

test('the update simulation disappears after installing its target version', () => {
    assert.equal(updateTestResponse('optional', '1.0.2'), null);
    assert.equal(updateTestResponse('mandatory', '1.0.2'), null);
    assert.equal(updateTestResponse('none', '1.0.1'), null);
});
