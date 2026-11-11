import fs from 'node:fs';
import path from 'node:path';

// Real filesystem persistence for restart and I/O failure tests; not a native storage certification.
export class DiskStorage {
    constructor(directory) { this.directory = directory; }
    get length() { return fs.readdirSync(this.directory).length; }
    key(index) { return this.keys()[index] ?? null; }
    keys() { return fs.readdirSync(this.directory).map(decodeURIComponent).sort(); }
    getItem(key) {
        try { return fs.readFileSync(path.join(this.directory, encodeURIComponent(key)), 'utf8'); }
        catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    }
    setItem(key, value) { fs.writeFileSync(path.join(this.directory, encodeURIComponent(key)), value); }
    removeItem(key) { fs.rmSync(path.join(this.directory, encodeURIComponent(key)), { force: true }); }
    clear() { for (const key of this.keys()) this.removeItem(key); }
}
