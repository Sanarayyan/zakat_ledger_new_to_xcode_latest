import React, { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { useLanguage } from '../../LanguageContext';
import { compareVersions, fetchUpdateConfig } from './versionCheck';
import './UpdateManager.css';

// Using a local JSON for development. Can be replaced with Firebase Remote Config or production URL.
const REMOTE_CONFIG_URL = '/update-config.json';
const FALLBACK_APP_VERSION = '1.0.0';

export default function UpdateManager() {
    const { t } = useLanguage();
    const [config, setConfig] = useState(null);
    const [currentVersion, setCurrentVersion] = useState(FALLBACK_APP_VERSION);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [updateType, setUpdateType] = useState('none'); // 'none', 'soft', 'force'

    useEffect(() => {
        let isMounted = true;

        const initializeUpdateCheck = async () => {
            try {
                // 1. Get Current App Version
                let appVersion = FALLBACK_APP_VERSION;
                try {
                    const info = await App.getInfo();
                    if (info && info.version) {
                        appVersion = info.version;
                    }
                } catch (e) {
                    console.warn('Capacitor App plugin not available, using fallback version.', e);
                }
                
                if (isMounted) setCurrentVersion(appVersion);

                // 2. Fetch Remote Configuration
                const fetchedConfig = await fetchUpdateConfig(REMOTE_CONFIG_URL);
                if (!isMounted) return;
                
                console.log('UpdateManager: Successfully fetched config:', fetchedConfig);
                setConfig(fetchedConfig);

                // 3. Determine Update Type
                // Developer override check
                let mode = fetchedConfig.updateMode || 'none';
                if (window.testUpdateMode) {
                    mode = window.testUpdateMode;
                    console.log('UpdateManager: Using developer override mode:', mode);
                }

                if (mode === 'none') {
                    console.log('UpdateManager: Update mode is "none", skipping checks.');
                    setUpdateType('none');
                    return;
                }

                // Check Minimum Supported Version (Force)
                const isBelowMinimum = compareVersions(appVersion, fetchedConfig.minimumSupportedVersion) === -1;
                
                // Check Latest Version (Soft)
                const isBelowLatest = compareVersions(appVersion, fetchedConfig.latestVersion) === -1;

                console.group('📱 UpdateManager Check');
                console.log('Installed Version:', appVersion);
                console.log('Latest Version:', fetchedConfig.latestVersion);
                console.log('Minimum Supported:', fetchedConfig.minimumSupportedVersion);
                console.log('Update Mode:', mode);
                console.log('Is Below Minimum:', isBelowMinimum);
                console.log('Is Below Latest:', isBelowLatest);

                if (isBelowMinimum || mode === 'force') {
                    // Even if mode is soft, if below minimum supported, we force.
                    setUpdateType('force');
                    setIsVisible(true);
                    console.log('Result: Showing FORCE update popup');
                } else if (isBelowLatest && mode === 'soft') {
                    setUpdateType('soft');
                    setIsVisible(true);
                    console.log('Result: Showing SOFT update popup');
                } else {
                    setUpdateType('none');
                    console.log('Result: No update needed');
                }
                console.groupEnd();

            } catch (error) {
                console.error('UpdateManager Initialization Error:', error);
                // Safe failure: do nothing.
            }
        };

        initializeUpdateCheck();

        // Developer testing hook
        window.triggerUpdateCheck = initializeUpdateCheck;

        return () => {
            isMounted = false;
        };
    }, []);

    const handleUpdate = () => {
        if (config && config.updateUrl) {
            window.open(config.updateUrl, '_blank');
        }
    };

    const handleDismiss = () => {
        if (updateType === 'soft') {
            setIsVisible(false);
            setIsDismissed(true);
        }
    };

    if (!isVisible || isDismissed || updateType === 'none' || !config) return null;

    const isForce = updateType === 'force';

    return (
        <div className={`update-manager-overlay ${isForce ? 'force-update' : ''}`}>
            <div className="update-card">
                <div className="update-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                </div>
                
                <h2 className="update-title">{isForce ? t('update_required_title') : t('update_available_title')}</h2>
                
                <div className="update-versions">
                    <span className="version-badge">v{currentVersion}</span>
                    <span className="version-arrow">→</span>
                    <span className="version-badge">v{config.latestVersion}</span>
                </div>

                <p className="update-message">
                    {isForce ? t('update_desc_force') : t('update_desc_soft')}
                </p>

                {config.changelog && config.changelog.length > 0 && (
                    <div className="update-changelog">
                        <h4>What's New</h4>
                        <ul>
                            {config.changelog.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="update-actions">
                    <button className="btn-update-primary" onClick={handleUpdate}>
                        {t('update_now')}
                    </button>
                    {!isForce && (
                        <button className="btn-update-secondary" onClick={handleDismiss}>
                            {t('update_later')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
