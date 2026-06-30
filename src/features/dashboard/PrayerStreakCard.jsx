import React, { useState } from 'react';
import { usePrayerStreak } from '../../PrayerStreakContext';
import { useLanguage } from '../../LanguageContext';
import * as Icons from '../../components/IconLibrary';
import './PrayerStreakCard.css';

const PRAYER_ICONS = {
    fajr:    { icon: <Icons.CrescentIcon />, label: 'Fajr',    ml: 'ഫജ്റ്' },
    dhuhr:   { icon: <Icons.SunIcon />, label: 'Dhuhr',   ml: 'ദുഹർ' },
    asr:     { icon: <Icons.SunIcon />, label: 'Asr',     ml: 'അസർ' },
    maghrib: { icon: <Icons.SunriseIcon />, label: 'Maghrib', ml: 'മഗ്രിബ്' },
    isha:    { icon: <Icons.CrescentIcon />, label: 'Isha',    ml: 'ഇഷാ' },
};

export default function PrayerStreakCard() {
    const { todayData, streak, todayComplete, completedCount, totalPrayers, prayers, togglePrayer, markAllComplete } = usePrayerStreak();
    const { lang, t } = useLanguage();
    const [expanded, setExpanded] = useState(false);

    const progressPct = Math.round((completedCount / totalPrayers) * 100);

    return (
        <section className={`psc-card ${todayComplete ? 'psc-complete' : ''}`}>
            {/* Top row: Target + streak + expand toggle */}
            <div className="psc-header" onClick={() => setExpanded(e => !e)}>
                <div className="psc-flame-box" style={{ color: todayComplete ? 'var(--dash-primary)' : 'currentColor' }}>
                    <Icons.TargetIcon />
                </div>

                <div className="psc-streak-info">
                    <h4 className="psc-streak-count">
                        {streak} {streak === 1 ? (lang === 'ml' ? 'ദിവസം' : 'Day') : (lang === 'ml' ? 'ദിവസം' : 'Day')} {lang === 'ml' ? 'സ്ട്രീക്ക്' : 'Streak'}
                        {streak >= 7 && <span className="psc-badge" style={{color: 'var(--dash-primary)'}}><Icons.TargetIcon /></span>}
                    </h4>
                    <p className="psc-streak-sub">
                        {todayComplete
                            ? (lang === 'ml' ? <><Icons.CheckCircleIcon /> ഇന്ന് എല്ലാ നമസ്കാരങ്ങളും!</> : <><Icons.CheckCircleIcon /> All prayers done today!</>)
                            : `${completedCount}/${totalPrayers} ${lang === 'ml' ? 'ഇന്ന് പൂർത്തിയായി' : 'completed today'}`
                        }
                    </p>
                </div>

                <div className={`psc-chevron ${expanded ? 'open' : ''}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </div>
            </div>

            {/* Progress bar */}
            <div className="psc-progress-track">
                <div
                    className="psc-progress-fill"
                    style={{ width: `${progressPct}%` }}
                />
            </div>

            {/* Expanded prayer checklist */}
            {expanded && (
                <div className="psc-prayers-list">
                    {prayers.map(prayer => {
                        const done = !!todayData[prayer];
                        const meta = PRAYER_ICONS[prayer];
                        return (
                            <button
                                key={prayer}
                                className={`psc-prayer-row ${done ? 'done' : ''}`}
                                onClick={e => { e.stopPropagation(); togglePrayer(prayer); }}
                            >
                                <span className="psc-prayer-emoji">{meta.icon}</span>
                                <span className="psc-prayer-name">
                                    {lang === 'ml' ? meta.ml : meta.label}
                                </span>
                                <span className="psc-prayer-check">
                                    {done
                                        ? <Icons.CheckIcon />
                                        : <Icons.CircleIcon />
                                    }
                                </span>
                            </button>
                        );
                    })}

                    {!todayComplete && (
                        <button className="psc-mark-all-btn" onClick={e => { e.stopPropagation(); markAllComplete(); }}>
                            {lang === 'ml' ? <><Icons.CheckIcon /> എല്ലാം പൂർത്തിയായി</> : <><Icons.CheckIcon /> Mark All Complete</>}
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}
