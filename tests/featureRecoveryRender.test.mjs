import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import Module from 'node:module';
import path from 'node:path';

// Render the real feature components with real React; replace only the storage I/O boundary.
const result = await build({ stdin: { contents: `
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from './src/LanguageContext';
import Hajj from './src/features/hajj/HajjGuide';
import Umrah from './src/features/umrah/UmrahGuide';
import Duas from './src/features/duas/DuasPage';
import Women from './src/features/more/WomensGuidance';
export { TRANSLATIONS } from './src/translations';
export function render(name) { const Component = {Hajj,Umrah,Duas,Women}[name]; return renderToStaticMarkup(<MemoryRouter><LanguageProvider><Component /></LanguageProvider></MemoryRouter>); }
`, resolveDir: process.cwd(), loader: 'jsx' }, bundle: true, packages: 'external', platform: 'node', format: 'cjs', write: false,
    jsx: 'automatic', loader: { '.css':'empty' }, plugins: [{name:'storage-boundary',setup(api){api.onResolve({filter:/services\/appStorage$/},()=>({path:'storage',namespace:'test-storage'}));api.onLoad({filter:/.*/,namespace:'test-storage'},()=>({contents:'export const appStorage = {getItem(key){return globalThis.__recoveryStore.getItem(key)},setItem(key,value){globalThis.__recoveryStore.setItem(key,value)}};'}));}}] });
const require = createRequire(import.meta.url);
const compiled = new Module(path.resolve('tests/feature-render-fixture.cjs'));
compiled.filename = path.resolve('tests/feature-render-fixture.cjs');
compiled.paths = require.resolve.paths('react');
compiled._compile(result.outputFiles[0].text, compiled.filename);
for(const [feature,key,title] of [['Hajj','hajj_steps_done','Hajj Guide'],['Umrah','umrah_bookmarks','Umrah Guide'],['Duas','dua_favorites','Duas / Dhikr'],['Women','womens_audio_bookmarks',"Women's Guidance"]]){
    test(`${feature} actually renders after unreadable persisted ${key}, keeping the original`,()=>{
        const data=new Map([[key,'{']]);globalThis.__recoveryStore={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
        const html=compiled.exports.render(feature);
        assert.ok(html.includes(feature === 'Women' ? 'Guidance' : title));assert.equal(data.get(key),'{');
        assert.deepEqual(JSON.parse(data.get('data_recovery_'+key)),['{']);
        delete globalThis.__recoveryStore;
    });
}

test('observed missing labels exist in both shipped languages', () => {
    for (const lang of ['en','ml']) for (const key of ['prayer_settings','mark_session_complete','bookmark','bookmark_saved']) {
        assert.equal(typeof compiled.exports.TRANSLATIONS[lang][key], 'string');
        assert.notEqual(compiled.exports.TRANSLATIONS[lang][key], key);
    }
});
