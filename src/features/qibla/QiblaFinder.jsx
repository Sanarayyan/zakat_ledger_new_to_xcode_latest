import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { getDevicePosition, locationDisplayName, locationErrorMessage } from '../../services/locationService.mjs';
import { qiblaBearing, distanceToMakkah, browserCompassHeading, headingDifference, normalizeHeading, smoothHeading } from './qiblaMath.mjs';
import './QiblaFinder.css';
import { useLanguage } from '../../LanguageContext';
import { usePrayer } from '../../PrayerContext';

const QiblaCompass = registerPlugin('QiblaCompass');
const compassTicks = Array.from({ length: 60 }, (_, i) => (
    <div key={i} className={`compass-tick-premium ${i % 5 === 0 ? 'major' : ''}`} style={{ transform: `rotate(${i * 6}deg)` }} />
));

export default function QiblaFinder() {
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    
    const { settings } = usePrayer();
    const [status, setStatus] = useState('initial');
    const [qiblaDir, setQiblaDir] = useState(null);
    const [distance, setDistance] = useState(null);
    const [compassDir, setCompassDir] = useState(null);
    const [isFallback, setIsFallback] = useState(false);
    const [sensorHint, setSensorHint] = useState('');
    const [locationError, setLocationError] = useState('');
    const [refreshingLocation, setRefreshingLocation] = useState(false);
    const continuousHeadingRef = useRef(null);
    const sensorRef = useRef(null);
    const frameRef = useRef(null);
    const fallbackTimerRef = useRef(null);
    const lastHeadingAt = useRef(null);
    const generationRef = useRef(0);
    const isNative = Capacitor.isNativePlatform();
    const isAndroid = Capacitor.getPlatform() === 'android';
    const isAligned = status === 'active' && !isFallback && !refreshingLocation && !sensorHint && compassDir !== null
        && Math.abs(headingDifference(qiblaDir, compassDir % 360)) <= 5;

    const updateHeading = heading => {
        if (!Number.isFinite(heading)) return;
        lastHeadingAt.current = performance.now();
        // Use the exact final reading; the CSS transition handles the visual easing.
        continuousHeadingRef.current = smoothHeading(continuousHeadingRef.current, heading, 1);
        if (frameRef.current === null) {
            frameRef.current = requestAnimationFrame(() => {
                setCompassDir(continuousHeadingRef.current);
                setIsFallback(false);
                frameRef.current = null;
            });
        }
    };

    const handleOrientation = useCallback(event => {
        updateHeading(browserCompassHeading(event, window.screen?.orientation?.angle ?? window.orientation ?? 0));
    }, []);

    const stopTracking = () => {
        if (sensorRef.current) {
            sensorRef.current.remove().catch(() => {});
            sensorRef.current = null;
            QiblaCompass.stop().catch(() => {});
        }
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
        clearInterval(fallbackTimerRef.current);
        window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
        window.removeEventListener('deviceorientation', handleOrientation, true);
    };

    const applyPosition = coords => {
        setQiblaDir(qiblaBearing(coords.latitude, coords.longitude));
        setDistance(distanceToMakkah(coords.latitude, coords.longitude));
        setStatus('active');
    };

    const startQiblaFinder = async () => {
        const generation = ++generationRef.current;
        stopTracking();
        continuousHeadingRef.current = null;
        lastHeadingAt.current = null;
        setCompassDir(null);
        setIsFallback(false);
        setSensorHint('');
        setLocationError('');
        setStatus('loading');
        if (!isNative) {
            window.addEventListener('deviceorientationabsolute', handleOrientation, true);
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
        let coords;
        const saved = settings?.location;
        const validSaved = Number.isFinite(saved?.lat) && Math.abs(saved.lat) <= 90
            && Number.isFinite(saved?.lng) && Math.abs(saved.lng) <= 180 && !saved.city?.includes('(Fallback)');
        const refreshSavedLocation = isAndroid && validSaved;
        setRefreshingLocation(refreshSavedLocation);
        if (validSaved) {
            coords = { latitude: saved.lat, longitude: saved.lng };
            applyPosition(coords);
            setLocationError(`${t('using_selected_city')}: ${locationDisplayName(saved, lang)}`);
        } else {
            try {
                const position = await getDevicePosition();
                if (generation !== generationRef.current) return;
                coords = position.coords;
                applyPosition(coords);
            } catch (error) {
                if (generation !== generationRef.current) return;
                setLocationError(locationErrorMessage(error, lang));
                setStatus('location-denied');
                stopTracking();
                return;
            }
        }
        const startedAt = performance.now();
        fallbackTimerRef.current = setInterval(() => {
            if (performance.now() - (lastHeadingAt.current ?? startedAt) > 4500) setIsFallback(true);
        }, 500);

        if (isNative) {
            try {
                const listener = await QiblaCompass.addListener('heading', ({ heading, level, calibrated, trueNorth }) => {
                    if (generation !== generationRef.current) return;
                    setSensorHint(!level ? 'level' : !calibrated ? 'calibrate' : trueNorth === false ? 'magnetic' : '');
                    updateHeading(heading);
                });
                if (generation !== generationRef.current) { await listener.remove(); return; }
                sensorRef.current = listener;
                const { available } = await QiblaCompass.start({ lat: coords.latitude, lng: coords.longitude });
                if (generation === generationRef.current && !available) setIsFallback(true);
            } catch {
                if (generation === generationRef.current) setIsFallback(true);
            }
        }

        if (refreshSavedLocation && generation === generationRef.current) {
            try {
                const { coords: current } = await getDevicePosition({ quick: true });
                if (generation !== generationRef.current) return;
                if (sensorRef.current) {
                    await QiblaCompass.start({ lat: current.latitude, lng: current.longitude });
                }
                if (generation !== generationRef.current) return;
                applyPosition(current);
                setLocationError(lang === 'ml' ? 'ഫോണിന്റെ സ്ഥലം ഉപയോഗിക്കുന്നു' : 'Using phone location');
            } catch {
                // The saved city remains available when the phone cannot get a fix.
            } finally {
                if (generation === generationRef.current) setRefreshingLocation(false);
            }
        }
    };

    const requestPermissionAndStart = async () => {
        if (!isNative && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                if (await DeviceOrientationEvent.requestPermission() !== 'granted') {
                    setStatus('compass-denied');
                    return;
                }
            } catch {
                setStatus('compass-denied');
                return;
            }
        }
        startQiblaFinder();
    };

    useEffect(() => {
        if (!isNative && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            setStatus('needs-permission');
        } else {
            startQiblaFinder();
        }
        return () => {
            generationRef.current++;
            stopTracking();
        };
    }, []);

    useEffect(() => {
        if (!isAligned) return;
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
        window.checkAppRating?.('qibla');
    }, [isAligned]);

    const getGuidanceState = (qibla, heading) => {
        const difference = headingDifference(qibla, heading % 360);
        const close = Math.abs(difference) <= 25;
        return {
            isAligned,
            status: isAligned ? 'aligned' : difference > 0 ? 'turn-right' : 'turn-left',
            text: isAligned ? (lang === 'ml' ? '✓ ഖിബ്ലയ്ക്ക് നേരെ' : '✓ Facing Qibla')
                : close ? (lang === 'ml' ? 'ഏകദേശം എത്തി' : 'Almost There')
                : difference > 0 ? (lang === 'ml' ? 'വലത്തോട്ട് തിരിയുക →' : 'Turn Right →')
                : (lang === 'ml' ? '← ഇടത്തോട്ട് തിരിയുക' : '← Turn Left'),
        };
    };

    const renderCompass = () => {
        if (status === 'active' && qiblaDir !== null) {
            const hasLiveHeading = !isFallback && compassDir !== null;
            const showNorthReference = isAndroid && (isFallback || sensorHint === 'calibrate');
            
            let guidance = null;
            if (hasLiveHeading && !sensorHint && !refreshingLocation) {
                guidance = getGuidanceState(qiblaDir, compassDir);
            }

            return (
                <div className="qibla-compass-section">
                    
                    {isFallback && (
                         <div className="clean-guidance-header fallback">
                             <h2 className="minimal-instruction">{lang === 'ml' ? 'ലൈവ് കോമ്പസ് ലഭ്യമല്ല' : 'Live compass unavailable'}</h2>
                             <p className="instruction-subtext">{lang === 'ml' ? 'സെൻസർ പിന്തുണ ലഭ്യമല്ല' : 'No compass readings received. If your phone has a compass, hold it flat and retry. The bearing below is clockwise from true north.'}</p>
                             <button className="qibla-btn minimal" onClick={requestPermissionAndStart}>{t('retry')}</button>
                         </div>
                    )}
                    {!isFallback && compassDir === null && <p role="status">{lang === 'ml' ? 'കോമ്പസ് ആരംഭിക്കുന്നു…' : 'Starting compass…'}</p>}
                    {!isFallback && sensorHint && <p role="status" className="qibla-location-note">
                        {sensorHint === 'level'
                            ? (lang === 'ml' ? 'ഫോൺ നിരപ്പായി പിടിക്കുക.' : 'Hold your phone flat, screen facing up.')
                            : sensorHint === 'magnetic'
                            ? (lang === 'ml' ? 'യഥാർത്ഥ വടക്ക് കണ്ടെത്താൻ ലൊക്കേഷൻ അനുവദിക്കുക.' : 'Waiting for true north. Allow location access for accurate alignment.')
                            : (lang === 'ml' ? 'ഫോൺ 8 ആകൃതിയിൽ കറക്കുക.' : 'Move away from metal or magnets, then move your phone in a figure eight.')}
                    </p>}

                    {showNorthReference && <p className="qibla-location-note">
                        {lang === 'ml'
                            ? 'സ്ഥിരമായ വടക്ക് റഫറൻസ്. ഈ അമ്പ് ഫോണിനൊപ്പം തിരിയില്ല.'
                            : 'North-up reference. Use a map or compass to find true north, then follow the marked bearing.'}
                    </p>}

                    {(hasLiveHeading || showNorthReference) && <div className={`qibla-compass-container-premium ${!showNorthReference && (sensorHint || refreshingLocation) ? 'unreliable' : ''}`}>
                        {/* Static Phone Top Marker */}
                        {!showNorthReference && <div className={`premium-phone-marker ${guidance?.isAligned ? 'aligned' : ''}`} />}

                        {/* Smooth animated rotating ring (Outer ring) */}
                        <div className={`premium-compass-ring ${guidance?.isAligned ? 'aligned' : ''}`} style={{ transform: `rotate3d(0, 0, 1, ${showNorthReference ? 0 : -compassDir}deg)` }}>
                            <div className="compass-mark n">N</div>
                            <div className="compass-mark e">E</div>
                            <div className="compass-mark s">S</div>
                            <div className="compass-mark w">W</div>
                            
                            {/* Inner ticks */}
                            {compassTicks}

                            {/* Orbiting Kaaba Marker */}
                            <div className="kaaba-orbit-container" style={{ transform: `rotate(${qiblaDir}deg)` }} aria-hidden="true">
                                <div className={`kaaba-orbit-icon ${guidance?.isAligned ? 'aligned' : ''}`}>
                                    <svg className="kaaba-orbit-arrow" viewBox="0 0 24 20" fill="currentColor">
                                        <path d="M12 1 23 18l-11-5-11 5z" stroke="var(--bg-dark)" strokeWidth="1.5" strokeLinejoin="round" />
                                    </svg>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        {/* Center static design (optional, to look premium) */}
                        <div className="premium-compass-center"></div>
                    </div>}
                    
                    <p className="qibla-bearing">{t('qibla_bearing')}: {qiblaDir.toFixed(1)}°</p>
                    {isAndroid && hasLiveHeading && !sensorHint && !refreshingLocation && <p className="qibla-location-note">
                        {lang === 'ml' ? 'ഫോൺ ചൂണ്ടുന്ന ദിശ' : 'Phone heading from true north'}: {normalizeHeading(Math.round(compassDir))}°
                    </p>}
                    {refreshingLocation && <p className="qibla-location-note" role="status">
                        {lang === 'ml' ? 'ഫോണിന്റെ സ്ഥലം പരിശോധിക്കുന്നു…' : 'Checking phone location…'}
                    </p>}
                    {locationError && <p className="qibla-location-note">{locationError}</p>}
                    {/* Live Guidance below compass */}
                    {!isFallback && guidance && (
                        <div className={`premium-guidance-text ${guidance.status}`}>
                            <h2>{guidance.text}</h2>
                            <p>{lang === 'ml'
                                ? 'ഫോൺ നിരപ്പായി പിടിക്കുക. അമ്പ് ഫോണിന്റെ മുകൾഭാഗത്തേക്ക് ചൂണ്ടുന്നതുവരെ ഫോണിനൊപ്പം തിരിയുക.'
                                : 'Hold your phone flat. Turn with it until the arrow points past the top of your phone, then face that way.'}</p>
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
                    {!isFallback && compassDir !== null && !sensorHint && !isAligned && (
                        <div className="qibla-bottom-card-minimal calibration-card">
                            <div className="compass-calibration-hint">
                                {lang === 'ml' ? 'കോമ്പസ് കൃത്യത മെച്ചപ്പെടുത്താൻ ഫോൺ 8 ആകൃതിയിൽ കറക്കുക.' : 'Hold your phone flat and turn slowly. Keep it away from metal or magnets.'}
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
                    <p>{locationError}</p>
                    <button className="qibla-btn minimal" onClick={requestPermissionAndStart}>
                        {lang === 'ml' ? 'വീണ്ടും ശ്രമിക്കുക' : 'Retry'}
                    </button>
                    <button className="qibla-btn minimal" onClick={() => navigate('/prayer')}>{t('choose_city_manually')}</button>
                </div>
            );
        }
        if (status === 'loading') {
            return (
                <div className="qibla-action-card-minimal">
                    <div className="qibla-loader-minimal"></div>
                    <p>{lang === 'ml' ? 'ലൊക്കേഷനും ഖിബ്ല ദിശയും കണ്ടെത്തുന്നു...' : 'Finding your location and Qibla direction...'}</p>
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
