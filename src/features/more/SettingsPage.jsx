import { Capacitor } from '@capacitor/core';
import { accountDataDeletion } from '../../services/accountDataService';
import { restoreSession } from '../../services/authService';
import { appStorage } from '../../services/appStorage';
import * as Icons from '../../components/IconLibrary';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';
import { usePrayer } from '../../PrayerContext';
import './SettingsPage.css';
import ReleaseTestControls from '../../components/ReleaseTestControls';
import { Adhan, nativeAdhanEnabled } from '../../services/adhanService';
import { LocalNotifications } from '@capacitor/local-notifications';

const BACK_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
const CHEVRON_DOWN = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const CHEVRON_UP = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>;

export default function SettingsPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { settings, updateSettings, stopAdhan, triggerTestNotification, scheduleError } = usePrayer();
    const [deletingData, setDeletingData] = useState(false);
    const [privacyError, setPrivacyError] = useState('');
    const [pendingDeletion, setPendingDeletion] = useState(false);
    useEffect(() => {
        accountDataDeletion.pending().then(value => setPendingDeletion(!!value)).catch(error => setPrivacyError(error.message));
    }, []);
    const deletePersonalData = async () => {
        if (deletingData) return;
        setPrivacyError('');
        try {
            const pending = await accountDataDeletion.pending();
            const session = restoreSession();
            if (!pending) {
                if (!window.confirm('Delete all app data for every profile on this device, including financial records, reading progress and period data? If signed in, your cloud calculation history and all app sessions will also be deleted. Your Google account is not deleted. This cannot be undone.')) return;
                if (!session && !window.confirm('You are not currently signed in. This will delete device data only. Cloud history will remain. To delete cloud history, cancel and sign in first. Continue with device-only deletion?')) return;
            }
            setDeletingData(true);
            await stopAdhan();
            if (pending) await accountDataDeletion.resume(session?.accessToken, session?.email);
            else await accountDataDeletion.start(session?.accessToken, session?.email);
            window.location.reload();
        } catch (error) {
            setPrivacyError(error.message || 'Deletion could not be completed. Please retry.');
            setPendingDeletion(!!(await accountDataDeletion.pending().catch(() => true)));
        } finally { setDeletingData(false); }
    };
    const [notificationError, setNotificationError] = useState('');
    const [isNotificationsExpanded, setIsNotificationsExpanded] = useState(false);

    const [isGenderModalOpen, setIsGenderModalOpen] = useState(false);
    const [tempGender, setTempGender] = useState('');

    // Gender State (persists directly to appStorage)
    const [gender, setGender] = useState(() => {
        return appStorage.getItem('userGender') || 'prefer_not_to_say';
    });

    const openGenderModal = () => {
        setTempGender(gender);
        setIsGenderModalOpen(true);
    };

    // When gender changes, save to appStorage
    const handleGenderSave = () => {
        setGender(tempGender);
        appStorage.setItem('userGender', tempGender);
        window.dispatchEvent(new Event('genderChanged'));
        setIsGenderModalOpen(false);
    };

    // Toggle Handlers
    const handleToggle = async (key) => {
        if (!settings) return;
        if (['notificationsEnabled', 'dailyAyahEnabled', 'prayerRemindersEnabled'].includes(key) && !settings[key]) {
            try {
                const permission = await LocalNotifications.requestPermissions();
                if (permission.display !== 'granted') {
                    setNotificationError('Allow app notifications in your phone settings first.');
                    return;
                }
            } catch (error) {
                setNotificationError(error.message || 'Notifications are unavailable.');
                return;
            }
        }
        setNotificationError('');
        updateSettings({
            ...settings,
            [key]: !settings[key]
        });
    };

    return (
        <div className="settings-root">
            <header className="header">
                <button className="back-btn" aria-label={t('back')} onClick={() => navigate(-1)}>{BACK_ICON}</button>
                <h1 className="header-title">{t('settings_title') || 'Settings'}</h1>
            </header>

            <div className="settings-content">
                {import.meta.env.MODE === 'device-test' && <p className="test-build-note">{t('device_test_banner')}</p>}
                {(scheduleError || notificationError) && <p role="alert">{notificationError || scheduleError}</p>}
                {nativeAdhanEnabled && <section className="settings-card" style={{ padding: 16 }}>
                    <h2>Adhan notification</h2>
                    <p>Stop the current Adhan from its notification. Future reminders stay enabled. Your media volume controls Adhan loudness.</p>
                    <button onClick={() => Adhan.requestExactPermission().catch(error => setNotificationError(error.message))}>Allow Alarms &amp; reminders</button>
                    <button onClick={() => stopAdhan().catch(error => setNotificationError(error.message))}>Stop current Adhan</button>
                    {import.meta.env.MODE === 'device-test' && <button onClick={triggerTestNotification}>Test Adhan notification in 10 seconds</button>}
                </section>}
                {import.meta.env.MODE === 'device-test' && Capacitor.getPlatform() === 'ios' &&
                    <button onClick={triggerTestNotification}>Test iOS Adhan sound and prayer action</button>}
                {import.meta.env.MODE === 'device-test' && (import.meta.env.VITE_VERSIONHUB_LIVE_TEST === 'true'
                    ? <p className="test-build-note">Update checks use the real VersionHub server. Close and reopen the app after changing versions.json.</p>
                    : <ReleaseTestControls />)}
                <section className="settings-card" style={{ padding: 16 }}>
                    <h2>{t('privacy_personal_data')}</h2>
                    <p>{t('privacy_device_description')}</p>
                    <p>{t('privacy_browser_description')}</p>
                    <button disabled={deletingData} onClick={deletePersonalData}>{deletingData ? t('deleting_app_data') : pendingDeletion ? t('resume_app_data_deletion') : t('delete_app_data')}</button>
                    {pendingDeletion && <p role="status">{t('pending_app_data_deletion')}</p>}
                    {privacyError && <p role="alert">{privacyError}</p>}
                </section>
                <section className="settings-card" style={{ padding: 16 }}>
                    <p>{t('notification_schedule_note')}</p>
                </section>
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
                            appStorage.setItem('userGender', 'female');
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
                            appStorage.setItem('userGender', 'male');
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
                            appStorage.setItem('userGender', 'prefer_not_to_say');
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
