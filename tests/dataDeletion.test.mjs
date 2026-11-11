import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { DiskStorage } from './helpers/diskStorage.mjs';
import { createDataDeletion, DELETION_JOURNAL_KEY } from '../src/services/dataDeletion.mjs';
let backend, config;
before(async () => {
    if (!process.env.PHASE1_TEST_PYTHON) return;
    backend = spawn(process.env.PHASE1_TEST_PYTHON, ['-B', 'tests/backend_server.py'], { stdio: ['ignore', 'pipe', 'pipe'] });
    config = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Backend startup timeout')), 15000);
        let errors = '';
        backend.stderr.on('data', chunk => { errors += chunk; });
        backend.once('exit', code => { clearTimeout(timer); reject(new Error(`Backend exited ${code}: ${errors}`)); });
        createInterface({ input: backend.stdout }).once('line', line => { clearTimeout(timer); resolve(JSON.parse(line)); });
    });
});
after(() => backend?.kill());
function setup(t, deleteCloud = () => { throw new Error('Unexpected cloud request'); }) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'muslimplus-deletion-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    for (const name of ['journal', 'data', 'reminders']) fs.mkdirSync(path.join(root, name));
    const journal = new DiskStorage(path.join(root, 'journal'));
    const data = new DiskStorage(path.join(root, 'data'));
    const reminders = new DiskStorage(path.join(root, 'reminders'));
    data.setItem('private-record', 'existing personal data'); reminders.setItem('alarm', 'scheduled');
    const deps = { journal, deleteCloud, cleanupReminders: async () => reminders.clear(), clearLocal: async () => data.clear() };
    return { root, journal, data, reminders, deps, service: createDataDeletion(deps) };
}
test('local deletion clears data and reminders; repeated resume does nothing', async t => {
    const { service, data, journal, reminders } = setup(t);
    await service.start(); await service.resume();
    assert.equal(data.length, 0); assert.equal(journal.length, 0); assert.equal(reminders.length, 0);
});
test('journal write failure prevents deletion of personal data', async t => {
    const { root, journal, data, service } = setup(t);
    fs.renameSync(journal.directory, path.join(root, 'offline'));
    await assert.rejects(service.start(), { code: 'ENOENT' });
    assert.equal(data.getItem('private-record'), 'existing personal data');
});
test('corrupted progress prevents unconfirmed cleanup', async t => {
    const { journal, service, data } = setup(t);
    journal.setItem(DELETION_JOURNAL_KEY, '{broken');
    await assert.rejects(service.resume());
    assert.equal(data.length, 1);
});
test('switching accounts cannot authorize another cloud deletion on retry', async t => {
    const seenTokens = [];
    const { service, data } = setup(t, async token => { seenTokens.push(token); throw new Error('No receipt'); });
    await assert.rejects(service.start('original-session', 'a@example.test'), /No receipt/);
    await assert.rejects(service.resume('different-session', 'b@example.test'), /No receipt/);
    assert.deepEqual(seenTokens, ['original-session', undefined]);
    assert.equal(data.length, 1);
});
test('interrupted reminder cleanup resumes after reopening', async t => {
    const { root, reminders, journal, data, service, deps } = setup(t);
    fs.renameSync(reminders.directory, path.join(root, 'offline'));
    await assert.rejects(service.start());
    assert.equal(data.length, 1);
    assert.equal(JSON.parse(journal.getItem(DELETION_JOURNAL_KEY)).stage, 'local');
    fs.renameSync(path.join(root, 'offline'), reminders.directory);
    await createDataDeletion(deps).resume();
    assert.equal(data.length, 0); assert.equal(journal.length, 0);
});
test('lost HTTP response and failed local cleanup resume against the real Django API', { skip: !process.env.PHASE1_TEST_PYTHON }, async t => {
    let loseResponse = true, requests = 0;
    const { root, data, journal, deps, service } = setup(t, async (token, deletionId) => {
        requests++;
        const response = await fetch(`${config.url}/api/account/data/`, { method: 'DELETE',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ deletionId }) });
        assert.equal(response.status, 200);
        const result = await response.json();
        if (loseResponse) { loseResponse = false; throw new Error('Connection lost after server response'); }
        return result;
    });
    await assert.rejects(service.start(config.token, 'integration@example.test'), /Connection lost/);
    assert.equal(JSON.parse(journal.getItem(DELETION_JOURNAL_KEY)).stage, 'cloud');
    assert.equal(data.length, 1);
    // The original session has been deleted. Receipt recovery must work without it.
    fs.renameSync(data.directory, path.join(root, 'offline'));
    await assert.rejects(createDataDeletion(deps).resume());
    assert.equal(JSON.parse(journal.getItem(DELETION_JOURNAL_KEY)).stage, 'local');
    fs.renameSync(path.join(root, 'offline'), data.directory);
    const resumed = createDataDeletion(deps);
    await Promise.all([resumed.resume(), resumed.resume()]);
    assert.equal(requests, 2); assert.equal(data.length, 0); assert.equal(journal.length, 0);
});
