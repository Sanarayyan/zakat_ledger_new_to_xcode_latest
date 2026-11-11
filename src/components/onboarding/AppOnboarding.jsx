import CitySearch from '../CitySearch';
import { appStorage } from '../../services/appStorage';
import React, { useState, useEffect, useRef } from 'react';
import { getDeviceLocation, locationErrorMessage } from '../../services/locationService.mjs';
import { usePrayer } from '../../PrayerContext';
import './AppOnboarding.css';

// SVG Icons to avoid emojis and maintain a premium look
const ICONS = {
    location: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    madhab: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="M6.5 2L6.5 17" />
        </svg>
    ),
    gender: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
};

export default function AppOnboarding({ onComplete }) {
    const { updateSettings } = usePrayer();
    const [step, setStep] = useState(1);
    const [isExiting, setIsExiting] = useState(false);
    
    // Check dark mode for smooth integration
    const [isDark, setIsDark] = useState(() => {
        return document.body.classList.contains('dark-mode');
    });

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.body.classList.contains('dark-mode'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const [form, setForm] = useState({
        lat: '',
        lng: '',
        city: '',
        madhab: '',
        gender: ''
    });

    const [isDetecting, setIsDetecting] = useState(false);
    const [locationError, setLocationError] = useState(false);
    const [showCitySearch, setShowCitySearch] = useState(false);
    const locationRequest = useRef(0);

    useEffect(() => () => { locationRequest.current++; }, []);

    const handleAutoDetect = async () => {
        const request = ++locationRequest.current;
        setIsDetecting(true);
        setLocationError(false);
        setShowCitySearch(false);
        try {
            const location = await getDeviceLocation({ quick: true });
            if (request === locationRequest.current) setForm(prev => ({ ...prev, ...location }));
        } catch (error) {
            if (request === locationRequest.current) setLocationError(locationErrorMessage(error));
        } finally {
            setIsDetecting(false);
        }
    };

    const nextStep = () => {
        if (step < 3) {
            setStep(prev => prev + 1);
        } else {
            handleFinish();
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(prev => prev - 1);
        }
    };

    const skipLocation = () => {
        locationRequest.current++;
        nextStep();
    };

    const openCitySearch = () => {
        locationRequest.current++;
        setLocationError(false);
        setShowCitySearch(true);
    };

    const skipMadhab = () => {
        if (!form.madhab) setForm(prev => ({ ...prev, madhab: 'shafi' }));
        nextStep();
    };

    const skipGender = () => {
        if (!form.gender) {
            const defaultGender = 'Prefer not to say';
            setForm(prev => ({ ...prev, gender: defaultGender }));
            handleFinish(defaultGender);
            return;
        }
        handleFinish();
    };

    // Swipe Gestures
    const [touchStartX, setTouchStartX] = useState(null);
    const [touchEndX, setTouchEndX] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEndX(null);
        setTouchStartX(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStartX || !touchEndX) return;
        const distance = touchStartX - touchEndX;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            if (step === 1 && form.city) nextStep();
            if (step === 2 && form.madhab) nextStep();
            if (step === 3 && form.gender) nextStep();
        }
        if (isRightSwipe) {
            prevStep();
        }
    };

    const handleFinish = (overrideGender) => {
        const finalGender = overrideGender || form.gender;
        // Save to global PrayerContext
        const newSettings = {
            location: form.city ? { lat: form.lat, lng: form.lng, city: form.city, source: form.source || 'device' } : undefined,
            madhab: form.madhab || 'shafi',
            school: (form.madhab === 'hanafi') ? 1 : 0,
            notificationsEnabled: false // Can be enabled in settings later
        };

        updateSettings(newSettings);
        
        if (finalGender) {
            appStorage.setItem('userGender', finalGender);
        }
        
        appStorage.setItem('app_onboarding_completed', 'true');
        
        setIsExiting(true);
        setTimeout(onComplete, 800);
    };

    return (
        <div 
            className={`app-onboarding-viewport ${isDark ? 'dark-mode' : 'light-mode'} ${isExiting ? 'exit' : ''}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Ambient Background Glows */}
            <div className="app-onboarding-glow top-right"></div>
            <div className="app-onboarding-glow bottom-left"></div>
            
            <div className="onboarding-header">
                {step > 1 ? (
                    <button className="btn-onboarding-back" onClick={prevStep}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                ) : (
                    <div style={{ width: 44 }}></div>
                )}
                <div className="onboarding-step-counter">Step {step} of 3</div>
            </div>

            <div className="app-onboarding-container">
                {step === 1 && (
                    <div className="onboarding-step-wrapper" key="step1">
                        <div className="onboarding-icon-wrapper">{ICONS.location}</div>
                        <h1 className="onboarding-title">Location Setup</h1>
                        <p className="onboarding-description">
                            We use your location to calculate accurate prayer times and Qibla direction.
                        </p>

                        {form.city ? (
                            <div className="location-detected-card">
                                <div className="loc-city-name">{form.city}</div>
                                <button className="loc-change-btn" onClick={() => setForm({...form, city: '', lat: '', lng: ''})}>Change</button>
                            </div>
                        ) : locationError ? (
                            <div className="onboarding-location-error" style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                    {locationError}
                                </p>
                                <div className="onboarding-actions" style={{ flexDirection: 'column', gap: '12px' }}>
                                    <button className="btn-onboarding-primary" onClick={handleAutoDetect} disabled={isDetecting}>Retry</button>
                                    <button className="btn-onboarding-ghost" onClick={openCitySearch}>Select city manually</button>
                                    <button className="btn-onboarding-ghost" onClick={skipLocation}>Skip for now</button>
                                </div>
                            </div>
                        ) : (
                            <div className="onboarding-actions" style={{marginBottom: '24px'}}>
                                <button className="btn-onboarding-primary" onClick={handleAutoDetect} disabled={isDetecting}>
                                    {isDetecting && !showCitySearch ? 'Detecting...' : 'Use phone location'}
                                </button>
                                <button className="btn-onboarding-ghost" onClick={skipLocation}>
                                    Skip for now
                                </button>
                                <button className="btn-onboarding-ghost" onClick={openCitySearch}>Select city manually</button>
                            </div>
                        )}

                        {showCitySearch && !form.city && (
                            <CitySearch onSelect={location => {
                                setForm(previous => ({ ...previous, ...location }));
                                setLocationError(false);
                                setShowCitySearch(false);
                            }} />
                        )}

                        {form.city && (
                            <div className="onboarding-actions">
                                <button className="btn-onboarding-primary" onClick={nextStep}>Continue</button>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="onboarding-step-wrapper" key="step2">
                        <div className="onboarding-icon-wrapper">{ICONS.madhab}</div>
                        <h1 className="onboarding-title">Select Madhab</h1>
                        <p className="onboarding-subtext">
                            Madhab selection helps provide accurate prayer time calculations and Islamic guidance preferences.
                        </p>

                        <div className="selection-grid">
                            {['shafi', 'hanafi', 'maliki', 'hanbali'].map(m => (
                                <div 
                                    key={m}
                                    className={`selection-card ${form.madhab === m ? 'active' : ''}`}
                                    onClick={() => setForm({...form, madhab: m})}
                                >
                                    <span className="card-title">{m.charAt(0).toUpperCase() + m.slice(1)}</span>
                                    <div className="card-indicator"></div>
                                </div>
                            ))}
                        </div>

                        <div className="onboarding-actions">
                            <button className="btn-onboarding-primary" onClick={nextStep} disabled={!form.madhab}>
                                Continue
                            </button>
                            <button className="btn-onboarding-ghost" onClick={skipMadhab}>
                                Skip
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="onboarding-step-wrapper" key="step3">
                        <div className="onboarding-icon-wrapper">{ICONS.gender}</div>
                        <h1 className="onboarding-title">Personalize Experience</h1>
                        <p className="onboarding-subtext">
                            We ask this to personalize certain Islamic guidance and features respectfully, including additional information relevant for women.
                        </p>

                        <div className="selection-grid">
                            {['Female', 'Male'].map(g => (
                                <div 
                                    key={g}
                                    className={`selection-card ${form.gender === g ? 'active' : ''}`}
                                    onClick={() => setForm({...form, gender: g})}
                                >
                                    <span className="card-title">{g}</span>
                                    <div className="card-indicator"></div>
                                </div>
                            ))}
                        </div>

                        <div className="onboarding-actions">
                            <button className="btn-onboarding-primary" onClick={() => handleFinish()} disabled={!form.gender}>
                                Complete Setup
                            </button>
                            <button className="btn-onboarding-ghost" onClick={skipGender}>
                                Skip
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="onboarding-progress">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`progress-dot ${i === step ? 'active' : ''}`}></div>
                ))}
            </div>
        </div>
    );
}
