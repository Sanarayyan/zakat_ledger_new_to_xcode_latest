import { calendarDay, prayerDateInZone } from '../../services/prayerCalendar.mjs';
import { appStorage } from '../../services/appStorage';
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';
import { usePrayer } from '../../PrayerContext';
import './MorePage.css';

const BACK_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
const ASMA_ICON = <span style={{fontSize: '24px', fontWeight: 'bold', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>الله</span>;
const ZAKAT_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>;
const WOMENS_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>;
const KAABA_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><path d="M4 10h16"/><path d="M4 14h16"/></svg>;
const MOON_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;
const TASBIH_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><circle cx="17" cy="8" r="2"/><circle cx="19" cy="14" r="2"/><circle cx="15" cy="19" r="2"/><circle cx="9" cy="19" r="2"/><circle cx="5" cy="14" r="2"/><circle cx="7" cy="8" r="2"/><path d="M12 21v3"/><path d="M10 24h4"/></svg>;

const SUN_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
const SUNRISE_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>;
const SUNSET_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 5-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>;
const SMALL_MOON_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;

const PRAYERS_LIST = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const PRAYER_ICONS = {
    Fajr: SMALL_MOON_ICON,
    Sunrise: SUNRISE_ICON,
    Dhuhr: SUN_ICON,
    Asr: SUN_ICON,
    Maghrib: SUNSET_ICON,
    Isha: SMALL_MOON_ICON
};

export default function MorePage() {
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    const { calendar, nextPrayer, formatTime, loading } = usePrayer();
    const [showToast, setShowToast] = useState(false);
    
    // Ref for the upcoming prayer card to enable auto-scroll
    const upcomingCardRef = useRef(null);

    // Auto-hide toast
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => setShowToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    const formatDate = (date) =>
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const getDayData = (offset) => {
        if (!calendar) return null;
        const targetDate = prayerDateInZone(calendar);
        targetDate.setDate(targetDate.getDate() + offset);
        const dayData = calendarDay(calendar, targetDate);
        return dayData ? { timings: dayData.timings, date: targetDate } : null;
    };

    const renderPrayerCards = (timings, isToday) => {
        return PRAYERS_LIST.map(prayer => {
            const isActive = isToday && nextPrayer === prayer;
            return (
                <div 
                    key={`${isToday ? 'today' : 'future'}-${prayer}`} 
                    ref={isActive ? upcomingCardRef : null}
                    className={`prayer-card ${isActive ? 'active-prayer' : ''}`}
                >
                    <div className="prayer-card-top">
                        <span className="prayer-name">{t(prayer.toLowerCase()) || prayer}</span>
                        <span className="prayer-icon">{PRAYER_ICONS[prayer]}</span>
                    </div>
                    <span className="prayer-time">{formatTime(timings[prayer])}</span>
                </div>
            );
        });
    };

    // Auto-scroll to the upcoming prayer card on load or when timings change
    useEffect(() => {
        if (!loading && calendar && upcomingCardRef.current) {
            // Short delay to ensure DOM is fully rendered
            const timeout = setTimeout(() => {
                upcomingCardRef.current.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                    block: "nearest"
                });
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [loading, calendar, nextPrayer]);

    const day0 = getDayData(0);
    const day1 = getDayData(1);
    const day2 = getDayData(2);
    
    // Gender visibility logic
    const [userGender, setUserGender] = useState(() => appStorage.getItem('userGender') || '');
    
    useEffect(() => {
        const handleStorageChange = () => {
            setUserGender(appStorage.getItem('userGender') || '');
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('genderChanged', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('genderChanged', handleStorageChange);
        };
    }, []);

    const isMale = userGender.toLowerCase() === 'male';

    return (
        <div className="more-root">
            {/* Header */}
            <header className="header">
                <button className="back-btn" onClick={() => navigate('/')}>{BACK_ICON}</button>
                <h1 className="header-title">{t('more_features')}</h1>
                <button className="settings-btn" onClick={() => navigate('/settings')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </button>
            </header>

            <div className="more-content">
                <h3 className="section-subtitle" style={{marginLeft: '16px'}}>{t('prayer_timeline')}</h3>
                
                <div className="prayer-timeline">
                    {loading && !calendar ? (
                        <div style={{padding: '20px'}}>{t('loading')}</div>
                    ) : (
                        <>
                            {/* Today */}
                            {day0 && renderPrayerCards(day0.timings, true)}

                            {/* Vertical Pill Divider Tomorrow */}
                            <div className="timeline-divider">
                                <span>{t('tomorrow').toUpperCase()}</span>
                            </div>

                            {/* Tomorrow */}
                            {day1 && renderPrayerCards(day1.timings, false)}

                            {/* Vertical Pill Divider Day After */}
                            {day2 && (
                                <div className="timeline-divider">
                                    <span>{formatDate(day2.date).toUpperCase()}</span>
                                </div>
                            )}

                            {/* Day After */}
                            {day2 && renderPrayerCards(day2.timings, false)}
                        </>
                    )}
                </div>

                {/* Features Grid */}
                <h3 className="section-subtitle" style={{marginTop: '32px', marginLeft: '16px'}}>{t('tools')}</h3>
                <div className="features-grid">
                    <div className="feature-card" onClick={() => navigate('/asma')}>
                        <div className="feature-icon">{ASMA_ICON}</div>
                        <span className="feature-label">{t('asmaul_husna')}</span>
                    </div>
                    <div className="feature-card upcoming-feature" onClick={() => setShowToast(true)}>
                        <div className="coming-soon-badge">{t('coming_soon')}</div>
                        <span className="feature-label" style={{ height: 'auto', marginTop: '6px' }}>{t('zakat_ledger')}</span>
                    </div>
                    {!isMale && (
                        <div className="feature-card" onClick={() => navigate('/womens-guidance')}>
                            <div className="feature-icon">{WOMENS_ICON}</div>
                            <span className="feature-label">{t('womens_guidance_title')}</span>
                        </div>
                    )}
                    <div className="feature-card" onClick={() => navigate('/hajj')}>
                        <div className="feature-icon">{KAABA_ICON}</div>
                        <span className="feature-label">{t('hajj_guide')}</span>
                    </div>
                    <div className="feature-card" onClick={() => navigate('/umrah')}>
                        <div className="feature-icon">{MOON_ICON}</div>
                        <span className="feature-label">{t('umrah_guide')}</span>
                    </div>
                    <div className="feature-card" onClick={() => navigate('/ratheeb')}>
                        <div className="feature-icon">{TASBIH_ICON}</div>
                        <span className="feature-label">{lang === 'ml' ? 'റാത്തീബുൽ ഹദ്ദാദ്' : 'Ratheeb al-Haddad'}</span>
                    </div>
                </div>
            </div>

            <div style={{ height: '80px' }}></div>
            
            {showToast && (
                <div className="more-toast">
                    {t('coming_soon_inshaallah')}
                </div>
            )}
        </div>
    );
}
