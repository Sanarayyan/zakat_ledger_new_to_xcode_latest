import { appStorage } from '../services/appStorage';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../LanguageContext';
import { versionHubService } from '../services/versionHubService';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import './VersionHubUpdatePopup.css';
import { updateTestResponse } from '../services/updateTestPolicy.mjs';
import { versionHubPresentation } from '../services/versionHubPolicy.mjs';

export default function VersionHubUpdatePopup({ testAction, testVersion, onTestClose } = {}) {
    const { t } = useLanguage();
    const [updateInfo, setUpdateInfo] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [currentVersion, setCurrentVersion] = useState('1.0.0');
    const [testInstructions, setTestInstructions] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [checking, setChecking] = useState(false);
    const [retryFailed, setRetryFailed] = useState(false);
    const lastResumeCheck = useRef(0);
    useEffect(() => {
        const refresh = () => {
            if (Date.now() - lastResumeCheck.current < 30000) return;
            lastResumeCheck.current = Date.now();
            setAttempt(value => value + 1);
        };
        let disposed = false, listener;
        if (Capacitor.isNativePlatform()) App.addListener('appStateChange', state => { if (state.isActive) refresh(); }).then(handle => { if (disposed) handle.remove(); else listener = handle; });
        window.addEventListener('online', refresh);
        return () => { disposed = true; listener?.remove(); window.removeEventListener('online', refresh); };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const checkUpdate = async () => {
            setChecking(true);
            setRetryFailed(false);
            if (import.meta.env.MODE === 'device-test' && testAction) {
                setCurrentVersion(testVersion);
                const data = updateTestResponse(testAction, testVersion);
                setUpdateInfo(data);
                setIsVisible(!!data);
                setChecking(false);
                return;
            }
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

            const data = await versionHubService.checkVersion({ retry: attempt > 0 });

            if (!isMounted) return;

            setChecking(false);
            if (!data) { setRetryFailed(attempt > 0); return; }
            const presentation = versionHubPresentation(data, Capacitor.getPlatform());
            if (presentation.action !== 'no_action') {
                setUpdateInfo(data);
                setIsVisible(true);
            } else { setIsVisible(false); setUpdateInfo(null); }
        };

        checkUpdate();

        return () => {
            isMounted = false;
        };
    }, [testAction, testVersion, attempt]);

    if (!isVisible || !updateInfo) return null;

    const presentation = versionHubPresentation(updateInfo, Capacitor.getPlatform(), import.meta.env.MODE === 'device-test');
    const isMandatory = presentation.mandatory;

    const handleUpdate = () => {
        if (presentation.simulated) {
            setTestInstructions(true);
            return;
        }
        if (presentation.storeUrl) {
            if (Capacitor.getPlatform() !== 'web') {
                // If native, open the external app URL
                // The URL is handled by the OS to open the respective store
                window.open(presentation.storeUrl, '_system');
            } else {
                window.open(presentation.storeUrl, '_blank', 'noopener,noreferrer');
            }
        }
    };

    const handleDismiss = () => {
        if (!isMandatory) {
            setIsVisible(false);
            onTestClose?.();
        }
    };

    return createPortal(<VersionHubDialog updateInfo={updateInfo} presentation={presentation} currentVersion={currentVersion} t={t}
        checking={checking} retryFailed={retryFailed} testInstructions={testInstructions} onUpdate={handleUpdate}
        onRetry={() => setAttempt(value => value + 1)} onDismiss={handleDismiss}
        onEndSimulation={presentation.simulated ? () => { appStorage.removeItem('versionhub_test_action'); setIsVisible(false); onTestClose?.(); } : undefined} />, document.body);
}

// Shared by the real portal and render tests, so the tested buttons are the production buttons.
export function VersionHubDialog({ updateInfo, presentation, currentVersion, t, checking, retryFailed, testInstructions, onUpdate, onRetry, onDismiss, onEndSimulation }) {
    const isMandatory = presentation.mandatory;
    const suppliedVersion = updateInfo.latestVersion || updateInfo.latest_version;
    const latestVersion = typeof suppliedVersion === 'string' ? suppliedVersion : '';
    return (
        <div className="versionhub-overlay" role="dialog" aria-modal="true" aria-label="App update">
            <div className="versionhub-card fade-in">
                <div className="versionhub-icon-wrapper">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                </div>
                
                <h2 className="versionhub-title">
                    {(typeof updateInfo.title === 'string' && updateInfo.title) || (isMandatory ? t('update_required_title') : t('update_available_title'))}
                </h2>
                
                <div className="versionhub-badges">
                    <span className="versionhub-badge">v{currentVersion}</span>
                    <span className="versionhub-arrow">→</span>
                    {latestVersion && <span className="versionhub-badge">v{latestVersion}</span>}
                </div>

                <p className="versionhub-description">
                    {(typeof updateInfo.description === 'string' && updateInfo.description) || (isMandatory ? t('update_desc_force') : t('update_desc_soft'))}
                </p>
                {testInstructions && <p role="status">For this test, install the new APK over the old app without uninstalling. In a real release, Update Now opens the store listing.</p>}
                {presentation.unavailable && <p role="alert">{t('update_link_unavailable')}</p>}
                {retryFailed && <p role="alert">{t('update_check_failed')}</p>}

                <div className="versionhub-actions">
                    <button className="versionhub-btn-primary" disabled={checking} onClick={presentation.unavailable ? onRetry : onUpdate}>
                        {checking ? t('update_checking') : presentation.unavailable ? t('retry') : t('update_now')}
                    </button>
                    {!isMandatory && (
                        <button className="versionhub-btn-secondary" onClick={onDismiss}>
                            {presentation.unavailable ? t('continue_app') : t('update_later')}
                        </button>
                    )}
                </div>
                {onEndSimulation && <button onClick={onEndSimulation}>End test simulation</button>}
            </div>
        </div>
    );
}
