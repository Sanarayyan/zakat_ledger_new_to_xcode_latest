import CalendarEventReminders from './components/CalendarEventReminders';
import DailyAyahReminders from './components/DailyAyahReminders';
import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { Capacitor } from '@capacitor/core';
import { appStorage, initializeStorage, flushStorage, hasStorageWriteError } from './services/appStorage';
import { accountDataDeletion } from './services/accountDataService';
import { prepareStartup } from './services/startup.mjs';
import { ErrorBoundary } from './ErrorBoundary.jsx'
import './index.css'
import { LanguageProvider } from './LanguageContext';
import { PrayerProvider } from './PrayerContext';
import { PrayerStreakProvider } from './PrayerStreakContext';
import ScrollToTop from './components/ScrollToTop';

// Loaded from .env file (VITE_GOOGLE_CLIENT_ID) — never hardcode this
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function OptionalGoogleOAuthProvider({ children }) {
    if (Capacitor.isNativePlatform() || !GOOGLE_CLIENT_ID || import.meta.env.MODE === 'device-test') return children;
    return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
}

function StorageFailureNotice() {
    const [failed, setFailed] = React.useState(hasStorageWriteError);
    const [recovered, setRecovered] = React.useState(false);
    React.useEffect(() => {
        const listener = () => setFailed(true);
        window.addEventListener('private-storage-error', listener);
        const recovery = () => setRecovered(true);
        window.addEventListener('storage-data-recovered', recovery);
        setRecovered(Array.from({ length: appStorage.length }, (_, i) => appStorage.key(i)).some(key => key?.startsWith('data_recovery_')));
        return () => { window.removeEventListener('private-storage-error', listener); window.removeEventListener('storage-data-recovered', recovery); };
    }, []);
    return failed ? <div role="alert" style={{ position: 'fixed', top: 0, zIndex: 100000, background: '#a00', color: 'white', padding: 12 }}>Changes could not be saved securely. Keep the app open. <button onClick={() => flushStorage().then(() => setFailed(false)).catch(() => {})}>Retry saving</button></div> : recovered ? <div role="alert">Some saved data could not be read. Original copies are preserved for recovery; please contact support.</div> : null;
}

async function startApp() {
    await prepareStartup({ initializeStorage, deletion: accountDataDeletion, storage: () => appStorage, document });
    ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <StorageFailureNotice />
            {appStorage.migrationConflicts?.length > 0 && <div role="alert">Some older device records differ from protected records. Both copies have been preserved. Please contact support before removing app data.</div>}
            <ScrollToTop />
            <ErrorBoundary><OptionalGoogleOAuthProvider>
                <LanguageProvider>
                    <PrayerProvider>
                        <DailyAyahReminders /><CalendarEventReminders />
                        <PrayerStreakProvider>
                            <App />
                        </PrayerStreakProvider>
                    </PrayerProvider>
                </LanguageProvider>
            </OptionalGoogleOAuthProvider></ErrorBoundary>
        </BrowserRouter>
    </React.StrictMode>,
)
}
function showStartupFailure() {
    const root = document.getElementById('root');
    root.textContent = 'Protected storage or pending deletion cleanup could not finish. Unlock your device and retry. Unfinished work will resume safely. ';
    const retry = document.createElement('button');
    retry.textContent = 'Retry';
    retry.onclick = () => { retry.disabled = true; startApp().catch(showStartupFailure); };
    root.appendChild(retry);
}
startApp().catch(showStartupFailure);
