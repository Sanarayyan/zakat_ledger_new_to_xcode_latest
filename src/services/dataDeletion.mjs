export const DELETION_JOURNAL_KEY = 'muslimplus_data_deletion_v1';

// No raw email or credentials are stored; an account hash prevents retrying against a different account.
export async function deletionAccountHash(email) {
    if (!email) return null;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.trim().toLowerCase()));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
export function createDataDeletion({ journal, deleteCloud, cleanupReminders, clearLocal }) {
    let active;
    async function pending() {
        const raw = await journal.getItem(DELETION_JOURNAL_KEY);
        if (!raw) return null;
        const operation = JSON.parse(raw);
        if (operation.version !== 1 || !['cloud', 'local'].includes(operation.stage) || typeof operation.id !== 'string') {
            throw new Error('Deletion progress could not be read. Existing data has been retained.');
        }
        return operation;
    }
    async function perform(token, start, email) {
        let operation = await pending();
        if (!operation) {
            if (!start) return;
            operation = { version: 1, id: crypto.randomUUID(), stage: token ? 'cloud' : 'local', accountHash: await deletionAccountHash(email) };
            await journal.setItem(DELETION_JOURNAL_KEY, JSON.stringify(operation));
        }
        if (operation.stage === 'cloud') {
            const sameAccount = operation.accountHash && operation.accountHash === await deletionAccountHash(email);
            // An unrecognized account may only ask for an existing receipt, never delete cloud data.
            const result = await deleteCloud(sameAccount ? token : undefined, operation.id);
            if (result?.deleted !== true) throw new Error('Cloud deletion has not been confirmed. Your local data was retained.');
            operation = { ...operation, stage: 'local' };
            await journal.setItem(DELETION_JOURNAL_KEY, JSON.stringify(operation));
        }
        await cleanupReminders();
        await clearLocal();
        await journal.removeItem(DELETION_JOURNAL_KEY);
    }
    function run(token, start, email) {
        if (!active) active = perform(token, start, email).finally(() => { active = null; });
        return active;
    }
    return { pending, start: (token, email) => run(token, true, email), resume: (token, email) => run(token, false, email) };
}
