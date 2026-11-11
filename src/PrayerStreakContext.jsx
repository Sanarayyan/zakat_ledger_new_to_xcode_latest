import { calendarDay, prayerInstant, prayerDateInZone } from './services/prayerCalendar.mjs';
import { buildFollowUpNotifications } from './services/prayerNotificationPolicy.mjs';
import { createNotificationScheduler } from './services/notificationScheduler.mjs';
import { Capacitor } from '@capacitor/core';
import { readStoredJSON } from './services/storedJson.mjs';
import { appStorage } from './services/appStorage';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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

    return currentStreak;
}

const PrayerStreakContext = createContext(null);

export function PrayerStreakProvider({ children }) {
    const { timings, calendar, settings, updateSettings, resumeCount } = usePrayer();
    
    const remindersEnabled = !!settings?.prayerRemindersEnabled;
    const reminderQueue = useRef(createNotificationScheduler(LocalNotifications));

    const [store, setStore] = useState(() => {
        const parsed = readStoredJSON(appStorage, STORAGE_KEY, {});
        const loadedCompleted = parsed.completed || parsed;
        const loadedTarget = parsed.streakTarget ?? 5;
        const accurateStreak = calculateStreakPure(loadedCompleted, loadedTarget);
        return { completed: loadedCompleted, streak: accurateStreak,
            bestStreak: Math.max(Number(parsed.bestStreak) || 0, accurateStreak), streakTarget: loadedTarget };
    });

    const [dismissedPrompts, setDismissedPrompts] = useState({});

    // Persist stores on updates
    useEffect(() => {
        appStorage.setItem(STORAGE_KEY, JSON.stringify(store));
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

        const prayerTime = prayerInstant(calendarDay(calendar, prayerDateInZone(calendar)), key);
        return !!prayerTime && new Date() < prayerTime;
    }, [timings, calendar, today, store.completed]);

    // Recalculate consecutive streak records
    const recalculateStreak = useCallback((completedMap, target = store.streakTarget) => {
        return calculateStreakPure(completedMap, target);
    }, [store.streakTarget]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        const notifications = remindersEnabled ? buildFollowUpNotifications(timings, todayData, new Date(), calendarDay(calendar, prayerDateInZone(calendar))) : [];
        reminderQueue.current.replace([11, 12, 13, 14, 15], notifications).catch(console.error);
        return () => reminderQueue.current.cancel();
    }, [timings, calendar, remindersEnabled, store.completed, today, resumeCount]);

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
                prayerRemindersEnabled: enabled
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
