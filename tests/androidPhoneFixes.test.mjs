import test from 'node:test';
import assert from 'node:assert/strict';
import { searchCities } from '../src/services/citySearch.mjs';
import { gregorianDay, orderedHijriMonth, shiftHijriMonth } from '../src/services/hijriMonth.mjs';
import { smoothHeading } from '../src/features/qibla/qiblaMath.mjs';

test('city search forwards full names and returns named, distinguishable selectable results', async t => {
    const controller = new AbortController();
    t.mock.method(globalThis, 'fetch', async (url, { signal }) => {
        assert.equal(signal, controller.signal);
        assert.equal(new URL(url).searchParams.get('name'), 'New Delhi');
        return new Response(JSON.stringify({ results: [
            { id: 1, name: 'New Delhi', admin1: 'Delhi', country: 'India', latitude: 28.6, longitude: 77.2 },
            { id: 2, name: '12345', latitude: 28, longitude: 77 },
            { id: 3, name: 'Delhi', latitude: 228, longitude: 77 },
        ] }));
    });
    assert.deepEqual(await searchCities('  New   Delhi ', { signal: controller.signal }), [
        { id: 1, city: 'New Delhi', region: 'Delhi, India', lat: 28.6, lng: 77.2, source: 'manual' },
    ]);
});

test('empty city results differ from service failures and a subsequent search can recover', async t => {
    const responses = [
        new Response('{}'),
        new Response('', { status: 503 }),
        new Response(JSON.stringify({ results: [{ id: 1, name: 'Kochi', latitude: 9.9, longitude: 76.3 }] })),
    ];
    const fetchMock = t.mock.method(globalThis, 'fetch', async () => responses.shift());
    assert.deepEqual(await searchCities('K'), []);
    assert.equal(fetchMock.mock.callCount(), 0);
    assert.deepEqual(await searchCities('Kochi'), []);
    await assert.rejects(searchCities('Kochi'));
    assert.equal((await searchCities('Kochi'))[0].city, 'Kochi');
});

const dates = Array.from({ length: 29 }, (_, index) => {
    const utc = new Date(Date.UTC(2026, 11, 23 + index));
    return {
        gregorian: { date: `${utc.getUTCDate()}-${utc.getUTCMonth() + 1}-${utc.getUTCFullYear()}` },
        hijri: { day: String(index + 1), month: { number: '12' }, year: '1448' },
    };
});

test('Hijri month sorts by Gregorian dates across a Gregorian year boundary and aligns weekdays', () => {
    assert.deepEqual(orderedHijriMonth(dates.toReversed(), 12, 1448), dates);
    assert.equal(gregorianDay(dates[0].gregorian.date).getUTCDay(), 3);
    assert.deepEqual(shiftHijriMonth({ month: 12, year: 1448 }, 1), { month: 1, year: 1449 });
    assert.deepEqual(shiftHijriMonth({ month: 1, year: 1449 }, -1), { month: 12, year: 1448 });
});

test('Hijri grid rejects missing, impossible and duplicate dates', () => {
    assert.equal(gregorianDay('31-02-2026'), null);
    assert.throws(() => orderedHijriMonth(dates.slice(1), 12, 1448), /Incomplete/);
    assert.throws(() => orderedHijriMonth([dates[0], ...dates.slice(0, -1)], 12, 1448), /Discontinuous/);
    assert.throws(() => orderedHijriMonth(dates, 1, 1448), /Invalid/);
});

test('compass follows the shortest arc across north, even after multiple full turns', () => {
    assert.equal(smoothHeading(null, 359), -1);
    assert.equal(smoothHeading(359, 1, 0.5), 360);
    assert.equal(smoothHeading(721, 359, 0.5), 720);
    assert.equal(smoothHeading(-1, 1, 0.5), 0);
});
