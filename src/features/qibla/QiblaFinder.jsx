import * as Icons from '../../components/IconLibrary';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import './QiblaFinder.css';
import { useLanguage } from '../../LanguageContext';
import { usePrayer } from '../../PrayerContext';

export default function QiblaFinder() {
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    
    // States
    const [status, setStatus] = useState('initial'); // 'initial', 'needs-permission', 'loading', 'active', 'location-denied', 'compass-denied'
    const [qiblaDir, setQiblaDir] = useState(null);
    const [distance, setDistance] = useState(null);
    const [compassDir, setCompassDir] = useState(null);
    const [isFallback, setIsFallback] = useState(false);
    const [isAligned, setIsAligned] = useState(false);
    
    // Refs
    const continuousHeadingRef = useRef(0);
    const lastRawHeadingRef = useRef(null);
    const watcherIdRef = useRef(null);
    const frameRef = useRef(null);
    const successTriggeredRef = useRef(false);
    const hasAbsoluteRef = useRef(false);
    
    // Smoothing
    const LPF_ALPHA = 0.08; 
    
    // Makkah
    const KAABA_LAT = 21.422487;
    const KAABA_LNG = 39.826206;

    useEffect(() => {
        const isIOS = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
        if (isIOS) {
            setStatus('needs-permission');
        } else {
            startQiblaFinder();
        }

        return () => {
            if (watcherIdRef.current !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watcherIdRef.current);
            }
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, []);


    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; 
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return Math.round(R * c);
    };

    const calculateQibla = (lat, lng) => {
        const φ1 = lat * Math.PI / 180;
        const λ1 = lng * Math.PI / 180;
        const φ2 = KAABA_LAT * Math.PI / 180;
        const λ2 = KAABA_LNG * Math.PI / 180;

        const Δλ = λ2 - λ1;
        const y = Math.sin(Δλ);
        const x = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(Δλ);
        
        let qibla = Math.atan2(y, x) * 180 / Math.PI;
        qibla = (qibla + 360) % 360;
        setQiblaDir(qibla);
        setDistance(calculateDistance(lat, lng, KAABA_LAT, KAABA_LNG));
    };

    const startLocation = () => {
        if (!navigator.geolocation) {
            setStatus('location-denied');
            return;
        }

        const successCb = (position) => {
            const { latitude, longitude } = position.coords;
            calculateQibla(latitude, longitude);
            setStatus('active');
            
            watcherIdRef.current = navigator.geolocation.watchPosition((pos) => {
                calculateQibla(pos.coords.latitude, pos.coords.longitude);
            }, () => {}, { enableHighAccuracy: true });
        };

        const errorCb = (error) => {
            console.error("Location error (High Accuracy):", error);
            // Fallback location
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    calculateQibla(latitude, longitude);
                    setStatus('active');
                },
                (err2) => {
                    console.error("Location error (Fallback):", err2);
                    setStatus('location-denied');
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: Infinity }
            );
        };

        navigator.geolocation.getCurrentPosition(successCb, errorCb, { 
            enableHighAccuracy: true, 
            timeout: 15000, 
            maximumAge: 0 
        });
    };

    const handleOrientation = (e) => {
        let heading = null;

        if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
            heading = e.webkitCompassHeading;
        } else if (e.absolute === true || e.type === 'deviceorientationabsolute') {
            hasAbsoluteRef.current = true;
            heading = 360 - e.alpha; 
        } else if (e.alpha !== null) {
            if (hasAbsoluteRef.current) return; // Prevent jitter if absolute is supported
            heading = 360 - e.alpha; 
        } else {
            return;
        }

        if (heading !== null) {
            setIsFallback(false);
            
            if (lastRawHeadingRef.current === null) {
                continuousHeadingRef.current = heading;
                lastRawHeadingRef.current = heading;
            } else {
                // Correct Low-Pass Filter logic tracking shortest path difference
                let diff = heading - continuousHeadingRef.current;
                
                // Normalize diff to -180 to 180
                diff = ((diff + 540) % 360) - 180;
                
                continuousHeadingRef.current += diff * LPF_ALPHA;
                lastRawHeadingRef.current = heading;
            }
        }
    };

    const animationLoop = () => {
        if (lastRawHeadingRef.current !== null) {
            setCompassDir(continuousHeadingRef.current);
        }
        frameRef.current = requestAnimationFrame(animationLoop);
    };

    const startOrientation = () => {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
        
        frameRef.current = requestAnimationFrame(animationLoop);
        
        setTimeout(() => {
            if (lastRawHeadingRef.current === null) {
                setIsFallback(true);
            }
        }, 2500);
    };

    const startQiblaFinder = () => {
        setStatus('loading');
        startOrientation();
        startLocation(); 
    };

    const requestPermissionAndStart = async () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const response = await DeviceOrientationEvent.requestPermission();
                if (response === 'granted') {
                    startQiblaFinder();
                } else {
                    setStatus('compass-denied');
                }
            } catch (err) {
                console.error("Compass Permission request failed", err);
                setStatus('compass-denied');
            }
        } else {
            startQiblaFinder();
        }
    };

    const getGuidanceState = (qibla, heading) => {
        // Calculate raw difference
        let difference = qibla - heading;
        
        // Normalize using shortest rotation path formula
        let normalizedDiff = ((difference + 540) % 360) - 180;

        // Temporary console logs for debugging
        console.log(`[Qibla Debug] Device Heading: ${heading.toFixed(2)}° | Qibla Bearing: ${qibla.toFixed(2)}° | Relative Angle: ${normalizedDiff.toFixed(2)}°`);

        const absOffset = Math.abs(normalizedDiff);
        let status = 'none';
        let text = '';
        let isNowAligned = false;

        // Alignment threshold is ±5°
        if (absOffset <= 5.0) { 
            status = 'aligned';
            text = lang === 'ml' ? '<Icons.CheckIcon /> ഖിബ്ലയ്ക്ക് നേരെ' : '<Icons.CheckIcon /> Facing Qibla';
            isNowAligned = true;
        } else if (absOffset <= 25) {
            status = normalizedDiff > 0 ? 'turn-right' : 'turn-left';
            text = lang === 'ml' ? 'ഏകദേശം എത്തി' : 'Almost There';
        } else {
            status = normalizedDiff > 0 ? 'turn-right' : 'turn-left';
            text = normalizedDiff > 0 
                ? (lang === 'ml' ? 'വലത്തോട്ട് തിരിയുക →' : 'Turn Right →') 
                : (lang === 'ml' ? '← ഇടത്തോട്ട് തിരിയുക' : '← Turn Left');
        }

        if (isNowAligned !== isAligned) {
            setIsAligned(isNowAligned);
            if (isNowAligned) {
                try {
                    Haptics.impact({ style: ImpactStyle.Heavy });
                } catch (e) {
                    console.log('Haptics not available');
                }
                if (window.checkAppRating) {
                    window.checkAppRating('qibla');
                }
            }
        }

        return { status, text, isAligned: isNowAligned };
    };

    const renderCompass = () => {
        if (status === 'active' && qiblaDir !== null) {
            const displayCompassDir = isFallback ? 0 : compassDir || 0;
            
            let guidance = null;
            if (!isFallback && compassDir !== null) {
                guidance = getGuidanceState(qiblaDir, compassDir);
            }

            return (
                <div className="qibla-compass-section">
                    
                    {isFallback && (
                         <div className="clean-guidance-header fallback">
                             <h2 className="minimal-instruction">{lang === 'ml' ? 'ലൈവ് കോമ്പസ് ലഭ്യമല്ല' : 'Live compass unavailable'}</h2>
                             <p className="instruction-subtext">{lang === 'ml' ? 'സെൻസർ പിന്തുണ ലഭ്യമല്ല' : 'Device sensors restricted'}</p>
                         </div>
                    )}

                    <div className="qibla-compass-container-premium">
                        {/* Static Phone Top Marker */}
                        <div className={`premium-phone-marker ${guidance?.isAligned ? 'aligned' : ''}`}></div>

                        {/* Smooth animated rotating ring (Outer ring) */}
                        <div className={`premium-compass-ring ${guidance?.isAligned ? 'aligned' : ''}`} style={{ transform: `rotate3d(0, 0, 1, ${-displayCompassDir}deg)` }}>
                            <div className="compass-mark n">N</div>
                            <div className="compass-mark e">E</div>
                            <div className="compass-mark s">S</div>
                            <div className="compass-mark w">W</div>
                            
                            {/* Inner ticks */}
                            {[...Array(60)].map((_, i) => (
                                <div key={i} className={`compass-tick-premium ${i % 5 === 0 ? 'major' : ''}`} style={{ transform: `rotate(${i * 6}deg)` }}></div>
                            ))}

                            {/* Orbiting Kaaba Marker */}
                            <div className="kaaba-orbit-container" style={{ transform: `rotate(${qiblaDir}deg)` }}>
                                <div className={`kaaba-orbit-icon ${guidance?.isAligned ? 'aligned' : ''}`}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        {/* Center static design (optional, to look premium) */}
                        <div className="premium-compass-center"></div>
                    </div>
                    
                    {/* Live Guidance below compass */}
                    {!isFallback && guidance && (
                        <div className={`premium-guidance-text ${guidance.status}`}>
                            <h2>{guidance.text}</h2>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };



    const renderBottomCard = () => {
        if (status === 'active' && distance !== null) {
            return (
                <div className="qibla-bottom-container">
                    <div className="qibla-bottom-card-minimal distance-card">
                        <div className="minimal-info-item">
                            <span className="info-label">{lang === 'ml' ? 'മക്കയിലേക്കുള്ള ദൂരം' : 'Distance to Makkah'}</span>
                            <span className="info-value">{distance.toLocaleString()} <small>km</small></span>
                        </div>
                    </div>
                    {!isFallback && !isAligned && (
                        <div className="qibla-bottom-card-minimal calibration-card">
                            <div className="compass-calibration-hint">
                                {lang === 'ml' ? 'കോമ്പസ് കൃത്യത മെച്ചപ്പെടുത്താൻ ഫോൺ 8 ആകൃതിയിൽ കറക്കുക.' : 'Move your phone in a figure-8 motion to improve compass accuracy.'}
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const renderPermissionsCard = () => {
        if (status === 'needs-permission') {
            return (
                <div className="qibla-action-card-minimal">
                    <h2>{lang === 'ml' ? 'കോമ്പസ് അനുവദിക്കുക' : 'Compass Access'}</h2>
                    <p>{lang === 'ml' ? 'ഖിബ്ല ദിശ കൃത്യമായി അറിയാൻ കോമ്പസ് അനുവദിക്കുക.' : 'Allow compass access to locate the Qibla.'}</p>
                    <button className="qibla-btn minimal" onClick={requestPermissionAndStart}>
                        {lang === 'ml' ? 'അനുവദിക്കുക' : 'Enable Compass'}
                    </button>
                </div>
            );
        }
        if (status === 'compass-denied') {
            return (
                <div className="qibla-action-card-minimal error">
                    <h2>{lang === 'ml' ? 'അനുമതി നിഷേധിച്ചു' : 'Compass Denied'}</h2>
                    <p>{lang === 'ml' ? 'ദയവായി നിങ്ങളുടെ ഉപകരണ സെറ്റിങ്‌സിൽ കോമ്പസ് അനുവദിക്കുക.' : 'Please allow motion sensors in settings.'}</p>
                    <button className="qibla-btn minimal" onClick={requestPermissionAndStart}>
                        {lang === 'ml' ? 'വീണ്ടും ശ്രമിക്കുക' : 'Try Again'}
                    </button>
                </div>
            );
        }
        if (status === 'location-denied') {
            return (
                <div className="qibla-action-card-minimal error">
                    <h2>{lang === 'ml' ? 'ലൊക്കേഷൻ ആവശ്യമാണ്' : 'Location Required'}</h2>
                    <p>{lang === 'ml' ? 'ഖിബ്ല കണ്ടെത്താൻ ലൈവ് ലൊക്കേഷൻ അനുവദിക്കുക.' : 'Location permission is needed to find Qibla. Please enable it in your device settings.'}</p>
                    <button className="qibla-btn minimal" onClick={() => { setStatus('initial'); startQiblaFinder(); }}>
                        {lang === 'ml' ? 'വീണ്ടും ശ്രമിക്കുക' : 'Retry'}
                    </button>
                </div>
            );
        }
        if (status === 'loading') {
            return (
                <div className="qibla-action-card-minimal">
                    <div className="qibla-loader-minimal"></div>
                    <p>{lang === 'ml' ? 'ഖിബ്ല കണ്ടെത്തുന്നു...' : 'Calibrating compass...'}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="qibla-page qibla-modern-theme">
            <div className="qibla-header-minimal">
                <button className="qibla-back-btn" onClick={() => navigate(-1)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <h1 className="qibla-title-minimal">{lang === 'ml' ? 'ഖിബ്ല' : 'Qibla'}</h1>
                <div className="qibla-header-spacer"></div>
            </div>

            <div className="qibla-content-wrapper">
                {renderPermissionsCard()}
                {renderCompass()}
                {renderBottomCard()}
            </div>
        </div>
    );
}
