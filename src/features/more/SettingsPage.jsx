import * as Icons from '../../components/IconLibrary';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';
import { usePrayer } from '../../PrayerContext';
import './SettingsPage.css';

const BACK_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
const CHEVRON_DOWN = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const CHEVRON_UP = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>;

export default function SettingsPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { settings, updateSettings } = usePrayer();
    const [isNotificationsExpanded, setIsNotificationsExpanded] = useState(false);

    const [isGenderModalOpen, setIsGenderModalOpen] = useState(false);
    const [tempGender, setTempGender] = useState('');

    // Gender State (persists directly to localStorage)
    const [gender, setGender] = useState(() => {
        return localStorage.getItem('userGender') || 'prefer_not_to_say';
    });

    const openGenderModal = () => {
        setTempGender(gender);
        setIsGenderModalOpen(true);
    };

    // When gender changes, save to localStorage
    const handleGenderSave = () => {
        setGender(tempGender);
        localStorage.setItem('userGender', tempGender);
        window.dispatchEvent(new Event('genderChanged'));
        setIsGenderModalOpen(false);
    };

    // Toggle Handlers
    const handleToggle = (key) => {
        if (!settings) return;
        updateSettings({
            ...settings,
            [key]: !settings[key]
        });
    };

    return (
        <div className="settings-root">
            <header className="header">
                <button className="back-btn" onClick={() => navigate(-1)}>{BACK_ICON}</button>
                <h1 className="header-title">{t('settings_title') || 'Settings'}</h1>
            </header>

            <div className="settings-content">
                {/* Personal Preferences Section */}
                <div className="settings-section-wrapper">
                    <h2 className="settings-section-title">{t('personal_preferences') || 'Personal Preferences'}</h2>
                    <section className="settings-card">
                        <div 
                            className="settings-item clickable" 
                            onClick={openGenderModal}
                        >
                            <div className="settings-item-info">
                                <div className="settings-item-title">{t('gender') || 'Gender'}</div>
                            </div>
                            <div className="settings-item-value">
                                {t(gender) || gender.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                <span className="settings-chevron-right">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Notifications Section */}
                <div className="settings-section-wrapper">
                    <section className="settings-card accordion-card">
                        <div 
                            className="accordion-header" 
                            onClick={() => setIsNotificationsExpanded(!isNotificationsExpanded)}
                        >
                            <h2 className="settings-section-title no-margin">{t('notifications') || 'Notifications'}</h2>
                            <span className="accordion-icon">
                                {isNotificationsExpanded ? CHEVRON_UP : CHEVRON_DOWN}
                            </span>
                        </div>
                        
                        <div className={`accordion-body ${isNotificationsExpanded ? 'expanded' : ''}`}>
                            {/* Prayer Notifications */}
                            <div className="settings-item">
                                <div className="settings-item-info">
                                    <div className="settings-item-title">{t('prayer_notifications') || 'Prayer Notifications'}</div>
                                    <div className="settings-item-desc">{t('prayer_notifications_desc') || "Get notified when it's time to pray"}</div>
                                </div>
                                <label className="settings-toggle">
                                    <input 
                                        type="checkbox" 
                                        checked={!!settings?.notificationsEnabled} 
                                        onChange={() => handleToggle('notificationsEnabled')} 
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            {/* Adhan Sound */}
                            <div className="settings-item">
                                <div className="settings-item-info">
                                    <div className="settings-item-title">{t('adhan_sound') || 'Adhan Sound'}</div>
                                    <div className="settings-item-desc">{t('adhan_sound_desc') || "Play Adhan audio with notifications"}</div>
                                </div>
                                <label className="settings-toggle">
                                    <input 
                                        type="checkbox" 
                                        checked={!!settings?.adhanEnabled} 
                                        onChange={() => handleToggle('adhanEnabled')} 
                                        disabled={!settings?.notificationsEnabled}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            {/* Vibration */}
                            <div className="settings-item">
                                <div className="settings-item-info">
                                    <div className="settings-item-title">{t('vibration') || 'Vibration'}</div>
                                    <div className="settings-item-desc">{t('vibration_desc') || "Vibrate device for notifications"}</div>
                                </div>
                                <label className="settings-toggle">
                                    <input 
                                        type="checkbox" 
                                        checked={!!settings?.vibrationEnabled} 
                                        onChange={() => handleToggle('vibrationEnabled')} 
                                        disabled={!settings?.notificationsEnabled}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            {/* Daily Ayah Notifications */}
                            <div className="settings-item">
                                <div className="settings-item-info">
                                    <div className="settings-item-title">{t('daily_ayah_notifications') || 'Daily Ayah Notifications'}</div>
                                    <div className="settings-item-desc">{t('daily_ayah_notifications_desc') || "Receive a verse from the Quran every day"}</div>
                                </div>
                                <label className="settings-toggle">
                                    <input 
                                        type="checkbox" 
                                        checked={!!settings?.dailyAyahEnabled} 
                                        onChange={() => handleToggle('dailyAyahEnabled')} 
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            {/* Prayer Reminder Notifications */}
                            <div className="settings-item">
                                <div className="settings-item-info">
                                    <div className="settings-item-title">{t('prayer_reminder_notifications') || 'Prayer Reminder Notifications'}</div>
                                    <div className="settings-item-desc">{t('prayer_reminder_notifications_desc') || "Reminders to pray after Adhan"}</div>
                                </div>
                                <label className="settings-toggle">
                                    <input 
                                        type="checkbox" 
                                        checked={!!settings?.prayerRemindersEnabled} 
                                        onChange={() => handleToggle('prayerRemindersEnabled')} 
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Gender Selection Bottom Sheet */}
            <div className={`sheet-overlay ${isGenderModalOpen ? 'open' : ''}`} onClick={() => setIsGenderModalOpen(false)}></div>
            <div className={`bottom-sheet ${isGenderModalOpen ? 'open' : ''}`}>
                <div className="sheet-drag-handle"></div>
                <div className="sheet-header">
                    <div className="sheet-header-text">
                        <h3>{t('choose_gender') || 'Choose Gender'}</h3>
                        <p className="sheet-subtitle">{t('select_your_preference') || 'Select your preference'}</p>
                    </div>
                </div>
                <div className="sheet-content">
                    <button 
                        className={`sheet-option ${gender === 'female' ? 'selected' : ''}`} 
                        onClick={() => {
                            setGender('female');
                            localStorage.setItem('userGender', 'female');
                            window.dispatchEvent(new Event('genderChanged'));
                            setIsGenderModalOpen(false);
                        }}
                    >
                        {t('female') || 'Female'}
                        {gender === 'female' && <span className="check-icon"><Icons.CheckIcon /></span>}
                    </button>
                    <button 
                        className={`sheet-option ${gender === 'male' ? 'selected' : ''}`} 
                        onClick={() => {
                            setGender('male');
                            localStorage.setItem('userGender', 'male');
                            window.dispatchEvent(new Event('genderChanged'));
                            setIsGenderModalOpen(false);
                        }}
                    >
                        {t('male') || 'Male'}
                        {gender === 'male' && <span className="check-icon"><Icons.CheckIcon /></span>}
                    </button>
                    <button 
                        className={`sheet-option ${gender === 'prefer_not_to_say' ? 'selected' : ''}`} 
                        onClick={() => {
                            setGender('prefer_not_to_say');
                            localStorage.setItem('userGender', 'prefer_not_to_say');
                            window.dispatchEvent(new Event('genderChanged'));
                            setIsGenderModalOpen(false);
                        }}
                    >
                        {t('prefer_not_to_say') || 'Prefer not to say'}
                        {gender === 'prefer_not_to_say' && <span className="check-icon"><Icons.CheckIcon /></span>}
                    </button>
                </div>
                <div className="sheet-actions">
                    <button className="sheet-btn-cancel" onClick={() => setIsGenderModalOpen(false)}>
                        {t('cancel') || 'Cancel'}
                    </button>
                </div>
            </div>
        </div>
    );
}
