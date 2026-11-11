import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { readStoredJSON } from '../src/services/storedJson.mjs';
import { createLatestRequest, fetchJSON } from '../src/services/latestRequest.mjs';
import { buildPrayerNotifications, isPrayerNotification, buildFollowUpNotifications, prayerRenewalNotification } from '../src/services/prayerNotificationPolicy.mjs';
import { calendarDay, nextCalendarPrayer, prayerContextKey } from '../src/services/prayerCalendar.mjs';
import { createNotificationScheduler } from '../src/services/notificationScheduler.mjs';
import { createRatingTransaction } from '../src/services/ratingTransaction.mjs';
import { versionHubEndpoint } from '../src/services/versionHubEndpoint.mjs';
import { eventNotifications } from '../src/services/calendarEvents.mjs';
import { createPositionPersistence } from '../src/services/positionPersistence.mjs';
import { dailyAyahNumber } from '../src/services/dailyAyah.mjs';

function storage(entries = []) {
    const data = new Map(entries);
    return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
const timings = fajr => ({ Fajr: fajr, Sunrise: '06:30', Dhuhr: '12:00', Asr: '15:00', Maghrib: '18:00', Isha: '20:00' });
const day = (year, month, date, fajr = '05:00') => ({ date: { gregorian: { year, month: { number: month }, day: date } }, timings: timings(fajr) });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test('malformed and wrong-shaped saved data retains original copies across repeated recovery', () => {
    const store = storage([['umrah_bookmarks', '{']]);
    assert.deepEqual(readStoredJSON(store, 'umrah_bookmarks', []), []);
    assert.equal(store.getItem('umrah_bookmarks'), '{');
    readStoredJSON(store, 'umrah_bookmarks', []);
    assert.deepEqual(JSON.parse(store.getItem('data_recovery_umrah_bookmarks')), ['{']);
    store.setItem('umrah_bookmarks', '"wrong"');
    assert.deepEqual(readStoredJSON(store, 'umrah_bookmarks', []), []);
    assert.deepEqual(JSON.parse(store.getItem('data_recovery_umrah_bookmarks')), ['{', '"wrong"']);
    for (const [key, value, fallback] of [['prayer_settings', {location:{city:12}}, {}], ['smart_prayer_tracker_data', {completed:'bad'}, {}], ['tasbih_sessions', [null], []], ['tasbih_sessions', ['bad'], []]]) {
        store.setItem(key, JSON.stringify(value));
        assert.deepEqual(readStoredJSON(store, key, fallback), fallback);
        assert.ok(store.getItem('data_recovery_' + key));
    }
});
test('failed recovery write stops fallback instead of losing the only original', () => {
    const store = storage([['dua_favorites', '{']]);
    store.setItem = () => { throw new Error('disk full'); };
    assert.throws(() => readStoredJSON(store, 'dua_favorites', []), /disk full/);
    assert.equal(store.getItem('dua_favorites'), '{');
});
test('valid saved records are returned unchanged', () => {
    const records = [{ id: '1', count: 15 }];
    const store = storage([['tasbih_sessions', JSON.stringify(records)]]);
    assert.deepEqual(readStoredJSON(store, 'tasbih_sessions', []), records);
    assert.equal(store.getItem('data_recovery_tasbih_sessions'), null);
});
test('prayer cleanup owns only its slots and never Ratheeb, daily Ayah or event IDs', () => {
    const pending = [11,100,134,198,401,600,700,999];
    assert.deepEqual(pending.filter(isPrayerNotification), [100,134,198,999]);
});
test('month and year rollover uses full dates and tomorrow Fajr', () => {
    const calendar = [day(2026,12,1,'04:00'), day(2026,12,31), day(2027,1,1,'05:11')];
    assert.equal(calendarDay(calendar, new Date(2027,0,1)).timings.Fajr, '05:11');
    const next = nextCalendarPrayer(calendar, new Date(2026,11,31,22));
    assert.equal(next.time, '05:11'); assert.equal(next.at.getFullYear(), 2027);
    const alarms = buildPrayerNotifications(calendar, new Date(2026,11,31,22), true);
    assert.equal(alarms.length,5); assert.ok(alarms.every(n => n.schedule.at.getFullYear() === 2027));
    assert.equal(prayerRenewalNotification(alarms, new Date(2026,11,31))[0].id, 198);
    assert.notEqual(prayerContextKey({location:{lat:1,lng:2}}),prayerContextKey({location:{lat:2,lng:2}}));
});
test('completed prayers never receive follow-up nudges and future nudges retain stable IDs', () => {
    const alerts = buildFollowUpNotifications(timings('05:00'), {fajr:true,asr:true}, new Date(2026,10,9,0));
    assert.deepEqual(alerts.map(n => n.id),[12,14,15]);
    assert.equal(alerts[0].schedule.at.getHours(),12); assert.equal(alerts[0].schedule.at.getMinutes(),45);
    assert.deepEqual(buildFollowUpNotifications(null, {}, new Date()),[]);
});
test('overlapping scheduler effects end with the newest schedule, never an older completion', async () => {
    const hold = deferred(), started = deferred(); let pending=[]; let calls=0;
    const scheduler = createNotificationScheduler({cancel:async () => { if (++calls === 1) { started.resolve(); await hold.promise; } pending=[]; },schedule:async ({notifications}) => {pending=notifications;} });
    const old=scheduler.replace([11],[{id:11}]); await started.promise;
    const latest=scheduler.replace([11],[]); hold.resolve(); await Promise.all([old,latest]);
    assert.deepEqual(pending,[]);
});
test('rating transaction remains locked while cooldown is being persisted', async () => {
    const gate=createRatingTransaction(), hold=deferred(), started=deferred(); let requests=0;
    const first=gate.run(async () => {requests++;started.resolve();await hold.promise;}); await started.promise;
    await gate.run(async () => {requests++;}); assert.equal(requests,1);
    hold.resolve();await first; await gate.run(async () => {requests++;});assert.equal(requests,2);
    gate.dispose();await gate.run(async () => {requests++;});assert.equal(requests,2);
});
test('VersionHub rejects insecure production endpoints and credentials; localhost is test-only', () => {
    for(const value of ['http://service.test/check','https://user:pass@service.test/check','http://localhost/check']) assert.throws(()=>versionHubEndpoint({MODE:'production',VITE_VERSIONHUB_URL:value}));
    assert.equal(versionHubEndpoint({MODE:'test',VITE_VERSIONHUB_URL:'http://127.0.0.1/check'}),'http://127.0.0.1/check');
    assert.equal(versionHubEndpoint({MODE:'production',VITE_VERSIONHUB_URL:'https://service.test/check'}),'https://service.test/check');
});
test('event previews follow actual Gregorian dates across a 29-day Hijri year boundary', () => {
    const days=[{at:new Date(2027,5,7),hijri:{day:'1',month:{number:1},year:'1449'}}];
    const alerts=eventNotifications(days,new Date(2027,5,6,0));
    assert.equal(alerts.length,2);
    assert.equal(alerts.find(n=>n.title.startsWith('Tomorrow:')).schedule.at.getDate(),6);
    assert.ok(alerts.every(n=>n.id>=700&&n.id<=713));
});
test('playback position writes are bounded and latest position flushes on pause/unmount', () => {
    let clock=0;const saved=[];const writer=createPositionPersistence(value=>saved.push(value),5000,()=>clock);
    for(let i=0;i<40;i++){clock=i*250;writer.update(i/4);}
    assert.equal(saved.length,2);writer.flush();assert.equal(saved.at(-1),9.75);
    writer.flush();assert.equal(saved.length,3);
});
test('daily Ayah deterministic date policy stays within the Quran bounds', () => {
    for(const key of ['2026-12-31','2027-01-01'])assert.ok(dailyAyahNumber(key)>=1&&dailyAyahNumber(key)<=6236);
});
test('actual latest HTTP loader suppresses old data/errors and recovers after timeout/HTTP errors', async t => {
    let oldResponse;const arrived=deferred();
    const server=http.createServer((request,response)=>{
        if(request.url==='/old'){oldResponse=response;arrived.resolve();return;}
        if(request.url==='/hang')return;
        if(request.url==='/fail'){response.writeHead(503);response.end();return;}
        response.end(JSON.stringify({chapter:2}));
    });server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>{server.closeAllConnections();server.close();});
    const base=`http://127.0.0.1:${server.address().port}`;const loader=createLatestRequest(5000);
    const old=loader.run(signal=>fetchJSON(base+'/old',{signal}));await arrived.promise;
    const latest=await loader.run(signal=>fetchJSON(base+'/new',{signal}));oldResponse.end('{broken');
    assert.equal(await old,null);assert.equal(latest.value.chapter,2);
    await assert.rejects(createLatestRequest(50).run(signal=>fetchJSON(base+'/hang',{signal})),/timed out/);
    await assert.rejects(loader.run(signal=>fetchJSON(base+'/fail',{signal})),/unavailable/);
    assert.equal((await loader.run(signal=>fetchJSON(base+'/new',{signal}))).value.chapter,2);
});

