import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DiskStorage } from './helpers/diskStorage.mjs';
import { createPrivateStorage } from '../src/services/privateStorage.mjs';

function setup(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'muslimplus-migration-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    for (const name of ['legacy', 'secure']) fs.mkdirSync(path.join(root, name));
    return { root, legacy: new DiskStorage(path.join(root, 'legacy')), secure: new DiskStorage(path.join(root, 'secure')) };
}
test('conflicting copies survive migration and restart without overwriting either', async t => {
    const { legacy, secure } = setup(t);
    legacy.setItem('theme', 'dark-mode'); secure.setItem('theme', 'light-mode');
    let storage = await createPrivateStorage(secure, legacy);
    assert.deepEqual(storage.migrationConflicts, ['theme']);
    assert.equal(storage.getItem('theme'), 'light-mode');
    assert.equal(legacy.getItem('theme'), 'dark-mode');
    const recovery = secure.keys().find(key => key.startsWith('migration_conflict_'));
    assert.deepEqual(JSON.parse(secure.getItem(recovery)), { key: 'theme', legacyValue: 'dark-mode', protectedValue: 'light-mode' });
    storage = await createPrivateStorage(secure, legacy);
    assert.equal(secure.keys().length, 2);
    assert.equal(legacy.getItem('theme'), 'dark-mode');
    storage.clear(); await storage.flush(); await storage.clearLegacy();
    assert.equal(secure.length, 0); assert.equal(legacy.length, 0);
});
test('partial migration resumes after an actual filesystem write failure', async t => {
    const { root, legacy, secure } = setup(t);
    legacy.setItem('a', 'first'); legacy.setItem('b', 'second');
    // A directory where a value file must be written forces a real EISDIR error.
    fs.mkdirSync(path.join(secure.directory, 'b'));
    // Start with an empty protected directory listing; introduce the obstruction after the first copy.
    fs.rmdirSync(path.join(secure.directory, 'b'));
    const originalSet = secure.setItem.bind(secure);
    secure.setItem = (key, value) => {
        originalSet(key, value);
        if (key === 'a') fs.mkdirSync(path.join(secure.directory, 'b'));
    };
    await assert.rejects(createPrivateStorage(secure, legacy), { code: 'EISDIR' });
    assert.equal(legacy.getItem('a'), null);
    assert.equal(legacy.getItem('b'), 'second');
    assert.equal(secure.getItem('a'), 'first');
    fs.rmdirSync(path.join(root, 'secure', 'b'));
    const resumed = await createPrivateStorage(new DiskStorage(secure.directory), legacy);
    assert.equal(resumed.getItem('b'), 'second'); assert.equal(legacy.length, 0);
});
test('a failed queued write remains retryable and persists after restart', async t => {
    const { root, legacy, secure } = setup(t);
    let failures = 0;
    const storage = await createPrivateStorage(secure, legacy, () => failures++);
    fs.renameSync(secure.directory, path.join(root, 'offline'));
    storage.setItem('theme', 'dark-mode');
    await assert.rejects(storage.flush(), { code: 'ENOENT' });
    assert.ok(failures > 0);
    fs.renameSync(path.join(root, 'offline'), secure.directory);
    await storage.flush();
    assert.equal((await createPrivateStorage(secure, legacy)).getItem('theme'), 'dark-mode');
});
test('conflict backup write failure preserves both original values', async t => {
    const { root, legacy, secure } = setup(t);
    legacy.setItem('theme', 'dark-mode'); secure.setItem('theme', 'light-mode');
    const originalGet = secure.getItem.bind(secure);
    secure.getItem = key => {
        const value = originalGet(key);
        if (key === 'theme') fs.renameSync(secure.directory, path.join(root, 'offline'));
        return value;
    };
    await assert.rejects(createPrivateStorage(secure, legacy), { code: 'ENOENT' });
    assert.equal(legacy.getItem('theme'), 'dark-mode');
    assert.equal(new DiskStorage(path.join(root, 'offline')).getItem('theme'), 'light-mode');
});
test('a mismatched durable readback prevents removal of legacy data', async t => {
    const { legacy, secure } = setup(t);
    legacy.setItem('reading', 'original progress');
    const write = secure.setItem.bind(secure);
    secure.setItem = (key, value) => { write(key, value); fs.writeFileSync(path.join(secure.directory, key), 'damaged write'); };
    await assert.rejects(createPrivateStorage(secure, legacy), /could not be verified/);
    assert.equal(legacy.getItem('reading'), 'original progress');
});
