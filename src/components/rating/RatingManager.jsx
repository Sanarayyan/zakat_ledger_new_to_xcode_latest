import React, { useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { App as CapacitorApp } from '@capacitor/app';
import { InAppReview } from '@capacitor-community/in-app-review';

const RATING_PREF_KEY = 'zakat_app_rating_data';

export default function RatingManager() {
    useEffect(() => {
        const handleCheckRating = async (event) => {
            const triggerSource = event.detail?.source;
            if (!triggerSource) return;

            try {
                const { value } = await Preferences.get({ key: RATING_PREF_KEY });
                const ratingData = value ? JSON.parse(value) : null;

                if (ratingData) {
                    if (ratingData.hasRated) return; // Never show again
                    if (ratingData.reminderDate && new Date() < new Date(ratingData.reminderDate)) return; // In cooldown
                }

                // Check specific conditions based on trigger
                let shouldShow = false;

                if (triggerSource === 'launch') {
                    const launches = parseInt(localStorage.getItem('zakat_launch_count') || '0', 10);
                    const firstLaunch = localStorage.getItem('zakat_first_launch');
                    
                    let daysSinceFirst = 0;
                    if (firstLaunch) {
                        const firstDate = new Date(firstLaunch);
                        const diffTime = Math.abs(new Date() - firstDate);
                        daysSinceFirst = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }

                    if (launches >= 10 || daysSinceFirst >= 3) {
                        shouldShow = true;
                    }
                } else if (triggerSource === 'tasbih') {
                    // Triggers when a tasbih session finishes
                    shouldShow = true;
                } else if (triggerSource === 'qibla') {
                    // Triggers when qibla is aligned
                    shouldShow = true;
                } else if (triggerSource === 'duas') {
                    const duaFavs = JSON.parse(localStorage.getItem('dua_favorites') || '[]');
                    if (duaFavs.length >= 3) shouldShow = true;
                } else if (triggerSource === 'quran') {
                    const quranSessions = parseInt(localStorage.getItem('zakat_quran_sessions') || '0', 10);
                    if (quranSessions >= 10) shouldShow = true;
                }

                if (shouldShow) {
                    try {
                        // Attempt native review dialog
                        await InAppReview.requestReview();
                        
                        // If successful, flag as rated to prevent future prompts
                        const newRatingData = {
                            hasRated: true,
                            ratedAt: new Date().toISOString()
                        };
                        await Preferences.set({ key: RATING_PREF_KEY, value: JSON.stringify(newRatingData) });
                    } catch (reviewError) {
                        console.error('Native AppReview failed or unavailable, using fallback', reviewError);
                        
                        // Fallback logic
                        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
                        if (/android/i.test(userAgent)) {
                            window.open('market://details?id=com.zakatledger.app', '_system');
                        } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                            window.open('itms-apps://itunes.apple.com/app/id123456789', '_system'); // placeholder
                        }
                        
                        // Put on cooldown since we triggered fallback
                        const cooldownDate = new Date();
                        cooldownDate.setDate(cooldownDate.getDate() + 30); // 30 days later
                        const nextRatingData = {
                            hasRated: false,
                            reminderDate: cooldownDate.toISOString()
                        };
                        await Preferences.set({ key: RATING_PREF_KEY, value: JSON.stringify(nextRatingData) });
                    }
                }
            } catch (e) {
                console.error("Failed to check rating preferences", e);
            }
        };

        // Attach global listener
        window.addEventListener('checkAppRating', handleCheckRating);

        // Expose a simple function to trigger the event safely from anywhere
        window.checkAppRating = (source) => {
            const event = new CustomEvent('checkAppRating', { detail: { source } });
            window.dispatchEvent(event);
        };

        return () => {
            window.removeEventListener('checkAppRating', handleCheckRating);
        };
    }, []);

    // No custom UI is rendered anymore; everything uses native dialogs
    return null;
}
