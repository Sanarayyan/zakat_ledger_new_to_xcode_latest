import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createPrivateStorage } from '../src/services/privateStorage.mjs';
// Actual disk persistence exercises migration ordering; this does not certify native Keychain/Keystore behavior.
class DiskStorage {
    constructor(directory) { this.directory = directory; }
    async keys() { return (await fs.readdir(this.directory)).map(name => decodeURIComponent(name)); }
    async getItem(key) { try { return await fs.readFile(path.join(this.directory, encodeURIComponent(key)), 'utf8'); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } }
    async setItem(key, value) { await fs.writeFile(path.join(this.directory, encodeURIComponent(key)), value); }
    async removeItem(key) { await fs.rm(path.join(this.directory, encodeURIComponent(key)), { force: true }); }
}
async function localStorageOnDisk(directory) {
    const entries = new Map();
    for (const file of await fs.readdir(directory)) entries.set(decodeURIComponent(file), await fs.readFile(path.join(directory, file), 'utf8'));
    const removals = [];
    return { get length() { return entries.size; }, key: i => [...entries.keys()][i], getItem: key => entries.get(key) ?? null,
        removeItem: key => { entries.delete(key); removals.push(fs.rm(path.join(directory, encodeURIComponent(key)), { force: true })); },
        done: () => Promise.all(removals) };
}
test('migration verifies durable copies, removes legacy tokens, and persists subsequent edits', async t => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'muslimplus-storage-'));
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const plain = path.join(root, 'plain'), secure = path.join(root, 'protected');
    await fs.mkdir(plain); await fs.mkdir(secure);
    await fs.writeFile(path.join(plain, 'zakat_records_owner'), '[{"amount":"10.50"}]');
    await fs.writeFile(path.join(plain, 'zakat_user'), JSON.stringify({ email: 'owner@example.test', accessToken: 'obsolete-token' }));
    const legacy = await localStorageOnDisk(plain), persistent = new DiskStorage(secure);
    const storage = await createPrivateStorage(persistent, legacy);
    await legacy.done();
    assert.equal(await persistent.getItem('zakat_records_owner'), '[{"amount":"10.50"}]');
    assert.equal(JSON.parse(storage.getItem('zakat_user')).accessToken, undefined);
    assert.equal((await fs.readdir(plain)).length, 0);
    storage.setItem('zakat_records_owner', '[1]'); storage.setItem('zakat_records_owner', '[2]');
    await storage.flush();
    assert.equal(await persistent.getItem('zakat_records_owner'), '[2]');
    storage.clear(); await storage.flush();
    assert.equal((await persistent.keys()).length, 0);
});
test('failed migration leaves the original durable data intact', async t => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'muslimplus-storage-'));
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const plain = path.join(root, 'plain'), unavailable = path.join(root, 'unavailable');
    await fs.mkdir(plain);
    await fs.writeFile(path.join(plain, 'periodStartDate'), '2026-11-01');
    const legacy = await localStorageOnDisk(plain);
    await assert.rejects(createPrivateStorage(new DiskStorage(unavailable), legacy));
    assert.equal(await fs.readFile(path.join(plain, 'periodStartDate'), 'utf8'), '2026-11-01');
});
