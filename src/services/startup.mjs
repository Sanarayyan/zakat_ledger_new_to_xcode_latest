import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';

export function storedTheme(storage) {
    return storage.getItem('theme') === 'dark-mode' ? 'dark-mode' : 'light-mode';
}

export function applyTheme(document, theme) {
    for (const element of [document.documentElement, document.body]) {
        element.classList.toggle('light-mode', theme === 'light-mode');
        element.classList.toggle('dark-mode', theme === 'dark-mode');
    }
    if (Capacitor.isNativePlatform()) {
        SystemBars.setStyle({ style: theme === 'dark-mode' ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {});
    }
}

export async function prepareStartup({ initializeStorage, deletion, storage, document }) {
    await initializeStorage();
    // Complete confirmed deletions before providers can read and resave old preferences.
    if ((await deletion.pending())?.stage === 'local') await deletion.resume();
    applyTheme(document, storedTheme(storage()));
}
