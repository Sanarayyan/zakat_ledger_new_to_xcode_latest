import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import Module from 'node:module';
import path from 'node:path';

// Render the app's actual route tree with an onboarded browser fixture.
const bundle = await build({
    stdin: { contents: `
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from './src/LanguageContext';
import { PrayerProvider } from './src/PrayerContext';
import { PrayerStreakProvider } from './src/PrayerStreakContext';
import App from './src/App';
export const render = route => renderToStaticMarkup(<MemoryRouter initialEntries={[route]}><LanguageProvider><PrayerProvider><PrayerStreakProvider><App /></PrayerStreakProvider></PrayerProvider></LanguageProvider></MemoryRouter>);
`, resolveDir: process.cwd(), loader: 'jsx' },
    bundle: true, packages: 'external', platform: 'node', format: 'cjs', write: false,
    jsx: 'automatic', loader: { '.css': 'empty', '.mov': 'text', '.png': 'text' },
    define: { 'import.meta.env': JSON.stringify({ MODE: 'device-test', DEV: false }) },
    plugins: [{ name: 'render-boundaries', setup(api) {
        api.onResolve({ filter: /services\/appStorage$/ }, () => ({ path: 'storage', namespace: 'fixture' }));
        api.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
            contents: 'export const appStorage = {getItem: key => globalThis.__closureStorage.get(key) ?? null}; export const flushStorage = async () => {};',
        }));
        api.onLoad({ filter: /\/src\/App\.jsx$/ }, async ({ path }) => {
            const source = await readFile(path, 'utf8');
            const splash = 'const [showSplash, setShowSplash] = useState(true);';
            assert.ok(source.includes(splash), 'fixture must bypass only the initial splash');
            return { contents: source.replace(splash, 'const [showSplash, setShowSplash] = useState(false);'), loader: 'jsx' };
        });
        api.onLoad({ filter: /\/(UmrahGuide|WomensGuidance)\.jsx$/ }, async ({ path }) => {
            const source = await readFile(path, 'utf8');
            const isUmrah = path.endsWith('/UmrahGuide.jsx');
            const initial = isUmrah ? "const [section, setSection] = useState('intro');"
                : "const [activeTab, setActiveTab] = useState('tracker');";
            assert.ok(source.includes(initial), 'audio fixture must select the Dua tab');
            const selected = initial.replace("useState('", "useState(globalThis.__closureDuaTab ? 'duas' : '");
            return { contents: source.replace(initial, selected), loader: 'jsx' };
        });
        // Native/static media are verified in the build. SSR only needs their URLs.
        api.onLoad({ filter: /\.(png|mov)$/ }, ({ path }) => ({ contents: JSON.stringify(path), loader: 'json' }));
    } }],
});
const require = createRequire(import.meta.url);
const compiled = new Module(path.resolve('tests/closure-smoke-fixture.cjs'));
compiled.filename = path.resolve('tests/closure-smoke-fixture.cjs');
compiled.paths = require.resolve.paths('react');
compiled._compile(bundle.outputFiles[0].text, compiled.filename);

const routes = [
    ['/', /daily ayah/i], ['/quran', /surah|khatam/i], ['/quran/1', /loading/i],
    ['/quran/juz/1', /loading/i], ['/quran/bookmarks', /bookmark/i], ['/prayer', /prayer/i],
    ['/calendar', /calendar/i], ['/qibla', /qibla/i], ['/tasbih', /tasbih/i],
    ['/tasbih/history', /history/i], ['/duas', /duas/i], ['/asma', /99 names|Ar-Rahman/i],
    ['/womens-guidance', /guidance/i], ['/hajj', /hajj guide/i], ['/umrah', /umrah guide/i],
    ['/ratheeb', /ratheeb/i], ['/settings', /settings/i], ['/more', /coming soon/i],
];
function render(route, lang = 'en', duaTab = false) {
    globalThis.__closureStorage = new Map([['app_onboarding_completed', 'true'], ['zakat_lang', lang]]);
    globalThis.__closureDuaTab = duaTab;
    globalThis.window = { innerWidth: 390, innerHeight: 844, location: { pathname: route }, dispatchEvent() {}, addEventListener() {}, removeEventListener() {} };
    globalThis.document = { body: { classList: { contains: () => false } } };
    globalThis.Audio = class {};
    try {
        return compiled.exports.render(route);
    } finally {
        delete globalThis.__closureDuaTab;
        delete globalThis.__closureStorage;
        delete globalThis.window;
        delete globalThis.document;
        delete globalThis.Audio;
    }
}

for (const [route, marker] of routes) {
    test(`active route ${route} renders its initial screen`, () => assert.match(render(route), marker));
}

for (const lang of ['en', 'ml']) {
    test(`Umrah Dua tab (${lang}) renders six text-only cards with unavailable recordings`, () => {
        const cards = render('/umrah', lang, true).split('<div class="ug-card dua-card">').slice(1);
        assert.equal(cards.length, 6);
        for (const card of cards) {
            assert.ok(card.includes(lang === 'ml' ? 'ഓഡിയോ ഈ ഉപകരണത്തിൽ ലഭ്യമല്ല' : 'Recording unavailable'));
            assert.match(card, /ug-dua-arabic/);
            assert.match(card, /ug-bookmark-btn/);
            assert.match(card, /ug-dua-action-icon/);
            assert.doesNotMatch(card, /aria-label="(?:Play|Pause)"|<audio\b/);
            assert.equal((card.split('<button').length - 1), 2);
        }
    });

    test(`Women's Dua tab (${lang}) offers playback for nine mapped recordings and labels three unavailable`, () => {
        const cards = render('/womens-guidance', lang, true).split('<div class="wellness-dua-card ').slice(1);
        assert.equal(cards.length, 12);
        let playable = 0;
        for (const card of cards) {
            const actions = card.split('<div class="dua-arabic-text">')[0];
            if (actions.includes(lang === 'ml' ? 'ഓഡിയോ ലഭ്യമല്ല' : 'Recording unavailable')) {
                assert.doesNotMatch(actions, /<button|play-chime-btn/);
            } else {
                assert.match(actions, /<button[^>]*aria-label="Play"/);
                playable++;
            }
        }
        assert.equal(playable, 9);
    });
}
