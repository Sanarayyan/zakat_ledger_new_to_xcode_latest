import * as Icons from '../../components/IconLibrary';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

import { useLanguage } from '../../LanguageContext';
import { usePrayer } from '../../PrayerContext';
import { usePrayerStreak } from '../../PrayerStreakContext';
import PrayerStreakCard from './PrayerStreakCard';
import { useDailyAyah } from '../../hooks/useDailyAyah';
import { getFormattedHijriDate } from '../../utils/hijri';

export default function Dashboard() {
    const navigate = useNavigate();
    const [isLightMode, setIsLightMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'light-mode' : true;
    });
    const { lang, setLang, t } = useLanguage();
    const { nextPrayer, nextPrayerTime, countdown, timings, locating, loading, settings, locError, refresh } = usePrayer();
    const { todayData, streak, todayComplete, completedCount, totalPrayers, prayers, togglePrayer, dismissedPrompts, dismissPrompt, isPrayerLocked } = usePrayerStreak();
    const [user, setUser] = useState(null);
    const dailyAyah = useDailyAyah(lang);

    const [toast, setToast] = useState('');

    const showToast = (msg) => {
        setToast(msg);
    };

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(''), 2500);
        return () => clearTimeout(timer);
    }, [toast]);

    const getPrayerStatus = (p) => {
        if (todayData[p] === true) return 'completed';
        if (isPrayerLocked(p)) return 'locked';
        if (!timings) return 'pending';
        
        // Find current active prayer based on past starting times
        const activeList = prayers.filter(x => {
            const key = x.charAt(0).toUpperCase() + x.slice(1);
            const timeStr = timings[key];
            if (!timeStr) return false;
            const [hours, minutes] = timeStr.split(' ')[0].split(':').map(Number);
            const pTime = new Date();
            pTime.setHours(hours, minutes, 0, 0);
            return new Date() >= pTime;
        });
        const currentActive = activeList.length > 0 ? activeList[activeList.length - 1] : null;
        
        if (p === currentActive) {
            return 'active';
        }
        
        return 'missed';
    };

    const mostRecentMissedPrayer = prayers.find(p => {
        return getPrayerStatus(p) === 'missed' && !todayData[p] && !dismissedPrompts[p];
    });

    useEffect(() => {
        const theme = isLightMode ? 'light-mode' : 'dark-mode';
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [isLightMode]);

    useEffect(() => {
        const storedUser = localStorage.getItem('zakat_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user", e);
            }
        }
    }, []);

    const toggleTheme = () => setIsLightMode(!isLightMode);
    
    const setLanguage = (newLang) => setLang(newLang);

    return (
        <div className={`dash-wrapper ${isLightMode ? 'light' : 'dark'}`}>
            <div className="dash-container">
                {/* Header */}
                <header className="dash-header">
                    <div className="dash-actions">
                        <div className="dash-lang-toggle">
                            <button className={`dash-lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
                            <button className={`dash-lang-btn ${lang === 'ml' ? 'active' : ''}`} onClick={() => setLanguage('ml')}>മല</button>
                        </div>
                        <button className="dash-icon-btn" onClick={toggleTheme}>
                            {isLightMode ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                            )}
                        </button>
                    </div>
                </header>

                {/* Main Date Card */}
                <section className="dash-date-card">
                    <div className="dash-date-bg-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 2.8l5 5V18h-2v-4H9v4H7v-8.2l5-5z"/></svg>
                    </div>
                    <div className="dash-date-info">
                        <span className="dash-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {t('todays_date')} 
                            {settings?.location?.city && <span style={{ color: 'var(--text-muted)' }}>• {settings.location.city}</span>}
                            {locError && (
                                <button onClick={refresh} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', marginLeft: 'auto', cursor: 'pointer' }}>
                                    Retry Location
                                </button>
                            )}
                        </span>
                        <h2>{new Date().toLocaleDateString(lang === 'ml' ? 'ml-IN' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</h2>
                        <p>{getFormattedHijriDate(new Date(), lang)}</p>
                    </div>
                    <div className="dash-prayer-info">
                        <div className="dash-prayer-next">
                            <span className="dash-label">{t('next_prayer')}</span>
                            <span className="dash-prayer-name" style={{ fontSize: locating || loading ? '0.9rem' : 'inherit', opacity: locating || loading ? 0.8 : 1 }}>
                                {locating ? 'Detecting Location...' : 
                                 loading ? 'Fetching Prayers...' : 
                                 nextPrayer ? `${t(nextPrayer.toLowerCase())} at ${nextPrayerTime}` : 
                                 locError ? 'Location Failed' : 'Calculating...'}
                            </span>
                        </div>
                        <div className="dash-prayer-timer">
                            <span className="dash-label">{t('starts_in')}</span>
                            <span className="dash-timer" style={{ opacity: locating || loading ? 0.5 : 1 }}>
                                {locating || loading ? '--:--:--' : countdown || '--:--:--'}
                            </span>
                        </div>
                    </div>

                    {/* Missed Prayer Recovery / Nudge Alert Banner */}
                    {mostRecentMissedPrayer && (
                        <div className="dash-nudge-banner fade-in">
                            <div className="dnb-content">
                                <span className="dnb-crescent"><Icons.CrescentIcon /></span>
                                <div className="dnb-text">
                                    <h4>
                                        {lang === 'ml' 
                                            ? `${mostRecentMissedPrayer.charAt(0).toUpperCase() + mostRecentMissedPrayer.slice(1)} നമസ്കരിച്ചോ?` 
                                            : `Did you pray ${mostRecentMissedPrayer.charAt(0).toUpperCase() + mostRecentMissedPrayer.slice(1)}?`}
                                    </h4>
                                    <p>
                                        {lang === 'ml' 
                                            ? 'ആത്മീയ ഉന്മേഷം നിലനിർത്താൻ പൂർത്തിയായതായി രേഖപ്പെടുത്താം.' 
                                            : 'Mark complete to keep your streak glowing.'}
                                    </p>
                                </div>
                            </div>
                            <div className="dnb-actions">
                                <button 
                                    className="dnb-btn-confirm" 
                                    onClick={() => {
                                        togglePrayer(mostRecentMissedPrayer);
                                        if (navigator.vibrate) navigator.vibrate([60, 40]);
                                    }}
                                >
                                    {lang === 'ml' ? 'അതെ' : 'Yes'}
                                </button>
                                <button 
                                    className="dnb-btn-dismiss" 
                                    onClick={() => dismissPrompt(mostRecentMissedPrayer)}
                                >
                                    {lang === 'ml' ? 'പിന്നീട്' : 'Later'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Premium Smart Prayer Tracker Capsule */}
                    <div className="dash-streak-capsule" onClick={() => navigate('/prayer')}>
                        {/* Elegant Capsule Overlay Toast */}
                        {toast && (
                            <div className="dsc-toast-overlay" onClick={(e) => { e.stopPropagation(); setToast(''); }}>
                                <span className="dsc-toast-icon"><Icons.CrescentIcon /></span>
                                <span className="dsc-toast-text">{toast}</span>
                            </div>
                        )}
                        <div className="dsc-top-row">
                            <div className="dsc-streak">
                                <span className="dsc-streak-text" style={{ color: '#d4af37', fontWeight: 800, paddingLeft: '2px', display: 'flex', alignItems: 'center' }}>
                                    {streak} {lang === 'ml' ? 'ദിവസത്തെ സറ്റ്രീക്ക്' : `${streak === 1 ? 'Day' : 'Day'} Streak`}
                                </span>
                            </div>
                            <div className="dsc-progress">
                                <span className="dsc-ratio">
                                    {completedCount}/{totalPrayers} {lang === 'ml' ? 'പൂർത്തിയായി' : 'Completed'}
                                </span>
                                <span className={`dsc-status-dot ${todayComplete ? 'complete' : ''}`} />
                            </div>
                        </div>

                        {/* Interactive mini prayer chips */}
                        <div className="dsc-indicators">
                            {prayers.map(p => {
                                const status = getPrayerStatus(p);
                                const isDone = status === 'completed';
                                const isMissed = status === 'missed';
                                const isLocked = status === 'locked';
                                const isActive = status === 'active';
                                
                                const initial = lang === 'ml' 
                                    ? (p === 'fajr' ? 'ഫ' : p === 'dhuhr' ? 'ദു' : p === 'asr' ? 'അ' : p === 'maghrib' ? 'മ' : 'ഇ') 
                                    : p.charAt(0).toUpperCase();

                                return (
                                    <button
                                        key={p}
                                        className={`dsc-indicator-btn ${status}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isLocked) {
                                                showToast(lang === 'ml' ? 'ഈ നമസ്കാര സമയം ആരംഭിച്ചിട്ടില്ല.' : 'This prayer time has not started yet.');
                                                return;
                                            }
                                            togglePrayer(p);
                                            if (navigator.vibrate) navigator.vibrate(60);
                                        }}
                                        title={`${p.charAt(0).toUpperCase() + p.slice(1)}: ${status}`}
                                    >
                                        <span className="dsc-indicator-symbol">
                                            {isDone ? <Icons.CheckIcon /> : (isLocked ? <Icons.LockIcon /> : (isActive ? <Icons.CircleIcon /> : <Icons.CircleIcon style={{opacity: 0.2}} />))}
                                        </span>
                                        <span className="dsc-indicator-label">{initial}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* High-visibility slim progress bar */}
                        <div className="dsc-progress-track">
                            <div 
                                className="dsc-progress-fill" 
                                style={{ width: `${(completedCount / totalPrayers) * 100}%` }}
                            />
                        </div>

                        {/* Motivational real-time subtitle */}
                        <div className="dsc-footer">
                            <span className="dsc-encourage">
                                {todayComplete 
                                    ? (lang === 'ml' ? <><Icons.SparkleIcon /> ഇന്ന് എല്ലാ നമസ്കാരങ്ങളും പൂർത്തിയായി</> : <><Icons.SparkleIcon /> Perfect! All prayers completed today</>) 
                                    : (completedCount === 0 
                                        ? (lang === 'ml' ? 'ഇന്നത്തെ ആദ്യ നമസ്കാരം രേഖപ്പെടുത്തൂ!' : 'Record your first prayer to keep the streak!') 
                                        : (lang === 'ml' ? `${totalPrayers - completedCount} നമസ്കാരം കൂടി ബാക്കിയുണ്ട്, തുടരുക!` : `${totalPrayers - completedCount} prayers remaining. Keep going!`))}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="dash-features-grid">
                    <div className="dash-feature-quran" onClick={() => navigate('/quran')}>
                        <div className="dash-icon-box">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                        </div>
                        <div className="dash-feature-text-bottom">
                            <h3>{t('quran')}</h3>
                            <p>{t('read_listen')}</p>
                        </div>
                    </div>
                    <div className="dash-feature-prayer" onClick={() => navigate('/prayer')}>
                        <div className="dash-icon-box small">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <h3>{t('prayer_times')}</h3>
                    </div>
                    <div className="dash-feature-qibla" onClick={() => navigate('/qibla')}>
                        <div className="dash-icon-box small">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                        </div>
                        <h3>{t('qibla_finder')}</h3>
                    </div>
                    <div className="home-shortcuts">
                        <div className="shortcut-card" onClick={() => navigate('/tasbih')}>
                            <div className="shortcut-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="8" r="2"/><circle cx="12" cy="16" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/></svg>
                            </div>
                            <span className="shortcut-label">{t('tasbih')}</span>
                        </div>
                        <div className="shortcut-card" onClick={() => navigate('/duas')}>
                            <div className="shortcut-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10v4a6 6 0 0 1-12 0v-4"/><path d="M12 22v-4"/><path d="M8 22h8"/><path d="M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>
                            </div>
                            <span className="shortcut-label">{t('duas')}</span>
                        </div>
                        <div className="shortcut-card" onClick={() => navigate('/calendar')}>
                            <div className="shortcut-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            </div>
                            <span className="shortcut-label">{t('calendar')}</span>
                        </div>
                    </div>
                </section>

                {/* Daily Ayah */}
                <section className={`dash-daily-ayah ${dailyAyah.loading ? 'da-loading' : ''}`}>
                    <div className="dash-ayah-header">
                        <h3 className="dash-ayah-inner-title">{t('daily_ayah')}</h3>
                        <div className="dash-ayah-divider"></div>
                    </div>
                    {dailyAyah.loading ? (
                        <div className="da-skeleton">
                            <div className="da-skel-line da-skel-arabic"></div>
                            <div className="da-skel-line da-skel-trans"></div>
                            <div className="da-skel-line da-skel-ref"></div>
                        </div>
                    ) : dailyAyah.error ? (
                        <>
                            <p className="dash-ayah-arabic">فَإِنَّ مَعَ الْعُسْرِ يُسْرًا</p>
                            <p className="dash-ayah-translation">&ldquo;{lang === 'ml' ? "നിശ്ചയമായും പ്രയാസത്തോടൊപ്പം എളുപ്പമുണ്ട്." : "So verily, with every hardship, there is ease."}&rdquo;</p>
                            <p className="dash-ayah-ref">{lang === 'ml' ? "അശ്-ശർഹ് 94:5" : "SURAH ASH-SHARH 94:5"}</p>
                        </>
                    ) : (
                        <>
                            <p className="dash-ayah-arabic">{dailyAyah.arabic}</p>
                            <p className="dash-ayah-translation">&ldquo;{dailyAyah.translation}&rdquo;</p>
                            <p className="dash-ayah-ref">
                                {lang === 'ml' ? '' : `${dailyAyah.surahEnglish.toUpperCase()} • `}{dailyAyah.surahArabic} &nbsp;|&nbsp; {lang === 'ml' ? 'ആയത്ത്' : 'Ayah'} {dailyAyah.ayahNum}
                            </p>
                        </>
                    )}
                </section>
                {/* Padder for fixed bottom nav */}
                <div style={{ height: '80px' }}></div>

                {/* Bottom Nav */}
                <nav className="dash-bottom-nav">
                    <div className="dash-nav-item active">
                        <div className="dash-nav-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                        </div>
                        <span>{t('home')}</span>
                    </div>
                    <div className="dash-nav-item" onClick={() => navigate('/quran')}>
                        <div className="dash-nav-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                        </div>
                        <span>{t('quran')}</span>
                    </div>
                    <div className="dash-nav-item" onClick={() => navigate('/tasbih')}>
                        <div className="dash-nav-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="8" r="2"/><circle cx="12" cy="16" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/></svg>
                        </div>
                        <span>{t('tasbih')}</span>
                    </div>
                    <div className="dash-nav-item" onClick={() => navigate('/qibla')}>
                        <div className="dash-nav-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                        </div>
                        <span>{t('qibla')}</span>
                    </div>
                    <div className="dash-nav-item" onClick={() => navigate('/more')}>
                        <div className="dash-nav-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                        </div>
                        <span>{t('more') || 'More'}</span>
                    </div>
                </nav>
            </div>
        </div>
    );
}
