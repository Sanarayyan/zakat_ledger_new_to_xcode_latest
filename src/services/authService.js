import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { appStorage, flushStorage } from './appStorage.js';

let browserSession = null;
let googleInitialized;
export function authenticationConfiguration(platform, webClientId, iosClientId) {
    if (!webClientId || !/^\S+\.apps\.googleusercontent\.com$/.test(webClientId) || webClientId.includes('your-')) throw new Error('Google sign-in is awaiting the deployment team’s Web OAuth client ID.');
    if (platform === 'ios' && (!iosClientId || !/^\S+\.apps\.googleusercontent\.com$/.test(iosClientId))) throw new Error('Google sign-in is awaiting the iOS OAuth client ID and URL scheme.');
    return { google: { webClientId, ...(iosClientId ? { iOSClientId: iosClientId, iOSServerClientId: webClientId } : {}), mode: 'online' } };
}
export async function nativeGoogleCredential(nonce) {
    const config = authenticationConfiguration(Capacitor.getPlatform(), import.meta.env.VITE_GOOGLE_CLIENT_ID, import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID);
    if (!googleInitialized) googleInitialized = SocialLogin.initialize(config).catch(error => { googleInitialized = null; throw error; });
    await googleInitialized;
    const response = await SocialLogin.login({ provider: 'google', options: { scopes: ['email', 'profile'], nonce } });
    if (!response.result?.idToken) throw new Error('Google did not return an identity token.');
    return response.result.idToken;
}
export async function saveSession(session) {
    if (Capacitor.isNativePlatform()) {
        appStorage.setItem('auth_session_v2', JSON.stringify(session));
        await flushStorage();
    } else browserSession = session;
    const { accessToken, ...profile } = session;
    appStorage.setItem('zakat_user', JSON.stringify(profile));
    await flushStorage();
}
export function restoreSession() {
    try {
        const session = Capacitor.isNativePlatform() ? JSON.parse(appStorage.getItem('auth_session_v2')) : browserSession;
        return session?.accessToken && Date.parse(session.expiresAt) > Date.now() ? session : null;
    } catch { return null; }
}
export async function clearSession() {
    browserSession = null;
    appStorage.removeItem('auth_session_v2');
    appStorage.removeItem('zakat_user');
    await flushStorage();
}
export async function signOutGoogle() {
    if (Capacitor.isNativePlatform() && googleInitialized) await SocialLogin.logout({ provider: 'google' });
}
