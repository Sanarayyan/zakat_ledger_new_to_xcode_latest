import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { GoogleLogin } from '@react-oauth/google';
import { useLanguage } from '../LanguageContext';
import { nativeGoogleCredential } from '../services/authService';

export default function GoogleSignInButton({ service, onSuccess, onError }) {
    const { t } = useLanguage();
    const native = Capacitor.isNativePlatform();
    const [challenge, setChallenge] = useState(null);
    const [busy, setBusy] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        if (native) return;
        let active = true;
        service.loginChallenge().then(value => { if (active) setChallenge(value); }).catch(error => { if (active) onError(error.message); });
        return () => { active = false; };
    }, [attempt]);
    const complete = async (credential, selectedChallenge) => {
        setBusy(true);
        try { await onSuccess({ credential, challengeId: selectedChallenge.challengeId }); }
        finally { setBusy(false); setChallenge(null); setAttempt(value => value + 1); }
    };
    if (native) return <button className="btn-primary" disabled={busy} onClick={async () => {
        setBusy(true);
        try {
            const nextChallenge = await service.loginChallenge();
            await complete(await nativeGoogleCredential(nextChallenge.nonce), nextChallenge);
        } catch (error) { onError(error.message); }
        finally { setBusy(false); }
    }}>{busy ? t('signing_in_google') : t('continue_with_google')}</button>;
    if (!challenge) return <button disabled={busy} onClick={() => setAttempt(value => value + 1)}>{t('prepare_google_signin')}</button>;
    return <GoogleLogin nonce={challenge.nonce} onSuccess={response => complete(response.credential, challenge)}
        onError={() => { onError('Google sign-in was cancelled or failed.'); setChallenge(null); setAttempt(value => value + 1); }} theme="filled_blue" shape="pill" />;
}
