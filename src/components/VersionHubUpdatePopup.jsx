import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { versionHubService } from '../services/versionHubService';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import './VersionHubUpdatePopup.css';

export default function VersionHubUpdatePopup() {
    const { t } = useLanguage();
    const [updateInfo, setUpdateInfo] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [currentVersion, setCurrentVersion] = useState('1.0.0');

    useEffect(() => {
        let isMounted = true;

        const checkUpdate = async () => {
            // Get local version for display
            if (Capacitor.getPlatform() !== 'web') {
                try {
                    const info = await App.getInfo();
                    if (isMounted && info.version) {
                        setCurrentVersion(info.version);
                    }
                } catch (e) {
                    console.warn('Capacitor App getInfo failed', e);
                }
            }

            const data = await versionHubService.checkVersion();

            if (!isMounted) return;

            const isAvailable = data && (data.updateAvailable === true || data.update_available === true || data.action === 'optional' || data.action === 'mandatory');

            if (isAvailable) {
                setUpdateInfo(data);
                setIsVisible(true);
            }
        };

        checkUpdate();

        return () => {
            isMounted = false;
        };
    }, []);

    if (!isVisible || !updateInfo) return null;

    const isMandatory = updateInfo.action === 'mandatory' || updateInfo.update_required === true || updateInfo.update_type === 'mandatory' || updateInfo.canContinue === false;
    const latestVersion = updateInfo.latestVersion || updateInfo.latest_version;
    const storeUrl = updateInfo.storeUrl || updateInfo.store_url;

    const handleUpdate = () => {
        if (storeUrl) {
            if (Capacitor.getPlatform() !== 'web') {
                // If native, open the external app URL
                // The URL is handled by the OS to open the respective store
                window.open(storeUrl, '_system');
            } else {
                window.open(storeUrl, '_blank');
            }
        }
    };

    const handleDismiss = () => {
        if (!isMandatory) {
            setIsVisible(false);
        }
    };

    return (
        <div className="versionhub-overlay">
            <div className="versionhub-card fade-in">
                <div className="versionhub-icon-wrapper">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                </div>
                
                <h2 className="versionhub-title">
                    {updateInfo.title || (isMandatory ? t('update_required_title') : t('update_available_title'))}
                </h2>
                
                <div className="versionhub-badges">
                    <span className="versionhub-badge">v{currentVersion}</span>
                    <span className="versionhub-arrow">→</span>
                    <span className="versionhub-badge">v{latestVersion}</span>
                </div>

                <p className="versionhub-description">
                    {updateInfo.description || (isMandatory ? t('update_desc_force') : t('update_desc_soft'))}
                </p>

                <div className="versionhub-actions">
                    <button className="versionhub-btn-primary" onClick={handleUpdate}>
                        {t('update_now')}
                    </button>
                    {!isMandatory && (
                        <button className="versionhub-btn-secondary" onClick={handleDismiss}>
                            {t('update_later')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
