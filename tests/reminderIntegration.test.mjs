import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const result = await build({entryPoints:['src/components/DailyAyahReminders.jsx'],bundle:true,packages:'external',platform:'node',format:'cjs',write:false,jsx:'automatic',plugins:[{name:'native-boundaries',setup(api){
    api.onResolve({filter:/^@capacitor\/(core|local-notifications)$/},args=>({path:args.path,namespace:'native-test'}));
    api.onResolve({filter:/\/(PrayerContext|LanguageContext)$/},args=>({path:args.path,namespace:'native-test'}));
    api.onLoad({filter:/.*/,namespace:'native-test'},({path})=>({contents:path.endsWith('/core')?'export const Capacitor={isNativePlatform:()=>true};':path.endsWith('/local-notifications')?'export const LocalNotifications={checkPermissions:async()=>({display:"granted"}),cancel:args=>globalThis.__notifications.cancel(args),schedule:args=>globalThis.__notifications.schedule(args)};':path.endsWith('PrayerContext')?'export const usePrayer=()=>({settings:{dailyAyahEnabled:globalThis.__enabled},resumeCount:0});':'export const useLanguage=()=>({lang:"en"});'}));
}}]});
const compiled=new Module(path.resolve('tests/reminder-fixture.cjs'));compiled.filename=path.resolve('tests/reminder-fixture.cjs');compiled.paths=require.resolve.paths('react');compiled._compile(result.outputFiles[0].text,compiled.filename);
function mount(){
    const effects=[],original=React.useEffect;React.useEffect=effect=>effects.push(effect);
    try{renderToStaticMarkup(React.createElement(compiled.exports.default));}finally{React.useEffect=original;}
    return effects[0]();
}
test('real DailyAyahReminders effect schedules seven actual verses at 9 AM and isolates its IDs',async t=>{
    const originalFetch=globalThis.fetch;let scheduled,requests=0,cancelled;let arrived;
    const complete=new Promise(resolve=>{arrived=resolve;});globalThis.__enabled=true;
    globalThis.__notifications={cancel:async args=>{cancelled=args.notifications;},schedule:async args=>{scheduled=args.notifications;arrived();}};
    globalThis.fetch=async url=>{requests++;assert.match(String(url),/\/ayah\/\d+\/editions\/quran-uthmani,en.sahih$/);return {ok:true,json:async()=>({code:200,data:[{text:'Arabic fixture'},{text:'Translation fixture'}]})};};
    t.after(()=>{globalThis.fetch=originalFetch;delete globalThis.__notifications;delete globalThis.__enabled;});
    const cleanup=mount();t.after(cleanup);await complete;
    assert.equal(requests,7);assert.equal(scheduled.length,7);assert.deepEqual(cancelled.map(n=>n.id),[600,601,602,603,604,605,606]);
    assert.ok(scheduled.every(n=>n.schedule.at.getHours()===9&&n.schedule.at.getMinutes()===0&&n.body==='Translation fixture'));
});
test('real offline reminder refresh retains existing scheduled data; disabling cancels only its own slots',async t=>{
    const originalFetch=globalThis.fetch;let cancels=0,schedules=0;globalThis.__enabled=true;
    globalThis.__notifications={cancel:async()=>{cancels++;},schedule:async()=>{schedules++;}};
    globalThis.fetch=async()=>{throw new Error('offline');};
    t.after(()=>{globalThis.fetch=originalFetch;delete globalThis.__notifications;delete globalThis.__enabled;});
    const cleanup=mount();await new Promise(setImmediate);assert.equal(cancels,0);assert.equal(schedules,0);cleanup();
    globalThis.__enabled=false;const stop=mount();await new Promise(setImmediate);assert.equal(cancels,1);assert.equal(schedules,0);stop();
});
