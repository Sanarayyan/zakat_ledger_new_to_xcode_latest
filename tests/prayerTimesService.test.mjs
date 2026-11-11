import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createPrayerTimesService } from '../src/services/prayerTimesService.mjs';

const date = new Date(2026, 10, 9, 12);
const settings = latitude => ({ location: { lat: latitude, lng: 76 }, school: 0 });
// Disposable HTTP test fixtures exercise the actual fetch/parser, never a production prayer-time fallback.
const calendar = fajr => ({ code: 200, data: Array.from({ length: 30 }, (_, index) => ({
    date: { gregorian: { day: String(index + 1), month: { number: 11 }, year: '2026' } },
    timings: { Fajr: fajr, Sunrise: '06:15 (IST)', Dhuhr: '12:15 (IST)', Asr: '15:15 (IST)', Maghrib: '18:15 (IST)', Isha: '19:15 (IST)' },
})) });
async function endpoint(t, handler) {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    t.after(() => { server.closeAllConnections(); server.close(); });
    return `http://127.0.0.1:${server.address().port}/calendar`;
}
test('latest location wins when the old request is interrupted or responds later', async t => {
    let releaseOld;
    const oldArrived = new Promise(resolve => { releaseOld = resolve; });
    let oldResponse;
    const url = await endpoint(t, (request, response) => {
        response.setHeader('Content-Type', 'application/json');
        const query = new URL(request.url, 'http://localhost').searchParams;
        assert.equal(query.has('method'), false);
        assert.equal(query.get('school'), '0');
        if (query.get('latitude') === '10') { oldResponse = response; releaseOld(); }
        else response.end(JSON.stringify(calendar('05:45 (IST)')));
    });
    const service = createPrayerTimesService({ endpoint: url });
    const old = service.load(settings(10), date); await oldArrived;
    const latest = await service.load(settings(11), date);
    oldResponse.end(JSON.stringify(calendar('04:00 (IST)')));
    assert.equal(await old, null);
    assert.equal(latest.value.timings.Fajr, '05:45 (IST)');
});
test('cancelling a request prevents late data and late errors reaching the caller', async t => {
    let arrived;
    const started = new Promise(resolve => { arrived = resolve; });
    const url = await endpoint(t, (_request, _response) => arrived());
    const service = createPrayerTimesService({ endpoint: url });
    const pending = service.load(settings(10), date); await started;
    service.cancel(); assert.equal(await pending, null);
});
test('timeouts reject clearly and a later request can recover', async t => {
    let requests = 0;
    const url = await endpoint(t, (_request, response) => {
        if (++requests > 1) response.end(JSON.stringify(calendar('05:00')));
    });
    const service = createPrayerTimesService({ endpoint: url, timeoutMs: 100 });
    await assert.rejects(service.load(settings(10), date), /timed out/);
    assert.equal((await service.load(settings(10), date)).value.timings.Fajr, '05:00');
});
test('HTTP errors, invalid JSON, incomplete dates/times and invalid coordinates are rejected', async t => {
    const bodies = [null, 'broken json', { code: 200, data: [] }, calendar('25:00'), calendar('05:00')];
    bodies[4].data[8].date.gregorian.year = '2025';
    const url = await endpoint(t, (_request, response) => {
        const body = bodies.shift(); response.statusCode = body === null ? 503 : 200;
        response.end(typeof body === 'string' ? body : JSON.stringify(body));
    });
    const service = createPrayerTimesService({ endpoint: url });
    for (let index = 0; index < 5; index++) await assert.rejects(service.load(settings(10), date));
    await assert.rejects(service.load(settings(91), date), /valid prayer location/);
});


test('calendar loader fills seven days across December to January', async t => {
    const url = await endpoint(t, (request, response) => {
        const query = new URL(request.url, 'http://localhost').searchParams;
        const month = Number(query.get('month')), year = Number(query.get('year'));
        response.end(JSON.stringify({ code: 200, data: Array.from({ length:31 }, (_,i) => ({
            date:{gregorian:{day:String(i+1),month:{number:month},year:String(year)}},
            timings:{Fajr:'05:00',Sunrise:'06:15',Dhuhr:'12:15',Asr:'15:15',Maghrib:'18:15',Isha:'19:15'}
        })) }));
    });
    const result = await createPrayerTimesService({endpoint:url}).load(settings(10),new Date(2026,11,31));
    assert.equal(result.value.calendar.length,62);
    assert.equal(result.value.calendar[31].date.gregorian.year,'2027');
});

test('a failed next-month renewal still returns verified current-month timings', async t => {
    const url = await endpoint(t, (request, response) => {
        const month = new URL(request.url, 'http://localhost').searchParams.get('month');
        if (month === '11') response.end(JSON.stringify(calendar('05:00')));
        else { response.statusCode = 503; response.end(); }
    });
    const result = await createPrayerTimesService({ endpoint: url }).load(settings(10), new Date(2026, 10, 30));
    assert.equal(result.value.timings.Fajr, '05:00');
    assert.equal(result.value.calendar.length, 30);
    assert.match(result.value.warning, /end of this month/);
});

test('rejects invalid future days before they can replace an existing schedule', async t => {
    const invalid = calendar('05:00');
    invalid.data[10].date.gregorian.day = '12';
    const url = await endpoint(t, (_request, response) => response.end(JSON.stringify(invalid)));
    await assert.rejects(createPrayerTimesService({ endpoint: url }).load(settings(10), date), /invalid data/);
});

test('loads the selected city month when it differs from the device at year rollover', async t => {
    const now = new Date('2026-12-31T22:00:00Z');
    const deviceIsJanuary = now.getMonth() === 0;
    const timezone = deviceIsJanuary ? 'America/Los_Angeles' : 'Pacific/Kiritimati';
    const url = await endpoint(t, (request, response) => {
        const params = new URL(request.url, 'http://localhost').searchParams;
        const month = Number(params.get('month')), year = Number(params.get('year'));
        response.end(JSON.stringify({ code: 200, data: Array.from({ length: 31 }, (_, index) => ({
            date: { gregorian: { day: index + 1, month: { number: month }, year } },
            meta: { timezone },
            timings: { Fajr: month === 1 ? '05:11' : '04:55', Sunrise: '06:15', Dhuhr: '12:15', Asr: '15:15', Maghrib: '18:15', Isha: '19:15' },
        })) }));
    });
    const result = await createPrayerTimesService({ endpoint: url }).load(settings(10), now);
    assert.equal(result.value.timings.Fajr, deviceIsJanuary ? '04:55' : '05:11');
});
