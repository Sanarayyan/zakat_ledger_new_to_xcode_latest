import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { versionHubPresentation } from '../src/services/versionHubPolicy.mjs';

async function loadModule(entry, env = {}) {
    const result = await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', write: false,
        loader: { '.css': 'empty' }, define: { 'import.meta.env': JSON.stringify({ MODE: 'test', DEV: false, ...env }) } });
    return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const { VersionHubDialog } = await loadModule('src/components/VersionHubUpdatePopup.jsx');
const props = data => ({ updateInfo: data, presentation: versionHubPresentation(data, 'android'), currentVersion: '1.0.3', t: key => key });
function buttons(element) {
    if (!element || typeof element !== 'object') return [];
    return [...(element.type === 'button' ? [element] : []), ...React.Children.toArray(element.props?.children).flatMap(buttons)];
}
test('production dialog renders recovery buttons for a mandatory update without a store URL', () => {
    let retries = 0, dismissed = 0;
    const state = { ...props({ canContinue: false }), onRetry: () => retries++, onDismiss: () => dismissed++ };
    const html = renderToStaticMarkup(React.createElement(VersionHubDialog, state));
    assert.match(html, /role="alert"/); assert.match(html, /update_link_unavailable/);
    const actions = buttons(VersionHubDialog(state));
    assert.deepEqual(actions.map(button => button.props.children), ['retry', 'continue_app']);
    actions[0].props.onClick(); actions[1].props.onClick();
    assert.equal(retries, 1); assert.equal(dismissed, 1);
});
test('production dialog keeps valid mandatory updates blocking and optional updates dismissible', () => {
    const store_url = 'https://play.google.com/store/apps/details?id=com.muslimplus.app';
    const mandatory = props({ update_required: true, store_url });
    assert.deepEqual(buttons(VersionHubDialog(mandatory)).map(button => button.props.children), ['update_now']);
    const optional = props({ update_available: true, store_url });
    assert.deepEqual(buttons(VersionHubDialog(optional)).map(button => button.props.children), ['update_now', 'update_later']);
    const retry = renderToStaticMarkup(React.createElement(VersionHubDialog, { ...props({ canContinue: false }), checking: true, retryFailed: true }));
    assert.match(retry, /disabled/); assert.match(retry, /update_check_failed/);
    assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(VersionHubDialog,
        props({ action: 'mandatory', title: {}, description: [], latestVersion: {} }))));
});
test('production VersionHub HTTP service caches launch requests and Retry actually refetches', async t => {
    let requests = 0;
    const server = http.createServer(async (request, response) => {
        requests++;
        let raw = ''; for await (const chunk of request) raw += chunk;
        const body = JSON.parse(raw);
        assert.equal(body.application_name, 'muslim_plus'); assert.equal(body.platform, 'web');
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(requests === 1 ? { canContinue: false } : { action: 'no_action' }));
    });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    t.after(() => { server.closeAllConnections(); server.close(); });
    const { versionHubService } = await loadModule('src/services/versionHubService.js', { VITE_VERSIONHUB_URL: `http://127.0.0.1:${server.address().port}` });
    const [first, repeated] = await Promise.all([versionHubService.checkVersion(), versionHubService.checkVersion()]);
    assert.deepEqual(first, { canContinue: false }); assert.deepEqual(repeated, first); assert.equal(requests, 1);
    assert.deepEqual(await versionHubService.checkVersion({ retry: true }), { action: 'no_action' });
    assert.equal(requests, 2);
});

test('production update service fails safely on HTTP/JSON errors and can retry after recovery', async t => {
    let requests = 0;
    const server = http.createServer((_request, response) => {
        requests++;
        response.statusCode = requests === 1 ? 503 : 200;
        response.end(requests === 2 ? 'invalid json' : JSON.stringify({ action: 'no_action' }));
    });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    t.after(() => { server.closeAllConnections(); server.close(); });
    const { versionHubService } = await loadModule('src/services/versionHubService.js', { VITE_VERSIONHUB_URL: `http://127.0.0.1:${server.address().port}` });
    assert.equal(await versionHubService.checkVersion(), null);
    assert.equal(await versionHubService.checkVersion({ retry: true }), null);
    assert.deepEqual(await versionHubService.checkVersion({ retry: true }), { action: 'no_action' });
});

test('update timeout also covers a stalled response body', { timeout: 8000 }, async t => {
    const server = http.createServer((_request, response) => {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.write('{'); // Headers arrive, but JSON never finishes.
    });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    t.after(() => { server.closeAllConnections(); server.close(); });
    const { versionHubService } = await loadModule('src/services/versionHubService.js', { VITE_VERSIONHUB_URL: `http://127.0.0.1:${server.address().port}` });
    assert.equal(await versionHubService.checkVersion(), null);
});

test('a redirect is rejected before forwarding the VersionHub request or app key', async t => {
    let redirected = 0;
    const server = http.createServer((request, response) => {
        if (request.url === '/redirected') {
            redirected++;
            response.end(JSON.stringify({ action: 'no_action' }));
        } else {
            response.writeHead(307, { Location: '/redirected' });
            response.end();
        }
    });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    t.after(() => { server.closeAllConnections(); server.close(); });
    const { versionHubService } = await loadModule('src/services/versionHubService.js', {
        VITE_VERSIONHUB_URL: `http://127.0.0.1:${server.address().port}`,
        VITE_VERSIONHUB_APP_KEY: 'disposable-test-key',
    });
    assert.equal(await versionHubService.checkVersion(), null);
    assert.equal(redirected, 0);
});
