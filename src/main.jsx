import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'
import './index.css'
import { LanguageProvider } from './LanguageContext';
import { PrayerProvider } from './PrayerContext';
import { PrayerStreakProvider } from './PrayerStreakContext';
import ScrollToTop from './components/ScrollToTop';

// Loaded from .env file (VITE_GOOGLE_CLIENT_ID) — never hardcode this
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <ScrollToTop />
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <LanguageProvider>
                    <PrayerProvider>
                        <PrayerStreakProvider>
                            <ErrorBoundary><App /></ErrorBoundary>
                        </PrayerStreakProvider>
                    </PrayerProvider>
                </LanguageProvider>
            </GoogleOAuthProvider>
        </BrowserRouter>
    </React.StrictMode>,
)
