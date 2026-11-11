import { gregorianDay, orderedHijriMonth, shiftHijriMonth } from '../../services/hijriMonth.mjs';
import { ISLAMIC_EVENTS, EVENT_MESSAGES } from '../../services/calendarEvents.mjs';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { createLatestRequest, fetchJSON } from '../../services/latestRequest.mjs';
import { appStorage } from '../../services/appStorage';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';
import './CalendarPage.css';

const MONTH_KEYS = [
    'muharram', 'safar', 'rabi_al_awwal', 'rabi_al_thani',
    'jumada_al_ula', 'jumada_al_akhira', 'rajab', 'shaban',
    'ramadan', 'shawwal', 'dhu_al_qidah', 'dhu_al_hijjah'
];

export default function CalendarPage() {
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    
    const [todayHijri, setTodayHijri] = useState(null);
    const [calendarData, setCalendarData] = useState([]);
    const [currentView, setCurrentView] = useState({ month: 0, year: 0 }); 
    const [selectedDay, setSelectedDay] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDark, setIsDark] = useState(false);
    const [error, setError] = useState(null);
    const [initAttempt, setInitAttempt] = useState(0);
    const [isHijriPriority, setIsHijriPriority] = useState(appStorage.getItem('calendar_priority') === 'hijri');
    const [notificationsEnabled, setNotificationsEnabled] = useState(appStorage.getItem('event_notifications') === 'true');
    const [toastMessage, setToastMessage] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const menuRef = useRef(null);
    const calendarRequest = useRef(createLatestRequest());

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const checkEventNotifications = (hijri) => {
        if (Capacitor.isNativePlatform() || appStorage.getItem('event_notifications') !== 'true') return;
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const hDay = parseInt(hijri.day);
        const hMonth = parseInt(hijri.month.number);

        const checkDate = (d, m, isTomorrow, year = hijri.year) => {
            const eventKey = `${d}-${m}`;
            const eventData = ISLAMIC_EVENTS[eventKey];
            if (eventData && EVENT_MESSAGES[eventData.key]) {
                const uniqueId = `${eventData.key}-${year}-${isTomorrow ? 'tomorrow' : 'today'}`;
                const lastNotified = appStorage.getItem('last_notified_event_date');
                if (lastNotified !== uniqueId) {
                    const msg = EVENT_MESSAGES[eventData.key];
                    const title = isTomorrow ? `Tomorrow: ${msg.title}` : msg.title;
                    new Notification(title, { body: msg.body });
                    appStorage.setItem('last_notified_event_date', uniqueId);
                }
            }
        };

        checkDate(hDay, hMonth, false);
        
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const date = `${tomorrow.getDate()}-${tomorrow.getMonth() + 1}-${tomorrow.getFullYear()}`;
        fetchJSON(`https://api.aladhan.com/v1/gToH?date=${date}`).then(data => {
            const next = data.data?.hijri;
            if (next) checkDate(Number(next.day), Number(next.month.number), true, next.year);
        }).catch(() => {});
    };

    useEffect(() => {
        setIsDark(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(() => {
            setIsDark(document.body.classList.contains('dark-mode'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        // Handle click outside for dropdown menu
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            observer.disconnect();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const initCalendar = async () => {
            setError(null);
            setLoading(true);
            try {
                const today = new Date();
                const dd = String(today.getDate()).padStart(2, '0');
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const yyyy = today.getFullYear();
                
                const result = await calendarRequest.current.run(signal => fetchJSON(`https://api.aladhan.com/v1/gToH?date=${dd}-${mm}-${yyyy}`, { signal }));
                if (!result) return;
                const data = result.value;
                if (data.code === 200) {
                    const hijri = data.data.hijri;
                    setTodayHijri(hijri);
                    checkEventNotifications(hijri);
                    const hMonth = parseInt(hijri.month.number);
                    const hYear = parseInt(hijri.year);
                    setCurrentView({ month: hMonth, year: hYear });
                    await fetchMonthData(hMonth, hYear);
                } else {
                    throw new Error("Failed to get today's Hijri date");
                }
            } catch (err) {
                console.error("Failed to initialize calendar", err);
                setError("Network error. Please check your connection.");
                setLoading(false);
            }
        };

        initCalendar();
        return () => calendarRequest.current.cancel();
    }, [initAttempt]);

    const fetchMonthData = async (month, year) => {
        if (!month || !year) return;
        setLoading(true);
        setError(null);
        setSelectedDay(null);
        let current = false;
        try {
            const result = await calendarRequest.current.run(signal => fetchJSON(`https://api.aladhan.com/v1/hToGCalendar/${month}/${year}`, { signal }));
            if (!result) return;
            current = true;
            const data = result.value;
            if (data.code !== 200) throw new Error('Calendar request failed');
            setCalendarData(orderedHijriMonth(data.data, month, year));
        } catch (err) {
            current = true;
            console.error("Failed to fetch month data", err);
            setError("Failed to load calendar data.");
        } finally {
            if (current) setLoading(false);
        }
    };

    const handleNavigate = (direction) => {
        const next = shiftHijriMonth(currentView, direction);
        setCurrentView(next);
        fetchMonthData(next.month, next.year);
    };

    const getEvent = (day, month) => {
        if (!day || !month) return null;
        const key = `${parseInt(day)}-${parseInt(month)}`;
        return ISLAMIC_EVENTS[key];
    };

    const togglePriority = () => {
        const newValue = !isHijriPriority;
        setIsHijriPriority(newValue);
        appStorage.setItem('calendar_priority', newValue ? 'hijri' : 'gregorian');
    };

    const toggleNotifications = async () => {
        const newState = !notificationsEnabled;
        if (Capacitor.isNativePlatform()) {
            try {
                if (newState && (await LocalNotifications.requestPermissions()).display !== 'granted') { showToast(t('enable_notifications')); return; }
                setNotificationsEnabled(newState);
                appStorage.setItem('event_notifications', String(newState));
                window.dispatchEvent(new Event('event-reminders-change'));
            } catch { showToast(t('notifications_unsupported')); }
            return;
        }
        
        if (newState) {
            if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                    setNotificationsEnabled(true);
                    appStorage.setItem('event_notifications', 'true');
                    showToast(t('reminders_enabled'));
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            setNotificationsEnabled(true);
                            appStorage.setItem('event_notifications', 'true');
                            showToast(t('reminders_enabled'));
                        } else {
                            showToast(t('enable_notifications'));
                        }
                    });
                } else {
                    showToast(t('enable_notifications'));
                }
            } else {
                showToast(t('notifications_unsupported'));
            }
        } else {
            setNotificationsEnabled(false);
            appStorage.setItem('event_notifications', 'false');
            showToast(t('notifications_paused'));
        }
    };

    const today = new Date();
    const formattedGregorian = today.toLocaleDateString(lang === 'ml' ? 'ml-IN' : 'en-GB', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });

    const currentMonthKey = currentView.month > 0 ? MONTH_KEYS[currentView.month - 1] : null;

    const monthFormat = new Intl.DateTimeFormat(lang === 'ml' ? 'ml-IN' : 'en-GB', {
        month: 'short', year: 'numeric', timeZone: 'UTC', calendar: 'gregory',
    });
    const range = !loading && calendarData.length ? [...new Set([
        monthFormat.format(gregorianDay(calendarData[0].gregorian.date)),
        monthFormat.format(gregorianDay(calendarData.at(-1).gregorian.date)),
    ])].join(' – ') : '';

    const renderGridCells = () => {
        if (!calendarData.length || !calendarData[0].gregorian) return null;
        
        const firstDayOfWeek = gregorianDay(calendarData[0].gregorian.date).getUTCDay();

        const cells = [];
        
        for (let i = 0; i < firstDayOfWeek; i++) {
            cells.push(<div key={`empty-${i}`} className="grid-cell empty"></div>);
        }
        
        calendarData.forEach((day) => {
            const rawEvent = getEvent(day.hijri.day, day.hijri.month.number);
            const eventList = Array.isArray(rawEvent) ? rawEvent : (rawEvent ? [rawEvent] : []);
            const maxVisible = 3;
            const visibleEvents = eventList.slice(0, maxVisible);
            const extraCount = eventList.length - maxVisible;

            const isToday = todayHijri && 
                            Number(day.hijri.day) === Number(todayHijri.day) && 
                            Number(day.hijri.month.number) === Number(todayHijri.month.number) && 
                            Number(day.hijri.year) === Number(todayHijri.year);
            
            const primaryDay = isHijriPriority ? day.hijri.day : day.gregorian.day;
            const secondaryDay = isHijriPriority ? day.gregorian.day : day.hijri.day;
            
            const hasEventClass = eventList.length > 0 ? `has-event ${eventList[0].type}` : '';

            cells.push(
                <button type="button"
                    key={day.hijri.date} 
                    className={`grid-cell ${isToday ? 'today' : ''} ${selectedDay?.hijri?.date === day.hijri.date ? 'selected' : ''} ${hasEventClass}`}
                    aria-label={`Hijri ${day.hijri.day} ${t(currentMonthKey)}, Gregorian ${day.gregorian.date}`}
                    aria-current={isToday ? 'date' : undefined}
                    aria-pressed={selectedDay?.hijri?.date === day.hijri.date}
                    onClick={() => setSelectedDay(day)}
                >
                    <span className="cell-content-wrapper">
                        <span className="cell-primary-day">{primaryDay}</span>
                        <span className="cell-secondary-day">{secondaryDay}</span>
                    </span>
                    {eventList.length > 0 && (
                        <span className="event-markers-container" aria-hidden="true">
                            {visibleEvents.map((ev, idx) => (
                                <span key={idx} className={`event-marker ${ev.type}`}></span>
                            ))}
                            {extraCount > 0 && (
                                <span className="event-marker-extra">+{extraCount}</span>
                            )}
                        </span>
                    )}
                </button>
            );
        });
        
        return cells;
    };

    return (
        <div className={`calendar-page ${isDark ? 'dark' : 'light'}`}>
            <div className="atmosphere-overlay"></div>
            {toastMessage && (
                <div className="calendar-toast-glass toast-fade-in">
                    {toastMessage}
                </div>
            )}
            <div className="calendar-container">
                <header className="calendar-header-mobile">
                    <button className="calendar-action-btn" onClick={() => navigate(-1)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <h1>{t('calendar')}</h1>
                    <div className="calendar-menu-wrapper" ref={menuRef}>
                        <button className="calendar-action-btn menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                            </svg>
                        </button>
                        
                        {/* Three-Dot Dropdown Settings */}
                        {isMenuOpen && (
                            <div className="calendar-dropdown-menu fade-in-down">
                                <div className="dropdown-row">
                                    <div className="dropdown-text">
                                        <span>{t('islamic_priority') !== 'islamic_priority' ? t('islamic_priority') : 'Hijri Priority'}</span>
                                        <p>{t('islamic_priority_desc') !== 'islamic_priority_desc' ? t('islamic_priority_desc') : 'Prioritize Hijri dates'}</p>
                                    </div>
                                    <label className="modern-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={isHijriPriority}
                                            onChange={togglePriority}
                                        />
                                        <span className="modern-slider"></span>
                                    </label>
                                </div>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-row">
                                    <div className="dropdown-text">
                                        <span>{t('event_notifications') !== 'event_notifications' ? t('event_notifications') : 'Event Alerts'}</span>
                                        <p>{t('get_notified_events_desc') !== 'get_notified_events_desc' ? t('get_notified_events_desc') : 'Reminders for dates'}</p>
                                    </div>
                                    <label className="modern-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={notificationsEnabled}
                                            onChange={toggleNotifications}
                                        />
                                        <span className="modern-slider"></span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <main className="calendar-content">
                    {error ? (
                        <div className="calendar-error-panel">
                            <p>{error}</p>
                            <button onClick={() => currentView.month ? fetchMonthData(currentView.month, currentView.year) : setInitAttempt(attempt => attempt + 1)}>{t('retry')}</button>
                        </div>
                    ) : (loading && !calendarData.length) ? (
                        <div className="calendar-loading-inline">
                            <div className="calendar-spinner"></div>
                            <p>{t('loading') || 'Loading Calendar...'}</p>
                        </div>
                    ) : (
                        <>
                            {/* Premium Today Card */}
                            {todayHijri && (
                                <div className="hijri-card today-highlight">
                                    <span className="gregorian-date-label">{formattedGregorian}</span>
                                    <div className="calendar-dual-main">
                                        <div className="priority-side">
                                            <span className="priority-day">{isHijriPriority ? todayHijri.day : today.getDate()}</span>
                                            <span className="priority-month">
                                                {isHijriPriority 
                                                    ? t(MONTH_KEYS[todayHijri.month.number - 1]) 
                                                    : today.toLocaleDateString(lang === 'ml' ? 'ml-IN' : 'en-GB', { month: 'long' })}
                                            </span>
                                        </div>
                                        <div className="divider"></div>
                                        <div className="secondary-side">
                                            <span className="secondary-date">
                                                {isHijriPriority 
                                                    ? today.toLocaleDateString(lang === 'ml' ? 'ml-IN' : 'en-GB', { day: 'numeric', month: 'short' })
                                                    : `${todayHijri.day} ${t(MONTH_KEYS[todayHijri.month.number - 1])}`}
                                            </span>
                                            <span className="secondary-year">{isHijriPriority ? today.getFullYear() : `${todayHijri.year} AH`}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Month Navigation */}
                            <div className="month-nav-container">
                                <button className="nav-btn-refined" aria-label="Previous Hijri month" onClick={() => handleNavigate(-1)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>
                                <div className="current-month-display">
                                    <h2>{currentMonthKey ? t(currentMonthKey) : '...'} {currentView.year || ''} AH</h2>
                                    <p className="gregorian-range-refined">
                                        {range}
                                    </p>
                                </div>
                                <button className="nav-btn-refined" aria-label="Next Hijri month" onClick={() => handleNavigate(1)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="calendar-grid-premium">
                                <p className="calendar-date-key">
                                    <strong>{isHijriPriority ? (lang === 'ml' ? 'ഹിജ്റി' : 'Hijri') : (lang === 'ml' ? 'ഗ്രിഗോറിയൻ' : 'Gregorian')}</strong>
                                    <span> / {isHijriPriority ? (lang === 'ml' ? 'ഗ്രിഗോറിയൻ' : 'Gregorian') : (lang === 'ml' ? 'ഹിജ്റി' : 'Hijri')}</span>
                                </p>
                                <div className="weekday-header-refined">
                                    {(lang === 'ml' ? ['ഞാ', 'തി', 'ചൊ', 'ബു', 'വ്യാ', 'വെ', 'ശ'] : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']).map((d, i) => <div key={i}>{d}</div>)}
                                </div>
                                <div className="full-calendar-grid">
                                    {loading ? (
                                        <div className="grid-loading"><div className="calendar-spinner small"></div></div>
                                    ) : (
                                        renderGridCells()
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Event Detail / Selected Day Info */}
                    {selectedDay && selectedDay.hijri && (
                        <div className="selected-day-panel-refined fade-in">
                            <div className="panel-header">
                                <div className="panel-title-group">
                                    <span className="badge-hijri">{selectedDay.hijri.day} {t(MONTH_KEYS[selectedDay.hijri.month.number - 1])}</span>
                                    <span className="badge-greg">{selectedDay.gregorian.day} {selectedDay.gregorian.month.en}</span>
                                </div>
                                <button className="close-panel-btn" onClick={() => setSelectedDay(null)}>×</button>
                            </div>
                            
                            {getEvent(selectedDay.hijri.day, selectedDay.hijri.month.number) ? (
                                <div className={`event-detail-card ${getEvent(selectedDay.hijri.day, selectedDay.hijri.month.number).type}`}>
                                    <div className="event-type-label">{t(getEvent(selectedDay.hijri.day, selectedDay.hijri.month.number).type)}</div>
                                    <h4>{t(getEvent(selectedDay.hijri.day, selectedDay.hijri.month.number).key)}</h4>
                                    <p className="event-desc">{t(`${getEvent(selectedDay.hijri.day, selectedDay.hijri.month.number).key}_desc`) || 'A significant day in the Islamic calendar.'}</p>
                                </div>
                            ) : (
                                <div className="no-event-info">
                                    <p>{selectedDay.gregorian.weekday.en}, {selectedDay.gregorian.date}</p>
                                    <span>No special events on this day.</span>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