test('wellness playback uses the existing declared recordings and fails closed for missing ones', async () => {
    const { wellnessAudioUrl } = await import('../src/features/more/wellnessDuas.js');
    assert.equal(wellnessAudioUrl('dua_pain'),'https://everyayah.com/data/Alafasy_128kbps/021083.mp3');
    assert.equal(wellnessAudioUrl('dua_sleep'),'https://www.hisnmuslim.com/audio/ar/145.mp3');
    assert.equal(wellnessAudioUrl('dua_exhaustion'),null);
    assert.equal(wellnessAudioUrl('unknown'),null);
});

test('out-of-range provider times cannot roll over into another prayer day', () => {
    const invalid = day(2026,11,9,'29:00'); invalid.timings.Asr = '15:99';
    const alarms=buildPrayerNotifications([invalid],new Date(2026,10,9,0));
    assert.equal(alarms.length,3);
});

test('calendar countdown, Adhan and follow-ups use the selected city timezone', () => {
    const selected = { ...day(2026, 11, 9, '05:00'), meta: { timezone: 'Asia/Kolkata' } };
    const now = new Date('2026-11-08T23:00:00Z');
    const fajr = '2026-11-08T23:30:00.000Z';
    assert.equal(nextCalendarPrayer([selected], now).at.toISOString(), fajr);
    assert.equal(buildPrayerNotifications([selected], now)[0].schedule.at.toISOString(), fajr);
    assert.equal(buildFollowUpNotifications(selected.timings, {}, now, selected)[0].schedule.at.toISOString(),
        '2026-11-09T00:15:00.000Z');
});
