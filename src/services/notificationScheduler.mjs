// Serialize each feature's replacement, including cancellation, to suppress old effects.
export function createNotificationScheduler(api) {
    let queue = Promise.resolve();
    let generation = 0;
    return {
        cancel() { generation++; },
        replace(ids, notifications) {
            const current = ++generation;
            queue = queue.catch(() => {}).then(async () => {
                if (current !== generation) return;
                await api.cancel({ notifications: ids.map(id => ({ id })) });
                if (current === generation && notifications.length) await notificationWrites.run(() => api.schedule({ notifications }));
            });
            return queue;
        },
    };
}

// Deletion waits for native registrations already in flight before reading and clearing pending reminders.
export function createNotificationWrites() {
    const active = new Set();
    let stopped = false;
    return {
        async run(write) {
            if (stopped) throw new Error('Notifications are unavailable while app data is being deleted.');
            const operation = Promise.resolve().then(write);
            active.add(operation);
            try {
                return await operation;
            } finally {
                active.delete(operation);
            }
        },
        async stop() {
            stopped = true;
            await Promise.allSettled(active);
        },
    };
}

export const notificationWrites = createNotificationWrites();
