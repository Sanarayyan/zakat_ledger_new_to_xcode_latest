import { Capacitor } from '@capacitor/core';
import { SecureStorage, KeychainAccess } from '@aparajita/capacitor-secure-storage';
import { createPrivateStorage } from './privateStorage.mjs';

export let appStorage;
let storageWriteError = false;
export const hasStorageWriteError = () => storageWriteError;
export async function initializeStorage() {
    if (Capacitor.isNativePlatform()) {
        await SecureStorage.setKeyPrefix('muslimplus.');
        await SecureStorage.setSynchronize(false);
        await SecureStorage.setDefaultKeychainAccess(KeychainAccess.whenUnlockedThisDeviceOnly);
        appStorage = await createPrivateStorage(SecureStorage, window.localStorage,
            () => { storageWriteError = true; window.dispatchEvent(new Event('private-storage-error')); });
    } else {
        // Browser data retains its existing persistence. Authentication tokens are memory-only.
        appStorage = window.localStorage;
        const old = appStorage.getItem('zakat_user');
        if (old) {
            try { const { accessToken, ...profile } = JSON.parse(old); appStorage.setItem('zakat_user', JSON.stringify(profile)); }
            catch { appStorage.removeItem('zakat_user'); }
        }
        appStorage.removeItem('auth_session_v2');
    }
}
export async function flushStorage() {
    await appStorage?.flush?.();
    storageWriteError = false;
}
