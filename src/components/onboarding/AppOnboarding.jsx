import React, { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
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

    const handleAutoDetect = async () => {
        setIsDetecting(true);
        setLocationError(false);
        try {
            let permission = await Geolocation.checkPermissions();
            
            if (permission.location !== 'granted') {
                permission = await Geolocation.requestPermissions();
            }

            if (permission.location !== 'granted' && permission.location !== 'prompt-with-rationale') {
                // Denied or disabled
                setLocationError(true);
                setIsDetecting(false);
                return;
            }

            // Enforce a strict 15s timeout because Android Geolocation can hang indefinitely
            const positionPromise = Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Location request timed out')), 15000));
            
            const position = await Promise.race([positionPromise, timeoutPromise]);
            const { latitude, longitude } = position.coords;
            
            try {
                const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                const data = await res.json();
                setForm(prev => ({
                    ...prev,
                    lat: latitude,
                    lng: longitude,
                    city: data.city || data.locality || 'Detected Location'
                }));
            } catch (err) {
                setForm(prev => ({ ...prev, lat: latitude, lng: longitude, city: 'Detected Location' }));
            }
        } catch (error) {
            console.error("Location error:", error);
            setLocationError(true);
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
        nextStep();
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
            location: { 
                lat: form.lat || 0, 
                lng: form.lng || 0, 
                city: form.city || 'Default' 
            },
            madhab: form.madhab || 'shafi',
            school: (form.madhab === 'hanafi') ? 1 : 0,
            method: 1,
            notificationsEnabled: false // Can be enabled in settings later
        };

        updateSettings(newSettings);
        
        if (finalGender) {
            localStorage.setItem('userGender', finalGender);
        }
        
        localStorage.setItem('app_onboarding_completed', 'true');
        
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
                                    Couldn't detect your location automatically.
                                </p>
                                <div className="onboarding-actions" style={{ flexDirection: 'column', gap: '12px' }}>
                                    <button className="btn-onboarding-primary" onClick={handleAutoDetect}>Retry</button>
                                    <button className="btn-onboarding-ghost" onClick={skipLocation}>Select city manually later</button>
                                </div>
                            </div>
                        ) : (
                            <div className="onboarding-actions" style={{marginBottom: '24px'}}>
                                <button className="btn-onboarding-primary" onClick={handleAutoDetect} disabled={isDetecting}>
                                    {isDetecting ? 'Detecting...' : 'Allow Location'}
                                </button>
                                <button className="btn-onboarding-ghost" onClick={skipLocation} disabled={isDetecting}>
                                    Skip for now
                                </button>
                            </div>
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
