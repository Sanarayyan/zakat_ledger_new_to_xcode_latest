import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { DiskStorage } from './helpers/diskStorage.mjs';
import { createPrivateStorage } from '../src/services/privateStorage.mjs';

// Actual asynchronous filesystem operations expose the same promise timing as native writes.
class AsyncDiskStorage extends DiskStorage {
    writes = [];
    active = 0;
    maxActive = 0;
    setItem(key, value) {
        const write = this.operation(() => fs.promises.writeFile(path.join(this.directory, encodeURIComponent(key)), value));
        this.writes.push(write);
        return write;
    }
    removeItem(key) {
        return this.operation(() => fs.promises.rm(path.join(this.directory, encodeURIComponent(key)), { force: true }));
    }
    async operation(action) {
        this.active++;
        this.maxActive = Math.max(this.maxActive, this.active);
        try { await action(); }
        finally { this.active--; }
    }
}

async function setup(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'muslimplus-queue-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    for (const name of ['secure', 'legacy']) fs.mkdirSync(path.join(root, name));
    const persistent = new AsyncDiskStorage(path.join(root, 'secure'));
    const legacy = new DiskStorage(path.join(root, 'legacy'));
    const errors = [];
    const storage = await createPrivateStorage(persistent, legacy, error => errors.push(error));
    return { root, persistent, legacy, storage, errors };
}
async function finishFirstWrite(storage, persistent) {
    storage.setItem('reading_progress', 'first');
    // Wait only for the actual adapter write, not the queue's outer completion promise.
    await Promise.resolve();
    await persistent.writes[0];
}
async function waitForValue(persistent, key, expected) {
    const deadline = Date.now() + 1000;
    while (persistent.getItem(key) !== expected && Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 5));
    }
    assert.equal(persistent.getItem(key), expected);
}

test('exact completion race automatically saves a new write without an explicit flush', async t => {
    const { storage, persistent, errors } = await setup(t);
    await finishFirstWrite(storage, persistent);
    storage.setItem('prayer_settings', 'newer');
    await waitForValue(persistent, 'prayer_settings', 'newer');
    await storage.flush();
    assert.equal(errors.length, 0);
});
test('flush waits for a write arriving at the previous write completion', async t => {
    const { storage, persistent } = await setup(t);
    await finishFirstWrite(storage, persistent);
    storage.setItem('reading_progress', 'latest');
    await storage.flush();
    assert.equal(persistent.getItem('reading_progress'), 'latest');
});
test('remove and clear arriving at completion are persisted before flush resolves', async t => {
    for (const operation of ['remove', 'clear']) {
        const { storage, persistent } = await setup(t);
        await finishFirstWrite(storage, persistent);
        if (operation === 'remove') storage.removeItem('reading_progress');
        else storage.clear();
        await storage.flush();
        assert.equal(persistent.getItem('reading_progress'), null, operation);
    }
});
test('rapid writes, replacements and removals stay serialized and restore the newest values', async t => {
    const { storage, persistent, legacy } = await setup(t);
    for (let index = 0; index < 250; index++) {
        storage.setItem('reading_progress', String(index));
        storage.setItem('prayer_settings', String(index));
        storage.removeItem('prayer_settings');
        if (index % 10 === 0) await Promise.resolve();
    }
    await Promise.all([storage.flush(), storage.flush(), storage.flush()]);
    assert.equal(persistent.maxActive, 1);
    const reopened = await createPrivateStorage(persistent, legacy);
    assert.equal(reopened.getItem('reading_progress'), '249');
    assert.equal(reopened.getItem('prayer_settings'), null);
    await reopened.flush();
    reopened.setItem('theme', 'dark-mode');
    await reopened.flush();
    assert.equal(persistent.getItem('theme'), 'dark-mode');
});
test('failed writes report an error, keep newer edits for retry and do not spin endlessly', async t => {
    const { root, storage, persistent, errors, legacy } = await setup(t);
    await finishFirstWrite(storage, persistent);
    fs.renameSync(persistent.directory, path.join(root, 'offline'));
    storage.setItem('reading_progress', 'newer');
    storage.setItem('theme', 'dark-mode');
    const firstFlush = storage.flush(), secondFlush = storage.flush();
    await assert.rejects(firstFlush, { code: 'ENOENT' });
    await assert.rejects(secondFlush, { code: 'ENOENT' });
    assert.equal(errors.length, 1);
    const attempts = persistent.writes.length;
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(persistent.writes.length, attempts);
    assert.equal(new DiskStorage(path.join(root, 'offline')).getItem('reading_progress'), 'first');
    storage.setItem('reading_progress', 'newest');
    await assert.rejects(storage.flush(), { code: 'ENOENT' });
    fs.renameSync(path.join(root, 'offline'), persistent.directory);
    await storage.flush();
    const reopened = await createPrivateStorage(persistent, legacy);
    assert.equal(reopened.getItem('reading_progress'), 'newest');
    assert.equal(reopened.getItem('theme'), 'dark-mode');
});
test('failed deletion remains queued and completes after storage is repaired', async t => {
    const { root, storage, persistent, errors } = await setup(t);
    await finishFirstWrite(storage, persistent);
    await storage.flush();
    const filename = path.join(persistent.directory, 'reading_progress');
    const saved = path.join(root, 'saved');
    fs.renameSync(filename, saved);
    fs.mkdirSync(filename);
    storage.removeItem('reading_progress');
    await assert.rejects(storage.flush());
    assert.equal(errors.length, 1);
    fs.rmdirSync(filename);
    fs.renameSync(saved, filename);
    await storage.flush();
    assert.equal(persistent.getItem('reading_progress'), null);
});

for (const mode of ['committed', 'pending']) {
    test(`process interruption ${mode === 'committed' ? 'after a flush retains every acknowledged write' : 'before a write retains the last completed value'}`, { timeout: 10000 }, async t => {
        const { root, persistent, legacy } = await setup(t);
        fs.writeFileSync(path.join(persistent.directory, 'reading_progress'), 'previous');
        const worker = fork(new URL('./fixtures/storageQueueWorker.mjs', import.meta.url), [root, mode], { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
        t.after(() => { if (worker.exitCode === null && worker.signalCode === null) worker.kill('SIGKILL'); });
        const [message] = await once(worker, 'message');
        assert.equal(message, mode);
        const exited = once(worker, 'exit');
        worker.kill('SIGKILL');
        await exited;
        const reopened = await createPrivateStorage(persistent, legacy);
        assert.equal(reopened.getItem('reading_progress'), mode === 'committed' ? 'completed' : 'previous');
        assert.equal(reopened.getItem('theme'), mode === 'committed' ? 'dark-mode' : null);
    });
}
