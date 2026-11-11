import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DiskStorage } from './helpers/diskStorage.mjs';
import { storedTheme, prepareStartup } from '../src/services/startup.mjs';
test('theme comes from persisted storage with a safe default', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'muslimplus-theme-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const storage = new DiskStorage(root);
    assert.equal(storedTheme(storage), 'light-mode');
    storage.setItem('theme', 'dark-mode'); assert.equal(storedTheme(storage), 'dark-mode');
    storage.setItem('theme', 'untrusted-class'); assert.equal(storedTheme(storage), 'light-mode');
});
test('failed pending cleanup blocks theme reads and application startup', async () => {
    const order = [];
    await assert.rejects(prepareStartup({
        initializeStorage: async () => order.push('storage'),
        deletion: { pending: async () => ({ stage: 'local' }), resume: async () => { order.push('cleanup'); throw new Error('locked'); } },
        storage: () => { throw new Error('Preferences must not be read before deletion finishes'); },
    }), /locked/);
    assert.deepEqual(order, ['storage', 'cleanup']);
});
