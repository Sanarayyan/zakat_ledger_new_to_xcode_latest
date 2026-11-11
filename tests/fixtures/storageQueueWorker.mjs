import fs from 'node:fs';
import path from 'node:path';
import { DiskStorage } from '../helpers/diskStorage.mjs';
import { createPrivateStorage } from '../../src/services/privateStorage.mjs';

const [root, mode] = process.argv.slice(2);
const persistent = new DiskStorage(path.join(root, 'secure'));
persistent.setItem = async (key, value) => {
    if (mode === 'pending') {
        // Interrupt before I/O acknowledgement; never fabricate a successful write.
        process.send('pending');
        await new Promise(() => {});
    }
    await fs.promises.writeFile(path.join(persistent.directory, encodeURIComponent(key)), value);
};
const storage = await createPrivateStorage(persistent, new DiskStorage(path.join(root, 'legacy')));
process.on('message', () => {}); // Keep the process alive until the parent terminates it.
storage.setItem('reading_progress', mode === 'committed' ? 'completed' : 'unfinished');
storage.setItem('theme', 'dark-mode');
await storage.flush();
process.send('committed');
