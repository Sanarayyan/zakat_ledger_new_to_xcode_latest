import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';
import './TasbihHistory.css';

export default function TasbihHistory() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [sessions, setSessions] = useState([]);
    const [analytics, setAnalytics] = useState({ currentStreak: 0, lifetimeTotal: 0 });
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sessionToDelete, setSessionToDelete] = useState(null);

    useEffect(() => {
        const storedSessions = JSON.parse(localStorage.getItem('tasbih_sessions') || '[]');
        storedSessions.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
        setSessions(storedSessions);

        const storedAnalytics = JSON.parse(localStorage.getItem('tasbih_analytics') || '{}');
        setAnalytics({
            currentStreak: storedAnalytics.currentStreak || 0,
            lifetimeTotal: storedAnalytics.lifetimeTotal || 0,
            dailyTotals: storedAnalytics.dailyTotals || {}
        });
    }, []);

    const handleResume = (session) => {
        navigate('/tasbih', { state: { resumeSessionId: session.id } });
    };

    const handleStartNew = () => {
        navigate('/tasbih', { state: { startNew: true } });
    };

    const handleDeleteClick = (id, e) => {
        e.stopPropagation();
        setSessionToDelete(id);
    };

    const confirmDelete = () => {
        if (sessionToDelete) {
            const updated = sessions.filter(s => s.id !== sessionToDelete);
            setSessions(updated);
            localStorage.setItem('tasbih_sessions', JSON.stringify(updated));
            setSessionToDelete(null);
        }
    };

    const filteredSessions = useMemo(() => {
        let result = sessions;
        if (searchQuery) {
            result = result.filter(s => s.dhikrName.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (filter === 'Today') {
            const today = new Date().toDateString();
            result = result.filter(s => new Date(s.lastActive).toDateString() === today);
        }
        return result;
    }, [sessions, filter, searchQuery]);

    const formatTimeAgo = (dateStr) => {
        const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (diff < 60) return `${diff} ${t('seconds_ago')}`;
        if (diff < 3600) return `${Math.floor(diff / 60)} ${t('mins_ago')}`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ${t('hours_ago')}`;
        return new Date(dateStr).toLocaleDateString();
    };

    const filters = [
        { id: 'All', label: t('all') },
        { id: 'Today', label: t('today') }
    ];

    return (
        <div className="tasbih-history-wrapper">
            <header className="history-header">
                <button className="history-btn-icon" onClick={() => navigate(-1)}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="history-title">{t('dhikr_history')}</div>
                <div style={{ width: 42 }}></div>
            </header>

            <main className="history-main">
                <div className="analytics-overview">
                    <div className="analytic-card">
                        <div className="analytic-val">{analytics.currentStreak} 🔥</div>
                        <div className="analytic-lbl">{t('day_streak')}</div>
                    </div>
                    <div className="analytic-card">
                        <div className="analytic-val">{analytics.lifetimeTotal}</div>
                        <div className="analytic-lbl">{t('lifetime_dhikr')}</div>
                    </div>
                    <div className="analytic-card">
                        <div className="analytic-val">{sessions.length}</div>
                        <div className="analytic-lbl">{t('sessions')}</div>
                    </div>
                </div>

                <div className="history-controls">
                    <input 
                        type="text" 
                        className="history-search" 
                        placeholder={t('search_dhikr_history_placeholder')} 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <div className="history-filters">
                        {filters.map(f => (
                            <button key={f.id} className={`filter-btn ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="sessions-list">
                    {filteredSessions.length === 0 ? (
                        <div className="no-sessions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px' }}>
                            <div style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>No Dhikr history yet</div>
                            <button className="btn-resume-primary" onClick={handleStartNew} style={{ padding: '10px 24px', borderRadius: '24px', fontSize: '1rem' }}>
                                Start New Dhikr
                            </button>
                        </div>
                    ) : (
                        filteredSessions.map(session => (
                            <div key={session.id} className="session-card" onClick={() => handleResume(session)}>
                                <div className="session-header" style={{ marginBottom: '12px' }}>
                                    <div className="session-dhikr" style={{ fontWeight: '600', fontSize: '1.1rem', color: '#fff' }}>{session.dhikrName}</div>
                                </div>
                                <div className="session-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Count:</span> {session.count}</div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Rounds:</span> {Math.floor(session.count / 33)}</div>
                                    {session.goal && session.goal !== 'unlimited' && (
                                        <div><span style={{ color: 'var(--text-muted)' }}>Goal:</span> {session.goal}</div>
                                    )}
                                    <div style={{ color: (session.goal !== 'unlimited' && session.count >= session.goal) ? '#34d399' : '#fbbf24', fontWeight: '500' }}>
                                        {session.goal !== 'unlimited' && session.count >= session.goal ? 'Completed' : 'In Progress'}
                                    </div>
                                    <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Last Active:</span> {new Date(session.lastActive).toLocaleDateString()} {new Date(session.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                                <div className="session-footer" style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button className="btn-resume" onClick={(e) => { e.stopPropagation(); handleResume(session); }}>{t('resume')}</button>
                                    <button className="btn-del" onClick={(e) => handleDeleteClick(session.id, e)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            <button className="fab-start-new" onClick={handleStartNew}>
                + {t('start_new_dhikr')}
            </button>

            {sessionToDelete && (
                <div className="premium-modal-overlay confirm-overlay" onClick={() => setSessionToDelete(null)}>
                    <div className="premium-confirm-card" onClick={e => e.stopPropagation()}>
                        <div className="confirm-icon">🗑️</div>
                        <h3>{t('delete_session_title')}</h3>
                        <p>{t('delete_session_message')}</p>
                        <p className="confirm-sub">{t('cannot_undo')}</p>
                        <div className="confirm-actions">
                            <button className="btn-confirm-cancel" onClick={() => setSessionToDelete(null)}>{t('cancel')}</button>
                            <button className="btn-confirm-reset" onClick={confirmDelete}>{t('delete')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
