import { calendarDay, nextCalendarPrayer, localDateKey, prayerContextKey, prayerDateInZone } from './services/prayerCalendar.mjs';
import { readStoredJSON } from './services/storedJson.mjs';
import { appStorage } from './services/appStorage';
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { getDeviceLocation, locationErrorMessage } from './services/locationService.mjs';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Adhan, nativeAdhanEnabled, scheduleIOSPrayerAlerts } from './services/adhanService';
import { shouldKeepExistingPrayerAlarms } from './services/prayerNotificationPolicy.mjs';
import { syncPrayerAlarms } from './services/prayerAlarmSync.mjs';
import { notificationWrites } from './services/notificationScheduler.mjs';
import { createPrayerTimesService } from './services/prayerTimesService.mjs';

const PrayerContext = createContext();

export const PrayerProvider = ({ children }) => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(() => {
        const parsed = readStoredJSON(appStorage, 'prayer_settings', {});
        if (parsed.location?.city?.includes('(Fallback)')) delete parsed.location;
        return {
            notificationsEnabled: false,
            adhanEnabled: false,
            vibrationEnabled: false,
            ...parsed
        };
    });

    const [initialCalendar] = useState(() => {
        const cache = readStoredJSON(appStorage, 'prayer_calendar_cache_v1', {});
        return cache.context === prayerContextKey(settings) && Array.isArray(cache.calendar) ? cache.calendar : null;
    });
    const [calendar, setCalendar] = useState(initialCalendar);
    const timings = calendarDay(calendar, prayerDateInZone(calendar))?.timings || null;
    const [prayerContextChanged, setPrayerContextChanged] = useState(false);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [nextPrayerTime, setNextPrayerTime] = useState('');
    const [countdown, setCountdown] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [locating, setLocating] = useState(false);
    const [locError, setLocError] = useState('');
    const [lastTriggeredPrayer, setLastTriggeredPrayer] = useState('');
    const [scheduleError, setScheduleError] = useState('');
    const [resumeCount, setResumeCount] = useState(0);
    const scheduleQueue = useRef(Promise.resolve());
    const prayerRequests = useRef(null);
    const locationRequest = useRef(0);
    if (!prayerRequests.current) prayerRequests.current = createPrayerTimesService();
    const [audio] = useState(() => new Audio('https://www.islamcan.com/audio/adhan/azan1.mp3'));

    useEffect(() => () => { audio.pause(); }, [audio]);

    const fetchPrayerTimes = async (currentSettings) => {
        if (!currentSettings || !currentSettings.location) return;
        
        setLoading(true);
        setError('');
        let current = false;
        try {
            const result = await prayerRequests.current.load(currentSettings);
            if (!result) return;
            current = true;
            const context = prayerContextKey(currentSettings);
            const previous = readStoredJSON(appStorage, 'prayer_calendar_cache_v1', {});
            const fetched = result.value.calendar;
            const lastDate = fetched.at(-1).date.gregorian;
            const lastMonth = Number(lastDate.year) * 12 + Number(lastDate.month.number);
            const retained = result.value.warning && previous.context === context
                ? previous.calendar?.filter(day => {
                    const date = day.date.gregorian;
                    return Number(date.year) * 12 + Number(date.month?.number) === lastMonth + 1;
                }) || [] : [];
            const updated = fetched.concat(retained);
            appStorage.setItem('prayer_calendar_cache_v1', JSON.stringify({ context, calendar: updated }));
            setCalendar(updated);
            setPrayerContextChanged(false);
            if (result.value.warning) setError(result.value.warning);
        } catch (err) {
            current = true;
            setError(err.message || 'Error connecting to prayer times service.');
        } finally {
            if (current) setLoading(false);
        }
    };

    const updateSettings = (newSettings) => {
        if ('location' in newSettings) {
            locationRequest.current++;
            setLocError('');
            setLocating(false);
        }
        prayerRequests.current.cancel();
        const location = 'location' in newSettings ? newSettings.location : settings.location;
        const school = newSettings.school ?? settings.school;
        if (location?.lat !== settings.location?.lat || location?.lng !== settings.location?.lng || school !== settings.school) {
            setPrayerContextChanged(true);
            setCalendar(null);
            setNextPrayer(null);
            setNextPrayerTime('');
            setCountdown('');
        }
        setSettings(previous => ({ ...previous, ...newSettings }));
    };

    const detectLocation = async () => {
        const request = ++locationRequest.current;
        setLocating(true);
        setLocError('');
        try {
            const location = await getDeviceLocation();
            if (request !== locationRequest.current) return null;
            updateSettings({ location });
            return location;
        } catch (error) {
            if (request === locationRequest.current) setLocError(locationErrorMessage(error, appStorage.getItem('zakat_lang')));
            return null;
        } finally {
            if (request === locationRequest.current) setLocating(false);
        }
    };

    useEffect(() => {
        appStorage.setItem('prayer_settings', JSON.stringify(settings));
        if (settings.location) {
            fetchPrayerTimes(settings);
        } else {
            prayerRequests.current.cancel();
            setLoading(false);
            setCalendar(null);
            setNextPrayer(null);
            setCountdown('');
        }
        return () => prayerRequests.current.cancel();
    }, [settings, resumeCount]);

    useEffect(() => {
        if (!calendar) return;
        
        const updateCountdown = () => {
            const now = new Date();
            const next = nextCalendarPrayer(calendar, now);
            if (next) {
                setNextPrayer(next.name);
                setNextPrayerTime(next.time);
                
                const h = Math.floor(next.diff / 60);
                const m = Math.floor(next.diff % 60);
                const s = Math.floor((next.diff * 60) % 60);
                
                setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);

                // Notification Trigger Logic (Foreground Web Fallback)
                if (!Capacitor.isNativePlatform() && settings?.notificationsEnabled && next.diff <= 0.02 && next.name !== lastTriggeredPrayer) {
                    setLastTriggeredPrayer(next.name);
                    triggerAction(next.name);
                }
            } else { setNextPrayer(null); setNextPrayerTime(''); setCountdown(''); }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [calendar, settings, lastTriggeredPrayer, audio]);

    // Unified Action Trigger (Adhan & Vibration)
    const triggerAction = async (prayerName) => {
        if (settings?.vibrationEnabled) {
            if (navigator.vibrate) {
                navigator.vibrate(1000);
            } else {
                try {
                    await Haptics.impact({ style: ImpactStyle.Heavy });
                    setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 250);
                    setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 500);
                    setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 750);
                } catch(e) {}
            }
        }
        if (settings?.adhanEnabled) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log("Audio playback failed:", e));
        }
    };

    const stopAdhan = async () => {
        audio.pause();
        audio.currentTime = 0;
        if (nativeAdhanEnabled) await Adhan.stop();
    };

    useEffect(() => {
        if (!settings.adhanEnabled || !settings.notificationsEnabled) stopAdhan().catch(console.error);
        if (nativeAdhanEnabled) notificationWrites.run(() => Adhan.configure({
            sound: !!settings.adhanEnabled && !!settings.notificationsEnabled,
            vibrate: !!settings.vibrationEnabled,
        })).catch(console.error);
    }, [settings.adhanEnabled, settings.notificationsEnabled, settings.vibrationEnabled]);

    useEffect(() => {
        let listener;
        let disposed = false;
        App.addListener('appStateChange', state => {
            if (state.isActive) setResumeCount(value => value + 1);
        }).then(handle => { if (disposed) handle.remove(); else listener = handle; });
        const refresh = () => setResumeCount(value => value + 1);
        const visible = () => { if (document.visibilityState === 'visible') refresh(); };
        window.addEventListener('online', refresh);
        document.addEventListener('visibilitychange', visible);
        let day = `${localDateKey()}-${new Date().getTimezoneOffset()}`;
        const timer = setInterval(() => {
            const next = `${localDateKey()}-${new Date().getTimezoneOffset()}`;
            if (next !== day) { day = next; refresh(); }
        }, 30000);
        return () => { disposed = true; if (listener) listener.remove(); clearInterval(timer); window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', visible); };
    }, []);

    useEffect(() => {
        let stale = false;
        scheduleQueue.current = scheduleQueue.current.catch(() => {}).then(async () => {
            if (stale) return;
            if (!Capacitor.isNativePlatform()) return;
            // Preserve saved alarms during an ordinary offline restart, but clear a superseded location's alarms.
            if (shouldKeepExistingPrayerAlarms(settings.notificationsEnabled, calendar, prayerContextChanged)) return;
            setScheduleError('');
            try {
                await syncPrayerAlarms({
                    localNotifications: LocalNotifications, adhan: nativeAdhanEnabled ? Adhan : null,
                    settings, calendar, isStale: () => stale, setScheduleError,
                    stopTitle: appStorage.getItem('zakat_lang') === 'ml' ? 'ബാങ്ക് നിർത്തുക' : 'Stop Adhan',
                    writeNotification: notificationWrites.run,
                    schedulePrimary: Capacitor.getPlatform() === 'ios' ? scheduleIOSPrayerAlerts : undefined,
                });
            } catch (error) {
                if (!stale) setScheduleError(error.message || 'Prayer reminders could not be scheduled.');
            }
        });
        return () => { stale = true; };
    }, [calendar, prayerContextChanged, settings.notificationsEnabled, settings.adhanEnabled, settings.vibrationEnabled, resumeCount]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform() || nativeAdhanEnabled) return;
        let disposed = false;
        let listener;
        async function register() {
            listener = await LocalNotifications.addListener('localNotificationActionPerformed', ({ actionId }) => {
                if (!disposed && actionId === 'OPEN_PRAYER') navigate('/prayer');
            });
            if (disposed) { await listener.remove(); return; }
            await LocalNotifications.registerActionTypes({
                types: [{ id: 'PRAYER_ALERT', actions: [{ id: 'OPEN_PRAYER', title: 'Open prayer times', foreground: true }] }],
            });
        }
        register().catch(console.warn);
        return () => { disposed = true; listener?.remove(); };
    }, [navigate]);

    // Developer Test Functions
    const triggerTestNotification = async () => {
        try {
            if (nativeAdhanEnabled) {
                const status = await Adhan.status();
                if (!status.notificationsAllowed) {
                    const permission = await LocalNotifications.requestPermissions();
                    if (permission.display !== 'granted') throw new Error('Allow notifications first.');
                }
                if (!status.exactAllowed) {
                    await Adhan.requestExactPermission();
                    alert('Allow Alarms & reminders, return here, then press Test notification again.');
                    return;
                }
                await notificationWrites.run(() => Adhan.test({
                    stopTitle: appStorage.getItem('zakat_lang') === 'ml' ? 'ബാങ്ക് നിർത്തുക' : 'Stop Adhan',
                }));
                alert('Test Adhan will play in 10 seconds. Lock the phone, expand the notification, and tap Stop Adhan.');
                return;
            }
            let permStatus = await LocalNotifications.checkPermissions();
            if (permStatus.display !== 'granted') {
                permStatus = await LocalNotifications.requestPermissions();
            }
            if (permStatus.display === 'granted') {
                const ios = Capacitor.getPlatform() === 'ios';
                const at = new Date(Math.ceil(Date.now() / 1000) * 1000 + 3000);
                const notifications = [{
                    title: '🕌 Test Prayer Notification',
                    body: 'This is a test notification for Adhan.',
                    id: 999,
                    schedule: { at },
                    ...(ios ? { sound: 'adhan.caf' } : {}),
                    extra: { prayer: 'Test' },
                }];
                await notificationWrites.run(() => ios ? scheduleIOSPrayerAlerts(notifications)
                    : LocalNotifications.schedule({ notifications }));
                alert('Test notification scheduled in a few seconds. Minimize the app to verify background delivery.');
            } else {
                alert('Notification permission denied by OS.');
            }
        } catch (e) {
            console.log('Local Notifications failed', e);
            alert(e.message || 'Notifications not supported on this platform/browser.');
        }
    };

    const triggerTestAdhan = () => {
        if (!settings?.adhanEnabled && !settings?.vibrationEnabled) {
            alert('Adhan and Vibration are both muted in settings. Toggle them ON to test.');
            return;
        }
        if (nativeAdhanEnabled) triggerTestNotification();
        else triggerAction('Test');
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        // Strip timezone info if present (e.g., '15:39 (IST)' -> '15:39')
        const cleanTime = timeStr.split(' ')[0];
        const [hours, minutes] = cleanTime.split(':');
        let h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; 
        return `${h}:${minutes} ${ampm}`;
    };



    return (
        <PrayerContext.Provider value={{ 
            settings, 
            updateSettings, 
            timings, 
            calendar,
            nextPrayer, 
            nextPrayerTime: formatTime(nextPrayerTime), 
            countdown, 
            loading, 
            error,
            locating,
            locError,
            detectLocation,
            formatTime,
            triggerTestNotification,
            triggerTestAdhan,
            stopAdhan,
            scheduleError,
            resumeCount,
            refresh: () => settings && fetchPrayerTimes(settings)
        }}>
            {children}
        </PrayerContext.Provider>
    );
};

export const usePrayer = () => useContext(PrayerContext);
