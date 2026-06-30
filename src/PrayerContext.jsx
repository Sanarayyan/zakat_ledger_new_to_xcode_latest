import React, { createContext, useState, useEffect, useContext } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App } from '@capacitor/app';

const PrayerContext = createContext();

const PRAYERS_LIST = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export const PrayerProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('prayer_settings');
        const parsed = saved ? JSON.parse(saved) : {};
        return {
            notificationsEnabled: false,
            adhanEnabled: false,
            vibrationEnabled: false,
            ...parsed
        };
    });

    const [timings, setTimings] = useState(null);
    const [calendar, setCalendar] = useState(null);
    const [nextPrayer, setNextPrayer] = useState(null);
    const [nextPrayerTime, setNextPrayerTime] = useState('');
    const [countdown, setCountdown] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [locating, setLocating] = useState(false);
    const [locError, setLocError] = useState('');
    const [lastTriggeredPrayer, setLastTriggeredPrayer] = useState('');
    const [audio] = useState(new Audio('https://www.islamcan.com/audio/adhan/azan1.mp3'));

    const fetchPrayerTimes = async (currentSettings) => {
        if (!currentSettings || !currentSettings.location) return;
        
        setLoading(true);
        setError('');
        try {
            const { lat, lng } = currentSettings.location;
            const school = currentSettings.school || 0;
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();
            
            // Fetch the whole month for today/tomorrow/etc.
            const res = await fetch(`https://api.aladhan.com/v1/calendar?latitude=${lat}&longitude=${lng}&school=${school}&month=${month}&year=${year}&method=1`);
            const data = await res.json();
            
            if (data.code === 200) {
                setCalendar(data.data);
                // Set today's timings specifically for backward compatibility
                const today = now.getDate();
                setTimings(data.data[today - 1].timings);
            } else {
                setError('Failed to fetch prayer times.');
            }
        } catch (err) {
            setError('Error connecting to prayer times service.');
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem('prayer_settings', JSON.stringify(newSettings));
    };

    const autoFetchLocation = async (currentSettings) => {
        setLocating(true);
        setLocError('');
        try {
            let permission = await Geolocation.checkPermissions();
            if (permission.location !== 'granted') {
                permission = await Geolocation.requestPermissions();
            }

            if (permission.location !== 'granted' && permission.location !== 'prompt-with-rationale') {
                throw new Error('Permission denied or disabled');
            }

            const positionPromise = Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Location timeout')), 15000));
            
            const position = await Promise.race([positionPromise, timeoutPromise]);
            const { latitude, longitude } = position.coords;
            
            let city = 'Current Location';
            try {
                const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                const data = await res.json();
                city = data.city || data.locality || city;
            } catch(e) {}

            updateSettings({ ...currentSettings, location: { lat: latitude, lng: longitude, city } });
        } catch (error) {
            console.error("Auto fetch location failed", error);
            setLocError('Location failed. Using fallback city (Makkah).');
            updateSettings({ ...currentSettings, location: { lat: 21.4225, lng: 39.8262, city: 'Makkah (Fallback)' } });
        } finally {
            setLocating(false);
        }
    };

    useEffect(() => {
        if (settings) {
            if (!settings.location || (settings.location.lat === 0 && settings.location.lng === 0)) {
                autoFetchLocation(settings);
            } else {
                fetchPrayerTimes(settings);
            }
        }
    }, [settings]);

    useEffect(() => {
        if (!timings) return;
        
        const updateCountdown = () => {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
            
            let next = null;
            let minDiff = Infinity;

            for (let prayer of PRAYERS_LIST) {
                if (prayer === 'Sunrise') continue;
                
                const timeStrRaw = timings[prayer];
                if (!timeStrRaw) continue;

                const timeStr = timeStrRaw.split(' ')[0];
                const [hours, mins] = timeStr.split(':').map(Number);
                const prayerTime = hours * 60 + mins;

                let diff = prayerTime - currentTime;
                if (diff < 0) diff += 24 * 60; // Next day

                if (diff < minDiff) {
                    minDiff = diff;
                    next = { name: prayer, diff, time: timeStr };
                }
            }

            if (next) {
                setNextPrayer(next.name);
                setNextPrayerTime(next.time);
                
                const h = Math.floor(next.diff / 60);
                const m = Math.floor(next.diff % 60);
                const s = Math.floor((next.diff * 60) % 60);
                
                setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);

                // Notification Trigger Logic (Foreground Web Fallback)
                if (settings?.notificationsEnabled && next.diff <= 0.02 && next.name !== lastTriggeredPrayer) {
                    setLastTriggeredPrayer(next.name);
                    triggerAction(next.name);
                }
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [timings, settings, lastTriggeredPrayer, audio]);

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

    // Robust Background Scheduling using Capacitor
    useEffect(() => {
        if (!calendar || !settings?.notificationsEnabled) return;

        const schedulePrayerNotifications = async () => {
            try {
                let permStatus = await LocalNotifications.checkPermissions();
                if (permStatus.display !== 'granted') {
                    permStatus = await LocalNotifications.requestPermissions();
                    if (permStatus.display !== 'granted') return;
                }

                // Clear previous prayer alarms
                const pending = await LocalNotifications.getPending();
                const prayerIds = pending.notifications
                    .filter(n => n.id >= 100 && n.id <= 500)
                    .map(n => ({ id: n.id }));
                if (prayerIds.length > 0) {
                    await LocalNotifications.cancel({ notifications: prayerIds });
                }

                const now = new Date();
                const scheduled = [];
                let idCounter = 100;
                
                const todayDate = now.getDate();
                const monthDays = calendar.slice(todayDate - 1); // From today to end of month
                
                // Limit to next 7 days to avoid OS scheduling limits (iOS limits to 64 local notifications).
                // 7 days * 5 prayers = 35 notifications. This is very safe!
                const lookaheadDays = monthDays.slice(0, 7);

                lookaheadDays.forEach((dayData) => {
                    const dayTimings = dayData.timings;
                    if (!dayTimings) return;
                    
                    const gDay = parseInt(dayData.date.gregorian.day, 10);
                    const gMonth = dayData.date.gregorian.month.number - 1; // JS months are 0-indexed
                    const gYear = parseInt(dayData.date.gregorian.year, 10);

                    PRAYERS_LIST.forEach((p) => {
                        if (p === 'Sunrise') return;
                        
                        const rawTime = dayTimings[p];
                        if (!rawTime) return;

                        const cleanTime = rawTime.split(' ')[0];
                        const [hours, minutes] = cleanTime.split(':').map(Number);
                        
                        const prayerTime = new Date(gYear, gMonth, gDay, hours, minutes, 0, 0);

                        if (prayerTime > now) {
                            scheduled.push({
                                title: `🕌 Time for ${p} Prayer`,
                                body: `The time for ${p} has begun.`,
                                id: idCounter++,
                                schedule: { at: prayerTime, allowWhileIdle: true }, // Wake device
                                sound: 'adhan.mp3',
                                actionTypeId: 'PRAYER_ALERT',
                                extra: { prayer: p }
                            });
                        }
                    });
                });

                if (scheduled.length > 0) {
                    await LocalNotifications.schedule({ notifications: scheduled });
                }
            } catch (e) {
                console.log('Background scheduling not supported in browser environment', e);
            }
        };

        schedulePrayerNotifications();
    }, [calendar, settings?.notificationsEnabled]);

    // Setup global foreground/action listeners
    useEffect(() => {
        let actionListener = null;
        let receivedListener = null;

        const setupListeners = async () => {
            try {
                actionListener = await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
                    const prayer = notification.notification.extra?.prayer;
                    if (prayer) {
                        triggerAction(prayer);
                    }
                });

                receivedListener = await LocalNotifications.addListener('localNotificationReceived', (notification) => {
                    const prayer = notification.extra?.prayer;
                    if (prayer && prayer !== lastTriggeredPrayer) {
                        setLastTriggeredPrayer(prayer);
                        triggerAction(prayer);
                    }
                });
            } catch (e) {
                console.log('Local notifications listeners failed', e);
            }
        };

        setupListeners();

        return () => {
            if (actionListener) actionListener.remove();
            if (receivedListener) receivedListener.remove();
        };
    }, [settings, lastTriggeredPrayer]);

    // Developer Test Functions
    const triggerTestNotification = async () => {
        try {
            let permStatus = await LocalNotifications.checkPermissions();
            if (permStatus.display !== 'granted') {
                permStatus = await LocalNotifications.requestPermissions();
            }
            if (permStatus.display === 'granted') {
                const now = new Date();
                now.setSeconds(now.getSeconds() + 3);
                await LocalNotifications.schedule({
                    notifications: [{
                        title: `🕌 Test Prayer Notification`,
                        body: `This is a test notification for Adhan.`,
                        id: 999,
                        schedule: { at: now },
                        extra: { prayer: 'Test' }
                    }]
                });
                alert('Test notification scheduled in 3 seconds. Please minimize the app to verify background delivery.');
            } else {
                alert('Notification permission denied by OS.');
            }
        } catch (e) {
            console.log('Local Notifications failed', e);
            alert('Notifications not supported on this platform/browser.');
        }
    };

    const triggerTestAdhan = () => {
        if (!settings?.adhanEnabled && !settings?.vibrationEnabled) {
            alert('Adhan and Vibration are both muted in settings. Toggle them ON to test.');
            return;
        }
        triggerAction('Test');
    };

    // Refresh at midnight
    useEffect(() => {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const timeUntilMidnight = midnight.getTime() - now.getTime();

        const timeout = setTimeout(() => {
            if (settings) fetchPrayerTimes(settings);
        }, timeUntilMidnight);

        return () => clearTimeout(timeout);
    }, [timings, settings]);

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
            formatTime,
            triggerTestNotification,
            triggerTestAdhan,
            refresh: () => settings && fetchPrayerTimes(settings)
        }}>
            {children}
        </PrayerContext.Provider>
    );
};

export const usePrayer = () => useContext(PrayerContext);
