import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';
import './CalendarPage.css';

const MONTH_KEYS = [
    'muharram', 'safar', 'rabi_al_awwal', 'rabi_al_thani',
    'jumada_al_ula', 'jumada_al_akhira', 'rajab', 'shaban',
    'ramadan', 'shawwal', 'dhu_al_qidah', 'dhu_al_hijjah'
];

const ISLAMIC_EVENTS = {
    "1-1": { key: "hijri_new_year", type: "festival" },
    "10-1": { key: "ashura", type: "special_day" },
    "12-3": { key: "mawlid", type: "special_day" },
    "1-9": { key: "start_ramadan", type: "special_day" },
    "27-9": { key: "laylat_al_qadr", type: "special_day" },
    "1-10": { key: "eid_al_fitr", type: "festival" },
    "9-12": { key: "day_arafah", type: "special_day" },
    "10-12": { key: "eid_al_adha", type: "festival" }
};

const EVENT_MESSAGES = {
    "hijri_new_year": { title: "✨ Islamic New Year", body: "Welcome the new Hijri year with reflection and prayers." },
    "ashura": { title: "🌙 Day of Ashura", body: "A blessed day for fasting and remembrance." },
    "mawlid": { title: "✨ Mawlid al-Nabi", body: "Remembering the birth and life of the Prophet ﷺ." },
    "start_ramadan": { title: "🌙 Ramadan Mubarak", body: "The blessed month of fasting has arrived." },
    "laylat_al_qadr": { title: "✨ Laylat al-Qadr", body: "Seek the Night of Decree with abundant prayers." },
    "eid_al_fitr": { title: "🌙 Eid al-Fitr Mubarak!", body: "May Allah accept your fasting and worship." },
    "day_arafah": { title: "🕋 Day of Arafah Today", body: "A beautiful day for dua and reflection." },
    "eid_al_adha": { title: "🕋 Eid al-Adha Mubarak!", body: "May Allah accept your sacrifices and prayers." }
};

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
    const [isHijriPriority, setIsHijriPriority] = useState(localStorage.getItem('calendar_priority') === 'hijri');
    const [notificationsEnabled, setNotificationsEnabled] = useState(localStorage.getItem('event_notifications') === 'true');
    const [toastMessage, setToastMessage] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const menuRef = useRef(null);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const checkEventNotifications = (hijri) => {
        if (localStorage.getItem('event_notifications') !== 'true') return;
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const hDay = parseInt(hijri.day);
        const hMonth = parseInt(hijri.month.number);

        const checkDate = (d, m, isTomorrow) => {
            const eventKey = `${d}-${m}`;
            const eventData = ISLAMIC_EVENTS[eventKey];
            if (eventData && EVENT_MESSAGES[eventData.key]) {
                const uniqueId = `${eventData.key}-${hijri.year}-${isTomorrow ? 'tomorrow' : 'today'}`;
                const lastNotified = localStorage.getItem('last_notified_event_date');
                if (lastNotified !== uniqueId) {
                    const msg = EVENT_MESSAGES[eventData.key];
                    const title = isTomorrow ? `Tomorrow: ${msg.title}` : msg.title;
                    new Notification(title, { body: msg.body });
                    localStorage.setItem('last_notified_event_date', uniqueId);
                }
            }
        };

        checkDate(hDay, hMonth, false);
        
        let nextDay = hDay + 1;
        let nextMonth = hMonth;
        if (nextDay > 30) {
            nextDay = 1;
            nextMonth = hMonth === 12 ? 1 : hMonth + 1;
        }
        checkDate(nextDay, nextMonth, true);
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
            try {
                const today = new Date();
                const dd = String(today.getDate()).padStart(2, '0');
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const yyyy = today.getFullYear();
                
                const res = await fetch(`https://api.aladhan.com/v1/gToH?date=${dd}-${mm}-${yyyy}`);
                const data = await res.json();
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
    }, []);

    const fetchMonthData = async (month, year) => {
        if (!month || !year) return;
        setLoading(true);
        try {
            const res = await fetch(`https://api.aladhan.com/v1/hToGCalendar/${month}/${year}`);
            const data = await res.json();
            if (data.code === 200) {
                setCalendarData(data.data);
            } else {
                throw new Error("API Error");
            }
        } catch (err) {
            console.error("Failed to fetch month data", err);
            setError("Failed to load calendar data.");
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (direction) => {
        let newMonth = currentView.month + direction;
        let newYear = currentView.year;

        if (newMonth > 12) {
            newMonth = 1;
            newYear += 1;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear -= 1;
        }

        setCurrentView({ month: newMonth, year: newYear });
        fetchMonthData(newMonth, newYear);
    };

    const getEvent = (day, month) => {
        if (!day || !month) return null;
        const key = `${parseInt(day)}-${parseInt(month)}`;
        return ISLAMIC_EVENTS[key];
    };

    const togglePriority = () => {
        const newValue = !isHijriPriority;
        setIsHijriPriority(newValue);
        localStorage.setItem('calendar_priority', newValue ? 'hijri' : 'gregorian');
    };

    const toggleNotifications = () => {
        const newState = !notificationsEnabled;
        
        if (newState) {
            if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                    setNotificationsEnabled(true);
                    localStorage.setItem('event_notifications', 'true');
                    showToast(t('reminders_enabled'));
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            setNotificationsEnabled(true);
                            localStorage.setItem('event_notifications', 'true');
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
            localStorage.setItem('event_notifications', 'false');
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

    const renderGridCells = () => {
        if (!calendarData.length || !calendarData[0].gregorian) return null;
        
        const firstDay = calendarData[0].gregorian;
        const [d, m, y] = firstDay.date.split('-');
        const dateObj = new Date(y, m - 1, d);
        const firstDayOfWeek = dateObj.getDay(); 
        
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
                            day.hijri.day === todayHijri.day && 
                            day.hijri.month.number === todayHijri.month.number && 
                            day.hijri.year === todayHijri.year;
            
            const primaryDay = isHijriPriority ? day.hijri.day : day.gregorian.day;
            const secondaryDay = isHijriPriority ? day.gregorian.day : day.hijri.day;
            
            const hasEventClass = eventList.length > 0 ? `has-event ${eventList[0].type}` : '';

            cells.push(
                <div 
                    key={day.hijri.date} 
                    className={`grid-cell ${isToday ? 'today' : ''} ${selectedDay?.hijri?.date === day.hijri.date ? 'selected' : ''} ${hasEventClass}`}
                    onClick={() => setSelectedDay(day)}
                >
                    <div className="cell-content-wrapper">
                        <span className="cell-primary-day">{primaryDay}</span>
                        <span className="cell-secondary-day">{secondaryDay}</span>
                    </div>
                    {eventList.length > 0 && (
                        <div className="event-markers-container">
                            {visibleEvents.map((ev, idx) => (
                                <div key={idx} className={`event-marker ${ev.type}`}></div>
                            ))}
                            {extraCount > 0 && (
                                <div className="event-marker-extra">+{extraCount}</div>
                            )}
                        </div>
                    )}
                </div>
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
                            <button onClick={() => window.location.reload()}>{t('retry') || 'Retry'}</button>
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
                                                    : `${todayHijri.day} ${t(MONTH_KEYS[todayHijri.month.number - 1]).substring(0, 3)}`}
                                            </span>
                                            <span className="secondary-year">{isHijriPriority ? `${todayHijri.year} AH` : today.getFullYear()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Month Navigation */}
                            <div className="month-nav-container">
                                <button className="nav-btn-refined" onClick={() => handleNavigate(-1)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>
                                <div className="current-month-display">
                                    <h2>{currentMonthKey ? t(currentMonthKey) : '...'} {currentView.year || ''}</h2>
                                    <p className="gregorian-range-refined">
                                        {calendarData.length > 0 && calendarData[0].gregorian ? `${calendarData[0].gregorian.month.en} ${calendarData[0].gregorian.year}` : '...'}
                                    </p>
                                </div>
                                <button className="nav-btn-refined" onClick={() => handleNavigate(1)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="calendar-grid-premium">
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
