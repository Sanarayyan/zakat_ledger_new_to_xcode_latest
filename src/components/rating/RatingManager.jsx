import { createRatingTransaction } from '../../services/ratingTransaction.mjs';
import { appStorage } from '../../services/appStorage';
import React, { useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { InAppReview } from '@capacitor-community/in-app-review';
import {
    InAppReviewService,
    ReviewRequestResult,
} from '../../services/inAppReviewService.mjs';

const RATING_PREF_KEY = 'zakat_app_rating_data';

export default function RatingManager() {
    useEffect(() => {
        let mounted = true;
        const reviewService = new InAppReviewService({
            gateway: {
                isAvailable: async () => mounted && Capacitor.isNativePlatform(),
                requestReview: async () => InAppReview.requestReview(),
            },
            onError: (error) => {
                console.error('Native in-app review request failed safely.', error);
            },
        });

        const transaction = createRatingTransaction();
        const handleCheckRating = (event) => transaction.run(async isActive => {
            const triggerSource = event.detail?.source;
            if (!triggerSource) return;

            try {
                const { value } = await Preferences.get({ key: RATING_PREF_KEY });
                const ratingData = value ? JSON.parse(value) : null;

                if (ratingData) {
                    if (ratingData.hasRated) return; // Never show again
                    if (ratingData.reminderDate && new Date() < new Date(ratingData.reminderDate)) return; // In cooldown
                }

                // Never ask during the very first app open: let new users try the app first.
                const launchCount = parseInt(appStorage.getItem('zakat_launch_count') || '0', 10);
                if (launchCount < 2) return;

                // Check specific conditions based on trigger
                let shouldShow = false;

                if (triggerSource === 'launch') {
                    const launches = parseInt(appStorage.getItem('zakat_launch_count') || '0', 10);
                    const firstLaunch = appStorage.getItem('zakat_first_launch');
                    
                    let daysSinceFirst = 0;
                    if (firstLaunch) {
                        const firstDate = new Date(firstLaunch);
                        const diffTime = Math.abs(new Date() - firstDate);
                        daysSinceFirst = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }

                    if (launches >= 3 || daysSinceFirst >= 1) {
                        shouldShow = true;
                    }
                } else if (triggerSource === 'tasbih') {
                    // Triggers when a tasbih session finishes
                    shouldShow = true;
                } else if (triggerSource === 'prayer') {
                    // Prayer times are the most-used screen: ask on the 3rd visit
                    const prayerVisits = parseInt(appStorage.getItem('zakat_prayer_visits') || '0', 10);
                    if (prayerVisits >= 3) shouldShow = true;
                } else if (triggerSource === 'zakat') {
                    // Triggers after a zakat calculation succeeds
                    shouldShow = true;
                } else if (triggerSource === 'qibla') {
                    // Triggers when qibla is aligned
                    shouldShow = true;
                } else if (triggerSource === 'duas') {
                    const duaFavs = JSON.parse(appStorage.getItem('dua_favorites') || '[]');
                    if (duaFavs.length >= 3) shouldShow = true;
                } else if (triggerSource === 'quran') {
                    const quranSessions = parseInt(appStorage.getItem('zakat_quran_sessions') || '0', 10);
                    if (quranSessions >= 3) shouldShow = true;
                }

                if (shouldShow && isActive()) {
                    const result = await reviewService.requestAfterSuccessfulAction();

                    if (result === ReviewRequestResult.REQUESTED) {
                        // Native APIs do not reveal whether a user completed a review.
                        // Space out successful requests instead of incorrectly marking them rated.
                        const nextEligibleDate = new Date();
                        nextEligibleDate.setDate(nextEligibleDate.getDate() + 60);
                        await Preferences.set({
                            key: RATING_PREF_KEY,
                            value: JSON.stringify({
                                hasRated: false,
                                lastRequestedAt: new Date().toISOString(),
                                reminderDate: nextEligibleDate.toISOString(),
                            }),
                        });
                    } else if (result === ReviewRequestResult.FAILED) {
                        const cooldownDate = new Date();
                        cooldownDate.setDate(cooldownDate.getDate() + 30);
                        await Preferences.set({
                            key: RATING_PREF_KEY,
                            value: JSON.stringify({
                                hasRated: false,
                                reminderDate: cooldownDate.toISOString(),
                            }),
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to check rating preferences", e);
            }
        });

        // Attach global listener
        window.addEventListener('checkAppRating', handleCheckRating);

        // Expose a simple function to trigger the event safely from anywhere
        const triggerRating = (source) => {
            const event = new CustomEvent('checkAppRating', { detail: { source } });
            window.dispatchEvent(event);
        };

        window.checkAppRating = triggerRating;
        return () => {
            mounted = false;
            transaction.dispose();
            if (window.checkAppRating === triggerRating) delete window.checkAppRating;
            window.removeEventListener('checkAppRating', handleCheckRating);
        };
    }, []);

    // No custom UI is rendered anymore; everything uses native dialogs
    return null;
}
