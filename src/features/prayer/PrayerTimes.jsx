import * as Icons from '../../components/IconLibrary';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';
import { usePrayer } from '../../PrayerContext';
import { Geolocation } from '@capacitor/geolocation';
import { getFormattedHijriDate } from '../../utils/hijri';
import './PrayerTimes.css';

const PRAYERS_LIST = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export default function PrayerTimes() {
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    const { settings, updateSettings, timings, nextPrayer, countdown, loading, error, refresh, formatTime, triggerTestNotification, triggerTestAdhan } = usePrayer();

    const [showSetup, setShowSetup] = useState(!settings);
    
    const [isDark, setIsDark] = useState(document.body.classList.contains('dark-mode'));

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.body.classList.contains('dark-mode'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const fetchPrayerTimes = () => refresh();

    const [showLocEdit, setShowLocEdit] = useState(false);
    const [showMadhabEdit, setShowMadhabEdit] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [locError, setLocError] = useState('');
    
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (searchQuery.trim().length > 2) {
                setIsSearching(true);
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`);
                    const data = await res.json();
                    setSearchResults(data);
                } catch (e) {
                    console.error("Geocoding failed", e);
                }
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSelectCity = (result) => {
        const cityName = result.name || result.display_name.split(',')[0];
        updateSettings({
            ...settings,
            location: {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                city: cityName
            }
        });
        setShowLocEdit(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSelectMadhab = (madhabValue) => {
        updateSettings({
            ...(settings || { location: { lat: 0, lng: 0, city: 'Unknown' }, method: 1 }),
            madhab: madhabValue,
            school: madhabValue === 'hanafi' ? 1 : 0
        });
        setShowMadhabEdit(false);
    };

    const handleAutoDetect = async () => {
        setIsDetecting(true);
        setLocError('');
        try {
            let permission = await Geolocation.checkPermissions();
            
            if (permission.location !== 'granted') {
                permission = await Geolocation.requestPermissions();
            }

            if (permission.location !== 'granted' && permission.location !== 'prompt-with-rationale') {
                setLocError('Location permission denied. Please enable it in your device settings.');
                setIsDetecting(false);
                return;
            }

            // Enforce a strict 15s timeout because Android Geolocation can hang indefinitely
            const positionPromise = Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Location request timed out')), 15000));
            
            const position = await Promise.race([positionPromise, timeoutPromise]);
            const { latitude, longitude } = position.coords;
            let finalCity = 'Current Location';
            try {
                const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                const data = await res.json();
                if (data.city || data.locality) {
                    finalCity = data.city || data.locality;
                }
            } catch (err) {
                console.error("Geocoding error:", err);
            }
            updateSettings({
                ...(settings || { madhab: 'shafi', school: 0, method: 1 }),
                location: {
                    lat: latitude,
                    lng: longitude,
                    city: finalCity
                }
            });
        } catch (error) {
            console.error("Location error:", error);
            setLocError('Unable to retrieve your location. Please check your GPS connection or enter city manually.');
        } finally {
            setIsDetecting(false);
        }
    };

    const getAtmosphere = (prayerName) => {
        switch(prayerName?.toLowerCase()) {
            case 'fajr': return 'theme-dawn';
            case 'sunrise': return 'theme-morning';
            case 'dhuhr': return 'theme-day';
            case 'asr': return 'theme-afternoon';
            case 'maghrib': return 'theme-sunset';
            case 'isha': return 'theme-night';
            default: return 'theme-day';
        }
    };

    const getGreeting = (prayerName) => {
        switch(prayerName?.toLowerCase()) {
            case 'fajr': return lang === 'ml' ? 'പ്രഭാത പ്രാർത്ഥനയ്ക്കുള്ള സമയം' : 'Blessed Fajr Time';
            case 'dhuhr': return lang === 'ml' ? 'സമാധാനപരമായ ഉച്ചസമയം' : 'Peaceful Afternoon';
            case 'asr': return lang === 'ml' ? 'ശാന്തമായ വൈകുന്നേരം' : 'Quiet Evening Reflection';
            case 'maghrib': return lang === 'ml' ? 'മനോഹരമായ സൂര്യാസ്തമയം' : 'Beautiful Sunset';
            case 'isha': return lang === 'ml' ? 'സമാധാനപരമായ രാത്രി' : 'Peaceful Night';
            default: return lang === 'ml' ? 'സമാധാനപരമായ സമയം' : 'Peaceful Time';
        }
    };

    const getHijriDate = () => {
        return getFormattedHijriDate(new Date(), lang);
    };

    const getPrayerIcon = (prayerName) => {
        const icons = {
            'fajr': <path d="M12 4v4m0 8v4m-8-8h4m8 0h4m-3.5-3.5l2.8-2.8m-11.4 0l2.8 2.8m8.6 8.6l-2.8-2.8m-8.6 0l2.8-2.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
            'sunrise': <path d="M12 4v4m-8 8h16M4 16A8 8 0 0120 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
            'dhuhr': <path d="M12 6a6 6 0 100 12 6 6 0 000-12zM12 2v2m0 16v2m-8-10H2m20 0h-2m-2.8-7.2l1.4-1.4m-13.2 0L6.8 6.8m10.4 10.4l1.4 1.4m-13.2 0l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
            'asr': <path d="M12 8a4 4 0 100 8 4 4 0 000-8zM12 4v2m0 12v2m-6-10H4m16 0h-2m-1.4-5.6l1.4-1.4m-10.4 0L6.2 6.2M17.6 17.6l1.4 1.4M6.2 17.6l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
            'maghrib': <path d="M12 18H4a8 8 0 0116 0h-8zm0-10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
            'isha': <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        };
        const name = prayerName.toLowerCase();
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="prayer-icon-svg">
                {icons[name] || icons['fajr']}
            </svg>
        );
    };

    if (showSetup) {
        return (
            <div className="prayer-modal-overlay" onClick={(e) => { if (e.target.className === 'prayer-modal-overlay') setShowSetup(false) }}>
                <div className="prayer-modal-sheet">
                    <div className="modal-drag-handle"></div>
                    <div className="modal-header-elegant" style={{ position: 'relative' }}>
                        <h2>{t('prayer_settings') || 'Prayer Settings'}</h2>
                        {settings?.location?.city && (
                            <button 
                                onClick={() => setShowSetup(false)}
                                style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--c-text-muted)', cursor: 'pointer', padding: '8px' }}
                            >
                                <Icons.CrossIcon />
                            </button>
                        )}
                        <div className="islamic-decorative-divider">
                            <span className="divider-line"></span>
                            <span className="divider-diamond"></span>
                            <span className="divider-line"></span>
                        </div>
                    </div>
                    
                    <div className="prayer-form-section" style={{ marginBottom: '24px' }}>
                        <label className="section-label">{t('location') || 'Location'}</label>
                        {locError && <div className="inline-error-message">{locError}</div>}
                        {settings?.location?.city ? (
                            <div className="prayer-location-card">
                                <div className="loc-left">
                                    <span className="loc-icon"><Icons.LocationIcon /></span>
                                    <span className="detected-city">{settings.location.city}</span>
                                </div>
                                <button className="prayer-btn-change" onClick={() => { setShowSetup(false); setShowLocEdit(true); }}>{t('change') || 'Change'}</button>
                            </div>
                        ) : (
                            <button className="prayer-btn-use-location" onClick={handleAutoDetect} disabled={isDetecting}>
                                {isDetecting ? (
                                    <><div className="mini-spinner inline"></div> Detecting your location...</>
                                ) : (
                                    <><span className="loc-icon"><Icons.LocationIcon /></span> {t('use_current_location') || 'Use Current Location'}</>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="prayer-form-section">
                        <label className="section-label">{t('madhab_school') || 'Madhab'}</label>
                        <div className="segmented-control">
                            <button 
                                className={`segment-btn ${(settings?.madhab || 'shafi') === 'shafi' ? 'active' : ''}`}
                                onClick={() => handleSelectMadhab('shafi')}
                            >
                                {t('shafi_maliki_hanbali') || 'Shafi / Maliki'}
                            </button>
                            <button 
                                className={`segment-btn ${(settings?.madhab || 'shafi') === 'hanafi' ? 'active' : ''}`}
                                onClick={() => handleSelectMadhab('hanafi')}
                            >
                                {t('hanafi') || 'Hanafi'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentAtmosphere = getAtmosphere(nextPrayer);

    return (
        <div className={`prayer-page ${isDark ? 'dark' : 'light'} ${currentAtmosphere}`}>
            
            {/* Atmospheric Backgrounds */}
            <div className="atmosphere-overlay"></div>
            
            <div className="prayer-container">
            <header className="prayer-header">
                <button className="prayer-back-btn" onClick={() => navigate(-1)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <h1>{t('prayer_times') || 'Prayer Times'}</h1>
                <button className="prayer-settings-btn" onClick={() => setShowSetup(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
            </header>

            {loading || !timings ? (
                <div className="prayer-loading">
                    <div className="prayer-spinner"></div>
                    <p>{t('loading') || 'Loading...'}</p>
                </div>
            ) : error ? (
                <div className="prayer-loading" style={{color: 'red'}}>
                    <p>{error}</p>
                    <button onClick={fetchPrayerTimes} className="prayer-btn-save" style={{marginTop: '16px', width: 'auto', padding: '8px 16px'}}>Retry</button>
                </div>
            ) : (
                <>
                    {/* Glassmorphic Hero Card */}
                    <div className="prayer-hero-card">
                        <div className="hero-particles">
                            <div className="particle p1"></div>
                            <div className="particle p2"></div>
                            <div className="particle p3"></div>
                        </div>

                        <div className="hero-content">
                            <div className="hero-header-row">
                                <div className="hero-greeting">{getGreeting(nextPrayer)}</div>
                                <div className="hero-hijri-date">{getHijriDate()}</div>
                            </div>
                            
                            <div className="hero-next-prayer-details">
                                <div className="prayer-next-label">{t('next_prayer') || 'Next Prayer'}</div>
                                <h2 className="prayer-next-name">{nextPrayer ? (t(nextPrayer.toLowerCase()) || nextPrayer) : '...'}</h2>
                                <div className="prayer-timer-container">
                                    <div className="prayer-timer-glow"></div>
                                    <div className="prayer-timer">
                                        {countdown || '--:--:--'}
                                    </div>
                                    <div className="prayer-timer-text">{t('starts_in') || 'remaining'}</div>
                                </div>
                            </div>

                            <div className="hero-footer-row">
                                <button className="quick-edit-btn" onClick={() => setShowLocEdit(true)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    <span className="truncate-text">{settings.location.city}</span>
                                </button>
                                <button className="quick-edit-btn" onClick={() => setShowMadhabEdit(true)}>
                                    {settings.madhab === 'hanafi' ? (t('hanafi') || 'Hanafi') : (t('shafi_maliki_hanbali') ? t('shafi_maliki_hanbali').split(' / ')[0] : 'Shafi')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Redesigned Prayer List */}
                    <div className="prayer-list-elegant">
                        {PRAYERS_LIST.map(prayer => (
                            <div key={prayer} className={`prayer-row ${nextPrayer === prayer ? 'active' : ''}`}>
                                <div className="prayer-row-left">
                                    <div className="prayer-icon-wrapper">
                                        {getPrayerIcon(prayer)}
                                    </div>
                                    <div className="prayer-row-name">{t(prayer.toLowerCase()) || prayer}</div>
                                </div>
                                <div className="prayer-row-right">
                                    <div className="prayer-row-time">{formatTime(timings[prayer])}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Quick Edit Location Sheet */}
            {showLocEdit && (
                <div className="prayer-modal-overlay" onClick={(e) => { if (e.target.className === 'prayer-modal-overlay') setShowLocEdit(false) }}>
                    <div className="prayer-modal-sheet quick-edit-sheet">
                        <div className="modal-drag-handle"></div>
                        <h3 className="quick-edit-title">Change Location</h3>
                        <div className="search-input-wrapper">
                            <input 
                                type="text" 
                                className="premium-search-input"
                                placeholder="Search city..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            {isSearching && <div className="mini-spinner"></div>}
                        </div>
                        <button className="prayer-btn-use-location mini-loc-btn" onClick={() => {
                            if (!isDetecting) handleAutoDetect();
                        }} disabled={isDetecting}>
                            {isDetecting ? (
                                <><div className="mini-spinner inline"></div> Detecting location...</>
                            ) : (
                                <><span className="loc-icon"><Icons.LocationIcon /></span> Use Current Location</>
                            )}
                        </button>
                        {locError && <div className="inline-error-message mt-2">{locError}</div>}
                        {searchResults.length > 0 && (
                            <div className="search-results-list">
                                {searchResults.map((res, i) => (
                                    <button key={i} className="search-result-item" onClick={() => handleSelectCity(res)}>
                                        <div className="res-title">{res.name}</div>
                                        <div className="res-subtitle">{res.display_name}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Quick Edit Madhab Sheet */}
            {showMadhabEdit && (
                <div className="prayer-modal-overlay" onClick={(e) => { if (e.target.className === 'prayer-modal-overlay') setShowMadhabEdit(false) }}>
                    <div className="prayer-modal-sheet quick-edit-sheet">
                        <div className="modal-drag-handle"></div>
                        <h3 className="quick-edit-title">Select Madhab</h3>
                        <div className="quick-madhab-list">
                            {[
                                { id: 'shafi', label: 'Shafi' },
                                { id: 'hanafi', label: 'Hanafi' },
                                { id: 'maliki', label: 'Maliki' },
                                { id: 'hanbali', label: 'Hanbali' }
                            ].map(m => (
                                <button 
                                    key={m.id}
                                    className={`quick-madhab-item ${settings.madhab === m.id ? 'active' : ''}`}
                                    onClick={() => handleSelectMadhab(m.id)}
                                >
                                    <span>{m.label}</span>
                                    {settings.madhab === m.id && <span className="active-check"><Icons.CheckIcon /></span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            </div>
        </div>
    );
}
