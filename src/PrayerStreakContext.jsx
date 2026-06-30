import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePrayer } from './PrayerContext';
import { LocalNotifications } from '@capacitor/local-notifications';

const STORAGE_KEY = 'smart_prayer_tracker_data';
const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

function getTodayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Pure function to calculate streak from historical data reliably
function calculateStreakPure(completedMap, target) {
    let currentStreak = 0;
    const todayKey = getTodayKey();

    const todayDone = PRAYERS.filter(p => (completedMap[todayKey] || {})[p] === true).length >= target;
    if (todayDone) {
        currentStreak = 1;
    }

    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1);

    for (let i = 0; i < 365; i++) {
        const y = checkDate.getFullYear();
        const m = String(checkDate.getMonth() + 1).padStart(2, '0');
        const d = String(checkDate.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${d}`;

        const count = PRAYERS.filter(p => (completedMap[key] || {})[p] === true).length;
        if (count >= target) {
            if (!todayDone && currentStreak === 0) {
                currentStreak = 1;
            } else {
                currentStreak++;
            }
        } else {
            break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
    }

    console.log("--- STREAK DEBUGGING ---");
    console.log("Current date:", todayKey);
    console.log("Prayer completion status for today:", completedMap[todayKey] || {});
    console.log("Daily completion result:", todayDone);
    console.log("Calculated streak value:", currentStreak);

    return currentStreak;
}

const PrayerStreakContext = createContext(null);

export function PrayerStreakProvider({ children }) {
    const { timings, settings, updateSettings } = usePrayer();
    
    // Unified setting: bind remindersEnabled directly to usePrayer settings notificationsEnabled
    const remindersEnabled = settings?.notificationsEnabled ?? false;

    const [store, setStore] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const loadedCompleted = parsed.completed || parsed || {};
                const loadedTarget = parsed.streakTarget ?? 5;
                
                // CRITICAL FIX: Recalculate streak from historical data on app startup 
                // to correctly reset streak to 0 if days were missed while the app was closed.
                const accurateStreak = calculateStreakPure(loadedCompleted, loadedTarget);
                
                return {
                    completed: loadedCompleted,
                    streak: accurateStreak,
                    bestStreak: Math.max(parsed.bestStreak ?? 0, accurateStreak),
                    streakTarget: loadedTarget,
                };
            }
        } catch (e) {
            console.error("Failed to parse prayer tracker storage", e);
        }
        return {
            completed: {},
            streak: 0,
            bestStreak: 0,
            streakTarget: 5,
        };
    });

    const [dismissedPrompts, setDismissedPrompts] = useState({});

    // Persist stores on updates
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }, [store]);

    const today = getTodayKey();
    const todayData = store.completed[today] || {};

    // Helper to verify if a prayer is in the future (locked)
    const isPrayerLocked = useCallback((prayer, targetDateKey = today) => {
        if (targetDateKey !== today) return false; // Past days are always editable (Recovery mode)
        
        // If a prayer is already completed, allow them to undo/untoggle it (not locked)
        const isCompleted = (store.completed[targetDateKey] || {})[prayer] === true;
        if (isCompleted) return false;

        if (!timings) return false;

        const key = prayer.charAt(0).toUpperCase() + prayer.slice(1);
        const rawTime = timings[key];
        if (!rawTime) return false;

        const cleanTime = rawTime.split(' ')[0];
        const [hours, minutes] = cleanTime.split(':').map(Number);
        const prayerTime = new Date();
        prayerTime.setHours(hours, minutes, 0, 0);

        return new Date() < prayerTime;
    }, [timings, today, store.completed]);

    // Recalculate consecutive streak records
    const recalculateStreak = useCallback((completedMap, target = store.streakTarget) => {
        return calculateStreakPure(completedMap, target);
    }, [store.streakTarget]);

    // Manage permission and local notifications dynamically
    useEffect(() => {
        if (remindersEnabled) {
            const requestPermissions = async () => {
                try {
                    const status = await LocalNotifications.checkPermissions();
                    if (status.display !== 'granted') {
                        await LocalNotifications.requestPermissions();
                    }
                } catch (e) {
                    console.log("Local notifications display permission skipped on standard browser.", e);
                }
            };
            requestPermissions();
        }
    }, [remindersEnabled]);

    // Synchronize background notification schedule reactively for follow-up nudges
    useEffect(() => {
        const cancelAllAlerts = async () => {
            try {
                await LocalNotifications.cancel({ 
                    notifications: [
                        { id: 11 }, { id: 12 }, { id: 13 }, { id: 14 }, { id: 15 }
                    ] 
                });
            } catch (e) {
                console.warn("Notification cancel skipped on web platform.", e);
            }
        };

        if (!remindersEnabled) {
            cancelAllAlerts();
            return;
        }

        if (!timings) return;

        const scheduleUpcomingAlerts = async () => {
            try {
                await cancelAllAlerts();

                const now = new Date();
                const scheduled = [];

                PRAYERS.forEach((p, idx) => {
                    const rawTime = timings[p.charAt(0).toUpperCase() + p.slice(1)];
                    if (!rawTime) return;

                    const cleanTime = rawTime.split(' ')[0];
                    const [hours, minutes] = cleanTime.split(':').map(Number);
                    const prayerTime = new Date();
                    prayerTime.setHours(hours, minutes, 0, 0);

                    // Gentle follow-up nudge (only 1 soft nudge 45 minutes later if still incomplete)
                    const nudgeTime = new Date(prayerTime.getTime() + 45 * 60 * 1000);
                    if (nudgeTime > now) {
                        scheduled.push({
                            title: `Prayer Reminder`,
                            body: `You haven't marked ${p.toUpperCase()} as prayed yet.`,
                            id: idx + 11,
                            schedule: { at: nudgeTime }
                        });
                    }
                });

                if (scheduled.length > 0) {
                    await LocalNotifications.schedule({ notifications: scheduled });
                }
            } catch (e) {
                console.warn("LocalNotifications scheduling failed or is running inside standard browser.", e);
            }
        };

        scheduleUpcomingAlerts();
    }, [timings, remindersEnabled]);

    // Handle toggling of a prayer state with locking validation
    const togglePrayer = useCallback((prayer, targetDateKey = today) => {
        // Validation: Verify if prayer is locked (in the future)
        if (isPrayerLocked(prayer, targetDateKey)) {
            return false; // Action rejected
        }

        setStore(prev => {
            const dayMap = prev.completed[targetDateKey] || {};
            const isCompleted = !dayMap[prayer];

            const updatedCompleted = {
                ...prev.completed,
                [targetDateKey]: {
                    ...dayMap,
                    [prayer]: isCompleted,
                }
            };

            const newStreak = recalculateStreak(updatedCompleted, prev.streakTarget);
            const bestStreak = Math.max(prev.bestStreak, newStreak);

            return {
                ...prev,
                completed: updatedCompleted,
                streak: newStreak,
                bestStreak,
            };
        });
        return true; // Action successful
    }, [today, isPrayerLocked, recalculateStreak]);

    // Mark all available (non-locked) prayers completed
    const markAllComplete = useCallback((targetDateKey = today) => {
        setStore(prev => {
            const full = {};
            PRAYERS.forEach(p => {
                // Only mark completed if it is unlocked
                if (!isPrayerLocked(p, targetDateKey)) {
                    full[p] = true;
                } else {
                    full[p] = (prev.completed[targetDateKey] || {})[p] || false;
                }
            });

            const updatedCompleted = {
                ...prev.completed,
                [targetDateKey]: full,
            };

            const newStreak = recalculateStreak(updatedCompleted, prev.streakTarget);
            const bestStreak = Math.max(prev.bestStreak, newStreak);

            return {
                ...prev,
                completed: updatedCompleted,
                streak: newStreak,
                bestStreak,
            };
        });
    }, [today, isPrayerLocked, recalculateStreak]);

    const setStreakTarget = useCallback((target) => {
        setStore(prev => {
            const newStreak = recalculateStreak(prev.completed, target);
            return {
                ...prev,
                streakTarget: target,
                streak: newStreak,
                bestStreak: Math.max(prev.bestStreak, newStreak)
            };
        });
    }, [recalculateStreak]);

    const setRemindersEnabled = useCallback((enabled) => {
        if (settings) {
            updateSettings({
                ...settings,
                notificationsEnabled: enabled
            });
        }
    }, [settings, updateSettings]);

    const dismissPrompt = useCallback((prayerKey) => {
        setDismissedPrompts(prev => ({
            ...prev,
            [prayerKey]: true,
        }));
    }, []);

    const getWeeklyStats = useCallback(() => {
        const stats = [];
        let tempDate = new Date();
        for (let i = 0; i < 7; i++) {
            const y = tempDate.getFullYear();
            const m = String(tempDate.getMonth() + 1).padStart(2, '0');
            const d = String(tempDate.getDate()).padStart(2, '0');
            const key = `${y}-${m}-${d}`;

            const dayData = store.completed[key] || {};
            const count = PRAYERS.filter(p => dayData[p] === true).length;
            stats.push({
                dateLabel: tempDate.toLocaleDateString('en-US', { weekday: 'short' }),
                dateKey: key,
                completedCount: count,
                total: PRAYERS.length,
            });
            tempDate.setDate(tempDate.getDate() - 1);
        }
        return stats.reverse();
    }, [store.completed]);

    const todayComplete = PRAYERS.filter(p => todayData[p] === true).length >= store.streakTarget;
    const completedCount = PRAYERS.filter(p => todayData[p] === true).length;

    return (
        <PrayerStreakContext.Provider value={{
            todayData,
            streak: store.streak,
            bestStreak: store.bestStreak,
            todayComplete,
            completedCount,
            totalPrayers: PRAYERS.length,
            prayers: PRAYERS,
            togglePrayer,
            markAllComplete,
            streakTarget: store.streakTarget,
            setStreakTarget,
            remindersEnabled,
            setRemindersEnabled,
            dismissedPrompts,
            dismissPrompt,
            getWeeklyStats,
            isPrayerLocked,
            storeData: store.completed,
        }}>
            {children}
        </PrayerStreakContext.Provider>
    );
}

export function usePrayerStreak() {
    const ctx = useContext(PrayerStreakContext);
    if (!ctx) throw new Error('usePrayerStreak must be used inside PrayerStreakProvider');
    return ctx;
}
