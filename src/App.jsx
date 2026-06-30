import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './App.css';
import Dashboard from './features/dashboard/Dashboard';
import PrayerTimes from './features/prayer/PrayerTimes';
import CalendarPage from './features/calendar/CalendarPage';
import QiblaFinder from './features/qibla/QiblaFinder';
import TasbihCounter from './features/tasbih/TasbihCounter';
import TasbihHistory from './features/tasbih/TasbihHistory';
import DuasPage from './features/duas/DuasPage';
import AsmaUlHusna from './features/asmaulhusna/AsmaUlHusna';

import { useLanguage } from './LanguageContext';
import AutoScrollControl from './features/quran/AutoScrollControl';
import ReadingSettingsModal from './features/quran/ReadingSettingsModal';
import MorePage from './features/more/MorePage';
import WomensGuidance from './features/more/WomensGuidance';
import GenderPrompt from './components/GenderPrompt';
import HajjGuide from './features/hajj/HajjGuide';
import UmrahGuide from './features/umrah/UmrahGuide';
import RatheebHaddad from './features/ratheeb/RatheebHaddad';
import AppOnboarding from './components/onboarding/AppOnboarding';
import UpdateManager from './components/update/UpdateManager';
import RatingManager from './components/rating/RatingManager';
import SettingsPage from './features/more/SettingsPage';

// --- AUDIO SYSTEM HELPERS ---
const getAudioUrl = (reciter, ayahNumber) => {
    // Abdul Basit requires 64 bitrate, others use 128
    const bitrate = reciter === 'ar.abdulsamad' ? '64' : '128';
    const url = `https://cdn.islamic.network/quran/audio/${bitrate}/${reciter}/${ayahNumber}.mp3`;
    console.log(`[DEBUG] Generated Audio URL for ${reciter} Ayah ${ayahNumber}: ${url}`);
    return url;
};


// Initial Template Columns
const DEFAULT_COLUMNS = [
    { id: 'serial', label: 'S.No', visible: true, type: 'number' },
    { id: 'recipient', label: 'Recipient Name', visible: true, type: 'text' },
    { id: 'date', label: 'Date', visible: true, type: 'date' },
    { id: 'amount', label: 'Amount', visible: true, type: 'number' },
    { id: 'location', label: 'Location', visible: true, type: 'text' },
    { id: 'relation', label: 'Relation', visible: true, type: 'text' },
    { id: 'status', label: 'Status', visible: true, type: 'select', options: ['To Pay', 'Paid', 'Yet to Decide', 'Pending'] },
    { id: 'notes', label: 'Notes', visible: true, type: 'text' },
];

const LOGOUT_ICON = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const BACK_ICON = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const PLAY_ICON = <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;
const PAUSE_ICON = <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const STOP_ICON = <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>;

const JUZ_DATA_LIST = [
    { num: 1, range: "Al-Fatihah → Al-Baqarah 141", surahs: [1, 2], totalAyahs: 148 },
    { num: 2, range: "Al-Baqarah 142 → Al-Baqarah 252", surahs: [2], totalAyahs: 111 },
    { num: 3, range: "Al-Baqarah 253 → Al-Imran 92", surahs: [2, 3], totalAyahs: 126 },
    { num: 4, range: "Al-Imran 93 → An-Nisa 23", surahs: [3, 4], totalAyahs: 131 },
    { num: 5, range: "An-Nisa 24 → An-Nisa 147", surahs: [4], totalAyahs: 124 },
    { num: 6, range: "An-Nisa 148 → Al-Ma'idah 81", surahs: [4, 5], totalAyahs: 110 },
    { num: 7, range: "Al-Ma'idah 82 → Al-An'am 110", surahs: [5, 6], totalAyahs: 149 },
    { num: 8, range: "Al-An'am 111 → Al-A'raf 87", surahs: [6, 7], totalAyahs: 142 },
    { num: 9, range: "Al-A'raf 88 → Al-Anfal 40", surahs: [7, 8], totalAyahs: 159 },
    { num: 10, range: "Al-Anfal 41 → At-Tawbah 92", surahs: [8, 9], totalAyahs: 127 },
    { num: 11, range: "At-Tawbah 93 → Hud 5", surahs: [9, 10], totalAyahs: 150 },
    { num: 12, range: "Hud 6 → Yusuf 52", surahs: [11, 12], totalAyahs: 170 },
    { num: 13, range: "Yusuf 53 → Ibrahim 52", surahs: [12, 13, 14], totalAyahs: 154 },
    { num: 14, range: "Al-Hijr 1 → An-Nahl 128", surahs: [15, 16], totalAyahs: 227 },
    { num: 15, range: "Al-Isra 1 → Al-Kahf 74", surahs: [17, 18], totalAyahs: 185 },
    { num: 16, range: "Al-Kahf 75 → Ta-Ha 135", surahs: [18, 19, 20], totalAyahs: 269 },
    { num: 17, range: "Al-Anbiya 1 → Al-Hajj 78", surahs: [21, 22], totalAyahs: 190 },
    { num: 18, range: "Al-Mu'minun 1 → Al-Furqan 20", surahs: [23, 24, 25], totalAyahs: 202 },
    { num: 19, range: "Al-Furqan 21 → An-Naml 55", surahs: [25, 26, 27], totalAyahs: 339 },
    { num: 20, range: "An-Naml 56 → Al-Ankabut 45", surahs: [27, 28, 29], totalAyahs: 171 },
    { num: 21, range: "Al-Ankabut 46 → Al-Ahzab 30", surahs: [29, 30, 31, 32, 33], totalAyahs: 178 },
    { num: 22, range: "Al-Ahzab 31 → Ya-Sin 27", surahs: [33, 34, 35, 36], totalAyahs: 169 },
    { num: 23, range: "Ya-Sin 28 → Az-Zumar 31", surahs: [36, 37, 38, 39], totalAyahs: 357 },
    { num: 24, range: "Az-Zumar 32 → Fussilat 46", surahs: [39, 40, 41], totalAyahs: 175 },
    { num: 25, range: "Fussilat 47 → Al-Jathiyah 37", surahs: [41, 42, 43, 44, 45], totalAyahs: 246 },
    { num: 26, range: "Al-Ahqaf 1 → Az-Zariyat 30", surahs: [46, 47, 48, 49, 50, 51], totalAyahs: 195 },
    { num: 27, range: "Az-Zariyat 31 → Al-Hadid 29", surahs: [51, 52, 53, 54, 55, 56, 57], totalAyahs: 399 },
    { num: 28, range: "Al-Mujadilah 1 → At-Tahrim 12", surahs: [58, 59, 60, 61, 62, 63, 64, 65, 66], totalAyahs: 137 },
    { num: 29, range: "Al-Mulk 1 → Al-Mursalat 50", surahs: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77], totalAyahs: 431 },
    { num: 30, range: "An-Naba 1 → An-Nas 6", surahs: Array.from({ length: 37 }, (_, i) => i + 78), totalAyahs: 564 }
];

function OnboardingView({ onSkip, onContinue, t }) {
    return (
        <div className="onboarding-container fade-in">
            <div className="onboarding-card">
                <div className="onboarding-header">
                    <h1>{t('onboarding_title')}</h1>
                    <p>{t('onboarding_desc')}</p>
                </div>
                
                <div className="onboarding-grid">
                    <div className="onboarding-section">
                        <div className="section-icon">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 8px 12px rgba(212, 175, 55, 0.4))', marginBottom: '8px' }}>
                                <defs>
                                    <linearGradient id="gemGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#FEF08A" />
                                        <stop offset="50%" stopColor="#D4AF37" />
                                        <stop offset="100%" stopColor="#997A15" />
                                    </linearGradient>
                                    <linearGradient id="gemGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.2" />
                                    </linearGradient>
                                </defs>
                                <path d="M12 2L2 9L12 22L22 9L12 2Z" fill="url(#gemGradMain)" stroke="#FFFFFF" strokeWidth="0.5" strokeLinejoin="round" />
                                <path d="M12 2L2 9L12 10V2Z" fill="url(#gemGradLight)" />
                                <path d="M12 2L22 9L12 10V2Z" fill="#D4AF37" fillOpacity="0.4" />
                                <path d="M2 9L12 22L12 10L2 9Z" fill="url(#gemGradLight)" fillOpacity="0.6" />
                                <path d="M22 9L12 22L12 10L22 9Z" fill="#8A6D1C" fillOpacity="0.6" />
                                <path d="M7 2L17 2L12 9L7 2Z" fill="#FFFFFF" fillOpacity="0.5" />
                            </svg>
                        </div>
                        <h3>{t('advantage_title')}</h3>
                        <p>{t('advantage_desc')}</p>
                    </div>
                    <div className="onboarding-section">
                        <div className="section-icon">⚖️</div>
                        <h3>{t('what_is_zakat')}</h3>
                        <p>{t('zakat_desc')}</p>
                    </div>
                    <div className="onboarding-section">
                        <div className="section-icon">💰</div>
                        <h3>{t('money_assets')}</h3>
                        <p>{t('money_desc')}</p>
                    </div>
                    <div className="onboarding-section">
                        <div className="section-icon">✨</div>
                        <h3>{t('wealth_specifics')}</h3>
                        <p>
                            <strong>{t('gold_rule')}</strong><br/>
                            <strong>{t('stocks_rule')}</strong><br/>
                            <strong>{t('cattle_rule')}</strong>
                        </p>
                    </div>
                </div>

                <div className="onboarding-footer">
                    <button className="btn-onboarding-secondary" onClick={onSkip}>{t('skip_to_home')}</button>
                    <button className="btn-onboarding-primary" onClick={onContinue}>{t('continue_reading')}</button>
                </div>
            </div>
        </div>
    );
}


function ConfirmModal({ isOpen, type, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay-blur" onClick={onCancel}>
            <div className="confirm-modal-card" onClick={e => e.stopPropagation()}>
                <div className="confirm-modal-icon">🗑️</div>
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="confirm-modal-actions">
                    <button className="btn-cancel" onClick={onCancel}>{type === 'info' ? 'Back' : 'Cancel'}</button>
                    <button className="btn-confirm-delete" onClick={onConfirm}>
                        {message.includes('threshold') || type === 'info' ? 'Close' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const computeCattleZakat = (type, countStr) => {
    const count = parseInt(countStr) || 0;
    if (type === 'camels') {
        if (count < 5) return '0';
        if (count >= 5 && count <= 9) return '1 Sheep';
        if (count >= 10 && count <= 14) return '2 Sheep';
        if (count >= 15 && count <= 19) return '3 Sheep';
        if (count >= 20 && count <= 24) return '4 Sheep';
        if (count >= 25 && count <= 35) return '1 Female Camel (1 year old)';
        if (count >= 36 && count <= 45) return '1 Female Camel (2 years old)';
        if (count >= 46 && count <= 60) return '1 Female Camel (3 years old)';
        if (count >= 61 && count <= 75) return '1 Female Camel (4 years old)';
        if (count >= 76 && count <= 90) return '2 Female Camels';
        if (count >= 91 && count <= 120) return '2 Female Camels';
        return 'Increase according to Islamic rules';
    } else if (type === 'cows') {
        if (count < 30) return '0';
        if (count >= 30 && count <= 39) return '1 One-Year-Old Calf';
        if (count >= 40 && count <= 59) return '1 Two-Year-Old Cow';
        if (count >= 60 && count <= 69) return '2 One-Year Calves';
        if (count >= 70 && count <= 79) return '1 One-Year Calf + 1 Two-Year Cow';
        if (count >= 80 && count <= 89) return '2 Two-Year Cows';
        if (count >= 90 && count <= 99) return '3 One-Year Calves';
        return 'Increase according to Islamic rules';
    } else if (type === 'sheep') {
        if (count < 40) return '0';
        if (count >= 40 && count <= 120) return '1 Sheep';
        if (count >= 121 && count <= 200) return '2 Sheep';
        if (count >= 201 && count <= 300) return '3 Sheep';
        if (count > 300) return `${Math.floor(count / 100)} Sheep`;
    } else if (type === 'goats') {
        if (count < 40) return '0';
        if (count >= 40 && count <= 120) return '1 Goat';
        if (count >= 121 && count <= 200) return '2 Goats';
        if (count >= 201 && count <= 300) return '3 Goats';
        if (count > 300) return `${Math.floor(count / 100)} Goats`;
    }
    return '0';
};

const getCattleNisab = (type) => {
    if (type === 'camels') return 5;
    if (type === 'cows') return 30;
    if (type === 'sheep' || type === 'goats') return 40;
    return 30;
};

function UserDashboard() {
    const navigate = useNavigate();
    const dataLoaded = useRef(false);  // guard: don't save before first load
    const [user, setUser] = useState(null);
    const [records, setRecords] = useState([]);
    const [columns, setColumns] = useState(DEFAULT_COLUMNS);
    const [viewedYear, setViewedYear] = useState(new Date().getFullYear());
    const [isEditing, setIsEditing] = useState(null);
    const [formData, setFormData] = useState({});
    const [showSettings, setShowSettings] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCalcInfo, setShowCalcInfo] = useState(false);
    const [currentView, setCurrentView] = useState('home'); // 'home', 'dashboard', 'calculator', 'create-group', 'add-record', 'onboarding', 'history'
    const [calcHistory, setCalcHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [groups, setGroups] = useState([]);
    const [newGroupData, setNewGroupData] = useState({ name: '', relation: '' });
    const [calcData, setCalcData] = useState({
        yearType: '',
        goldEntries: [{ id: 'gold_initial', caliber: '', weight: '' }],
        goldRate: 0, // Will fetch live
        currency: 'INR',
        cash: 0,
        detailedMoney: {
            financial: { money: 0, bank: 0, others: 0 },
            creditor: { monetary: 0, others: 0 },
            debtor: { houseRent: 0, loan: 0, carInstalment: 0, others: 0 }
        },
        cattle: 0,
        cattleType: 'camels',
        cattleTradeProfit: 0,
        cattleMilkProfit: 0,
        cattleWorkerProfit: 0,
        stocks: 0,
        stocksShareType: '',
        stocksNumShares: '',
        stocksMarketPrice: '',
        stocksDividend: '',
        stocksNonHalalPct: '',
        hasHawl: true
    });
    const [authError, setAuthError] = useState('');
    const [isFetchingRate, setIsFetchingRate] = useState(false);
    const [rateError, setRateError] = useState('');
    const [imgError, setImgError] = useState(false);
    const [calcModalStep, setCalcModalStep] = useState(1);
    const [activeAccordion, setActiveAccordion] = useState(null);
    const { lang, setLang, t } = useLanguage();
    const [isLightMode, setIsLightMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'light-mode' : true;
    });

    useEffect(() => {
        const theme = isLightMode ? 'light-mode' : 'dark-mode';
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [isLightMode]);

    const [showCalcResultModal, setShowCalcResultModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [moneyCalcType, setMoneyCalcType] = useState('quick');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [expandedRecordId, setExpandedRecordId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });
    const [notifications, setNotifications] = useState([]);
    const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);

    // t is provided by useLanguage

    const switchLang = (newLang) => setLang(newLang);

    const showNotify = (text, type = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, text, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    useEffect(() => {
        if (isLightMode) {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }, [isLightMode]);

    useEffect(() => {
        const savedUser = localStorage.getItem('zakat_user');
        if (savedUser) setUser(JSON.parse(savedUser));
    }, []);

    useEffect(() => {
        if (!user) {
            setRecords([]);
            setColumns(DEFAULT_COLUMNS);
            setCalcData({
                yearType: '',
                goldEntries: [{ id: 'gold_initial', caliber: '', weight: '' }],
                goldRate: 0,
                currency: 'INR',
                cash: 0,
                cattle: 0,
                cattleType: 'camels',
                cattleTradeProfit: 0,
                cattleMilkProfit: 0,
                cattleWorkerProfit: 0,
                hasHawl: true
            });
            setGroups([]);
            setSelectedGroupId(null);
            return;
        }
        const email = user.email;
        const savedRecords = localStorage.getItem(`zakat_records_${email}`);
        const savedCols = localStorage.getItem(`zakat_columns_${email}`);
        const savedCalc = localStorage.getItem(`zakat_calc_${email}`);
        const savedGroups = localStorage.getItem(`zakat_groups_${email}`);

        if (savedRecords) setRecords(JSON.parse(savedRecords));
        else setRecords([]);

        if (savedCols) {
            let loadedCols = JSON.parse(savedCols);
            // Migration: Ensure 'status' column has correct type and options
            loadedCols = loadedCols.map(col => {
                if (col.id === 'status') {
                    return { ...col, type: 'select', options: ['To Pay', 'Paid', 'Yet to Decide', 'Pending'] };
                }
                return col;
            });
            // If status doesn't exist, add it before notes
            if (!loadedCols.find(c => c.id === 'status')) {
                const notesIdx = loadedCols.findIndex(c => c.id === 'notes');
                const newCol = { id: 'status', label: t('status_label'), visible: true, type: 'select', options: [t('status_to_pay'), t('status_paid'), t('status_yet_to_decide'), t('status_pending')] };
                if (notesIdx !== -1) loadedCols.splice(notesIdx, 0, newCol);
                else loadedCols.push(newCol);
            }
            setColumns(loadedCols);
        } else setColumns(DEFAULT_COLUMNS);

        if (savedCalc) {
            const parsed = JSON.parse(savedCalc);
            setCalcData({
                ...parsed,
                yearType: '',
                goldEntries: [{ id: 'gold_initial', caliber: '', weight: '' }],
                cash: 0,
                cattle: 0,
                cattleType: 'camels',
                cattleTradeProfit: 0,
                cattleMilkProfit: 0,
                cattleWorkerProfit: 0,
                hasHawl: false
            });
        } else setCalcData({
            yearType: '',
            goldEntries: [{ id: 'gold_initial', caliber: '', weight: '' }],
            goldRate: 0,
            currency: 'INR',
            cash: 0,
            cattle: 0,
            cattleType: 'camels',
            cattleTradeProfit: 0,
            cattleMilkProfit: 0,
            cattleWorkerProfit: 0,
            hasHawl: false
        });

        if (savedGroups) setGroups(JSON.parse(savedGroups));
        else setGroups([]);

        setImgError(false);
        setCalcModalStep(1);
        // Mark data as loaded so the save effect can now safely run
        dataLoaded.current = true;
    }, [user]);

    // Save data whenever it changes — but ONLY after initial load to avoid overwriting good data
    useEffect(() => {
        if (!user) return;
        if (!dataLoaded.current) return;  // still in initial load phase, skip
        const email = user.email;
        localStorage.setItem(`zakat_records_${email}`, JSON.stringify(records));
        localStorage.setItem(`zakat_columns_${email}`, JSON.stringify(columns));
        localStorage.setItem(`zakat_calc_${email}`, JSON.stringify(calcData));
        localStorage.setItem(`zakat_groups_${email}`, JSON.stringify(groups));
    }, [records, columns, calcData, groups, user]);

    const annualRecords = useMemo(() => {
        return [...records]
            .filter(r => new Date(r.date).getFullYear() === parseInt(viewedYear))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [records, viewedYear]);

    const totalAnnualAmount = useMemo(() => {
        return annualRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    }, [annualRecords]);


    const filteredRecords = useMemo(() => {
        return [...records]
            .filter(r => {
                const yearMatch = new Date(r.date).getFullYear() === parseInt(viewedYear);
                const groupMatch = selectedGroupId ? r.groupId === selectedGroupId : !r.groupId;
                return yearMatch && groupMatch;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [records, viewedYear, selectedGroupId]);

    const totalPaidAmount = useMemo(() => {
        const target = selectedGroupId ? filteredRecords : annualRecords;
        return target.filter(r => r.status === 'Paid').reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    }, [filteredRecords, annualRecords, selectedGroupId]);

    const totalPendingAmount = useMemo(() => {
        const target = selectedGroupId ? filteredRecords : annualRecords;
        return target.filter(r => r.status === 'To Pay' || r.status === 'Pending').reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    }, [filteredRecords, annualRecords, selectedGroupId]);

    const totalAmount = useMemo(() => {
        if (selectedGroupId) {
            return filteredRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        }
        return totalAnnualAmount;
    }, [filteredRecords, selectedGroupId, totalAnnualAmount]);

    const totalPeople = useMemo(() => {
        return new Set(filteredRecords.map(r => r.recipient)).size;
    }, [filteredRecords]);

    const currentGroupName = useMemo(() => {
        if (!selectedGroupId) return null;
        const group = groups.find(g => g.id === selectedGroupId);
        return group ? group.name : null;
    }, [selectedGroupId, groups]);

    // 🔐 Phase 3 — Google Login with Backend Verification
    // Instead of just decoding the token locally (which can be faked),
    // we send the raw token to Django. Django then asks Google to verify it.
    // If Google says it's real, Django returns the verified email/name.
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            console.log('🔐 Verifying Google login with backend...');
            const response = await fetch('http://localhost:8000/api/auth/google/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Backend verification failed');
            }

            const verifiedData = await response.json();
            
            // Now we use the data VERIFIED by the server
            const userData = { 
                email: verifiedData.email, 
                name: verifiedData.name, 
                picture: verifiedData.picture 
            };
            
            setUser(userData);
            localStorage.setItem('zakat_user', JSON.stringify(userData));
            setAuthError('');
            
            console.log('✅ Google login verified by Django!', userData);
            
            // Always show the introduction page on every login
            setCurrentView('onboarding');
        } catch (err) {
            console.error('❌ Authentication failed:', err.message);
            setAuthError(`Authentication failed: ${err.message}`);
        }
    };

    const handleLogout = () => {
        dataLoaded.current = false;  // reset so next login re-guards the save effect
        setUser(null);
        localStorage.removeItem('zakat_user');
    };

    const openModal = (record = null, explicitGroupId = undefined) => {
        if (record) {
            setIsEditing(record.id);
            setFormData(record);
        } else {
            setIsEditing(null);
            // Use explicitGroupId if provided, else fall back to current selectedGroupId
            const gid = explicitGroupId !== undefined ? explicitGroupId : selectedGroupId;
            const initialData = {
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                groupId: gid
            };
            columns.forEach(col => { if (!initialData[col.id]) initialData[col.id] = ''; });
            setFormData(initialData);
        }
        setCurrentView('add-record');
    };

    const handleCreateGroup = (e) => {
        e.preventDefault();
        if (!newGroupData.name || !newGroupData.relation) return;
        const newGroupId = `group_${Date.now()}`;
        const newGroup = { ...newGroupData, id: newGroupId };
        setGroups([...groups, newGroup]);
        setNewGroupData({ name: '', relation: '' });
        setSelectedGroupId(newGroupId);
        setCurrentView('dashboard'); // Redirect to dashboard which now shows this group's details
    };

    const handleBack = () => {
        // 1. Calculator Category -> Calculator Main
        if (currentView === 'calculator' && selectedCategory) {
            setSelectedCategory(null);
            return;
        }

        // 2. Filtered Group -> Dashboard Overview
        if (currentView === 'dashboard' && selectedGroupId) {
            setSelectedGroupId(null);
            return;
        }

        // 3. General View -> Home
        const primaryViews = ['dashboard', 'calculator', 'zakat-info', 'history', 'add-record', 'create-group', 'all-records', 'pending-records', 'manage-groups'];
        if (primaryViews.includes(currentView)) {
            setCurrentView('home');
        } else {
            // Fallback for any other custom views or deeper navigation
            window.history.back();
            // If window.history.back() isn't what they want in a SPA without formal routing, 
            // the setCurrentView('home') is a safer primary fallback.
            if (currentView !== 'home') setCurrentView('home');
        }
    };

    const selectGroup = (groupId) => {
        setSelectedGroupId(groupId);
        setCurrentView('dashboard');
    };

    const handleSaveRecord = (e) => {
        e.preventDefault();
        if (isEditing) setRecords(records.map(r => r.id === isEditing ? formData : r));
        else setRecords([...records, formData]);
        setCurrentView('dashboard');
        setIsEditing(null);
    };

    const handleDeleteRecord = (id) => {
        setDeleteModal({
            isOpen: true,
            type: 'record',
            id,
            title: t('delete_record_title'),
            message: t('delete_record_message')
        });
    };

    const confirmDelete = () => {
        if (deleteModal.type === 'record') {
            setRecords(records.filter(r => r.id !== deleteModal.id));
            showNotify(t('record_deleted_success'));
        } else if (deleteModal.type === 'group') {
            setGroups(groups.filter(g => g.id !== deleteModal.id));
            setRecords(records.filter(r => r.groupId !== deleteModal.id));
            showNotify(t('group_records_deleted'));
        }
        setDeleteModal({ ...deleteModal, isOpen: false });
    };

    const handleDeleteGroup = (groupId) => {
        setDeleteModal({
            isOpen: true,
            type: 'group',
            id: groupId,
            title: t('delete_group_title'),
            message: t('delete_group_message')
        });
    };

    const handleTableEdit = (id, field, value) => {
        setRecords(records.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleAddNewRow = () => {
        const newRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            groupId: selectedGroupId
        };
        columns.forEach(col => { if (!newRecord[col.id]) newRecord[col.id] = ''; });
        setRecords([...records, newRecord]);
    };

    // Calculator Actions
    const addGoldRow = () => {
        setCalcData(prev => ({
            ...prev,
            goldEntries: [...prev.goldEntries, { id: `gold_${Date.now()}_${Math.random()}`, caliber: '', weight: '' }]
        }));
    };

    const removeGoldRow = (id) => {
        setCalcData(prev => {
            const newEntries = prev.goldEntries.filter(row => row.id !== id);
            if (newEntries.length === 0) {
                return {
                    ...prev,
                    goldEntries: [{ id: `gold_${Date.now()}`, caliber: '', weight: '' }]
                };
            }
            return {
                ...prev,
                goldEntries: newEntries
            };
        });
    };

    const updateGoldRow = (id, field, value) => {
        setCalcData(prev => ({
            ...prev,
            goldEntries: prev.goldEntries.map(row => row.id === id ? { ...row, [field]: value } : row)
        }));
    };

    const CALIBERS = {
        '24K': 1,
        '22K': 0.916,
        '18K': 0.75
    };

    const zakatResults = useMemo(() => {
        const zakatRate = calcData.yearType === 'islamic' ? 0.025 : (calcData.yearType === 'calendar' ? 0.02577 : 0);
        const goldRate24K = parseFloat(calcData.goldRate) || 0;

        let totalGoldValue = 0;
        let totalGoldWeight = 0;

        calcData.goldEntries.forEach(entry => {
            const weight = parseFloat(entry.weight) || 0;
            const caliberFactor = CALIBERS[entry.caliber] || 1;
            
            // Calculate the Adjusted Price explicitly per user request:
            // Adjusted Price = Live 24K Rate * Purity Multiplier
            const adjustedPrice = Math.round(goldRate24K * caliberFactor);
            const entryValue = weight * adjustedPrice; 
            totalGoldValue += entryValue;
            
            // For accurate Nisab check (87.48g), we use the pure gold equivalent.
            totalGoldWeight += (weight * caliberFactor); 
        });

        const goldZakatAmount = totalGoldValue * zakatRate;
        const goldZakatWeight = totalGoldWeight * zakatRate;

        let cashValue = 0;
        if (moneyCalcType === 'detailed') {
            const financial = Object.values(calcData.detailedMoney.financial).reduce((a, b) => (parseFloat(a) || 0) + (parseFloat(b) || 0), 0);
            const creditor = Object.values(calcData.detailedMoney.creditor).reduce((a, b) => (parseFloat(a) || 0) + (parseFloat(b) || 0), 0);
            const debtor = Object.values(calcData.detailedMoney.debtor).reduce((a, b) => (parseFloat(a) || 0) + (parseFloat(b) || 0), 0);
            cashValue = (financial + creditor) - debtor;
            if (cashValue < 0) cashValue = 0;
        } else if (selectedCategory === 'cattle') {
            const trade = parseFloat(calcData.cattleTradeProfit) || 0;
            const milk = parseFloat(calcData.cattleMilkProfit) || 0;
            const worker = parseFloat(calcData.cattleWorkerProfit) || 0;
            cashValue = trade + milk + worker;
        } else {
            cashValue = parseFloat(calcData.cash) || 0;
        }
        
        const cashZakatAmount = cashValue * zakatRate;

        const totalZakatPayable = goldZakatAmount + cashZakatAmount;
        
        const cattleZakatDue = computeCattleZakat(calcData.cattleType || 'camels', calcData.cattle);

        // --- Stocks Calculation ---
        const numShares = parseFloat(calcData.stocksNumShares) || 0;
        const marketPrice = parseFloat(calcData.stocksMarketPrice) || 0;
        const dividend = parseFloat(calcData.stocksDividend) || 0;
        const nonHalalPct = parseFloat(calcData.stocksNonHalalPct) || 0;
        const shareType = calcData.stocksShareType;

        let stocksTotalValue = 0;
        let stocksZakatAmount = 0;
        let stocksPurificationAmount = 0;
        let stocksZakatableBase = 0;

        if (shareType === 'trading') {
            stocksTotalValue = numShares * marketPrice;
            stocksZakatableBase = stocksTotalValue;
            stocksZakatAmount = stocksTotalValue * 0.025;
        } else if (shareType === 'investment') {
            stocksTotalValue = numShares * marketPrice;
            stocksZakatableBase = stocksTotalValue * 0.25;
            stocksZakatAmount = stocksZakatableBase * 0.025;
        } else if (shareType === 'purification') {
            stocksPurificationAmount = dividend * (nonHalalPct / 100);
        }

        // Thresholds
        const goldNisab = 87.48;
        const moneyNisabValue = goldRate24K * goldNisab;
        
        const isBelowNisab = 
            selectedCategory === 'gold' ? totalGoldWeight < goldNisab : 
            selectedCategory === 'cattle' ? (
                ((calcData.cattleType === 'camels') && ((parseInt(calcData.cattle) || 0) < 5)) || 
                ((calcData.cattleType === 'cows') && ((parseInt(calcData.cattle) || 0) < 30)) || 
                ((calcData.cattleType === 'sheep') && ((parseInt(calcData.cattle) || 0) < 40)) ||
                ((calcData.cattleType === 'goats') && ((parseInt(calcData.cattle) || 0) < 40))
            ) : 
            selectedCategory === 'money' ? cashValue < moneyNisabValue :
            selectedCategory === 'stocks' ? (
                shareType === 'purification' ? false : stocksTotalValue < moneyNisabValue
            ) :
            false;

        return {
            goldValue: totalGoldValue,
            goldWeight: totalGoldWeight,
            goldZakatAmount,
            goldZakatWeight,
            cashValue,
            cashZakatAmount,
            totalZakatPayable,
            cattleZakatDue,
            isBelowNisab,
            zakatRateDisplay: calcData.yearType ? (calcData.yearType === 'islamic' ? '2.5' : '2.577') : '---',
            stocksTotalValue,
            stocksZakatableBase,
            stocksZakatAmount,
            stocksPurificationAmount,
            shareType
        };
    }, [calcData, moneyCalcType, selectedCategory, CALIBERS]);

    // ─────────────────────────────────────────────────────────────────────────
    // DJANGO API INTEGRATION (Day 4)
    //
    // This sends the same data to the Django backend and logs the result.
    // Currently runs in PARALLEL with the React calculation so you can
    // compare both results in the browser Console (F12 → Console tab).
    //
    // HOW TO SEE IT WORKING:
    //   1. Open the calculator in the app
    //   2. Fill in some gold details and click Calculate
    //   3. Open browser DevTools (F12) → Console tab
    //   4. Look for "🕌 Django API result:" — that's your backend responding!
    //
    // FUTURE: Once you're confident, replace zakatResults useMemo with
    // the API response and remove the local calculation entirely.
    // ─────────────────────────────────────────────────────────────────────────
    const callDjangoAPI = async () => {
        // ── UPGRADED: Now uses /api/calculations/ (saves to DB!) ─────────────
        // Before: POST /api/calculate/   → calculates, returns result, forgets it
        // Now:    POST /api/calculations/ → calculates, saves to DB, returns result
        //
        // The difference:
        //   /api/calculate/    = stateless  (no memory, like a calculator app)
        //   /api/calculations/ = stateful   (saves history — this is the LEDGER!)
        // ─────────────────────────────────────────────────────────────────────
        const DJANGO_SAVE_URL = 'http://localhost:8000/api/calculations/';

        const payload = {
            userEmail:         user?.email || 'anonymous@zakatledger.app',
            category:          selectedCategory,
            yearType:          calcData.yearType,
            goldRate:          calcData.goldRate,
            goldEntries:       calcData.goldEntries,
            cash:              calcData.cash,
            cattleType:        calcData.cattleType,
            cattle:            calcData.cattle,
            stocksShareType:   calcData.stocksShareType,
            stocksNumShares:   calcData.stocksNumShares,
            stocksDividend:    calcData.stocksDividend,
            stocksNonHalalPct: calcData.stocksNonHalalPct,
        };

        try {
            console.log('📤 Saving calculation to Django DB...');

            const response = await fetch(DJANGO_SAVE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`Django returned HTTP ${response.status}`);

            const saved = await response.json();

            // ✅ Permanently stored in db.sqlite3!
            console.log(`💾 Saved to DB! Record ID #${saved.id}`);
            
            // If the user is on the history view, we should refresh the list immediately
            if (currentView === 'history') fetchHistory();

        } catch (err) {
            // React still works if Django is offline — graceful fallback
            console.warn('⚠️ Could not save to Django. React still works.', err.message);
        }
    };

    // ── HISTORY FETCHING (Day 4) ──────────────────────────────────────────
    const fetchHistory = async () => {
        if (!user?.email) return;
        
        setIsLoadingHistory(true);
        try {
            const response = await fetch(`http://localhost:8000/api/calculations/?email=${user.email}`);
            if (!response.ok) throw new Error('Could not fetch history');
            
            const data = await response.json();
            setCalcHistory(data.results || []);
        } catch (err) {
            console.error('❌ History fetch error:', err.message);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const deleteHistoryItem = async (id) => {
        if (!window.confirm('Permanently delete this calculation from your ledger?')) return;
        
        try {
            const response = await fetch(`http://localhost:8000/api/calculations/${id}/?email=${user?.email}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                // Success — update local state so the item disappears immediately
                setCalcHistory(prev => prev.filter(item => item.id !== id));
                console.log(`🗑️ Deleted record #${id}`);
            }
        } catch (err) {
            console.error('❌ Delete error:', err.message);
        }
    };

    const handleCalculateSubmit = () => {

        // 1. Empty Check
        let hasData = false;
        if (selectedCategory === 'gold') {
            hasData = calcData.goldEntries.some(e => parseFloat(e.weight) > 0);
        } else if (selectedCategory === 'money') {
            if (moneyCalcType === 'quick') hasData = parseFloat(calcData.cash) > 0;
            else {
                const financial = Object.values(calcData.detailedMoney.financial).some(v => parseFloat(v) > 0);
                const creditor = Object.values(calcData.detailedMoney.creditor).some(v => parseFloat(v) > 0);
                hasData = financial || creditor;
            }
        } else if (selectedCategory === 'cattle') {
            hasData = parseFloat(calcData.cattle) > 0 || parseFloat(calcData.cattleTradeProfit) > 0 || parseFloat(calcData.cattleMilkProfit) > 0 || parseFloat(calcData.cattleWorkerProfit) > 0;
        } else if (selectedCategory === 'stocks') {
            if (calcData.stocksShareType === 'purification') {
                hasData = parseFloat(calcData.stocksDividend) > 0;
            } else if (calcData.stocksShareType === 'trading' || calcData.stocksShareType === 'investment') {
                hasData = parseFloat(calcData.stocksNumShares) > 0 && parseFloat(calcData.stocksMarketPrice) > 0;
            } else {
                hasData = false;
            }
        }

        if (!hasData) {
            showNotify(t('enter_asset_details'), 'error');
            return;
        }

        const closeInfo = () => setDeleteModal({ ...deleteModal, isOpen: false });

        // 2. Specific Rule Pop-ups
        if (selectedCategory === 'gold') {
            const pureWeight = calcData.goldEntries.reduce((sum, e) => sum + (parseFloat(e.weight) || 0) * (CALIBERS[e.caliber] || 1), 0);
            if (pureWeight < 87.48) {
                setDeleteModal({
                    isOpen: true,
                    type: 'info',
                    title: t('below_gold_nisab_title'),
                    message: t('below_gold_nisab_message', { pureWeight: pureWeight.toFixed(2) }),
                    onConfirm: () => { 
                        setDeleteModal(prev => ({ ...prev, isOpen: false })); 
                        setShowCalcResultModal(true); 
                    }
                });
                return;
            }
        }

        if (selectedCategory === 'cattle') {
            if (parseFloat(calcData.cattle) < 30) {
                setDeleteModal({
                    isOpen: true,
                    type: 'info',
                    title: t('cattle_zakat_rule_title'),
                    message: t('cattle_zakat_rule_message', { cattleCount: calcData.cattle }),
                    onConfirm: () => { 
                        setDeleteModal(prev => ({ ...prev, isOpen: false })); 
                        setShowCalcResultModal(true); 
                    }
                });
                return;
            }
        }

        if (selectedCategory === 'stocks' && calcData.stocksShareType !== 'purification') {
            const goldNisabValue = parseFloat(calcData.goldRate) * 87.48;
            const totalVal = (parseFloat(calcData.stocksNumShares) || 0) * (parseFloat(calcData.stocksMarketPrice) || 0);
            if (totalVal < goldNisabValue) {
                setDeleteModal({
                    isOpen: true,
                    type: 'info',
                    title: t('stocks_zakat_below_nisab_title'),
                    message: t('stocks_zakat_below_nisab_message', { goldNisabValue: Math.round(goldNisabValue).toLocaleString(), totalVal: Math.round(totalVal).toLocaleString() }),
                    onConfirm: () => { 
                        setDeleteModal(prev => ({ ...prev, isOpen: false })); 
                        setShowCalcResultModal(true); 
                    }
                });
                return;
            }
        }

        // 🔥 Call Django backend in parallel — check Console (F12) to see results!
        // This doesn't affect the UI — it just logs for learning purposes.
        callDjangoAPI();

        setShowCalcResultModal(true);
    };


    const handleColChange = (id, field, value) => {
        setColumns(columns.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const fetchGoldRate = async () => {
        setIsFetchingRate(true);
        setRateError('');
        try {
            // Fetch gold price in USD/oz
            const goldRes = await fetch('https://api.gold-api.com/price/XAU');
            if (!goldRes.ok) throw new Error('Network response from gold API was not ok');
            const goldData = await goldRes.json();
            const goldPriceUSDPerOz = goldData.price;

            // Fetch USD/Currency exchange rate
            const exRes = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
            if (!exRes.ok) throw new Error('Network response from exchange API was not ok');
            const exData = await exRes.json();
            const usdToLocal = exData.rates[calcData.currency] || exData.rates.INR;

            // Market Adjustment for Kerala, India (March 2026)
            // Calibrated to match the exact Google snippet/retail board rate (₹16,222)
            // Factor includes: 6% Import Duty + 3% GST + Regional Retail Premium
            const premiumFactor = 1.0767; 
            const localPerGram = (goldPriceUSDPerOz / 31.1035) * usdToLocal * premiumFactor;

            setCalcData(prev => ({ ...prev, goldRate: Math.round(localPerGram) }));
        } catch (error) {
            console.error("Failed to fetch gold rate:", error);
            setRateError(t('price_unavailable_error'));
        } finally {
            setIsFetchingRate(false);
        }
    };

    const getRelativeDateLabel = (dateStr) => {
        if (!dateStr) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const recordDate = new Date(dateStr);
        recordDate.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - recordDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return t('today');
        if (diffDays === 1) return t('yesterday');
        if (diffDays > 1 && diffDays < 7) return recordDate.toLocaleDateString(undefined, { weekday: 'long' });
        return null;
    };

    useEffect(() => {
        if (!calcData.goldRate || calcData.goldRate === 0 || calcData.goldRate === '0') {
            fetchGoldRate();
        }

        const fetchInterval = setInterval(() => {
            fetchGoldRate();
        }, 1800000); // 30 minutes interval for better real-time accuracy during active hours

        return () => clearInterval(fetchInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addNewColumn = () => {
        const label = prompt(t('enter_column_name'));
        if (label) {
            const id = label.toLowerCase().replace(/\s+/g, '_');
            setColumns([...columns, { id, label, visible: true, type: 'text' }]);
        }
    };

    const openCalculator = () => {
        setCalcData(prev => ({
            ...prev,
            yearType: '',
            goldEntries: [{ id: `gold_initial_${Date.now()}`, caliber: '', weight: '' }],
            cash: 0,
            detailedMoney: {
                financial: { money: 0, bank: 0, others: 0 },
                creditor: { monetary: 0, others: 0 },
                debtor: { houseRent: 0, loan: 0, carInstalment: 0, others: 0 }
            },
            cattle: 0,
            stocks: 0,
            stocksShareType: '',
            stocksNumShares: '',
            stocksMarketPrice: '',
            stocksDividend: '',
            stocksNonHalalPct: '',
            hasHawl: true
        }));
        setSelectedCategory(null);
        setMoneyCalcType('quick');
        setShowCalcResultModal(false);
        setCurrentView('calculator');
    };

    useEffect(() => {
        const handleSetView = (e) => {
            if (e.detail) {
                setCurrentView(e.detail);
                if (e.detail === 'history') fetchHistory();
                if (e.detail === 'calculator') openCalculator();
            }
        };
        window.addEventListener('set-view', handleSetView);
        return () => window.removeEventListener('set-view', handleSetView);
    }, []);

    if (!user) {
        return (
            <div className="auth-container fade-in">
                <div className="auth-card">
                    <div className="logo-section">
                        <img src="/muslim-plus-logo.png" alt="Muslim Plus Logo" className="auth-logo-img" />
                        <p>{t('your_personal_charity_records')}</p>
                    </div>
                    <div className="auth-content">
                        {authError && <div className="auth-error-msg">{authError}</div>}
                        <div className="google-auth-wrapper">
                            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setAuthError(t('auth_failed'))} useOneTap theme="filled_blue" shape="pill" />
                        </div>
                    </div>
                    <p className="auth-footer">{t('secure_tracking_message')}</p>
                </div>
            </div>
        );
    }

    if (currentView === 'onboarding') {
        const handleCompleteOnboarding = (target) => {
            // Do NOT write to localStorage — intro should show on every login
            setCurrentView(target);
        };

        return <OnboardingView 
            onSkip={() => handleCompleteOnboarding('home')} 
            onContinue={() => handleCompleteOnboarding('zakat-info')} 
            t={t}
        />;
    }

    return (
        <div className="zakat-page-wrapper">
            <div className="app-layout-top">
            <nav className="top-navbar-refined">
                <button 
                    className="btn-settings" 
                    style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
                    onClick={() => {
                        if (currentView === 'home') {
                            navigate('/home');
                        } else {
                            setCurrentView('home');
                        }
                    }}
                >
                    {BACK_ICON}
                </button>

                <div className="header-title">
                    {currentView === 'calculator' ? t('calculator') : t('zakat')}
                </div>

                <div className="top-menu-container">
                    <button className="btn-three-dots" onClick={() => setIsTopMenuOpen(!isTopMenuOpen)}>⋮</button>
                    
                    {isTopMenuOpen && (
                        <>
                            <div className="menu-overlay" onClick={() => setIsTopMenuOpen(false)}></div>
                            <div className="top-dropdown-menu fade-in">
                                <div className="top-dropdown-item" onClick={() => { setCurrentView('history'); setIsTopMenuOpen(false); }}>
                                    <span>📊 {t('view_records') || 'View Records'}</span>
                                </div>
                                <div className="top-dropdown-item" onClick={() => { setShowAddModal(true); setIsTopMenuOpen(false); }}>
                                    <span>➕ {t('add_entry') || 'Add Entry'}</span>
                                </div>
                                <div className="top-dropdown-item" onClick={() => { setShowSettings(true); setIsTopMenuOpen(false); }}>
                                    <span>⚙️ {t('settings')}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </nav>


            <main className="main-content-top fade-in">
                {currentView === 'home' ? (
                    <div className="home-view fade-in">

                        <section className="home-portals">
                            <div className="portal-card" onClick={() => setCurrentView('dashboard')}>
                                <div className="portal-icon">📜</div>
                                <h3>{t('records')}</h3>
                                <p>{t('portal_records_desc')}</p>
                                <span className="portal-link">{t('view_ledger')} →</span>
                            </div>
                            <div className="portal-card highlight" onClick={openCalculator}>
                                <div className="portal-icon">⚖️</div>
                                <h3>{t('calculate')}</h3>
                                <p>{t('portal_calc_desc')}</p>
                                <span className="portal-link">{t('start_calc')} →</span>
                            </div>
                            <div className="portal-card" onClick={() => setCurrentView('zakat-info')}>
                                <div className="portal-icon">📖</div>
                                <h3>{t('knowledge_center')}</h3>
                                <p>{t('portal_knowledge_desc')}</p>
                                <span className="portal-link">{t('read_more')} →</span>
                            </div>
                        </section>

                        <section className="home-quote">
                            <div className="quote-container">
                                <p className="quote-arabic text-center">"إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ..."</p>
                                <p className="quote-english">{t('quran_verse')}</p>
                            </div>
                        </section>
                    </div>
                ) : currentView === 'dashboard' ? (
                    <>
                        <header className="page-header">
                            <div className="header-info">
                                {selectedGroupId ? (
                                    <div className="group-header">
                                        <button className="btn-back" onClick={handleBack} aria-label="Go Back">{BACK_ICON}</button>
                                        <div>
                                            <h1>{currentGroupName} {t('group_records')}</h1>
                                            <p>{t('managing_zakat_group')}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="group-header">
                                        <button className="btn-back" onClick={handleBack} aria-label="Go Back">{BACK_ICON}</button>
                                        <div>
                                            <div className="year-heading-big">{viewedYear}</div>
                                            <h1>{t('records')}</h1>
                                            <p>{t('managing_contributions')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="header-actions">
                                <button className="btn-primary" style={{textTransform: 'none'}} onClick={() => selectedGroupId ? openModal() : setCurrentView('create-group')}>
                                    + {t('add_record')}
                                </button>
                            </div>
                        </header>

                        <div className="summary-toggle-container mobile-only" onClick={() => setIsSummaryOpen(!isSummaryOpen)}>
                            <span className="summary-toggle-text">{t('know_much_spent')}</span>
                            <svg className={`summary-toggle-icon ${isSummaryOpen ? 'open' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        <div className={`summary-collapsible-wrapper ${isSummaryOpen ? 'open' : ''}`}>
                            <section className="stats-grid dashboard-stats">
                                <div className="stat-card clickable" onClick={() => setCurrentView('all-records')}>
                                    <div className="stat-icon-wrapper">💰</div>
                                    <div className="stat-label" style={{ fontWeight: 500 }}>{t('total_payout')}</div>
                                    <div className="stat-value" style={{ fontWeight: 700 }}>₹{totalAmount.toLocaleString('en-IN')}</div>
                                </div>

                                <div className="stat-card clickable" onClick={() => setCurrentView('pending-records')}>
                                    <div className="stat-icon-wrapper">⏳</div>
                                    <div className="stat-label" style={{ fontWeight: 500 }}>{t('total_pending_amount')}</div>
                                    <div className="stat-value" style={{ fontWeight: 700 }}>₹{totalPendingAmount.toLocaleString('en-IN')}</div>
                                </div>

                                {!selectedGroupId && (
                                    <div className="stat-card clickable" onClick={() => setCurrentView('manage-groups')}>
                                        <div className="stat-icon-wrapper">📁</div>
                                        <div className="stat-label" style={{ fontWeight: 500 }}>{t('total_group_count')}</div>
                                        <div className="stat-value" style={{ fontWeight: 700 }}>{groups.length}</div>
                                    </div>
                                )}

                                {!selectedGroupId && (
                                    <div className="stat-card clickable" onClick={() => setCurrentView('all-records')}>
                                        <div className="stat-icon-wrapper">📜</div>
                                        <div className="stat-label" style={{ fontWeight: 500 }}>{t('total_no_records')}</div>
                                        <div className="stat-value" style={{ fontWeight: 700 }}>{annualRecords.length}</div>
                                    </div>
                                )}

                                {selectedGroupId && (
                                    <div className="stat-card">
                                        <div className="stat-icon-wrapper">📜</div>
                                        <div className="stat-label">{t('record_entries')}</div>
                                        <div className="stat-value">{filteredRecords.length}</div>
                                        <div className="stat-trend">{t('history_count')}</div>
                                    </div>
                                )}
                            </section>
                        </div>



                        {!selectedGroupId && (
                            <section className="empty-state-two-col">

                                {/* ── Groups Panel ── */}
                                <div className="empty-panel">
                                    <div className="empty-panel-header">
                                        <span className="empty-panel-icon-wrap green">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                                        </span>
                                        <h3 className="empty-panel-title">{t('your_groups')}</h3>
                                    </div>

                                    {groups.length === 0 ? (
                                        <div className="empty-row-card">
                                            <div className="empty-row-left">
                                                <span className="empty-compass-icon green-stroke-fill">
                                                    <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <circle cx="50" cy="50" r="46" strokeWidth="4"/>
                                                        <circle cx="50" cy="50" r="32" strokeWidth="2"/>
                                                        <path d="M50 20 L54 46 L50 50 L46 46 Z"/>
                                                        <path d="M50 80 L54 54 L50 50 L46 54 Z" fill="#C0A050"/>
                                                        <circle cx="50" cy="50" r="5"/>
                                                        <path d="M20 50 L46 54 L50 50 L46 46 Z" fill="#C0A050"/>
                                                        <path d="M80 50 L54 54 L50 50 L54 46 Z"/>
                                                    </svg>
                                                </span>
                                                <span className="empty-row-text">{t('no_group_records_found')}</span>
                                            </div>
                                            <button className="empty-create-btn green" onClick={() => setCurrentView('create-group')}>
                                                + {t('create_group')}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="empty-row-card compact" style={{ marginBottom: '1rem' }}>
                                                <div className="empty-row-left">
                                                    <span className="empty-compass-icon green-stroke-fill">
                                                        <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <circle cx="50" cy="50" r="46" strokeWidth="4"/>
                                                            <circle cx="50" cy="50" r="32" strokeWidth="2"/>
                                                            <path d="M50 20 L54 46 L50 50 L46 46 Z"/>
                                                            <path d="M50 80 L54 54 L50 50 L46 54 Z" fill="#C0A050"/>
                                                            <circle cx="50" cy="50" r="5"/>
                                                            <path d="M20 50 L46 54 L50 50 L46 46 Z" fill="#C0A050"/>
                                                            <path d="M80 50 L54 54 L50 50 L54 46 Z"/>
                                                        </svg>
                                                    </span>
                                                    <span className="empty-row-text">{groups.length} {t('group_count_label')}</span>
                                                </div>
                                                <button className="empty-create-btn green" onClick={() => setCurrentView('create-group')}>
                                                    + {t('add_group')}
                                                </button>
                                            </div>
                                            <div className="groups-grid" style={{ marginTop: '0.5rem' }}>
                                                {groups.map(group => (
                                                    <div key={group.id} className="group-card" onClick={() => selectGroup(group.id)}>
                                                        <div className="group-icon-wrapper">📁</div>
                                                        <div className="group-info">
                                                            <h4>{group.name}</h4>
                                                            <p>{group.relation}</p>
                                                        </div>
                                                        <div className="group-card-actions">
                                                            <button className="btn-icon danger sm" onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}>🗑️</button>
                                                            <div className="group-arrow">→</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* ── Individual Records Panel — only shown when empty ── */}
                                {filteredRecords.length === 0 && (
                                    <div className="empty-panel">
                                        <div className="empty-panel-header">
                                            <span className="empty-panel-icon-wrap gold">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                            </span>
                                            <h3 className="empty-panel-title">{t('your_individual_records')}</h3>
                                        </div>
                                        <div className="empty-row-card">
                                            <div className="empty-row-left">
                                                <span className="empty-compass-icon gold-stroke-fill">
                                                    <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <circle cx="50" cy="50" r="46" strokeWidth="4"/>
                                                        <circle cx="50" cy="50" r="32" strokeWidth="2"/>
                                                        <path d="M50 20 L54 46 L50 50 L46 46 Z"/>
                                                        <path d="M50 80 L54 54 L50 50 L46 54 Z" fill="#C0A050"/>
                                                        <circle cx="50" cy="50" r="5"/>
                                                        <path d="M20 50 L46 54 L50 50 L46 46 Z" fill="#C0A050"/>
                                                        <path d="M80 50 L54 54 L50 50 L54 46 Z"/>
                                                    </svg>
                                                </span>
                                                <span className="empty-row-text">{t('no_individual_records_found')}</span>
                                            </div>
                                            <button className="empty-create-btn gold" onClick={() => { setSelectedGroupId(null); openModal(null, null); }}>
                                                + {t('create_record')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </section>
                        )}



                        {(selectedGroupId || (!selectedGroupId && filteredRecords.length > 0)) && (
                            <>
                                <section className="data-table-container white-bg-table desktop-only">
                                    <div className="table-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <h3>{selectedGroupId ? t('group_records') : t('your_individual_records')}</h3>
                                            <button className="btn-manage-cols" onClick={() => setShowSettings(true)} title={t('manage_columns_title')}>⚙️</button>
                                        </div>
                                    </div>
                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    {columns.filter(c => c.visible).map(col => <th key={col.id} className={col.id === 'serial' ? 'center-col' : ''}>{col.label}</th>)}
                                                    <th className="action-col">{t('actions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredRecords.map((record, idx) => (
                                                    <tr key={record.id}>
                                                        {columns.filter(c => c.visible).map(col => (
                                                            <td key={col.id} className={`editable-cell ${col.id === 'serial' ? 'center-col' : ''}`}>
                                                                {col.id === 'serial' ? (record[col.id] || idx + 1) :
                                                                    col.type === 'select' ? (
                                                                        <select
                                                                            className="table-input status-select center-col"
                                                                            data-status={record[col.id]}
                                                                            value={record[col.id] || ''}
                                                                            onChange={(e) => handleTableEdit(record.id, col.id, e.target.value)}
                                                                        >
                                                                            <option value="" disabled>{t('update_status')}</option>
                                                                            {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                        </select>
                                                                    ) : col.type === 'date' ? (
                                                                        <div className="date-cell-container">
                                                                            <input
                                                                                type="date"
                                                                                className="table-input"
                                                                                value={record[col.id] || ''}
                                                                                onChange={(e) => handleTableEdit(record.id, col.id, e.target.value)}
                                                                            />
                                                                            {getRelativeDateLabel(record[col.id]) && (
                                                                                <span className="relative-date-tag">{getRelativeDateLabel(record[col.id])}</span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <input
                                                                            type={col.type || 'text'}
                                                                            className="table-input"
                                                                            value={record[col.id] || ''}
                                                                            onChange={(e) => handleTableEdit(record.id, col.id, e.target.value)}
                                                                            placeholder="..."
                                                                        />
                                                                    )}
                                                            </td>
                                                        ))}
                                                        <td>
                                                            <div className="row-actions">
                                                                <button className="btn-icon danger sm" onClick={() => handleDeleteRecord(record.id)}>🗑️</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="add-row-placeholder" onClick={handleAddNewRow}>
                                                    <td colSpan={columns.filter(c => c.visible).length + 1}>
                                                        + {t('tap_add_record')}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                {/* Mobile Specific UI for Records */}
                                <section className="mobile-only mobile-records-container" style={{ marginTop: !selectedGroupId ? '1rem' : '0' }}>
                                    <div className="table-header" style={{ marginBottom: '1rem' }}>
                                        <h3>{selectedGroupId ? t('manage_records') : t('your_individual_records')}</h3>
                                    </div>
                                    {filteredRecords.map((record, idx) => {
                                        const isExpanded = expandedRecordId === record.id;
                                        return (
                                        <div key={record.id} className={`mobile-record-card fade-in ${isExpanded ? 'expanded' : ''}`} onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}>
                                            <div className="record-card-header">
                                                <div className="record-card-title">{record.recipient || `Entry #${idx + 1}`}</div>
                                                <div className="record-card-header-right">
                                                    <select 
                                                        className="record-card-status status-select" 
                                                        data-status={record.status}
                                                        value={record.status || ''}
                                                        onChange={(e) => handleTableEdit(record.id, 'status', e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <option value="" disabled>{t('update_status')}</option>
                                                        {DEFAULT_COLUMNS.find(c => c.id === 'status').options.map(opt => (
                                                            <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                                                        ))}
                                                    </select>
                                                    <div className={`record-card-chevron ${isExpanded ? 'open' : ''}`}>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`record-card-collapse ${isExpanded ? 'open' : ''}`}>
                                                <div className="record-card-grid">
                                                    <div className="record-field-item">
                                                        <span className="field-label">{t('mobile_amount')}</span>
                                                        <input 
                                                            type="number" 
                                                            className="table-input" 
                                                            value={record.amount || ''} 
                                                            onChange={(e) => handleTableEdit(record.id, 'amount', e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="record-field-item">
                                                        <span className="field-label">{t('mobile_date')}</span>
                                                        <input 
                                                            type="date" 
                                                            className="table-input" 
                                                            value={record.date || ''} 
                                                            onChange={(e) => handleTableEdit(record.id, 'date', e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <div className="record-field-item">
                                                        <span className="field-label">{t('mobile_location')}</span>
                                                        <input 
                                                            type="text" 
                                                            className="table-input" 
                                                            value={record.location || ''} 
                                                            onChange={(e) => handleTableEdit(record.id, 'location', e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            placeholder={t('city_place_placeholder')}
                                                        />
                                                    </div>
                                                    <div className="record-field-item">
                                                        <span className="field-label">{t('mobile_relation')}</span>
                                                        <input 
                                                            type="text" 
                                                            className="table-input" 
                                                            value={record.relation || ''} 
                                                            onChange={(e) => handleTableEdit(record.id, 'relation', e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            placeholder={t('relation_placeholder')}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="record-card-actions">
                                                    <button className="btn-icon danger sm" onClick={(e) => { e.stopPropagation(); handleDeleteRecord(record.id); }}>{t('mobile_delete')}</button>
                                                </div>
                                            </div>
                                        </div>
                                    )})}
                                </section>
                            </>
                        )}
                    </>
                ) : currentView === 'zakat-info' ? (
                    <div className="zakat-info-page fade-in calculator-view-refined">
                        <div className="calc-top-nav">
                            <button className="btn-back" onClick={handleBack} aria-label="Go Back">{BACK_ICON}</button>
                        </div>
                        
                        <div className="calc-header-centered" style={{ marginBottom: '1.5rem', color: '#fff' }}>
                            <h1 className="about-hero-title">{t('about')}</h1>
                        </div>

                        <div className="about-zakat-container">
                            {[
                                {
                                    id: 'zakat',
                                    title: t('about_title_zakat'),
                                    content: (
                                        <p>{t('zakat_pillar_desc')}</p>
                                    )
                                },
                                {
                                    id: 'virtues',
                                    title: t('about_title_virtues'),
                                    content: (
                                        <>
                                            <p>{t('virtues_p1')}</p>
                                            <p style={{ marginTop: '1rem' }}>{t('virtues_p2')}</p>
                                        </>
                                    )
                                },
                                {
                                    id: 'status',
                                    title: t('about_title_status'),
                                    content: (
                                        <>
                                            <p>{t('status_p1')}</p>
                                            <p style={{ marginTop: '1rem' }}>{t('status_p2')}</p>
                                        </>
                                    )
                                },
                                {
                                    id: 'denier',
                                    title: t('about_title_denier'),
                                    content: (
                                        <>
                                            <p>{t('denier_desc_1')}</p>
                                            <p style={{ marginTop: '1rem' }}>{t('denier_desc_2')}</p>
                                        </>
                                    )
                                },
                                {
                                    id: 'conditions-obligation',
                                    title: t('about_title_conditions_obligation'),
                                    content: (
                                        <>
                                            <h4 className="about-subtitle">{t('obligation_islam_title')}</h4>
                                            <p>{t('obligation_islam_desc')}</p>
                                            <h4 className="about-subtitle mt-xl">{t('obligation_freedom_title')}</h4>
                                        </>
                                    )
                                },
                                {
                                    id: 'conditions-money',
                                    title: t('conditions_money_title'),
                                    content: (
                                        <>
                                            <h4 style={{ color: '#1A365D', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>{t('possession_title')}</h4>
                                            <p>{t('possession_desc_1')}</p>
                                            <p style={{ marginTop: '1rem' }}>{t('possession_desc_2')}</p>
                                            <ul style={{ listStyleType: 'none', padding: 0, margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                <li style={{ paddingLeft: '1.5rem', position: 'relative' }}><span style={{ position: 'absolute', left: 0, color: 'var(--primary)' }}>•</span> {t('possession_item_1')}</li>
                                                <li style={{ paddingLeft: '1.5rem', position: 'relative' }}><span style={{ position: 'absolute', left: 0, color: 'var(--primary)' }}>•</span> {t('possession_item_2')}</li>
                                                <li style={{ paddingLeft: '1.5rem', position: 'relative' }}><span style={{ position: 'absolute', left: 0, color: 'var(--primary)' }}>•</span> {t('possession_item_3')}</li>
                                                <li style={{ paddingLeft: '1.5rem', position: 'relative' }}><span style={{ position: 'absolute', left: 0, color: 'var(--primary)' }}>•</span> {t('possession_item_4')}</li>
                                                <li style={{ paddingLeft: '1.5rem', position: 'relative' }}><span style={{ position: 'absolute', left: 0, color: 'var(--primary)' }}>•</span> {t('possession_item_5')}</li>
                                            </ul>
                                            <h4 style={{ color: '#1A365D', marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>{t('passage_year_title')}</h4>
                                            <p>{t('passage_year_desc')}</p>
                                            <h4 style={{ color: '#1A365D', marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>{t('reaching_nisab_title')}</h4>
                                            <p>{t('reaching_nisab_desc')}</p>
                                        </>
                                    )
                                },
                                {
                                    id: 'quran',
                                    title: t('quran_title'),
                                    content: (
                                        <>
                                            <p>{t('quran_p2')}</p>
                                            <p style={{ marginTop: '1rem' }}>{t('quran_p1')}</p>
                                            <p style={{ marginTop: '1rem' }}>{t('quran_p3')}</p>
                                        </>
                                    )
                                },
                                {
                                    id: 'sunnah',
                                    title: t('sunnah_title'),
                                    content: (
                                        <>
                                            <p>{t('sunnah_p1')}</p>
                                            <p style={{ marginTop: '1rem' }}>{t('sunnah_p2')}</p>
                                        </>
                                    )
                                },
                                {
                                    id: 'mandatory',
                                    title: t('mandatory_conditions_title'),
                                    content: (
                                        <>
                                            <p>{t('mandatory_intro', { defaultValue: 'Islam sets a list conditions when Zakat becomes obligatory. These conditions aim at facilitating the process of giving Zakat, and enable to clear any misunderstanding about when Zakat is due. These conditions are as follows:' })}</p>
                                            <ul style={{ listStyleType: 'none', padding: 0, margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                <li>* {t('mandatory_condition_1')}</li>
                                                <li>* {t('mandatory_condition_2')}</li>
                                                <li>* {t('mandatory_condition_3')}</li>
                                                <li>* {t('mandatory_condition_4')}</li>
                                                <li>* {t('mandatory_condition_5')}</li>
                                            </ul>
                                        </>
                                    )
                                },
                                {
                                    id: 'nisab-def',
                                    title: t('what_is_nisab_title'),
                                    content: (
                                        <p>{t('what_is_nisab_desc')}</p>
                                    )
                                },
                                {
                                    id: 'types-cash',
                                    title: t('about_title_types_cash'),
                                    content: (
                                        <>
                                            <h4 style={{ textDecoration: 'underline', marginBottom: '1rem' }}>* {t('cash_zakat_title')}</h4>
                                            <p>{t('cash_zakat_desc')} <span style={{ textDecoration: 'underline', fontStyle: 'italic', color: '#B8860B', cursor: 'pointer' }} onClick={() => setCurrentView('calculator')}>{t('see_calculator', { defaultValue: 'See Zakat Calculator' })}</span></p>
                                            <p style={{ marginTop: '1rem' }}>{t('no_haram_income_note')}</p>
                                        </>
                                    )
                                },
                                {
                                    id: 'gold-silver',
                                    title: t('about_title_gold_silver'),
                                    content: (
                                        <>
                                            <h4 style={{ color: '#1A365D', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>* {t('gold_silver_zakat_title')}</h4>
                                            <p>{t('gold_nisab_desc')} <span style={{ textDecoration: 'underline', fontStyle: 'italic', color: '#B8860B', cursor: 'pointer' }} onClick={() => { setSelectedCategory('gold'); setCurrentView('calculator'); }}>{t('calc_gold_silver', { defaultValue: 'Calculate your Zakat on Gold & Silver' })}</span></p>
                                            <p style={{ marginTop: '1rem' }}>{t('silver_nisab_desc')}</p>
                                            <p style={{ marginTop: '1rem' }}>{t('gold_silver_price_note')}</p>
                                        </>
                                    )
                                },
                                {
                                    id: 'stocks-trade',
                                    title: t('stocks_trade_title'),
                                    content: (
                                        <>
                                            <p>{t('stocks_merchandise_desc')}</p>
                                            <p style={{ marginTop: '1rem' }}>{t('shares_zakat_title')}</p>
                                            <p>{t('stocks_info_text')} <span style={{ textDecoration: 'underline', fontStyle: 'italic', color: '#B8860B', cursor: 'pointer' }} onClick={() => { setSelectedCategory('stocks'); setCurrentView('calculator'); }}>{t('calc_stocks', { defaultValue: 'Calculate your Zakat on Stocks' })}</span></p>
                                        </>
                                    )
                                },
                                {
                                    id: 'shares-info',
                                    title: t('about_title_shares'),
                                    content: (
                                        <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <li>* {t('shares_capital_gain_rule')}</li>
                                            <li>* {t('shares_dividends_rule')}</li>
                                        </ul>
                                    )
                                },
                                {
                                    id: 'livestock',
                                    title: t('livestock_zakat_title'),
                                    content: (
                                        <>
                                            <p><span style={{ color: '#B8860B', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setSelectedCategory('cattle'); setCurrentView('calculator'); }}>{t('livestock_zakat_title')}</span> {t('livestock_intro_desc')}</p>
                                            
                                            <div style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--primary)', paddingLeft: '1rem' }}>
                                                <h4 style={{ color: '#1A365D', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>{t('cattle_zakat_title')}</h4>
                                                <p>{t('cattle_rule_desc')}</p>
                                                <ul style={{ listStyleType: 'none', padding: 0, margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.95rem' }}>
                                                    <li>• 30-39: 1 cow (1 year old)</li>
                                                    <li>• 40-59: 1 cow (2 years old)</li>
                                                    <li>• 60-69: 2 cows (1 year old)</li>
                                                </ul>
                                            </div>

                                            <div style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--secondary)', paddingLeft: '1rem' }}>
                                                <h4 style={{ color: '#1A365D', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>{t('goats_zakat_title')}</h4>
                                                <p>{t('goats_rule_desc')}</p>
                                                <ul style={{ listStyleType: 'none', padding: 0, margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.95rem' }}>
                                                    <li>• 40-120: 1 goat</li>
                                                    <li>• 121-200: 2 goats</li>
                                                    <li>• 201-399: 3 goats</li>
                                                    <li>• 400+: 1 goat for every 100 heads</li>
                                                </ul>
                                            </div>

                                            <div style={{ marginTop: '1.5rem', borderLeft: '4px solid #DFBE5D', paddingLeft: '1rem' }}>
                                                <h4 style={{ color: '#1A365D', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>{t('camels_zakat_title')}</h4>
                                                <p>{t('camels_rule_desc')}</p>
                                                <ul style={{ listStyleType: 'none', padding: 0, margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.95rem' }}>
                                                    <li>• 5-9: 1 goat</li>
                                                    <li>• 10-14: 2 goats</li>
                                                    <li>• 15-19: 3 goats</li>
                                                    <li>• 20-24: 4 goats</li>
                                                    <li>• 25-35: 1 female camel (1 year old)</li>
                                                </ul>
                                            </div>
                                        </>
                                    )
                                }
                            ].map((item) => (
                                <div key={item.id} className="about-accordion-item">
                                    <div className="about-accordion-header" onClick={() => setActiveAccordion(activeAccordion === item.id ? null : item.id)}>
                                        <span className="about-title">{item.title}</span>
                                        <div className={`about-icon-circle ${activeAccordion === item.id ? 'open' : ''}`}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                {activeAccordion === item.id ? (
                                                    <polyline points="18 15 12 9 6 15" />
                                                ) : (
                                                    <polyline points="6 9 12 15 18 9" />
                                                )}
                                            </svg>
                                        </div>
                                    </div>
                                    <div className={`about-accordion-body ${activeAccordion === item.id ? 'open' : ''}`}>
                                        <div className="about-content-inner">
                                            {item.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : currentView === 'all-records' || currentView === 'pending-records' ? (
                    <div className="records-view-page fade-in">
                        <header className="page-header">
                            <div className="header-info">
                                <div className="group-header">
                                    <button className="btn-back" onClick={handleBack} aria-label="Go Back">{BACK_ICON}</button>
                                    <div>
                                        <h1>{currentView === 'all-records' ? t('all_records_title') : t('pending_payments_title')}</h1>
                                        <p>{currentView === 'all-records' ? t('history_for') : t('unpaid_commitments')}{viewedYear}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="header-actions">
                                <input type="number" value={viewedYear} onChange={(e) => setViewedYear(e.target.value)} className="year-picker" />
                            </div>
                        </header>

                        <section className="data-table-container white-bg-table">
                            <div className="table-header">
                                <h3>{currentView === 'all-records' ? t('full_audit') : t('priority_actions')}</h3>
                            </div>
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            {columns.filter(c => c.visible).map(col => <th key={col.id} className={col.id === 'serial' ? 'center-col' : ''}>{col.label}</th>)}
                                            <th className="action-col">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(currentView === 'all-records' ? annualRecords : annualRecords.filter(r => ['Pending', 'To Pay', 'Yet to Decide'].includes(r.status))).map((record, idx) => (
                                            <tr key={record.id}>
                                                {columns.filter(c => c.visible).map(col => (
                                                    <td key={col.id} className={`editable-cell ${col.id === 'serial' ? 'center-col' : ''}`}>
                                                        {col.id === 'serial' ? (idx + 1) :
                                                            col.type === 'select' ? (
                                                                <select 
                                                                    className="table-input status-select center-col"
                                                                    data-status={record[col.id]}
                                                                    value={record[col.id] || ''}
                                                                    onChange={(e) => handleTableEdit(record.id, col.id, e.target.value)}
                                                                >
                                                                    <option value="" disabled>Update Status</option>
                                                                    {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                </select>
                                                            ) : col.type === 'date' ? (
                                                                <div className="date-cell-container">
                                                                    <input
                                                                        type="date"
                                                                        className="table-input"
                                                                        value={record[col.id] || ''}
                                                                        onChange={(e) => handleTableEdit(record.id, col.id, e.target.value)}
                                                                    />
                                                                    {getRelativeDateLabel(record[col.id]) && (
                                                                        <span className="relative-date-tag">{getRelativeDateLabel(record[col.id])}</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type={col.type || 'text'}
                                                                    className="table-input"
                                                                    value={record[col.id] || ''}
                                                                    onChange={(e) => handleTableEdit(record.id, col.id, e.target.value)}
                                                                />
                                                            )}
                                                    </td>
                                                ))}
                                                <td><button className="btn-icon danger sm" onClick={() => handleDeleteRecord(record.id)}>🗑️</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                ) : currentView === 'manage-groups' ? (
                    <div className="records-view-page fade-in">
                        <header className="page-header">
                            <div className="header-info">
                                <div className="group-header">
                                    <button className="btn-back" onClick={handleBack} aria-label="Go Back">{BACK_ICON}</button>
                                    <div>
                                        <h1>Manage Zakat Groups</h1>
                                        <p>Organize your distribution categories</p>
                                    </div>
                                </div>
                            </div>
                            <div className="header-actions">
                                <button className="btn-primary" onClick={() => setCurrentView('create-group')}>{t('add_new_group')}</button>
                            </div>
                        </header>
                        <section className="groups-container">
                            <div className="groups-grid">
                                {groups.map(group => (
                                    <div key={group.id} className="group-card">
                                        <div className="group-icon-wrapper">📁</div>
                                        <div className="group-info">
                                            <h4>{group.name}</h4>
                                            <p>{group.relation}</p>
                                        </div>
                                        <div className="group-card-actions">
                                            <button className="btn-icon danger sm" onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}>🗑️</button>
                                            <button className="btn-primary sm" style={{ padding: '0.4rem 0.8rem' }} onClick={() => selectGroup(group.id)}>{t('view_list')}</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                ) : (currentView === 'create-group' || currentView === 'add-record') ? (
                    <div className="form-page fade-in">
                        <header className="page-header">
                            <div className="header-info">
                                <div className="group-header">
                                    <button className="btn-back" onClick={handleBack} aria-label="Go Back">{BACK_ICON}</button>
                                    <div>
                                        <h1>{isEditing ? t('edit_entry') : t('add_entry')}</h1>
                                        <p>{selectedGroupId ? `${t('adding_to')} ${currentGroupName}` : t('organize_recipients')}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="header-actions">
                                <input type="number" value={viewedYear} onChange={(e) => setViewedYear(e.target.value)} className="year-picker" />
                            </div>
                        </header>

                        <div className="form-card-centered" style={{ paddingTop: '1rem' }}>
                            <div className="premium-form dual-tab-container">
                                {(!isEditing && !selectedGroupId) && (
                                    <div className="dual-tabs">
                                        <div 
                                            className={`dual-tab ${currentView === 'create-group' ? 'active' : ''}`}
                                            onClick={() => setCurrentView('create-group')}
                                        >
                                            {t('group_record_tab')}
                                        </div>
                                        <div 
                                            className={`dual-tab ${currentView === 'add-record' ? 'active' : ''}`}
                                            onClick={() => openModal(null, null)}
                                        >
                                            {t('individual_record_tab')}
                                        </div>
                                    </div>
                                )}

                                <div className="dual-tab-content fade-in" key={currentView}>
                                    {currentView === 'create-group' ? (
                                        <form onSubmit={handleCreateGroup}>
                                            <div className="input-field">
                                                <label>Group Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., Relatives, Neighbors"
                                                    value={newGroupData.name}
                                                    onChange={e => setNewGroupData({ ...newGroupData, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="input-field">
                                                <label>Relation</label>
                                                <input
                                                    type="text"
                                                    placeholder="Relationship to group"
                                                    value={newGroupData.relation}
                                                    onChange={e => setNewGroupData({ ...newGroupData, relation: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-actions-premium" style={{ marginTop: '2rem' }}>
                                                <button type="submit" className="btn-primary full-width">SUBMIT GROUP</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleSaveRecord}>
                                            <div className="form-grid-vertical">
                                                {columns.filter(c => c.visible && c.id !== 'serial').map(col => (
                                                    <div className="input-field" key={col.id}>
                                                        <label>{col.label}</label>
                                                        <div className="form-input-wrapper" style={{ position: 'relative' }}>
                                                            {col.type === 'select' ? (
                                                                <select
                                                                    value={formData[col.id] || ''}
                                                                    onChange={(e) => setFormData({ ...formData, [col.id]: e.target.value })}
                                                                    required={['recipient', 'amount', 'date', 'status'].includes(col.id)}
                                                                    className="premium-select"
                                                                    data-status={formData[col.id]}
                                                                >
                                                                    <option value="" disabled>{t('select')} {col.label}</option>
                                                                    {col.options && col.options.map(opt => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    type={col.type || 'text'}
                                                                    value={formData[col.id] || ''}
                                                                    onChange={(e) => setFormData({ ...formData, [col.id]: e.target.value })}
                                                                    required={['recipient', 'amount', 'date'].includes(col.id)}
                                                                    className={col.id === 'date' ? 'date-input-with-label' : ''}
                                                                />
                                                            )}
                                                            {col.id === 'date' && getRelativeDateLabel(formData[col.id]) && (
                                                                <span className="relative-date-tag form-tag">{getRelativeDateLabel(formData[col.id])}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="form-actions-premium" style={{ marginTop: '2rem' }}>
                                                <button type="submit" className="btn-primary full-width">
                                                    {isEditing ? t('update_record') : t('save_contribution')}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : currentView === 'history' ? (
                    <div className="history-view fade-in">
                        <div className="section-header-compact">
                            <button className="btn-back" onClick={() => setCurrentView('home')}>{BACK_ICON}</button>
                            <h1>{t('calculation_history')}</h1>
                        </div>

                        <div className="history-container">
                            {isLoadingHistory ? (
                                <div className="loader-centered">Loading History...</div>
                            ) : calcHistory.length === 0 ? (
                                <div className="empty-state-card">
                                    <div className="empty-icon">📜</div>
                                    <h3>{t('no_history_yet')}</h3>
                                    <p>{t('history_desc')}</p>
                                    <button className="btn-primary" onClick={() => setCurrentView('calculator')}>{t('start_calculating')}</button>
                                </div>
                            ) : (
                                <div className="history-list">
                                    {calcHistory.map(item => (
                                        <div key={item.id} className="history-item-card premium-card">
                                            <div className="history-item-main">
                                                <div className="history-type">
                                                    <span className="type-badge">{item.category?.toUpperCase()}</span>
                                                    <span className="date-badge">{new Date(item.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="history-amount">
                                                    <span className="total-label">{t('total_zakat_due')}:</span>
                                                    <span className="amount-value highlight-gold">₹{parseFloat(item.total_zakat).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="history-item-footer">
                                                <div className="footer-details">
                                                    <span>{item.year_type === 'islamic' ? '🌙 Islamic' : '🗓️ Solar'}</span>
                                                    {item.is_below_nisab && <span className="nisab-tag">Below Nisab</span>}
                                                </div>
                                                <button className="btn-delete-icon" onClick={() => deleteHistoryItem(item.id)}>🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="calculator-view-refined fade-in">
                        <div className="calc-top-nav">
                            <button className="btn-back" onClick={handleBack} aria-label="Go Back">{BACK_ICON}</button>
                            <button className="btn-help-icon-refined" onClick={() => setShowCalcInfo(true)} title="What is Zakat?">ⓘ</button>
                        </div>
                        
                        <div className="calc-header-centered">
                            <h1>{t('calculate')}</h1>
                            <p>{t('calc_annual_precise')}</p>
                        </div>

                        <div className="calc-category-grid">
                            <div className={`category-card ${selectedCategory === 'money' ? 'selected' : ''}`} onClick={() => setSelectedCategory('money')}>
                                <div className="icon-circle">💰</div>
                                <span>{t('money')}</span>
                            </div>
                            <div className={`category-card ${selectedCategory === 'gold' ? 'selected' : ''}`} onClick={() => setSelectedCategory('gold')}>
                                <div className="icon-circle">
                                    <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 55L35 45H55L40 55H20Z" fill="#FACC15"/>
                                        <path d="M40 55L55 45V65L40 75V55Z" fill="#EAB308"/>
                                        <path d="M20 55V75L40 75V55H20Z" fill="#CA8A04"/>
                                        <path d="M45 65L60 55H80L65 65H45Z" fill="#FACC15"/>
                                        <path d="M65 65L80 55V75L65 85V65Z" fill="#EAB308"/>
                                        <path d="M45 65V85L65 85V65H45Z" fill="#CA8A04"/>
                                        <path d="M35 40L50 30H70L55 40H35Z" fill="#FDE047"/>
                                        <path d="M55 40L70 30V50L55 60V40Z" fill="#FACC15"/>
                                        <path d="M35 40V60L55 60V40H35Z" fill="#EAB308"/>
                                        <path d="M40 40L45 37L50 40H45L40 40Z" fill="white" fillOpacity="0.4"/>
                                        <path d="M55 35L60 32L65 35H60L55 35Z" fill="white" fillOpacity="0.4"/>
                                        <path d="M30 30L32 25L34 30L39 32L34 34L32 39L30 34L25 32L30 30Z" fill="#FEF08A"/>
                                        <path d="M75 25L77 20L79 25L84 27L79 29L77 34L75 29L70 27L75 25Z" fill="#FEF08A"/>
                                        <path d="M65 45L66 42L67 45L70 46L67 47L66 50L65 47L62 46L65 45Z" fill="white"/>
                                    </svg>
                                </div>
                                <span>{t('gold')}</span>
                            </div>
                            <div className={`category-card ${selectedCategory === 'cattle' ? 'selected' : ''}`} onClick={() => setSelectedCategory('cattle')}>
                                <div className="icon-circle">🐪</div>
                                <span>{t('cattle')}</span>
                            </div>
                            <div className={`category-card ${selectedCategory === 'stocks' ? 'selected' : ''}`} onClick={() => setSelectedCategory('stocks')}>
                                <div className="icon-circle">📈</div>
                                <span>{t('stocks')}</span>
                            </div>
                        </div>

                        {selectedCategory && (
                            <div className="calculator-container-refined category-box-anim">
                                {selectedCategory === 'gold' && (
                                    <>
                                        <div className="year-selection-box-refined">
                                            <div className="year-dropdown-wrapper">
                                                <select
                                                    className="year-type-select-inline"
                                                    value={calcData.yearType}
                                                    onChange={(e) => setCalcData({ ...calcData, yearType: e.target.value })}
                                                    required
                                                >
                                                    <option value="" disabled>Choose Year</option>
                                                    <option value="islamic">Islamic Year</option>
                                                    <option value="calendar">Calendar Year</option>
                                                </select>
                                            </div>
                                            {calcData.yearType && (
                                                <div className="year-logic-note">
                                                    {calcData.yearType === 'islamic' ? (
                                                        <p>🌙 Zakat is due when wealth is held for one full <strong>Lunar Year (Hawl)</strong>. (Recommended)</p>
                                                    ) : (
                                                        <p>⚠️ Solar Year adjustment: Rate is calculated at <strong>2.577%</strong> to account for the extra 11 days.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="calc-info-display-refined">
                                            <div className="info-row-refined">
                                                <span className="info-label">{t('zakat_percentage')}</span>
                                                <span className="info-value-refined highlight-gold">{zakatResults.zakatRateDisplay}%</span>
                                            </div>
                                            <div className="info-row-refined">
                                                <div className="rate-info-group">
                                                    <span className="info-label">{t('gold_price_today')}</span>
                                                    <span className="info-subtext">{t('est_market_value')}</span>
                                                </div>
                                                <div className="info-value-refined highlight-gold">
                                                    <span>₹{calcData.goldRate > 0 ? calcData.goldRate.toLocaleString() : '---'}</span>
                                                    {isFetchingRate && <span className="fetching-loader">...</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="gold-section-refined">
                                            <div className="section-header-refined">
                                                <div className="header-left">
                                                    <span className="icon">💰</span>
                                                    <h3>{t('gold_assets')}</h3>
                                                </div>
                                                <button className="btn-add-gold-refined" onClick={addGoldRow}>+ Add Purity</button>
                                            </div>

                                            <div className="gold-rows-refined">
                                                {calcData.goldEntries.map((row) => (
                                                    <div key={row.id} className="gold-row-refined">
                                                        <div className="input-group-refined">
                                                            <label>Purity (Caliber)</label>
                                                            <select
                                                                value={row.caliber}
                                                                onChange={(e) => updateGoldRow(row.id, 'caliber', e.target.value)}
                                                            >
                                                                <option value="" disabled>Select Caliber</option>
                                                                {Object.keys(CALIBERS).map(k => <option key={k} value={k}>{k}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="input-group-refined">
                                                            <label>Weight (Grams)</label>
                                                            <div style={{ position: 'relative' }}>
                                                                <input
                                                                    type="number"
                                                                    placeholder="Enter weight"
                                                                    value={row.weight}
                                                                    onChange={(e) => updateGoldRow(row.id, 'weight', e.target.value)}
                                                                />
                                                                {row.caliber && (
                                                                    <span className="row-price-badge">@ ₹{Math.round(calcData.goldRate * (CALIBERS[row.caliber] || 1)).toLocaleString()}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button className="btn-remove-row-refined" onClick={() => removeGoldRow(row.id)}>✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {selectedCategory === 'money' && (
                                    <div className="money-calculator-box">
                                        <div className="calc-tabs-refined">
                                            <div 
                                                className={`calc-tab ${moneyCalcType === 'quick' ? 'active' : ''}`}
                                                onClick={() => setMoneyCalcType('quick')}
                                            >
                                                Quick calculator
                                            </div>
                                            <div 
                                                className={`calc-tab ${moneyCalcType === 'detailed' ? 'active' : ''}`}
                                                onClick={() => setMoneyCalcType('detailed')}
                                            >
                                                Detailed calculator
                                            </div>
                                        </div>

                                        <div className="year-selection-box-refined" style={{ marginBottom: '1.5rem', border: 'none', padding: 0 }}>
                                            <div className="year-dropdown-wrapper">
                                                <select
                                                    className="year-type-select-inline"
                                                    value={calcData.yearType}
                                                    onChange={(e) => setCalcData({ ...calcData, yearType: e.target.value })}
                                                    required
                                                >
                                                    <option value="" disabled>Choose Year</option>
                                                    <option value="islamic">Islamic Year</option>
                                                    <option value="calendar">Calendar Year</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="percentage-display-refined">
                                            <span>The percentage of Zakat according to the selected year is</span>
                                            <span className="rate-val">{calcData.yearType ? (calcData.yearType === 'islamic' ? '2.5%' : '2.577%') : '0%'}</span>
                                        </div>

                                        {moneyCalcType === 'detailed' ? (
                                            <div className="detailed-money-calc category-box-anim">
                                                <div className="detailed-section">
                                                    <div className="detailed-header">
                                                        <span className="icon">ⓘ</span> My Financial Accounts
                                                    </div>
                                                    <div className="detailed-inputs">
                                                        <input type="number" placeholder="Value of Money" value={calcData.detailedMoney.financial.money || ''} onChange={(e) => setCalcData({ ...calcData, detailedMoney: { ...calcData.detailedMoney, financial: { ...calcData.detailedMoney.financial, money: e.target.value } } })} className="money-input-refined" />
                                                        <input type="number" placeholder="Value of the Bank Account" value={calcData.detailedMoney.financial.bank || ''} onChange={(e) => setCalcData({ ...calcData, detailedMoney: { ...calcData.detailedMoney, financial: { ...calcData.detailedMoney.financial, bank: e.target.value } } })} className="money-input-refined" />
                                                        <input type="number" placeholder="Others" value={calcData.detailedMoney.financial.others || ''} onChange={(e) => setCalcData({ ...calcData, detailedMoney: { ...calcData.detailedMoney, financial: { ...calcData.detailedMoney.financial, others: e.target.value } } })} className="money-input-refined" />
                                                    </div>
                                                </div>

                                                <div className="detailed-section">
                                                    <div className="detailed-header">
                                                        <span className="icon">ⓘ</span> Creditor
                                                    </div>
                                                    <div className="detailed-inputs">
                                                        <input type="number" placeholder="Value of Monetary Amount" value={calcData.detailedMoney.creditor.monetary || ''} onChange={(e) => setCalcData({ ...calcData, detailedMoney: { ...calcData.detailedMoney, creditor: { ...calcData.detailedMoney.creditor, monetary: e.target.value } } })} className="money-input-refined" />
                                                        <input type="number" placeholder="Others" value={calcData.detailedMoney.creditor.others || ''} onChange={(e) => setCalcData({ ...calcData, detailedMoney: { ...calcData.detailedMoney, creditor: { ...calcData.detailedMoney.creditor, others: e.target.value } } })} className="money-input-refined" />
                                                    </div>
                                                </div>

                                                <div className="detailed-section">
                                                    <div className="detailed-header">
                                                        <span className="icon">ⓘ</span> Debtor
                                                    </div>
                                                    <div className="detailed-inputs">
                                                        <input type="number" placeholder="House Rent Value" value={calcData.detailedMoney.debtor.houseRent || ''} onChange={(e) => setCalcData({ ...calcData, detailedMoney: { ...calcData.detailedMoney, debtor: { ...calcData.detailedMoney.debtor, houseRent: e.target.value } } })} className="money-input-refined" />
                                                        <input type="number" placeholder="Valeur d'un Crédit" value={calcData.detailedMoney.debtor.loan || ''} onChange={(e) => setCalcData({ ...calcData, detailedMoney: { ...calcData.detailedMoney, debtor: { ...calcData.detailedMoney.debtor, loan: e.target.value } } })} className="money-input-refined" />
                                                        <input type="number" placeholder="Value of a Car Instalment" value={calcData.detailedMoney.debtor.carInstalment || ''} onChange={(e) => setCalcData({ ...calcData, detailedMoney: { ...calcData.detailedMoney, debtor: { ...calcData.detailedMoney.debtor, carInstalment: e.target.value } } })} className="money-input-refined" />
                                                        <input type="number" placeholder="Others" value={calcData.detailedMoney.debtor.others || ''} onChange={(e) => setCalcData({ ...calcData, detailedMoney: { ...calcData.detailedMoney, debtor: { ...calcData.detailedMoney.debtor, others: e.target.value } } })} className="money-input-refined" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="amount-input-wrapper">
                                                <input
                                                    type="number"
                                                    placeholder="Amount value"
                                                    value={calcData.cash || ''}
                                                    onChange={(e) => setCalcData({ ...calcData, cash: e.target.value })}
                                                    className="money-input-refined"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedCategory === 'cattle' && (
                                    <div className="cattle-calculator-wrapper category-box-anim">

                                        {/* Section 1: Zakat Cattle — Animal Type + Count */}
                                        <div className="cattle-calc-card">
                                            <div className="cattle-card-header">
                                                <span>ⓘ</span> Zakat Cattle
                                                <button className="cattle-header-btn" onClick={() => setCalcData({ ...calcData, cattle: '', cattleType: 'camels', cattleTradeProfit: 0, cattleMilkProfit: 0, cattleWorkerProfit: 0 })}>⊕</button>
                                            </div>
                                            <div className="cattle-card-body">
                                                <div className="cattle-row-inputs">
                                                    <select
                                                        className="cattle-type-select"
                                                        value={calcData.cattleType || 'camels'}
                                                        onChange={(e) => setCalcData({ ...calcData, cattleType: e.target.value, cattle: '' })}
                                                    >
                                                        <option value="camels">🐪 Camels</option>
                                                        <option value="cows">🐄 Cows / Buffalo</option>
                                                        <option value="sheep">🐑 Sheep</option>
                                                        <option value="goats">🐐 Goats</option>
                                                    </select>
                                                    <input
                                                        type="number"
                                                        className="cattle-count-input"
                                                        placeholder="Count"
                                                        min="0"
                                                        value={calcData.cattle || ''}
                                                        onChange={(e) => setCalcData({ ...calcData, cattle: e.target.value })}
                                                    />
                                                    <button className="cattle-remove-btn" onClick={() => setCalcData({ ...calcData, cattle: '' })}>⊖</button>
                                                </div>

                                                {/* Live Zakat Due Preview */}
                                                {calcData.cattle > 0 && (
                                                    <div className="cattle-zakat-preview">
                                                        <span className="cattle-preview-label">Zakat Due:</span>
                                                        <span className={`cattle-preview-value ${computeCattleZakat(calcData.cattleType || 'camels', calcData.cattle) === '0' ? 'zakat-nil' : 'zakat-due'}`}>
                                                            {computeCattleZakat(calcData.cattleType || 'camels', calcData.cattle) === '0'
                                                                ? 'No Zakat (Below Nisab)'
                                                                : computeCattleZakat(calcData.cattleType || 'camels', calcData.cattle)}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="cattle-nisab-note">
                                                    <span>Nisab:</span>
                                                    <span>
                                                        {calcData.cattleType === 'camels' && 'Min. 5 Camels'}
                                                        {calcData.cattleType === 'cows' && 'Min. 30 Cows/Buffalo'}
                                                        {calcData.cattleType === 'sheep' && 'Min. 40 Sheep'}
                                                        {calcData.cattleType === 'goats' && 'Min. 40 Goats'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 2: Cattle for trading */}
                                        <div className="cattle-calc-card">
                                            <div className="cattle-card-header secondary">
                                                <span>ⓘ</span> Cattle for Trading
                                            </div>
                                            <div className="cattle-card-body">
                                                <input
                                                    type="number"
                                                    className="cattle-profit-input"
                                                    placeholder="Profit from trading"
                                                    min="0"
                                                    value={calcData.cattleTradeProfit || ''}
                                                    onChange={(e) => setCalcData({ ...calcData, cattleTradeProfit: e.target.value })}
                                                />
                                                <p className="cattle-note">If cattle are kept for trade, calculate 2.5% of their total market value.</p>
                                            </div>
                                        </div>

                                        {/* Section 3: Cattle for milk */}
                                        <div className="cattle-calc-card">
                                            <div className="cattle-card-header secondary">
                                                <span>ⓘ</span> Cattle for Milk
                                            </div>
                                            <div className="cattle-card-body">
                                                <input
                                                    type="number"
                                                    className="cattle-profit-input"
                                                    placeholder="Profit from milk"
                                                    min="0"
                                                    value={calcData.cattleMilkProfit || ''}
                                                    onChange={(e) => setCalcData({ ...calcData, cattleMilkProfit: e.target.value })}
                                                />
                                                <p className="cattle-note">Cattle used for milk production — Zakat is calculated on profit if it meets Nisab.</p>
                                            </div>
                                        </div>

                                        {/* Section 4: Worker Cattle */}
                                        <div className="cattle-calc-card">
                                            <div className="cattle-card-header secondary">
                                                <span>ⓘ</span> Worker Cattle
                                            </div>
                                            <div className="cattle-card-body">
                                                <input
                                                    type="number"
                                                    className="cattle-profit-input"
                                                    placeholder="Profit from work"
                                                    min="0"
                                                    value={calcData.cattleWorkerProfit || ''}
                                                    onChange={(e) => setCalcData({ ...calcData, cattleWorkerProfit: e.target.value })}
                                                />
                                                <p className="cattle-note">Animals used mainly for work or farming are exempt. Only profit earned is zakatable.</p>
                                            </div>
                                        </div>

                                        {/* Nisab Reference Card */}
                                        <div className="cattle-nisab-card">
                                            <div className="cattle-nisab-title">For Cattle</div>
                                            <p className="cattle-nisab-desc">
                                                <strong style={{ color: '#D4AF37' }}>Zakat</strong> on livestock includes cattle, camels, and goats (Sheep are deemed as goats). Zakatable livestock becomes obligatory only when one owns a specific number of heads in order to reach Nisab.
                                            </p>
                                            <div className="cattle-nisab-grid">
                                                <div className="nisab-item"><span>🐪 Camels</span><span>5 heads</span></div>
                                                <div className="nisab-item"><span>🐄 Cows</span><span>30 heads</span></div>
                                                <div className="nisab-item"><span>🐑 Sheep</span><span>40 heads</span></div>
                                                <div className="nisab-item"><span>🐐 Goats</span><span>40 heads</span></div>
                                            </div>
                                        </div>

                                    </div>
                                )}

                                {selectedCategory === 'stocks' && (
                                    <div className="stocks-section-refined category-box-anim">
                                        <div className="section-header-refined">
                                            <div className="header-left">
                                                <span className="icon">📈</span>
                                                <h3>Stocks Zakat Calculator</h3>
                                            </div>
                                        </div>

                                        {/* Share Type Selector */}
                                        <div className="stocks-type-selector">
                                            <label className="stocks-type-label">Select Share Type</label>
                                            <div className="stocks-type-options">
                                                <div
                                                    className={`stocks-type-card ${calcData.stocksShareType === 'trading' ? 'active' : ''}`}
                                                    onClick={() => setCalcData({ ...calcData, stocksShareType: 'trading', stocksNumShares: '', stocksMarketPrice: '', stocksDividend: '', stocksNonHalalPct: '' })}
                                                >
                                                    <span className="stocks-type-icon">📊</span>
                                                    <span className="stocks-type-name">Trading Shares</span>
                                                    <span className="stocks-type-desc">Bought to sell for profit</span>
                                                    <span className="stocks-type-tooltip">ⓘ<span className="tooltip-text">Shares purchased with the intention to sell later. Zakat = 2.5% of total market value.</span></span>
                                                </div>
                                                <div
                                                    className={`stocks-type-card ${calcData.stocksShareType === 'investment' ? 'active' : ''}`}
                                                    onClick={() => setCalcData({ ...calcData, stocksShareType: 'investment', stocksNumShares: '', stocksMarketPrice: '', stocksDividend: '', stocksNonHalalPct: '' })}
                                                >
                                                    <span className="stocks-type-icon">🏦</span>
                                                    <span className="stocks-type-name">Long-Term Investment</span>
                                                    <span className="stocks-type-desc">Held for dividends, not resale</span>
                                                    <span className="stocks-type-tooltip">ⓘ<span className="tooltip-text">Shares held long-term for dividends. Zakat = 2.5% of 25% of share value (zakatable assets portion).</span></span>
                                                </div>
                                                <div
                                                    className={`stocks-type-card ${calcData.stocksShareType === 'purification' ? 'active' : ''}`}
                                                    onClick={() => setCalcData({ ...calcData, stocksShareType: 'purification', stocksNumShares: '', stocksMarketPrice: '', stocksDividend: '', stocksNonHalalPct: '' })}
                                                >
                                                    <span className="stocks-type-icon">🧹</span>
                                                    <span className="stocks-type-name">Dividend Purification</span>
                                                    <span className="stocks-type-desc">Remove non-halal portion</span>
                                                    <span className="stocks-type-tooltip">ⓘ<span className="tooltip-text">Not Zakat, but a purification donation. Enter total dividend and non-halal income percentage.</span></span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Trading Shares Inputs */}
                                        {calcData.stocksShareType === 'trading' && (
                                            <div className="stocks-inputs-block category-box-anim">
                                                <div className="stocks-formula-pill">Formula: (Shares × Price) × 2.5%</div>
                                                <div className="stocks-input-row">
                                                    <div className="stocks-input-group">
                                                        <label>Number of Shares</label>
                                                        <input
                                                            type="number"
                                                            placeholder="e.g. 500"
                                                            value={calcData.stocksNumShares || ''}
                                                            onChange={(e) => setCalcData({ ...calcData, stocksNumShares: e.target.value })}
                                                            className="money-input-refined"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div className="stocks-input-group">
                                                        <label>Current Market Price (₹)</label>
                                                        <input
                                                            type="number"
                                                            placeholder="e.g. 250.00"
                                                            value={calcData.stocksMarketPrice || ''}
                                                            onChange={(e) => setCalcData({ ...calcData, stocksMarketPrice: e.target.value })}
                                                            className="money-input-refined"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>
                                                {calcData.stocksNumShares && calcData.stocksMarketPrice && (
                                                    <div className="stocks-live-preview">
                                                        <div className="slp-row"><span>Total Portfolio Value</span><span>₹{(parseFloat(calcData.stocksNumShares)*parseFloat(calcData.stocksMarketPrice)).toLocaleString()}</span></div>
                                                        <div className="slp-row highlight"><span>Estimated Zakat (2.5%)</span><span>₹{Math.round(parseFloat(calcData.stocksNumShares)*parseFloat(calcData.stocksMarketPrice)*0.025).toLocaleString()}</span></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Investment Shares Inputs */}
                                        {calcData.stocksShareType === 'investment' && (
                                            <div className="stocks-inputs-block category-box-anim">
                                                <div className="stocks-formula-pill">Formula: (Shares × Price × 25%) × 2.5%</div>
                                                <div className="stocks-input-row">
                                                    <div className="stocks-input-group">
                                                        <label>Number of Shares</label>
                                                        <input
                                                            type="number"
                                                            placeholder="e.g. 200"
                                                            value={calcData.stocksNumShares || ''}
                                                            onChange={(e) => setCalcData({ ...calcData, stocksNumShares: e.target.value })}
                                                            className="money-input-refined"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div className="stocks-input-group">
                                                        <label>Current Market Price (₹)</label>
                                                        <input
                                                            type="number"
                                                            placeholder="e.g. 350.00"
                                                            value={calcData.stocksMarketPrice || ''}
                                                            onChange={(e) => setCalcData({ ...calcData, stocksMarketPrice: e.target.value })}
                                                            className="money-input-refined"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>
                                                {calcData.stocksNumShares && calcData.stocksMarketPrice && (
                                                    <div className="stocks-live-preview">
                                                        <div className="slp-row"><span>Total Portfolio Value</span><span>₹{(parseFloat(calcData.stocksNumShares)*parseFloat(calcData.stocksMarketPrice)).toLocaleString()}</span></div>
                                                        <div className="slp-row"><span>Zakatable Base (25%)</span><span>₹{Math.round(parseFloat(calcData.stocksNumShares)*parseFloat(calcData.stocksMarketPrice)*0.25).toLocaleString()}</span></div>
                                                        <div className="slp-row highlight"><span>Estimated Zakat (2.5%)</span><span>₹{Math.round(parseFloat(calcData.stocksNumShares)*parseFloat(calcData.stocksMarketPrice)*0.25*0.025).toLocaleString()}</span></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {/* Purification Inputs */}
                                        {calcData.stocksShareType === 'purification' && (
                                            <div className="stocks-inputs-block category-box-anim">
                                                <div className="stocks-formula-pill purification">Formula: Dividend × Non-Halal % (Purification Donation)</div>
                                                <div className="purification-note">This is <strong>not Zakat</strong> — it's a purification donation to remove non-halal income from your dividends.</div>
                                                <div className="stocks-input-row">
                                                    <div className="stocks-input-group">
                                                        <label>Total Dividend Received (₹)</label>
                                                        <input
                                                            type="number"
                                                            placeholder="e.g. 5000"
                                                            value={calcData.stocksDividend || ''}
                                                            onChange={(e) => setCalcData({ ...calcData, stocksDividend: e.target.value })}
                                                            className="money-input-refined"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div className="stocks-input-group">
                                                        <label>Non-Halal Income % </label>
                                                        <input
                                                            type="number"
                                                            placeholder="e.g. 5"
                                                            value={calcData.stocksNonHalalPct || ''}
                                                            onChange={(e) => setCalcData({ ...calcData, stocksNonHalalPct: e.target.value })}
                                                            className="money-input-refined"
                                                            min="0"
                                                            max="100"
                                                        />
                                                    </div>
                                                </div>
                                                {calcData.stocksDividend && calcData.stocksNonHalalPct && (
                                                    <div className="stocks-live-preview purification-preview">
                                                        <div className="slp-row"><span>Total Dividend</span><span>₹{parseFloat(calcData.stocksDividend).toLocaleString()}</span></div>
                                                        <div className="slp-row"><span>Non-Halal Portion ({calcData.stocksNonHalalPct}%)</span><span>₹{Math.round(parseFloat(calcData.stocksDividend)*(parseFloat(calcData.stocksNonHalalPct)/100)).toLocaleString()}</span></div>
                                                        <div className="slp-row highlight purification-highlight"><span>Amount to Donate (Purify)</span><span>₹{Math.round(parseFloat(calcData.stocksDividend)*(parseFloat(calcData.stocksNonHalalPct)/100)).toLocaleString()}</span></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Stocks Info Card */}
                                        <div className="stocks-info-card">
                                            <div className="stocks-info-title">{t('stocks_info_title')}</div>
                                            <p>{t('stocks_info_text')}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedCategory === 'gold' && (
                                    <div className="zakat-guide-section-refined">
                                        <h3>{t('for_gold')}</h3>
                                        <p style={{ lineHeight: '1.6', color: '#4b5563', fontSize: '0.95rem', textAlign: 'justify' }}>
                                            {t('gold_info_text')}
                                        </p>
                                    </div>
                                )}

                                <div className="calc-action-refined">
                                    <button className="btn-calculate-submit" onClick={handleCalculateSubmit}>
                                        {t('calc_submit')}
                                    </button>
                                </div>

                                <h2>{t('recently_read')}</h2>
                                <div className="recents-list">
                                    {recents.map((item, idx) => (
                                        <div 
                                            key={idx} 
                                            className="recent-item-refined"
                                            onClick={() => navigate(item.type === 'juz' ? `/quran/juz/${item.id}` : `/quran/${item.id}?mode=reading`)}
                                        >
                                            <div className="recent-main-info">
                                                <div className="recent-arabic">{item.surahName || item.englishName || `Juz ${item.id}`}</div>
                                                <div className="recent-meta-desc">
                                                    {item.type === 'juz' ? `${t('juz_label')} ${item.id}` : `${t('surah_label')} ${item.id}`} • {t('ayah_label')} {item.ayahNumber}
                                                </div>
                                            </div>
                                            <div className="recent-time-badge">
                                                {(() => {
                                                    const getTimeAgo = (dateString) => {
                                                        const date = new Date(dateString);
                                                        const now = new Date();
                                                        const seconds = Math.floor((now - date) / 1000);
                                                        if (seconds < 60) return t('just_now');
                                                        const minutes = Math.floor(seconds / 60);
                                                        if (minutes < 60) return t('minutes_ago').replace('{{minutes}}', minutes);
                                                        const hours = Math.floor(minutes / 60);
                                                        if (hours < 24) return t('hours_ago').replace('{{hours}}', hours);
                                                        const days = Math.floor(hours / 24);
                                                        return t('days_ago').replace('{{days}}', days);
                                                    };
                                                    return getTimeAgo(item.timestamp);
                                                })()}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                        {selectedCategory === 'money' && (
                            <div className="guidance-box-refined category-box-anim">
                                <h3>{t('for_money')}</h3>
                                <p>{t('money_info_text')}</p>
                            </div>
                        )}
                    </div>
                )}

                        {showCalcResultModal && (
                            <div className="modal-overlay">
                                <div className="modal-card calc-summary-modal-refined fade-in">
                                    <div className="modal-header-refined">
                                        <h2>{t('calc_summary')}</h2>
                                        <button className="close-x" onClick={() => setShowCalcResultModal(false)}>✕</button>
                                    </div>
                                    

                                    <div className="modal-body-refined">
                                        {zakatResults.isBelowNisab ? (
                                            <div className="below-nisab-message">
                                                <div className="warning-icon">ℹ️</div>
                                                <p>{t('nisaab_warning')}</p>
                                            </div>
                                        ) : (
                                            <div className="summary-details-refined">
                                                {selectedCategory === 'gold' && (
                                                    <>
                                                        <div className="summary-row-refined">
                                                            <span>Total Gold Market Value:</span>
                                                            <span className="val">₹{zakatResults.goldValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                        </div>
                                                        <div className="summary-row-refined">
                                                            <span>Zakat on Gold ({zakatResults.zakatRateDisplay}%):</span>
                                                            <span className="val">₹{Math.round(zakatResults.goldZakatAmount).toLocaleString()}</span>
                                                        </div>
                                                        <div className="summary-row-refined">
                                                            <span>Zakat on Gold (in Grams):</span>
                                                            <span className="val">{zakatResults.goldZakatWeight.toLocaleString(undefined, { maximumFractionDigits: 2 })} g</span>
                                                        </div>
                                                    </>
                                                )}
                                                {selectedCategory === 'money' && (
                                                    <div className="summary-row-refined">
                                                        <span>Zakat on Cash & Savings:</span>
                                                        <span className="val">₹{Math.round(zakatResults.cashZakatAmount).toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {selectedCategory === 'cattle' && (
                                                    <>
                                                        <div className="summary-row-refined">
                                                            <span>Animal Type:</span>
                                                            <span className="val" style={{ textTransform: 'capitalize' }}>
                                                                {calcData.cattleType === 'camels' ? '🐪 Camels' :
                                                                 calcData.cattleType === 'cows' ? '🐄 Cows / Buffalo' :
                                                                 calcData.cattleType === 'sheep' ? '🐑 Sheep' : '🐐 Goats'}
                                                            </span>
                                                        </div>
                                                        <div className="summary-row-refined">
                                                            <span>Number of Animals:</span>
                                                            <span className="val">{calcData.cattle} Heads</span>
                                                        </div>
                                                        <div className="summary-row-refined">
                                                            <span>Zakat Due (Islamic Rule):</span>
                                                            <span className="val" style={{ color: '#D4AF37', fontWeight: 800 }}>
                                                                {zakatResults.cattleZakatDue === '0' ? 'None (Below Nisab)' : zakatResults.cattleZakatDue}
                                                            </span>
                                                        </div>
                                                        {(parseFloat(calcData.cattleTradeProfit) > 0 || parseFloat(calcData.cattleMilkProfit) > 0 || parseFloat(calcData.cattleWorkerProfit) > 0) && (
                                                            <div className="summary-row-refined">
                                                                <span>Zakat on Cattle Profit (2.5%):</span>
                                                                <span className="val">₹{Math.round(zakatResults.cashZakatAmount).toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                {selectedCategory === 'stocks' && (
                                                    <>
                                                        <div className="summary-row-refined">
                                                            <span>Share Type:</span>
                                                            <span className="val" style={{ textTransform: 'capitalize' }}>
                                                                {zakatResults.shareType === 'trading' ? '📊 Trading Shares' :
                                                                 zakatResults.shareType === 'investment' ? '🏦 Long-Term Investment' :
                                                                 zakatResults.shareType === 'purification' ? '🧹 Dividend Purification' : '—'}
                                                            </span>
                                                        </div>
                                                        {zakatResults.shareType !== 'purification' && (
                                                            <>
                                                                <div className="summary-row-refined">
                                                                    <span>Number of Shares:</span>
                                                                    <span className="val">{parseFloat(calcData.stocksNumShares || 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="summary-row-refined">
                                                                    <span>Market Price per Share:</span>
                                                                    <span className="val">₹{parseFloat(calcData.stocksMarketPrice || 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="summary-row-refined">
                                                                    <span>Total Portfolio Value:</span>
                                                                    <span className="val">₹{Math.round(zakatResults.stocksTotalValue).toLocaleString()}</span>
                                                                </div>
                                                                {zakatResults.shareType === 'investment' && (
                                                                    <div className="summary-row-refined">
                                                                        <span>Zakatable Base (25%):</span>
                                                                        <span className="val">₹{Math.round(zakatResults.stocksZakatableBase).toLocaleString()}</span>
                                                                    </div>
                                                                )}
                                                                <div className="summary-row-refined">
                                                                    <span>Zakat on Stocks (2.5%):</span>
                                                                    <span className="val">₹{Math.round(zakatResults.stocksZakatAmount).toLocaleString()}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                        {zakatResults.shareType === 'purification' && (
                                                            <>
                                                                <div className="summary-row-refined">
                                                                    <span>Total Dividend:</span>
                                                                    <span className="val">₹{parseFloat(calcData.stocksDividend || 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="summary-row-refined">
                                                                    <span>Non-Halal %:</span>
                                                                    <span className="val">{calcData.stocksNonHalalPct || 0}%</span>
                                                                </div>
                                                                <div className="summary-row-refined">
                                                                    <span>Amount to Purify (Donate):</span>
                                                                    <span className="val" style={{ color: '#059669', fontWeight: 700 }}>₹{Math.round(zakatResults.stocksPurificationAmount).toLocaleString()}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        
                                        <div className="final-payable-refined">
                                            <h3>
                                                {selectedCategory === 'cattle' ? 'ZAKAT DUE' :
                                                 (selectedCategory === 'stocks' && zakatResults.shareType === 'purification') ? 'PURIFICATION AMOUNT' :
                                                 t('total_payable')}
                                            </h3>
                                            <div className={`total-amount-refined ${selectedCategory === 'stocks' && zakatResults.shareType === 'purification' ? 'purification-total' : ''}`}>
                                                {zakatResults.isBelowNisab
                                                    ? 'NIL'
                                                    : selectedCategory === 'cattle'
                                                        ? (zakatResults.cattleZakatDue === '0' ? 'NIL' : zakatResults.cattleZakatDue)
                                                        : selectedCategory === 'stocks'
                                                            ? zakatResults.shareType === 'purification'
                                                                ? `₹${Math.round(zakatResults.stocksPurificationAmount).toLocaleString()}`
                                                                : `₹${Math.round(zakatResults.stocksZakatAmount).toLocaleString()}`
                                                            : `₹${Math.round(zakatResults.totalZakatPayable).toLocaleString()}`
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer-refined">
                                        <button className="btn-modal-download" onClick={() => window.print()}>{t('download_pdf')}</button>
                                        <button className="btn-modal-close" onClick={() => setShowCalcResultModal(false)}>{t('close')}</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Modals removed for full-page premium forms */}

            {showSettings && (
                <div className="settings-panel">
                    <div className="settings-header">
                        <h3>{t('manage_columns')}</h3>
                        <button className="close-btn" onClick={() => setShowSettings(false)}>&times;</button>
                    </div>
                    <div className="settings-list">
                        {columns.map(col => (
                            <div key={col.id} className="settings-item">
                                <input type="checkbox" checked={col.visible} onChange={(e) => handleColChange(col.id, 'visible', e.target.checked)} />
                                <input className="label-input" value={col.label} onChange={(e) => handleColChange(col.id, 'label', e.target.value)} />
                                <button className="btn-icon danger sm" onClick={() => setColumns(columns.filter(c => c.id !== col.id))}>&times;</button>
                            </div>
                        ))}
                        <button className="btn-outline btn-full" onClick={addNewColumn}>+ Add Custom Field</button>
                    </div>
                </div>
            )}

            {showCalcInfo && (
                <div className="modal-overlay">
                    <div className="modal-card info-modal">
                        <div className="modal-header">
                            <h2>Zakat Eligibility | സകാത്ത് അർഹത</h2>
                            <button className="close-btn" onClick={() => setShowCalcInfo(false)}>&times;</button>
                        </div>
                        <div className="modal-body info-body">
                            <div className="lang-section">
                                <p>Zakat is a 2.5% donation of your wealth to help the poor. It is required for Muslims who have savings above a certain limit for one year.</p>
                            </div>
                            <div className="lang-section malayalam">
                                <p>സകാത്ത് എന്നാൽ നമ്മുടെ സമ്പത്തിന്റെ ഒരു ചെറിയ ഭാഗം (2.5%) പാവപ്പെട്ടവർക്ക് നൽകുന്നതാണ്. ഒരു പരിധിയിൽ കൂടുതൽ സമ്പാദ്യമുള്ള എല്ലാ മുസ്ലിങ്ങളും ഇത് നൽകണം.</p>
                            </div>
                            <button className="btn-primary btn-full" onClick={() => setShowCalcInfo(false)}>Start Calculation</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={deleteModal.isOpen}
                type={deleteModal.type}
                title={deleteModal.title}
                message={deleteModal.message}
                onConfirm={deleteModal.onConfirm || confirmDelete}
                onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })}
            />

            <div className="notification-container">
                {notifications.map(n => (
                    <div key={n.id} className="notification-toast">
                        <span className="notification-icon">✨</span>
                        <span className="notification-text">{n.text}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);
}

const toArabicNumerals = (num) => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().split('').map(digit => arabicNumbers[parseInt(digit)]).join('');
};

const RECITERS = [
    { id: 'ar.alafasy', name: 'Mishary Alafasy' },
    { id: 'ar.husary', name: 'Khalil Al-Husary' },
    { id: 'ar.minshawi', name: 'Al-Minshawi' },
    { id: 'ar.abdulsamad', name: 'Abdul Basit' },
    { id: 'ar.parhizgar', name: 'Parhizgar' }
];

function CustomReciterDropdown({ current, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedReciter = RECITERS.find(r => r.id === current) || RECITERS[0];

    return (
        <div className="custom-dropdown" ref={dropdownRef}>
            <button 
                className={`dropdown-trigger ${isOpen ? 'active' : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="selected-name">{selectedReciter.name}</span>
                <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
            </button>
            
            {isOpen && (
                <div className="dropdown-menu-custom fade-in-down-sm">
                    {RECITERS.map(reciter => (
                        <div 
                            key={reciter.id} 
                            className={`dropdown-item-custom ${current === reciter.id ? 'selected' : ''}`}
                            onClick={() => {
                                onSelect(reciter.id);
                                setIsOpen(false);
                            }}
                        >
                            <span className="item-name">{reciter.name}</span>
                            {current === reciter.id && (
                                <span className="selected-check">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function QuranPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [surahs, setSurahs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { lang, setLang, t } = useLanguage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLightMode, setIsLightMode] = useState(localStorage.getItem('zakat_theme') !== 'dark');
    const [streakUpdate, setStreakUpdate] = useState(0);

    useEffect(() => {
        const handleStreakUpdate = () => setStreakUpdate(s => s + 1);
        window.addEventListener('khatam_streak_updated', handleStreakUpdate);
        return () => window.removeEventListener('khatam_streak_updated', handleStreakUpdate);
    }, []);

    useEffect(() => {
        let sessions = parseInt(localStorage.getItem('zakat_quran_sessions') || '0', 10);
        sessions += 1;
        localStorage.setItem('zakat_quran_sessions', sessions.toString());
        if (window.checkAppRating) window.checkAppRating('quran');
    }, []);
    const [browseMode, setBrowseMode] = useState('surah'); // 'surah' or 'juz'
    const [sectionTab, setSectionTab] = useState('reading'); // 'reading', 'khatam', 'star'
    const [recents, setRecents] = useState([]);
    const [juzMeta, setJuzMeta] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
    const [showResetKhatamModal, setShowResetKhatamModal] = useState(false);
    const [showSearchPanel, setShowSearchPanel] = useState(false);
    const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg) => {
        window.showToastFn = showToast;
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleContinueReading = () => {
        navigate('/quran/bookmarks');
    };

    const [favorites, setFavorites] = useState(() => {
        try { return JSON.parse(localStorage.getItem('quran_favorites') || '[]'); } catch { return []; }
    });

    useEffect(() => {
        const handleStorageChange = () => {
            try { setFavorites(JSON.parse(localStorage.getItem('quran_favorites') || '[]')); } catch {}
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);



    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('khatam') === 'true') {
            setSectionTab('khatam');
        }
    }, [location.search]);

    const [lastReadingMode, setLastReadingMode] = useState('surah');

    useEffect(() => {
        if (sectionTab === 'khatam') {
            setBrowseMode('juz');
        } else if (sectionTab === 'reading') {
            setBrowseMode(lastReadingMode);
        }
    }, [sectionTab, lastReadingMode]);

    useEffect(() => {
        const savedRecents = JSON.parse(localStorage.getItem('quran_recents') || '[]');
        setRecents(savedRecents);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowResetKhatamModal(false);
            }
        };
        if (showResetKhatamModal) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showResetKhatamModal]);
    useEffect(() => {
        const handleKhatamCompleted = () => {
            const hist = JSON.parse(localStorage.getItem('khatamHistory') || '[]');
            const todayStr = new Date().toDateString();
            if (hist.length > 0 && new Date(hist[0].completedAt).toDateString() === todayStr) return;
            
            hist.unshift({ completedAt: Date.now() });
            localStorage.setItem('khatamHistory', JSON.stringify(hist));
            // Show celebratory reset modal
            setShowResetKhatamModal(true);
        };
        window.addEventListener('khatam_completed', handleKhatamCompleted);
        return () => window.removeEventListener('khatam_completed', handleKhatamCompleted);
    }, []);
    const filteredSurahs = surahs.filter(surah => {
        const q = searchQuery.toLowerCase();
        return surah.englishName.toLowerCase().includes(q) || surah.name.includes(q);
    });


    const TOTAL_AYAHS_GLOBAL = 6236;

    const getKhatamStats = () => {
        const furthestAyah = parseInt(localStorage.getItem("khatamFurthestAyah") || "0", 10);
        const percent = Math.floor((furthestAyah / TOTAL_AYAHS_GLOBAL) * 100);
        return { totalRead: furthestAyah, percent };
    };
    const getJuzProgress = (juzItem) => {
        const furthestAyah = parseInt(localStorage.getItem("khatamFurthestAyah") || "0", 10);
        const startGlobalAyah = JUZ_DATA_LIST.slice(0, juzItem.num - 1).reduce((acc, curr) => acc + curr.totalAyahs, 1);
        const endGlobalAyah = startGlobalAyah + juzItem.totalAyahs - 1;

        if (furthestAyah < startGlobalAyah) return { state: 'Not Started', pct: 0, readCount: 0 };
        if (furthestAyah >= endGlobalAyah) return { state: 'Completed', pct: 100, readCount: juzItem.totalAyahs };
        
        const readCount = furthestAyah - startGlobalAyah + 1;
        const pct = Math.min(Math.round((readCount / juzItem.totalAyahs) * 100), 99);
        return { state: 'In Progress', pct, readCount };
    };

    const { totalRead: totalReadCount, percent: khatamPercentage } = getKhatamStats();
    
    const resetKhatamProgress = () => {
        localStorage.removeItem('khatamProgress');
        localStorage.removeItem('khatamFurthestAyah');
        localStorage.removeItem('khatamResumeState');
        setShowResetKhatamModal(false);
        window.location.reload();
    };

    const removeFavorite = (ayahNum) => {
        const newFavs = favorites.filter(f => f.ayahNumber !== ayahNum);
        setFavorites(newFavs);
        localStorage.setItem('quran_favorites', JSON.stringify(newFavs));
        window.dispatchEvent(new Event('storage'));
    };
    
    const timeAgo = (timestamp) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return t('just_now');
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return t('minutes_ago').replace('{{minutes}}', minutes);
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return t('hours_ago').replace('{{hours}}', hours);
        const days = Math.floor(hours / 24);
        return t('days_ago').replace('{{days}}', days);
    };

    useEffect(() => {
        const theme = isLightMode ? 'light-mode' : 'dark-mode';
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [isLightMode]);

    const handleRecentClick = (item) => {
        if (item.type === 'juz') {
            navigate(`/quran/juz/${item.id}`, { state: { ayah: item.ayahNumber } });
        } else {
            navigate(`/quran/${item.id}`, { state: { ayah: item.ayahNumber } });
        }
    };

    // t is provided by useLanguage

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch('https://api.alquran.cloud/v1/surah').then(res => res.json()),
            fetch('https://api.alquran.cloud/v1/meta').then(res => res.json())
        ])
        .then(([surahData, metaData]) => {
            setSurahs(surahData.data);
            setJuzMeta(metaData.data.juzs.references);
            setLoading(false);
        })
        .catch(err => {
            console.error("Error fetching Quran metadata:", err);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (isLightMode) {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('zakat_theme', 'light');
        } else {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
            localStorage.setItem('zakat_theme', 'dark');
        }
    }, [isLightMode]);

    const switchLang = (l) => setLang(l);

    return (
        <div className="app-layout-top">
            {/* ── Top Navbar ── */}
            <nav className="top-navbar-refined qh-navbar">
                <button
                    className="btn-settings"
                    style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
                    onClick={() => navigate('/')}
                >
                    {BACK_ICON}
                </button>

                <div className="header-title">Quran</div>

                <div className="qh-nav-actions">
                    <button
                        className="qh-icon-btn"
                        title="Continue Reading"
                        onClick={handleContinueReading}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                        </svg>
                    </button>
                    <button
                        className={`qh-icon-btn ${showSearchPanel ? 'active' : ''}`}
                        title="Search"
                        onClick={() => setShowSearchPanel(v => !v)}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                    </button>
                </div>
            </nav>

            {toastMessage && (
                <div className="notification-toast">
                    <span className="notification-text">{toastMessage}</span>
                </div>
            )}

            {/* ── Inline Search Panel ── */}
            {showSearchPanel && (
                <div className="qh-search-panel fade-in">
                    <div className="qh-search-inner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0, opacity:0.5}}>
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            autoFocus
                            type="text"
                            className="qh-search-input"
                            placeholder={t('search_surah') || 'Search Surah...'}
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setBrowseMode('surah'); setSectionTab('reading'); }}
                        />
                        {searchQuery && (
                            <button className="qh-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                        )}
                    </div>
                </div>
            )}

            <main className="main-content-top fade-in quran-container qh-main">

                {/* ── Section Tabs ── */}
                <div className="qh-tabs">
                    <button className={`qh-tab ${sectionTab === 'reading' ? 'active' : ''}`} onClick={() => setSectionTab('reading')}>
                        Read
                    </button>
                    <button className={`qh-tab ${sectionTab === 'khatam' ? 'active' : ''}`} onClick={() => setSectionTab('khatam')}>
                        Khatam
                    </button>
                </div>

                {/* ══════════ READ TAB ══════════ */}
                {sectionTab === 'reading' && (
                    <>
                        {/* Recently Read horizontal slider */}
                        {recents.filter(r => r.type !== 'juz').length > 0 && (
                            <section className="qh-section">
                                <h2 className="qh-section-title">Recently Read</h2>
                                <div className="qh-recents-slider">
                                    {recents.filter(r => r.type !== 'juz').map((item, idx) => (
                                        <div key={idx} className="qh-recent-card" onClick={() => handleRecentClick(item)}>
                                            <div className="qh-recent-box">
                                                <span className="qh-recent-arabic">{item.name || 'سورة'}</span>
                                            </div>
                                            <div className="qh-recent-meta">
                                                <h4 className="qh-recent-en">{lang === 'ml' ? item.name : item.englishName}</h4>
                                                <span className="qh-recent-sub">{t('ayah_label')} {item.ayahNumberInSurah || 1}</span>
                                                <span className="qh-recent-sub" style={{ color: 'var(--text-muted)' }}>{timeAgo(item.timestamp)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Surah / Juz list section */}
                        <section className="qh-section" style={{paddingBottom: '40px'}}>
                            <div className="qh-list-header">
                                <h2 className="qh-section-title" style={{margin:0}}>
                                    {browseMode === 'surah' ? 'Sura list' : 'Juz list'}
                                </h2>
                                {/* View dropdown */}
                                <div className="qh-view-dropdown" style={{position:'relative'}}>
                                    <button
                                        className="qh-view-btn"
                                        onClick={() => setViewDropdownOpen(v => !v)}
                                    >
                                        View: {browseMode === 'surah' ? 'Sura' : 'Juz'} ▾
                                    </button>
                                    {viewDropdownOpen && (
                                        <>
                                            <div className="menu-overlay" onClick={() => setViewDropdownOpen(false)} style={{zIndex: 400}} />
                                            <div className="qh-view-menu fade-in" style={{zIndex: 401}}>
                                                <div className={`qh-view-item ${browseMode === 'surah' ? 'active' : ''}`}
                                                    onClick={() => { setBrowseMode('surah'); setLastReadingMode('surah'); setViewDropdownOpen(false); }}>
                                                    Sura
                                                </div>
                                                <div className={`qh-view-item ${browseMode === 'juz' ? 'active' : ''}`}
                                                    onClick={() => { setBrowseMode('juz'); setLastReadingMode('juz'); setViewDropdownOpen(false); }}>
                                                    Juz
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* List */}
                            {loading ? (
                                <div className="loading-state">Loading...</div>
                            ) : browseMode === 'surah' ? (
                                (searchQuery ? filteredSurahs : surahs).length > 0 ? (
                                    <div className="qh-surah-list">
                                        {(searchQuery ? filteredSurahs : surahs).map(surah => (
                                            <div key={surah.number} className="qh-surah-row" onClick={() => navigate(`/quran/${surah.number}`)}>
                                                <div className="qh-surah-num">{surah.number}</div>
                                                <div className="qh-surah-info">
                                                    {lang !== 'ml' && <span className="qh-surah-en">{surah.englishName}</span>}
                                                    <span className="qh-surah-sub">{lang === 'ml' ? '' : `${surah.englishNameTranslation} • `}{surah.numberOfAyahs} {t('ayah_label')}</span>
                                                </div>
                                                <div className="qh-surah-arabic">{surah.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-search-results" style={{padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)'}}>
                                        <p>No Surah found matching "{searchQuery}"</p>
                                    </div>
                                )
                            ) : (
                                <div className="qh-surah-list">
                                    {Array.from({ length: 30 }, (_, i) => i + 1).map((num, idx) => {
                                        const start = juzMeta[idx];
                                        const nextStart = juzMeta[idx + 1];
                                        let firstSurah = '', lastSurah = '';
                                        const getSurahName = (s) => s ? (lang === 'ml' ? s.name : s.englishName) : '';
                                        if (start && surahs.length > 0) {
                                            firstSurah = getSurahName(surahs[start.surah - 1]);
                                            if (idx === 29) {
                                                lastSurah = getSurahName(surahs[113]);
                                            } else if (nextStart) {
                                                const eSurah = nextStart.ayah === 1 ? surahs[nextStart.surah - 2] : surahs[nextStart.surah - 1];
                                                lastSurah = getSurahName(eSurah);
                                            }
                                        }
                                        return (
                                            <div key={num} className="qh-surah-row" onClick={() => navigate(`/quran/juz/${num}`)}>
                                                <div className="qh-surah-num">{num}</div>
                                                <div className="qh-surah-info">
                                                    <span className="qh-surah-en">{t('juz_label')} {num}</span>
                                                    <span className="qh-surah-sub">
                                                        {firstSurah}
                                                        {lastSurah && firstSurah !== lastSurah && ` → ${lastSurah}`}
                                                    </span>
                                                </div>
                                                <div className="qh-surah-arabic" style={{ fontSize:'1.4rem' }}>
                                                    الجزء {num}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* ══════════ KHATAM TAB ══════════ */}
                {sectionTab === 'khatam' && (
                    <div className="khatam-tab-content fade-in" style={{padding: '20px 16px'}}>
                        <div className="khatam-mini-card">
                            <div className="khatam-progress-side">
                                <div className="khatam-ring-container">
                                    <svg className="khatam-svg-ring" width="80" height="80">
                                        <circle cx="40" cy="40" r="34" stroke="rgba(197,160,89,0.1)" strokeWidth="4" fill="transparent"/>
                                        <circle cx="40" cy="40" r="34" stroke="var(--primary)" strokeWidth="4" fill="transparent"
                                            strokeDasharray={2 * Math.PI * 34}
                                            strokeDashoffset={2 * Math.PI * 34 * (1 - khatamPercentage / 100)}
                                            strokeLinecap="round"
                                            style={{transition:'stroke-dashoffset 0.8s ease'}}
                                        />
                                    </svg>
                                    <span className="khatam-ring-percentage">{khatamPercentage}%</span>
                                </div>
                                <div className="khatam-meta-text">
                                    <span className="khatam-meta-title">Khatam</span>
                                    <span className="khatam-meta-read">{totalReadCount} / 6236 Ayahs Read</span>
                                </div>
                                <div className="khatam-streak-badge" style={{marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-bg)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(197,160,89,0.2)'}}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.5 19c2.5 0 4.5-2 4.5-4.5a4.5 4.5 0 0 0-4.5-4.5c-.8 0-1.5.2-2.2.6C14.8 6.8 11.5 4 7.5 4A5.5 5.5 0 0 0 2 9.5a5.5 5.5 0 0 0 5.5 5.5h10Z"/>
                                        <path d="M12 12v9"/>
                                        <path d="M8 17h8"/>
                                    </svg>
                                    <div>
                                        <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Daily Streak</div>
                                        <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)'}}>
                                            {JSON.parse(localStorage.getItem('khatamStreak') || '{"consecutiveDays":0}').consecutiveDays} Days
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="khatam-action-side">
                                {recents.length > 0 && (
                                    <div className="khatam-resume-box">
                                        <span className="resume-label">Current Position</span>
                                        <h3 className="resume-title">
                                            {recents[0].type === 'juz'
                                                ? `Juz ${recents[0].juz || recents[0].id} • ${recents[0].surahName || recents[0].englishName}`
                                                : `${recents[0].englishName || recents[0].name}`}
                                        </h3>
                                    </div>
                                )}
                                <div className="khatam-buttons">
                                    <button className="btn-khatam-primary" onClick={() => {
                                        const resume = JSON.parse(localStorage.getItem('khatamResumeState'));
                                        if (resume) {
                                            if (resume.type === 'juz') {
                                                navigate(`/quran/juz/${resume.juz}?mode=khatam`, { state: { ayah: resume.ayah } });
                                            } else {
                                                navigate(`/quran/${resume.surah}?mode=khatam`, { state: { ayah: resume.ayah } });
                                            }
                                        }
                                        else if (recents.length > 0) {
                                            const r = recents[0];
                                            if (r.type === 'juz') navigate(`/quran/juz/${r.id}?mode=khatam`, { state: { ayah: r.ayahNumber } });
                                            else navigate(`/quran/${r.id}?mode=khatam`, { state: { ayah: r.ayahNumber } });
                                        } else navigate('/quran/1?mode=khatam');
                                    }}>
                                        Continue Journey
                                    </button>
                                    <button className="btn-khatam-secondary" onClick={() => setShowResetKhatamModal(true)}>
                                        Start New Khatam
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="khatam-progress-list-section">
                            <div className="khatam-section-title">
                                <span>Quran Progress by Juz</span>
                                <span className="khatam-section-subtitle">30 Sections Completion</span>
                            </div>
                            <div className="khatam-juz-list">
                                {JUZ_DATA_LIST.map(juzItem => {
                                    const { state, pct, readCount } = getJuzProgress(juzItem);
                                    const resumeState = JSON.parse(localStorage.getItem('khatamResumeState'));
                                    const currentJuzNum = resumeState?.juz || (recents[0]?.type === 'juz' ? (recents[0]?.juz || recents[0]?.id) : null);
                                    const isActive = parseInt(currentJuzNum) === juzItem.num;
                                    
                                    return (
                                        <div 
                                            key={juzItem.num} 
                                            className={`khatam-juz-card ${state === 'Completed' ? 'completed' : ''} ${isActive ? 'current-active' : ''}`}
                                            onClick={() => navigate(`/quran/juz/${juzItem.num}?mode=khatam`)}
                                        >
                                            <div className="khatam-juz-header">
                                                <div className="khatam-juz-info">
                                                    <span className="khatam-juz-title">Juz {juzItem.num}</span>
                                                    <span className="khatam-juz-range">{juzItem.range}</span>
                                                </div>
                                                <div className="khatam-juz-status-container">
                                                    {isActive && (
                                                        <span className="current-reading-badge">Currently Reading</span>
                                                    )}
                                                    {state !== 'Not Started' && (
                                                        <span className={`khatam-juz-status-badge ${state.toLowerCase().replace(' ', '-')}`}>
                                                            {state === 'Completed' ? '✔️ Completed' : `${pct}%`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {state === 'In Progress' && (
                                                <div className="khatam-juz-progress-bar-container">
                                                    <div className="khatam-juz-progress-bar" style={{ width: `${pct}%` }}></div>
                                                </div>
                                            )}
                                            {state === 'Completed' && (
                                                <div className="khatam-juz-progress-bar-container">
                                                    <div className="khatam-juz-progress-bar completed" style={{ width: '100%' }}></div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {JSON.parse(localStorage.getItem('khatamHistory') || '[]').length > 0 && (
                            <div className="khatam-history-list-section" style={{marginTop: '32px'}}>
                                <div className="khatam-section-title">
                                    <span>Past Khatams</span>
                                    <span className="khatam-section-subtitle">Your completed journeys</span>
                                </div>
                                <div className="khatam-juz-list">
                                    {JSON.parse(localStorage.getItem('khatamHistory') || '[]').map((h, i, arr) => (
                                        <div key={i} className="khatam-juz-card completed">
                                            <div className="khatam-juz-header">
                                                <div className="khatam-juz-info">
                                                    <span className="khatam-juz-title">Khatam #{arr.length - i}</span>
                                                    <span className="khatam-juz-range">Completed on {new Date(h.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                </div>
                                                <div className="khatam-juz-status-container">
                                                    <span className="khatam-juz-status-badge completed">✔️ Completed</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}


            </main>

            {/* ── Reset Khatam Modal ── */}
            {showResetKhatamModal && (
                <div className="khatam-modal-overlay" onClick={() => setShowResetKhatamModal(false)}>
                    <div className="khatam-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="khatam-modal-title">
                            Start a new Khatam journey?
                        </h3>
                        <p className="khatam-modal-desc">
                            Your current progress will be reset.
                        </p>
                        <div className="khatam-modal-buttons">
                            <button className="khatam-modal-btn-cancel" onClick={() => setShowResetKhatamModal(false)}>
                                Cancel
                            </button>
                            <button className="khatam-modal-btn-reset" onClick={resetKhatamProgress}>
                                Start New
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}

function QuranBookmarksPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [isLightMode] = useState(localStorage.getItem('zakat_theme') !== 'dark');

    const [bookmarks, setBookmarks] = useState(() => {
        try { return JSON.parse(localStorage.getItem('quran_bookmarks') || '[]'); } catch { return []; }
    });

    // Stay in sync when other tabs/pages modify bookmarks
    useEffect(() => {
        const sync = () => {
            try { setBookmarks(JSON.parse(localStorage.getItem('quran_bookmarks') || '[]')); } catch {}
        };
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    const removeBookmark = (id) => {
        const updated = bookmarks.filter(b => b.id !== id);
        setBookmarks(updated);
        localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
    };

    const continueReading = (b) => {
        if (b.type === 'juz') {
            navigate(`/quran/juz/${b.juz}`, { state: { ayah: b.globalAyahNumber } });
        } else {
            navigate(`/quran/${b.surahId}`, { state: { ayah: b.globalAyahNumber } });
        }
    };

    const formatDate = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) +
               ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`app-layout-top ${isLightMode ? 'light-mode' : 'dark-mode'}`}>
            {/* ── Header ── */}
            <nav className="bkp-navbar">
                <button
                    className="bkp-back-btn"
                    onClick={() => navigate('/quran')}
                    aria-label="Back to Quran"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 5l-7 7 7 7"/>
                    </svg>
                </button>
                <div className="bkp-header-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="bkp-header-icon">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                    </svg>
                    <span className="bkp-header-title">Bookmarks</span>
                </div>
                <div style={{ width: 40 }} />{/* spacer to balance back button */}
            </nav>

            {/* ── Content ── */}
            <main className="bkp-main">
                {bookmarks.length === 0 ? (
                    /* ── Empty State ── */
                    <div className="bkp-empty-wrap">
                        <div className="bkp-empty-card">
                            <div className="bkp-empty-icon">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                                </svg>
                            </div>
                            <h2 className="bkp-empty-title">No bookmarks yet</h2>
                            <p className="bkp-empty-desc">
                                Bookmarks help you continue your Quran journey from where you left off.
                            </p>
                            <button className="bkp-go-quran-btn" onClick={() => navigate('/quran')}>
                                Browse Quran
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Bookmark Cards ── */
                    <div className="bkp-list">
                        <p className="bkp-count">{bookmarks.length} saved {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}</p>
                        {bookmarks.map((b) => (
                            <div key={b.id} className="bkp-card">
                                {/* Card Top: label row */}
                                <div className="bkp-card-label-row">
                                    <span className="bkp-label-badge">
                                        {b.type === 'juz' ? `Juz ${b.juz}` : 'Surah'}
                                    </span>
                                    <span className="bkp-timestamp">{formatDate(b.timestamp)}</span>
                                </div>

                                {/* Surah + Ayah title */}
                                <div className="bkp-card-title">
                                    {b.surahEnglishName}
                                    <span className="bkp-ayah-num"> · Ayah {b.ayahNumber}</span>
                                </div>

                                {/* Arabic preview */}
                                {b.text && (
                                    <div className="bkp-arabic-preview">
                                        {b.text.length > 120 ? b.text.slice(0, 120) + '…' : b.text}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="bkp-card-actions">
                                    <button
                                        className="bkp-btn-continue"
                                        onClick={() => continueReading(b)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="5 3 19 12 5 21 5 3"/>
                                        </svg>
                                        Continue Reading
                                    </button>
                                    <button
                                        className="bkp-btn-remove"
                                        onClick={() => removeBookmark(b.id)}
                                        aria-label="Remove bookmark"
                                        title="Remove bookmark"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6l-1 14H6L5 6"/>
                                            <path d="M10 11v6M14 11v6"/>
                                            <path d="M9 6V4h6v2"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}



// --- KHATAM AUTO-TRACKER HOOK ---
function useKhatamTracker(dataObj, viewMode, isJuz = false) {
    useEffect(() => {
        if (!dataObj) return;

        let timers = {};

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.id;
                if (!id) return;
                const globalAyahNum = parseInt(id.replace('ayah-', ''), 10);
                
                if (entry.isIntersecting) {
                    timers[globalAyahNum] = setTimeout(() => {
                        let sNum, juzNum, pageNum;
                        
                        if (isJuz) {
                            const a = dataObj.ayahs.find(ay => ay.number === globalAyahNum);
                            if (!a) return;
                            sNum = a.surah.number;
                            juzNum = dataObj.number;
                            pageNum = a.page;
                        } else {
                            const a = dataObj.ayahs.find(ay => ay.number === globalAyahNum);
                            if (!a) return;
                            sNum = dataObj.number;
                            juzNum = a.juz;
                            pageNum = a.page;
                        }

                        const currentFurthest = parseInt(localStorage.getItem('khatamFurthestAyah') || '0', 10);
                        if (globalAyahNum > currentFurthest) {
                            localStorage.setItem('khatamFurthestAyah', globalAyahNum.toString());
                            
                            // Check completion
                            if (globalAyahNum >= 6236) {
                                window.dispatchEvent(new CustomEvent('khatam_completed'));
                            }
                            
                            // Update streak
                            const todayStr = new Date().toISOString().split('T')[0];
                            const streak = JSON.parse(localStorage.getItem('khatamStreak') || '{"lastReadDate":"","consecutiveDays":0,"totalSessions":0}');
                            if (streak.lastReadDate !== todayStr) {
                                const yesterday = new Date();
                                yesterday.setDate(yesterday.getDate() - 1);
                                if (streak.lastReadDate === yesterday.toISOString().split('T')[0]) {
                                    streak.consecutiveDays += 1;
                                } else {
                                    streak.consecutiveDays = 1;
                                }
                                streak.totalSessions += 1;
                                streak.lastReadDate = todayStr;
                                localStorage.setItem('khatamStreak', JSON.stringify(streak));
                                window.dispatchEvent(new Event('khatam_streak_updated'));
                            }
                            
                            // Trigger re-render to update UI (like progress bars)
                            window.dispatchEvent(new Event('storage'));
                        }

                        // Update resume state exactly to this position
                        localStorage.setItem('khatamResumeState', JSON.stringify({
                            surah: sNum,
                            ayah: globalAyahNum,
                            juz: juzNum,
                            page: pageNum,
                            type: isJuz ? 'juz' : 'surah',
                            timestamp: Date.now()
                        }));

                    }, 1200);
                } else {
                    if (timers[globalAyahNum]) {
                        clearTimeout(timers[globalAyahNum]);
                        delete timers[globalAyahNum];
                    }
                }
            });
        }, { threshold: 0.5 });

        const initObserver = setTimeout(() => {
            document.querySelectorAll('.ayah-card, .page-ayah-item').forEach(el => observer.observe(el));
        }, 1500);

        return () => {
            clearTimeout(initObserver);
            observer.disconnect();
            Object.values(timers).forEach(clearTimeout);
        };
    }, [dataObj, viewMode, isJuz]);
}

function SurahDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get('mode');
    
    const [surah, setSurah] = useState(null);
    const [loading, setLoading] = useState(true);
    const { lang, setLang, t } = useLanguage();
    const [isLightMode, setIsLightMode] = useState(localStorage.getItem('zakat_theme') !== 'dark');
    const [reciter, setReciter] = useState('ar.alafasy');
    const [viewMode, setViewMode] = useState('ayah'); // 'ayah' or 'page'
    const [playingAyah, setPlayingAyah] = useState(null);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const playbackRateRef = useRef(1);
    const [userScrolling, setUserScrolling] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    useKhatamTracker(surah, viewMode, false);
    const [toastMessage, setToastMessage] = useState('');
    const [allSurahs, setAllSurahs] = useState([]);

    useEffect(() => {
        const cached = localStorage.getItem('all_surahs_meta');
        if (cached) {
            try { setAllSurahs(JSON.parse(cached)); } catch {}
        } else {
            fetch('https://api.alquran.cloud/v1/surah')
                .then(r => r.json())
                .then(d => {
                    if (d.data) {
                        setAllSurahs(d.data);
                        localStorage.setItem('all_surahs_meta', JSON.stringify(d.data));
                    }
                }).catch(() => {});
        }
    }, []);

    const [bookmarksArray, setBookmarksArray] = useState(() => {
        try { return JSON.parse(localStorage.getItem('quran_bookmarks')) || []; } catch { return []; }
    });

    useEffect(() => {
        const handleStorageChange = () => {
            try { setBookmarksArray(JSON.parse(localStorage.getItem('quran_bookmarks')) || []); } catch {}
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const isBookmarkedAyah = (globalAyahNum) => bookmarksArray.some(b => b.globalAyahNumber === globalAyahNum);

    const showToast = (msg) => {
        window.showToastFn = showToast;
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };
    const handleBookmark = (ayah) => {
        const currentBookmarks = JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
        if (isBookmarkedAyah(ayah.number)) {
            const updated = currentBookmarks.filter(b => b.globalAyahNumber !== ayah.number);
            localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
            showToast(t('bookmark_removed') || 'Bookmark removed');
        } else {
            const newBookmark = {
                id: `surah-${surah.number}-${ayah.numberInSurah}`,
                type: 'surah',
                surahId: surah.number,
                surahEnglishName: surah.englishName,
                ayahNumber: ayah.numberInSurah,
                globalAyahNumber: ayah.number,
                text: ayah.text,
                timestamp: Date.now()
            };
            const updated = [newBookmark, ...currentBookmarks];
            localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
            showToast(t('bookmark_saved') || 'Bookmark saved');
        }
        setActiveMenu(null);
    };

    const markSessionComplete = (ayah) => {
        localStorage.setItem('khatamFurthestAyah', ayah.number.toString());
        localStorage.setItem('khatamResumeState', JSON.stringify({
            surah: surah.number,
            ayah: ayah.number,
            juz: ayah.juz,
            page: ayah.page,
            type: 'surah',
            timestamp: Date.now()
        }));
        showToast(t('session_marked_complete') || 'Reading Session Completed');
        setActiveMenu(null);
        window.dispatchEvent(new Event('storage'));
    };

    const [favorites, setFavorites] = useState(() => {
        try { return JSON.parse(localStorage.getItem('quran_favorites') || '[]'); } catch { return []; }
    });

    useEffect(() => {
        const handleStorageChange = () => {
            try { setFavorites(JSON.parse(localStorage.getItem('quran_favorites') || '[]')); } catch {}
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const isStarred = (ayahNum) => {
        return favorites.some(f => f.ayahNumber === ayahNum);
    };

    const toggleStar = (ayah) => {
        if (isStarred(ayah.number)) {
            const newFavs = favorites.filter(f => f.ayahNumber !== ayah.number);
            localStorage.setItem('quran_favorites', JSON.stringify(newFavs));
            setFavorites(newFavs);
            window.dispatchEvent(new Event('storage'));
            showToast(t('removed_from_favorites') || 'Removed from Favorites');
        } else {
            const previewText = ayah.text ? (ayah.text.length > 60 ? ayah.text.substring(0, 60) + '...' : ayah.text) : '';
            const pin = {
                id: surah.number,
                englishName: surah.englishName,
                name: surah.name,
                ayahNumber: ayah.number,
                ayahNumberInSurah: ayah.numberInSurah,
                previewText: previewText,
                timestamp: Date.now(),
                type: 'surah'
            };
            const newFavs = [...favorites, pin];
            localStorage.setItem('quran_favorites', JSON.stringify(newFavs));
            setFavorites(newFavs);
            window.dispatchEvent(new Event('storage'));
            showToast(t('added_to_favorites') || 'Added to Favorites');
        }
        setActiveMenu(null);
    };

    const [bookmarks, setBookmarks] = useState(JSON.parse(localStorage.getItem('bookmarks') || '[]'));
    const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
    
    // Quran Reading Settings Modal States
    const [quranTheme, setQuranTheme] = useState(localStorage.getItem('quran_theme') || 'modern');
    const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('quran_font_size') || '24'));
    const [showTranslation, setShowTranslation] = useState(localStorage.getItem('quran_show_translation') !== 'false');
    const [showTransliteration, setShowTransliteration] = useState(localStorage.getItem('quran_show_transliteration') !== 'false');

    const toggleBookmark = (surahNum, ayahNum, surahName) => {
        let newBookmarks = [...bookmarks];
        const index = newBookmarks.findIndex(b => b.surah === surahNum && b.ayah === ayahNum);
        
        if (index > -1) {
            newBookmarks.splice(index, 1);
        } else {
            newBookmarks.push({ surah: surahNum, ayah: ayahNum, surahName });
        }
        
        localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
        setBookmarks(newBookmarks);
        setActiveMenu(null);
    };

    const isBookmarked = (surahNum, ayahNum) => {
        return bookmarks.some(b => b.surah === surahNum && b.ayah === ayahNum);
    };

    const audioRef = useRef(null);

    useEffect(() => {
        console.log(`[DEBUG] Reciter selected: ${reciter}`);
        if (playingAyah !== null && audioRef.current) {
            const wasPlaying = !audioRef.current.paused;
            // The Ayah number to fetch (if 0, it means we are playing the Bismillah preamp which corresponds to Ayah 1's audio file)
            const targetAyah = playingAyah === 0 ? 1 : playingAyah;
            
            // Only update if we're actually changing reciters while an ayah is active
            const url = getAudioUrl(reciter, targetAyah);
            if (audioRef.current.src !== url) {
                audioRef.current.src = url;
                audioRef.current.load();
                audioRef.current.playbackRate = playbackRateRef.current || 1;
                if (wasPlaying) {
                    audioRef.current.play().catch(err => console.error("Audio playback error on reciter switch:", err));
                }
            }
        }
    }, [reciter]);

    const initialAyah = location.state?.ayah;

    // Recents Tracking
    useEffect(() => {
        if (surah && !loading) {
            const recentsRepo = JSON.parse(localStorage.getItem('quran_recents') || '[]');
            const currentAyahObj = surah.ayahs.find(a => a.number === playingAyah) || surah.ayahs[0];
            
            const newRecent = {
                id: surah.number,
                englishName: surah.englishName,
                name: surah.name,
                juz: currentAyahObj?.juz || 0,
                ayahNumber: currentAyahObj?.number || 0, // Global index for navigation
                ayahNumberInSurah: currentAyahObj?.numberInSurah || 0, // Surah index for progress
                totalAyahs: surah.numberOfAyahs, // Total ayahs in surah for progress
                timestamp: Date.now(),
                type: 'surah'
            };
            const filtered = recentsRepo.filter(r => r.id !== surah.number || r.type !== 'surah');
            localStorage.setItem('quran_recents', JSON.stringify([newRecent, ...filtered].slice(0, 5)));

            // Save specific Khatam resume state
            if (mode === 'khatam') {
                localStorage.setItem("khatamResumeState", JSON.stringify({
                    surah: surah.number,
                    ayah: currentAyahObj?.number || 0
                }));
            }
        }
    }, [surah, loading, playingAyah, mode]);

    // Scroll to initial ayah
    useEffect(() => {
        if (initialAyah && !loading && surah) {
            setTimeout(() => {
                const el = document.getElementById(`ayah-${initialAyah}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 600);
        }
    }, [surah, loading, initialAyah]);

    // User scroll detection
    useEffect(() => {
        let scrollTimeout;
        const handleScroll = () => {
            setUserScrolling(true);
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                setUserScrolling(false);
            }, 2000);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-scroll to playing ayah smoothly and gently
    useEffect(() => {
        if (playingAyah && playingAyah > 0 && !userScrolling) {
            const el = document.getElementById(`ayah-${playingAyah}`);
            if (el) {
                // Gently center the newly active ayah without jumping violently
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [playingAyah, userScrolling]);

    // t is provided by useLanguage

    useEffect(() => {
        setLoading(true);
        // Map language to Quran translation edition
        const translationEdition = lang === 'ml' ? 'ml.abdulhameed' : 'en.asad';
        
        // Fetch clean Arabic text (quran-uthmani), selected translation, and audio recitation
        fetch(`https://api.alquran.cloud/v1/surah/${id}/editions/quran-uthmani,${translationEdition}`)
            .then(res => res.json())
            .then(data => {
                const arabic = data.data[0];
                const translation = data.data[1];
                // const audio = data.data[2]; // Removed
                
                const structuredAyahs = arabic.ayahs.map((ayah, index) => ({
                    number: ayah.number,
                    numberInSurah: ayah.numberInSurah,
                    text: ayah.text,
                    translation: translation.ayahs[index].text,
                    // audio mapping removed since we use getAudioUrl
                    page: ayah.page,
                    juz: ayah.juz
                }));

                const combinedSurah = {
                    ...arabic,
                    ayahs: structuredAyahs
                };
                setSurah(combinedSurah);
                setLoading(false);

                // Auto-play if moving from previous surah
                if (location.state?.autoPlay) {
                    setTimeout(() => {
                        const firstAyah = combinedSurah.ayahs[0];
                        if (firstAyah) {
                            handlePlayAudio(firstAyah.number, getAudioUrl(reciter, firstAyah.number));
                        }
                    }, 500);
                    // Clear state to avoid replay on manual refresh
                    window.history.replaceState({ ...location.state, autoPlay: false }, document.title);
                }
            })
            .catch(err => {
                console.error("Error fetching surah details:", err);
                setLoading(false);
            });
    }, [id, lang, location.state]);

    const switchLang = (l) => setLang(l);

    useEffect(() => {
        if (isLightMode) {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('zakat_theme', 'light');
        } else {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
            localStorage.setItem('zakat_theme', 'dark');
        }
    }, [isLightMode]);

    useEffect(() => {
        playbackRateRef.current = playbackRate;
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        
        const audio = audioRef.current;
        audio.playbackRate = playbackRateRef.current;
        
        const handlePlay = () => setIsAudioPlaying(true);
        const handlePause = () => setIsAudioPlaying(false);
        
        const handleLoadStart = () => {
            console.log(`[DEBUG] Audio loading started for: ${audio.src}`);
        };
        const handleError = (e) => {
            console.error(`[DEBUG] Audio loading error for ${audio.src}: `, e);
            if(window.showToastFn) window.showToastFn(t('audio_load_failed'));
            setPlayingAyah(null);
        };

        const handleLoadedMetadata = () => {
            audio.playbackRate = playbackRateRef.current;
        };
        
        const handleEnded = () => {
            setPlayingAyah(currentNum => {
                if (currentNum === null) return null;
                
                let nextAyah;
                // If Bismillah preamp finished, play first ayah of surah
                if (currentNum === 0) {
                    nextAyah = surah?.ayahs[0];
                } else {
                    const nextNum = currentNum + 1;
                    nextAyah = surah?.ayahs?.find(a => a.number === nextNum);
                }
                
                if (nextAyah) {
                    // Ayah tracking is handled automatically

                    audio.pause();
                    audio.src = getAudioUrl(reciter, nextAyah.number);
                    audio.load();
                    audio.playbackRate = playbackRateRef.current;
                    audio.play().catch(err => {
                        if (err.name !== 'AbortError') console.error("Audio playback error:", err);
                    });
                    return nextAyah.number;
                } else {
                    // End of surah reached
                    const nextSurahNum = (surah?.number || 0) + 1;
                    if (nextSurahNum <= 114) {
                        setTimeout(() => {
                            const nextUrl = mode === 'khatam' 
                                ? `/quran/${nextSurahNum}?mode=khatam` 
                                : `/quran/${nextSurahNum}`;
                            navigate(nextUrl, { state: { autoPlay: true } });
                        }, 100);
                    } else {
                        setTimeout(() => {
                            alert("Khatam Completed! Alhamdulillah.");
                        }, 500);
                    }
                    return null;
                }
            });
        };

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('error', handleError);
        audio.addEventListener('ended', handleEnded);
        
        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
            audio.src = "";
        };
    }, [surah]);

    const handlePlayAudio = (ayahNum, audioUrl) => {
        const audio = audioRef.current;

        // Bismillah Preamp Logic: If starting playback from Ayah 1 (global number check)
        if (ayahNum === surah?.ayahs[0]?.number && surah?.number !== 1 && surah?.number !== 9 && playingAyah === null) {
            audio.src = getAudioUrl(reciter, 1);
            audio.load();
            audio.playbackRate = playbackRateRef.current;
            audio.play().catch(err => console.error("Audio playback error:", err));
            setPlayingAyah(0);
            return;
        }

        if (playingAyah === ayahNum) {
            if (audio.paused) {
                audio.playbackRate = playbackRateRef.current;
                audio.play().catch(err => console.error("Audio playback error:", err));
            } else {
                audio.pause();
            }
        } else {
            audio.src = audioUrl;
            audio.load();
            audio.playbackRate = playbackRateRef.current;
            audio.play().catch(err => console.error("Audio playback error:", err));
            setPlayingAyah(ayahNum);
        }
    };

    const playSurah = () => {
        if (surah && surah.ayahs.length > 0) {
            if (playingAyah !== null) {
                if (isAudioPlaying) {
                    audioRef.current.pause();
                } else {
                    audioRef.current.playbackRate = playbackRate;
                    audioRef.current.play().catch(err => console.error(err));
                }
            } else {
                if (surah.number !== 1 && surah.number !== 9) {
                    handlePlayAudio(0, getAudioUrl(reciter, 1));
                } else {
                    handlePlayAudio(surah.ayahs[0].number, getAudioUrl(reciter, surah.ayahs[0].number));
                }
            }
        }
    };


    return (
        <div className={`app-container theme-${quranTheme} ${isLightMode ? 'light-mode' : 'dark-mode'}`}>
            <nav className="top-navbar-refined">
                <button 
                    className="btn-settings" 
                    style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
                    onClick={() => navigate(mode === 'khatam' ? '/quran?khatam=true' : '/quran')}
                >
                    {BACK_ICON}
                </button>

                <div className="header-title">
                    {loading ? '...' : surah?.englishName}
                </div>



                <div className="top-menu-container" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="btn-three-dots" onClick={() => setIsTopMenuOpen(!isTopMenuOpen)}>⋮</button>
                    
                    {isTopMenuOpen && (
                        <>
                            <div className="menu-overlay" onClick={() => setIsTopMenuOpen(false)}></div>
                            <div className="premium-settings-menu fade-in">
                                <div className="premium-menu-section" onClick={(e) => e.stopPropagation()}>
                                    <span className="premium-menu-label">A {t('text_size') || 'Text Size'}</span>
                                    <div className="text-size-controls">
                                        <button className="text-size-btn" onClick={() => { setFontSize(Math.max(16, fontSize - 2)); localStorage.setItem('quran_font_size', Math.max(16, fontSize - 2)); }}>A−</button>
                                        <button className="text-size-btn default" onClick={() => { setFontSize(24); localStorage.setItem('quran_font_size', 24); }}>{t('default') || 'Default'}</button>
                                        <button className="text-size-btn" onClick={() => { setFontSize(Math.min(48, fontSize + 2)); localStorage.setItem('quran_font_size', Math.min(48, fontSize + 2)); }}>A+</button>
                                    </div>
                                </div>

                                <div className="premium-menu-section" onClick={(e) => e.stopPropagation()}>
                                    <span className="premium-menu-label">🎤 {t('reciter') || 'Reciter'}</span>
                                    <div className="reciter-options">
                                        {[
                                            { id: 'ar.alafasy', name: 'Alafasy' },
                                            { id: 'ar.abdulsamad', name: 'Abdul Basit' },
                                            { id: 'ar.minshawi', name: 'Minshawi' },
                                            { id: 'ar.hudhaify', name: 'Hudhaify' }
                                        ].map(r => (
                                            <button 
                                                key={r.id}
                                                className={`reciter-btn ${reciter === r.id ? 'active' : ''}`}
                                                onClick={() => { setReciter(r.id); setIsTopMenuOpen(false); }}
                                            >
                                                {r.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </nav>

            <main className={`surah-detail-content fade-in quran-container ${viewMode === 'page' ? 'page-mode' : ''}`}>
                <div className="view-mode-toggle-wrapper">
                    <div className="view-mode-quick-toggle">
                        <button 
                            className={`toggle-btn ${viewMode === 'ayah' ? 'active' : ''}`}
                            onClick={() => setViewMode('ayah')}
                        >
                            {t('reading_tab') || 'Reading'}
                        </button>
                        <button 
                            className={`toggle-btn ${viewMode === 'page' ? 'active' : ''}`}
                            onClick={() => setViewMode('page')}
                        >
                            {t('page_view') || 'Page'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">{t('loading')}</div>
                ) : surah ? (
                    <>
                        <header className="detail-header-refined" style={{ padding: '20px 16px', marginBottom: '20px' }}>
                            <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{surah.englishName}</h1>
                            <p className="arabic-title" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{surah.name}</p>
                            <div className="surah-meta" style={{ fontSize: '0.7rem' }}>
                                <span>{surah.revelationType === 'Meccan' ? t('revelation_meccan') : t('revelation_medinan')}</span> • <span>{surah.numberOfAyahs} {t('ayahs_label')}</span>
                            </div>
                            <div className="surah-playback-actions">
                                <button className="btn-play-surah" onClick={playSurah}>
                                    {PLAY_ICON}
                                    <span>{t('play_surah') || 'Play Surah'}</span>
                                </button>
                            </div>
                        </header>


                        {viewMode === 'ayah' ? (
                            <div className="ayahs-view-container">
                                <div className="ayahs-list">
                                    {surah.ayahs.map((ayah, idx) => {
                                        let displayText = ayah.text;
                                        
                                        return (
                                            <div 
                                                key={ayah.number} 
                                                id={`ayah-${ayah.number}`}
                                                className={`ayah-card ${playingAyah === ayah.number ? 'playing active-ayah' : ''}`}
                                            >
                                                {isBookmarkedAyah(ayah.number) && (
                                                    <div className="ayah-bookmarked-badge">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                                                    </div>
                                                )}
                                                <button 
                                                    className="ayah-actions-dots" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenu(activeMenu === ayah.number ? null : ayah.number);
                                                    }}
                                                >
                                                    ⋮
                                                </button>
                                                {activeMenu === ayah.number && (
                                                    <div className="ayah-action-menu" onClick={e => e.stopPropagation()}>
                                                        <div className="menu-item" onClick={() => markSessionComplete(ayah)}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                                                            <span>{t('mark_session_complete') || 'Mark Session Complete'}</span>
                                                        </div>
                                                        <div className="menu-item" onClick={() => handleBookmark(ayah)}>
                                                            {isBookmarkedAyah(ayah.number) ? (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                                                            ) : (
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                                                            )}
                                                            <span style={isBookmarkedAyah(ayah.number) ? { color: 'var(--primary)' } : {}}>{isBookmarkedAyah(ayah.number) ? (t('remove_bookmark') || 'Remove Bookmark') : (t('bookmark') || 'Bookmark')}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="ayah-top">
                                                    <div className="ayah-info">
                                                        <button 
                                                            className="btn-audio-play" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePlayAudio(ayah.number, getAudioUrl(reciter, ayah.number));
                                                            }}
                                                        >
                                                            {playingAyah === ayah.number && isAudioPlaying ? PAUSE_ICON : PLAY_ICON}
                                                        </button>
                                                        <span className="ayah-index-arabic">{ayah.numberInSurah}</span>
                                                    </div>
                                                    <div className="ayah" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
                                                        {displayText} <span className="ayah-number-inline">﴿{toArabicNumerals(ayah.numberInSurah)}﴾</span>
                                                    </div>
                                                </div>
                                                {showTranslation && (
                                                    <p className="ayah-translation">{ayah.translation}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="surah-page-view-wrapper">
                                <div className="surah-page-view">
                                <div className="page-text-block">
                                    {(() => {
                                        const pages = [];
                                        let currentPage = null;
                                        const startPage = surah.ayahs[0]?.page || 1;

                                        surah.ayahs.forEach((ayah, idx) => {
                                            if (!currentPage || ayah.page !== currentPage.globalPage) {
                                                currentPage = {
                                                    globalPage: ayah.page,
                                                    relativePage: ayah.page - startPage + 1,
                                                    juz: ayah.juz,
                                                    ayahs: []
                                                };
                                                pages.push(currentPage);
                                            }
                                            currentPage.ayahs.push(ayah);
                                        });

                                        return pages.map((page, pIdx) => (
                                            <div key={pIdx} className="mushaf-page-section">
                                                {pIdx > 0 && (
                                                    <div className="mushaf-page-divider">
                                                        <span className="page-line"></span>
                                                        <span className="page-number-marker">{t('page')} {page.relativePage}</span>
                                                        <span className="page-line"></span>
                                                    </div>
                                                )}
                                                <div className="mushaf-page-content">
                                                    {page.ayahs.map((ayah, aIdx) => {
                                                        let bismillahText = null;
                                                        let displayText = ayah.text;

                                                        if (surah.number !== 1 && surah.number !== 9 && ayah.numberInSurah === 1) {
                                                            const standardBismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
                                                            const simpleBismillah = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
                                                            
                                                            if (displayText.startsWith(standardBismillah)) {
                                                                bismillahText = standardBismillah;
                                                                displayText = displayText.slice(standardBismillah.length).trim();
                                                            } else if (displayText.startsWith(simpleBismillah)) {
                                                                bismillahText = simpleBismillah;
                                                                displayText = displayText.slice(simpleBismillah.length).trim();
                                                            } else {
                                                                const searchPhrase = "ٱلرَّحِيمِ";
                                                                const searchPhraseBackup = "الرَّحِيمِ";
                                                                const searchPhraseBackup2 = "الرحيم";
                                                                
                                                                let idx = displayText.indexOf(searchPhrase);
                                                                let phraseLen = searchPhrase.length;
                                                                if (idx === -1) {
                                                                    idx = displayText.indexOf(searchPhraseBackup);
                                                                    phraseLen = searchPhraseBackup.length;
                                                                }
                                                                if (idx === -1) {
                                                                    idx = displayText.indexOf(searchPhraseBackup2);
                                                                    phraseLen = searchPhraseBackup2.length;
                                                                }
                                                                
                                                                if (idx !== -1 && idx < 50) {
                                                                    bismillahText = displayText.slice(0, idx + phraseLen).trim();
                                                                    displayText = displayText.slice(idx + phraseLen).trim();
                                                                }
                                                            }
                                                        }

                                                        return (
                                                            <React.Fragment key={ayah.number}>
                                                                {bismillahText && (
                                                                    <div className="mushaf-bismillah" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
                                                                        {bismillahText}
                                                                    </div>
                                                                )}
                                                                <span 
                                                                    id={`ayah-${ayah.number}`}
                                                                    className={`page-ayah-item ${playingAyah === ayah.number ? 'playing' : ''}`}
                                                                    onClick={() => handlePlayAudio(ayah.number, getAudioUrl(reciter, ayah.number))}
                                                                    style={{ fontSize: `${fontSize}px`, lineHeight: 2.2 }}
                                                                >
                                                                    {displayText} <span className="ayah-number-badge">{toArabicNumerals(ayah.numberInSurah)}</span>
                                                                </span>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </div>
                                                <div className="mushaf-page-footer">
                                                    <div className="juz-indicator">Juz {page.juz || '...'}</div>
                                                    {pIdx === 0 && <div className="relative-page-indicator">{t('page')} {page.relativePage}</div>}
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="error-state">Surah not found.</div>
                )}
                {mode === 'khatam' && surah && surah.number < 114 && (
                    <div className="khatam-footer-nav fade-in" style={{ marginBottom: playingAyah ? '100px' : '0' }}>
                        <button 
                            className="btn-next-surah"
                            onClick={() => navigate(`/quran/${surah.number + 1}?mode=khatam`)}
                        >
                            Next Surah: {surah.number + 1} →
                        </button>
                    </div>
                )}

                {/* Surah Navigation (Floating/Fixed Bottom) */}
                {surah && mode !== 'khatam' && (
                    <div className="surah-navigation-floating fade-in">
                        <button 

                            className={`surah-nav-btn prev ${surah.number === 1 ? 'disabled' : ''}`}
                            onClick={() => {
                                if (surah.number > 1) {
                                    navigate(`/quran/${surah.number - 1}${mode ? `?mode=${mode}` : ''}`, { state: { autoPlay: false } });
                                    window.scrollTo(0, 0);
                                }
                            }}
                            disabled={surah.number === 1}
                        >
                            <span className="nav-icon">◀</span>
                            <div className="nav-text-group">
                                <span className="nav-label">{t('previous') || 'Previous'}</span>
                                <span className="nav-surah-name">{surah.number > 1 && allSurahs.length > 0 ? allSurahs[surah.number - 2].englishName : 'Surah'}</span>
                            </div>
                        </button>
                        <button 
                            className={`surah-nav-btn next ${surah.number === 114 ? 'disabled' : ''}`}
                            onClick={() => {
                                if (surah.number < 114) {
                                    navigate(`/quran/${surah.number + 1}${mode ? `?mode=${mode}` : ''}`, { state: { autoPlay: false } });
                                    window.scrollTo(0, 0);
                                }
                            }}
                            disabled={surah.number === 114}
                        >
                            <div className="nav-text-group" style={{ alignItems: 'flex-end' }}>
                                <span className="nav-label">{t('next') || 'Next'}</span>
                                <span className="nav-surah-name">{surah.number < 114 && allSurahs.length > 0 ? allSurahs[surah.number].englishName : 'Surah'}</span>
                            </div>
                            <span className="nav-icon">▶</span>
                        </button>
                    </div>
                )}

            </main>

            {toastMessage && (
                <div className="notification-container">
                    <div className="notification-toast">
                        <span className="notification-icon">✨</span>
                        <span className="notification-text">{toastMessage}</span>
                    </div>
                </div>
            )}

            {playingAyah === null && (
                <AutoScrollControl isVisible={true} />
            )}

            {playingAyah !== null && (
                <div className="sticky-audio-player fade-in-up">
                    <div className="sap-info">
                        <span className="sap-ayah-badge">Ayah {surah?.ayahs?.find(a => a.number === playingAyah)?.numberInSurah}</span>
                        <span className="sap-status">Playing</span>
                    </div>
                    
                    <div className="sap-speed-pills">
                        {[0.75, 1, 1.25, 1.5, 2].map(rate => (
                            <button 
                                key={rate} 
                                className={`speed-pill ${playbackRate === rate ? 'active' : ''}`}
                                onClick={() => setPlaybackRate(rate)}
                            >
                                {rate}x
                            </button>
                        ))}
                    </div>

                    <button className="sap-play-pause" onClick={() => {
                        if (audioRef.current.paused) {
                            audioRef.current.playbackRate = playbackRate;
                            audioRef.current.play().catch(err => console.error(err));
                        } else {
                            audioRef.current.pause();
                        }
                    }}>
                        {playingAyah !== null && isAudioPlaying ? PAUSE_ICON : PLAY_ICON}
                    </button>
                    
                    <button className="sap-close" onClick={() => {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                        setPlayingAyah(null);
                    }}>×</button>
                </div>
            )}
        </div>
    );
}

function AdminPanel() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminUser, setAdminUser] = useState('');
    const [adminPass, setAdminPass] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (adminUser === 'admin' && adminPass === 'zakat@2026') {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Invalid Developer Credentials');
        }
    };

    const handleWipeAll = () => {
        if (confirm('CRITICAL ACTION: This will permanently delete ALL records, groups, and calculator data for EVERY email in the system. Are you absolutely sure?')) {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('zakat_')) keysToRemove.push(key);
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            alert('System Reset Complete. All user data has been removed.');
            window.location.reload();
        }
    };

    const adminStats = useMemo(() => {
        let totalAmount = 0;
        let totalRecipients = new Set();
        const users = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('zakat_records_')) {
                const email = key.replace('zakat_records_', '');
                const userRecords = JSON.parse(localStorage.getItem(key)) || [];
                const userTotal = userRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
                users.push({ email, recordCount: userRecords.length, totalDonated: userTotal });
                totalAmount += userTotal;
                userRecords.forEach(r => totalRecipients.add(r.recipient));
            }
        }
        return { totalAmount, totalUsers: users.length, totalRecipients: totalRecipients.size, users };
    }, []);

    if (!isAuthenticated) {
        return (
            <div className="auth-container fade-in">
                <form className="auth-card" onSubmit={handleLogin}>
                    <div className="logo-section">
                        <div className="logo-icon">🛠️</div>
                        <h1>Admin<span>Portal</span></h1>
                        <p>Developer Access Only</p>
                    </div>
                    <div className="auth-content ad-log" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                        {error && <div className="auth-error-msg">{error}</div>}
                        <input type="text" placeholder="Username" value={adminUser} onChange={e => setAdminUser(e.target.value)} required style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: 'white' }} />
                        <input type="password" placeholder="Password" value={adminPass} onChange={e => setAdminPass(e.target.value)} required style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: 'white' }} />
                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>Enter Admin Mode</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <nav className="sidebar">
                <div className="sidebar-brand"><div className="logo-icon">🌙</div><h2>Admin View</h2></div>
                <div className="nav-links">
                    <div className="nav-item active">Global Audit</div>
                    <div className="nav-item" onClick={() => window.location.href = '/'}>Exit Admin</div>
                </div>
            </nav>
            <main className="main-content fade-in">
                <header className="page-header">
                    <div className="header-info">
                        <h1>System-Wide Overview</h1>
                        <p>Aggregated data from all local storage entries</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-icon danger sm" onClick={handleWipeAll} title="Wipe All System Data">🗑️ Wipe All Data</button>
                    </div>
                </header>
                <section className="stats-grid">
                    <div className="stat-card" style={{ borderColor: 'var(--primary)' }}>
                        <div className="stat-label">Global Impact</div>
                        <div className="stat-value">₹{adminStats.totalAmount.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Registered Donors</div>
                        <div className="stat-value">{adminStats.totalUsers}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Total Recipients</div>
                        <div className="stat-value">{adminStats.totalRecipients}</div>
                    </div>
                </section>
                <section className="data-table-container white-bg-table">
                    <div className="table-header"><h3>{t('active_donor_list')}</h3></div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr><th>User Email</th><th>Entries</th><th>Total Impact</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {adminStats.users.map((u, i) => (
                                    <tr key={i}>
                                        <td>{u.email}</td>
                                        <td>{u.recordCount}</td>
                                        <td>₹{u.totalDonated.toLocaleString('en-IN')}</td>
                                        <td><span className="badge badge-success">Verified</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}

const JuzDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const mode = queryParams.get('mode');
    const initialAyah = location.state?.ayah;

    const [juzData, setJuzData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('ayah');
    const [reciter, setReciter] = useState('ar.alafasy');
    const [playingAyah, setPlayingAyah] = useState(null);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const playbackRateRef = useRef(1);
    const [userScrolling, setUserScrolling] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    useKhatamTracker(juzData, viewMode, true);
    const [toastMessage, setToastMessage] = useState('');

    const [bookmarksArray, setBookmarksArray] = useState(() => {
        try { return JSON.parse(localStorage.getItem('quran_bookmarks')) || []; } catch { return []; }
    });

    useEffect(() => {
        const handleStorageChange = () => {
            try { setBookmarksArray(JSON.parse(localStorage.getItem('quran_bookmarks')) || []); } catch {}
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const isBookmarkedAyah = (globalAyahNum) => bookmarksArray.some(b => b.globalAyahNumber === globalAyahNum);

    const showToast = (msg) => {
        window.showToastFn = showToast;
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleBookmark = (ayah) => {
        const currentBookmarks = JSON.parse(localStorage.getItem('quran_bookmarks') || '[]');
        if (isBookmarkedAyah(ayah.number)) {
            const updated = currentBookmarks.filter(b => b.globalAyahNumber !== ayah.number);
            localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
            showToast(t('bookmark_removed') || 'Bookmark removed');
        } else {
            const newBookmark = {
                id: `juz-${id}-${ayah.number}`,
                type: 'juz',
                juz: id,
                surahId: ayah.surah.number,
                surahEnglishName: ayah.surah.englishName,
                ayahNumber: ayah.numberInSurah,
                globalAyahNumber: ayah.number,
                text: ayah.text,
                timestamp: Date.now()
            };
            const updated = [newBookmark, ...currentBookmarks];
            localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
            showToast(t('bookmark_saved') || 'Bookmark saved');
        }
        setActiveMenu(null);
    };

    const markSessionComplete = (ayah) => {
        localStorage.setItem('khatamFurthestAyah', ayah.number.toString());
        localStorage.setItem('khatamResumeState', JSON.stringify({
            surah: ayah.surah.number,
            ayah: ayah.number,
            juz: juzData.number,
            page: ayah.page,
            type: 'juz',
            timestamp: Date.now()
        }));
        showToast(t('session_marked_complete') || 'Reading Session Completed');
        setActiveMenu(null);
        window.dispatchEvent(new Event('storage'));
    };

    const [favorites, setFavorites] = useState(() => {
        try { return JSON.parse(localStorage.getItem('quran_favorites') || '[]'); } catch { return []; }
    });

    useEffect(() => {
        const handleStorageChange = () => {
            try { setFavorites(JSON.parse(localStorage.getItem('quran_favorites') || '[]')); } catch {}
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const isStarred = (ayahNum) => {
        return favorites.some(f => f.ayahNumber === ayahNum);
    };

    const toggleStar = (ayah) => {
        if (isStarred(ayah.number)) {
            const newFavs = favorites.filter(f => f.ayahNumber !== ayah.number);
            localStorage.setItem('quran_favorites', JSON.stringify(newFavs));
            setFavorites(newFavs);
            window.dispatchEvent(new Event('storage'));
            showToast(t('removed_from_favorites') || 'Removed from Favorites');
        } else {
            const previewText = ayah.text ? (ayah.text.length > 60 ? ayah.text.substring(0, 60) + '...' : ayah.text) : '';
            const pin = {
                id: juzData.number,
                englishName: `Surah ${ayah.surah.englishName || juzData.name}`,
                name: juzData.name,
                ayahNumber: ayah.number,
                ayahNumberInSurah: ayah.numberInSurah,
                previewText: previewText,
                timestamp: Date.now(),
                type: 'juz',
                juz: juzData.number
            };
            const newFavs = [...favorites, pin];
            localStorage.setItem('quran_favorites', JSON.stringify(newFavs));
            setFavorites(newFavs);
            window.dispatchEvent(new Event('storage'));
            showToast(t('added_to_favorites') || 'Added to Favorites');
        }
        setActiveMenu(null);
    };

    const [bookmarks, setBookmarks] = useState(JSON.parse(localStorage.getItem('bookmarks') || '[]'));
    const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
    
    // Quran Reading Settings Modal States
    const [quranTheme, setQuranTheme] = useState(localStorage.getItem('quran_theme') || 'modern');
    const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('quran_font_size') || '24'));
    const [showTranslation, setShowTranslation] = useState(localStorage.getItem('quran_show_translation') !== 'false');
    const [showTransliteration, setShowTransliteration] = useState(localStorage.getItem('quran_show_transliteration') !== 'false');

    const toggleBookmark = (surahNum, ayahNum, surahName) => {
        let newBookmarks = [...bookmarks];
        const index = newBookmarks.findIndex(b => b.surah === surahNum && b.ayah === ayahNum);
        
        if (index > -1) {
            newBookmarks.splice(index, 1);
        } else {
            newBookmarks.push({ surah: surahNum, ayah: ayahNum, surahName });
        }
        
        localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
        setBookmarks(newBookmarks);
        setActiveMenu(null);
    };

    const isBookmarked = (surahNum, ayahNum) => {
        return bookmarks.some(b => b.surah === surahNum && b.ayah === ayahNum);
    };

    const { lang, setLang, t } = useLanguage();
    const [isLightMode, setIsLightMode] = useState(localStorage.getItem('zakat_theme') !== 'dark');
    
    const audioRef = useRef(null);

    useEffect(() => {
        console.log(`[DEBUG] Juz Reciter selected: ${reciter}`);
        if (playingAyah !== null && audioRef.current) {
            const wasPlaying = !audioRef.current.paused;
            const targetAyah = playingAyah === 0 ? 1 : playingAyah;
            const url = getAudioUrl(reciter, targetAyah);
            if (audioRef.current.src !== url) {
                audioRef.current.src = url;
                audioRef.current.load();
                audioRef.current.playbackRate = playbackRateRef.current || 1;
                if (wasPlaying) {
                    audioRef.current.play().catch(err => console.error("Audio playback error on reciter switch:", err));
                }
            }
        }
    }, [reciter]);


    useEffect(() => {
        if (juzData && !loading) {
            const recentsRepo = JSON.parse(localStorage.getItem('quran_recents') || '[]');
            const currentAyahObj = juzData.ayahs.find(a => a.number === playingAyah) || juzData.ayahs[0];

            const newRecent = {
                id: id,
                englishName: `Juz ${id}`,
                name: `الجزء ${id}`,
                juz: parseInt(id),
                surahName: currentAyahObj?.surah?.englishName || '',
                ayahNumber: currentAyahObj?.number || 0,
                ayahNumberInSurah: currentAyahObj?.numberInSurah || 0,
                totalAyahs: currentAyahObj?.surah?.numberOfAyahs || 0,
                timestamp: Date.now(),
                type: 'juz'
            };
            const filtered = recentsRepo.filter(r => r.id !== id || r.type !== 'juz');
            localStorage.setItem('quran_recents', JSON.stringify([newRecent, ...filtered].slice(0, 5)));
        }
    }, [juzData, loading, playingAyah, id, mode]);

    useEffect(() => {
        if (initialAyah && !loading && juzData) {
            setTimeout(() => {
                const el = document.getElementById(`ayah-${initialAyah}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 600);
        }
    }, [juzData, loading, initialAyah]);

    useEffect(() => {
        let scrollTimeout;
        const handleScroll = () => {
            setUserScrolling(true);
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                setUserScrolling(false);
            }, 2000);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (playingAyah && playingAyah > 0 && !userScrolling) {
            const el = document.getElementById(`ayah-${playingAyah}`);
            if (el) {
                // Gently center the newly active ayah without jumping violently
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [playingAyah, userScrolling]);

    useEffect(() => {
        const fetchJuz = async () => {
            setLoading(true);
            try {
                const translationEdition = lang === 'ml' ? 'ml.abdulhameed' : 'en.asad';
                
                const [arabicRes, transRes] = await Promise.all([
                    fetch(`https://api.alquran.cloud/v1/juz/${id}/quran-uthmani`),
                    fetch(`https://api.alquran.cloud/v1/juz/${id}/${translationEdition}`)
                ]);
                
                const arabicData = await arabicRes.json();
                const transData = await transRes.json();
                
                if (arabicData.code === 200 && transData.code === 200) {
                    const structuredAyahs = arabicData.data.ayahs.map((ayah, index) => ({
                        ...ayah,
                        translation: transData.data.ayahs[index].text,
                        juz: ayah.juz || id
                    }));

                    setJuzData({
                        ...arabicData.data,
                        ayahs: structuredAyahs
                    });
                } else {
                    setError("Failed to load Juz data");
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching juz:", err);
                setError("Failed to load Juz data");
                setLoading(false);
            }
        };
        fetchJuz();
    }, [id, lang]);

    useEffect(() => {
        playbackRateRef.current = playbackRate;
        if (audioRef.current) audioRef.current.playbackRate = playbackRate;
    }, [playbackRate]);

    const playingAyahRef = useRef(playingAyah);
    useEffect(() => {
        playingAyahRef.current = playingAyah;
    }, [playingAyah]);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        const audio = audioRef.current;
        audio.playbackRate = playbackRateRef.current;

        const handlePlay = () => setIsAudioPlaying(true);
        const handlePause = () => setIsAudioPlaying(false);
        
        const handleLoadStart = () => {
            console.log(`[DEBUG] Audio loading started for: ${audio.src}`);
        };
        const handleError = (e) => {
            console.error(`[DEBUG] Audio loading error for ${audio.src}: `, e);
            if(window.showToastFn) window.showToastFn(t('audio_load_failed'));
            setPlayingAyah(null);
        };

        const handleLoadedMetadata = () => {
            audio.playbackRate = playbackRateRef.current;
        };

        const handleEnded = () => {
            if (juzData) {
                let nextAyah;
                const currentPlayingNum = playingAyahRef.current;
                
                if (currentPlayingNum === 0) {
                    nextAyah = juzData.ayahs.find(a => a.numberInSurah === 1 && a.surah.number !== 1 && a.surah.number !== 9);
                } else {
                    const currentIndex = juzData.ayahs.findIndex(a => a.number === currentPlayingNum);
                    if (currentIndex !== -1 && currentIndex < juzData.ayahs.length - 1) {
                        nextAyah = juzData.ayahs[currentIndex + 1];
                    }
                }

                if (nextAyah) {
                    const currentAyahData = juzData.ayahs.find(a => a.number === currentPlayingNum);
                    if (currentAyahData) markSessionComplete(currentAyahData);
                    
                    handlePlayAudio(nextAyah.number, getAudioUrl(reciter, nextAyah.number));
                } else {
                    setPlayingAyah(null);
                }
            }
        };

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('error', handleError);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
            audio.src = "";
        };
    }, [juzData, reciter]);

    const handlePlayAudio = (ayahNumber, audioUrl) => {
        const audio = audioRef.current;

        const currentAyahObj = juzData?.ayahs?.find(a => a.number === ayahNumber);
        if (currentAyahObj?.numberInSurah === 1 && currentAyahObj?.surah?.number !== 1 && currentAyahObj?.surah?.number !== 9 && playingAyah === null) {
            audio.src = getAudioUrl(reciter, 1);
            audio.load();
            audio.playbackRate = playbackRateRef.current;
            audio.play().catch(err => console.error("Audio playback error:", err));
            setPlayingAyah(0);
            return;
        }

        if (playingAyah === ayahNumber) {
            if (audio.paused) {
                audio.playbackRate = playbackRateRef.current;
                audio.play().catch(err => console.error("Audio playback error:", err));
            } else {
                audio.pause();
            }
        } else {
            audio.src = audioUrl;
            audio.load();
            audio.playbackRate = playbackRateRef.current;
            audio.play().catch(err => console.error("Audio playback error:", err));
            setPlayingAyah(ayahNumber);
        }
    };

    const playJuz = () => {
        if (!juzData || !juzData.ayahs || juzData.ayahs.length === 0) return;
        
        if (playingAyah !== null) {
            if (audioRef.current.paused) {
                audioRef.current.playbackRate = playbackRate;
                audioRef.current.play().catch(err => console.error(err));
            } else {
                audioRef.current.pause();
            }
        } else {
            const firstAyah = juzData.ayahs[0];
            handlePlayAudio(firstAyah.number, getAudioUrl(reciter, firstAyah.number));
        }
    };

    if (loading) return <div className="loading-container dark-mode-ready"><div className="loader"></div><p style={{marginTop: '15px', color: '#c5a059'}}>{t('loading') || 'Loading Juz...'}</p></div>;
    if (error) return <div className="loading-container dark-mode-ready"><p style={{color: 'red'}}>{error}</p><button onClick={() => window.location.reload()} className="btn-retry">{t('retry') || 'Retry'}</button></div>;
    if (!juzData) return null;

    return (
        <div className={`app-container theme-${quranTheme} ${isLightMode ? 'light-mode' : 'dark-mode'}`}>
            <nav className="top-navbar-refined">
                <button 
                    className="btn-settings" 
                    style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
                    onClick={() => navigate(mode === 'khatam' ? '/quran?khatam=true' : '/quran')}
                >
                    {BACK_ICON}
                </button>

                <div className="header-title">
                    {t('juz_label')} {id}
                </div>



                <div className="top-menu-container" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="btn-three-dots" onClick={() => setIsTopMenuOpen(!isTopMenuOpen)}>⋮</button>
                    
                    {isTopMenuOpen && (
                        <>
                            <div className="menu-overlay" onClick={() => setIsTopMenuOpen(false)}></div>
                            <div className="premium-settings-menu fade-in">
                                <div className="premium-menu-section" onClick={(e) => e.stopPropagation()}>
                                    <span className="premium-menu-label">A {t('text_size') || 'Text Size'}</span>
                                    <div className="text-size-controls">
                                        <button className="text-size-btn" onClick={() => { setFontSize(Math.max(16, fontSize - 2)); localStorage.setItem('quran_font_size', Math.max(16, fontSize - 2)); }}>A−</button>
                                        <button className="text-size-btn default" onClick={() => { setFontSize(24); localStorage.setItem('quran_font_size', 24); }}>{t('default') || 'Default'}</button>
                                        <button className="text-size-btn" onClick={() => { setFontSize(Math.min(48, fontSize + 2)); localStorage.setItem('quran_font_size', Math.min(48, fontSize + 2)); }}>A+</button>
                                    </div>
                                </div>

                                <div className="premium-menu-section" onClick={(e) => e.stopPropagation()}>
                                    <span className="premium-menu-label">🎤 {t('reciter') || 'Reciter'}</span>
                                    <div className="reciter-options">
                                        {[
                                            { id: 'ar.alafasy', name: 'Alafasy' },
                                            { id: 'ar.abdulsamad', name: 'Abdul Basit' },
                                            { id: 'ar.minshawi', name: 'Minshawi' },
                                            { id: 'ar.hudhaify', name: 'Hudhaify' }
                                        ].map(r => (
                                            <button 
                                                key={r.id}
                                                className={`reciter-btn ${reciter === r.id ? 'active' : ''}`}
                                                onClick={() => { setReciter(r.id); setIsTopMenuOpen(false); }}
                                            >
                                                {r.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </nav>

            <main className={`surah-detail-content fade-in quran-container ${viewMode === 'page' ? 'page-mode' : ''}`}>
                <div className="view-mode-toggle-wrapper">
                    <div className="view-mode-quick-toggle">
                        <button 
                            className={`toggle-btn ${viewMode === 'ayah' ? 'active' : ''}`}
                            onClick={() => setViewMode('ayah')}
                        >
                            {t('reading_tab') || 'Reading'}
                        </button>
                        <button 
                            className={`toggle-btn ${viewMode === 'page' ? 'active' : ''}`}
                            onClick={() => setViewMode('page')}
                        >
                            {t('page_view') || 'Page'}
                        </button>
                    </div>
                </div>

                <header className="detail-header-refined" style={{ padding: '20px 16px', marginBottom: '20px' }}>
                    <h1 className="surah-english-title" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{t('juz_label')} {id}</h1>
                    <p className="arabic-title" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>الجزء {id}</p>
                    
                    <div className="surah-playback-actions">
                        <button className="btn-play-surah" onClick={playJuz}>
                            {PLAY_ICON}
                            <span>{t('play_juz') || 'Play Juz'}</span>
                        </button>
                    </div>
                </header>

                <div className="ayahs-view-container">
                    {viewMode === 'ayah' ? (
                        <div className="ayahs-list">
                            {juzData.ayahs.map((ayah, idx) => (
                                <div 
                                    key={ayah.number} 
                                    id={`ayah-${ayah.number}`} 
                                    className={`ayah-card ${playingAyah === ayah.number ? 'playing active-ayah' : ''}`}
                                >
                                    {isBookmarkedAyah(ayah.number) && (
                                        <div className="ayah-bookmarked-badge">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                                        </div>
                                    )}
                                    <button 
                                        className="ayah-actions-dots" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenu(activeMenu === ayah.number ? null : ayah.number);
                                        }}
                                    >
                                        ⋮
                                    </button>
                                    {activeMenu === ayah.number && (
                                        <div className="ayah-action-menu" onClick={e => e.stopPropagation()}>
                                            <div className="menu-item" onClick={() => markSessionComplete(ayah)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                                                <span>{t('mark_session_complete') || 'Mark Session Complete'}</span>
                                            </div>
                                            <div className="menu-item" onClick={() => handleBookmark(ayah)}>
                                                {isBookmarkedAyah(ayah.number) ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                                                )}
                                                <span style={isBookmarkedAyah(ayah.number) ? { color: 'var(--primary)' } : {}}>{isBookmarkedAyah(ayah.number) ? (t('remove_bookmark') || 'Remove Bookmark') : (t('bookmark') || 'Bookmark')}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="ayah-top">
                                        <div className="ayah-info">
                                            <button className="btn-audio-play" onClick={() => handlePlayAudio(ayah.number, getAudioUrl(reciter, ayah.number))}>
                                                {playingAyah === ayah.number && isAudioPlaying ? PAUSE_ICON : PLAY_ICON}
                                            </button>
                                            <span className="ayah-index-arabic">{ayah.numberInSurah}</span>
                                            <span className="ayah-surah-tag">{ayah.surah.englishName}</span>
                                        </div>
                                        <div className="ayah" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
                                            {ayah.text} <span className="ayah-number-inline">﴿{toArabicNumerals(ayah.numberInSurah)}﴾</span>
                                        </div>
                                    </div>
                                    {showTranslation && ayah.translation && (
                                        <p className="ayah-translation">{ayah.translation}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="surah-page-view-wrapper">
                            <div className="surah-page-view">
                                <div className="page-text-block">
                                    {(() => {
                                        const pages = [];
                                        let currentPage = null;
                                        const startPageOfJuz = juzData.ayahs[0]?.page || 1;

                                        juzData.ayahs.forEach((ayah, idx) => {
                                            if (!currentPage || ayah.page !== currentPage.globalPage) {
                                                currentPage = {
                                                    globalPage: ayah.page,
                                                    relativePage: ayah.page - startPageOfJuz + 1,
                                                    juz: ayah.juz,
                                                    ayahs: []
                                                };
                                                pages.push(currentPage);
                                            }
                                            currentPage.ayahs.push(ayah);
                                        });

                                        return pages.map((page, pIdx) => (
                                            <div key={pIdx} className="mushaf-page-section">
                                                {pIdx > 0 && (
                                                    <div className="mushaf-page-divider">
                                                        <span className="page-line"></span>
                                                        <span className="page-number-marker">{t('page')} {page.relativePage}</span>
                                                        <span className="page-line"></span>
                                                    </div>
                                                )}
                                                <div className="mushaf-page-content">
                                                    {page.ayahs.map((ayah, aIdx) => {
                                                        let bismillahText = null;
                                                        let displayText = ayah.text;

                                                        if (ayah.numberInSurah === 1 && ayah.surah?.number !== 1 && ayah.surah?.number !== 9) {
                                                            const standardBismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
                                                            const simpleBismillah = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
                                                            
                                                            if (displayText.startsWith(standardBismillah)) {
                                                                bismillahText = standardBismillah;
                                                                displayText = displayText.slice(standardBismillah.length).trim();
                                                            } else if (displayText.startsWith(simpleBismillah)) {
                                                                bismillahText = simpleBismillah;
                                                                displayText = displayText.slice(simpleBismillah.length).trim();
                                                            } else {
                                                                const searchPhrase = "ٱلرَّحِيمِ";
                                                                const searchPhraseBackup = "الرَّحِيمِ";
                                                                const searchPhraseBackup2 = "الرحيم";
                                                                
                                                                let idx = displayText.indexOf(searchPhrase);
                                                                let phraseLen = searchPhrase.length;
                                                                if (idx === -1) {
                                                                    idx = displayText.indexOf(searchPhraseBackup);
                                                                    phraseLen = searchPhraseBackup.length;
                                                                }
                                                                if (idx === -1) {
                                                                    idx = displayText.indexOf(searchPhraseBackup2);
                                                                    phraseLen = searchPhraseBackup2.length;
                                                                }
                                                                
                                                                if (idx !== -1 && idx < 50) {
                                                                    bismillahText = displayText.slice(0, idx + phraseLen).trim();
                                                                    displayText = displayText.slice(idx + phraseLen).trim();
                                                                }
                                                            }
                                                        }

                                                        return (
                                                            <React.Fragment key={ayah.number}>
                                                                {bismillahText && (
                                                                    <div className="mushaf-bismillah" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
                                                                        {bismillahText}
                                                                    </div>
                                                                )}
                                                                <span 
                                                                    id={`ayah-${ayah.number}`}
                                                                    className={`page-ayah-item ${playingAyah === ayah.number ? 'playing active-ayah' : ''}`}
                                                                    onClick={() => handlePlayAudio(ayah.number, getAudioUrl(reciter, ayah.number))}
                                                                    style={{ fontSize: `${fontSize}px`, lineHeight: 2.2 }}
                                                                >
                                                                    {displayText} <span className="ayah-number-badge">{toArabicNumerals(ayah.numberInSurah)}</span>
                                                                </span>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </div>

                                                <div className="mushaf-page-footer">
                                                    <div className="juz-indicator">Juz {page.juz || id}</div>
                                                    <div className="relative-page-indicator">{pIdx === 0 ? `Juz ${id} • ` : ''}{t('page')} {page.relativePage}</div>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Juz Navigation (Bottom) */}
                <div className="juz-navigation-bottom fade-in">
                    <button 
                        className={`juz-nav-btn prev ${parseInt(id) === 1 ? 'disabled' : ''}`}
                        onClick={() => {
                            if (parseInt(id) > 1) {
                                navigate(`/quran/juz/${parseInt(id) - 1}`);
                                window.scrollTo(0, 0);
                            }
                        }}
                        disabled={parseInt(id) === 1}
                    >
                        <span className="nav-icon">◀</span>
                        <div className="nav-text-group">
                            <span className="nav-label">{t('previous') || 'Previous'}</span>
                            <span className="nav-juz-name">Juz {parseInt(id) - 1}</span>
                        </div>
                    </button>
                    <button 
                        className={`juz-nav-btn next ${parseInt(id) === 30 ? 'disabled' : ''}`}
                        onClick={() => {
                            if (parseInt(id) < 30) {
                                navigate(`/quran/juz/${parseInt(id) + 1}`);
                                window.scrollTo(0, 0);
                            }
                        }}
                        disabled={parseInt(id) === 30}
                    >
                        <div className="nav-text-group" style={{ alignItems: 'flex-end' }}>
                            <span className="nav-label">{t('next') || 'Next'}</span>
                            <span className="nav-juz-name">Juz {parseInt(id) + 1}</span>
                        </div>
                        <span className="nav-icon">▶</span>
                    </button>
                </div>

            </main>

            {toastMessage && (
                <div className="notification-container">
                    <div className="notification-toast">
                        <span className="notification-icon">✨</span>
                        <span className="notification-text">{toastMessage}</span>
                    </div>
                </div>
            )}

            {playingAyah === null && (
                <AutoScrollControl isVisible={true} />
            )}

            {playingAyah !== null && (
                <div className="sticky-audio-player fade-in-up">
                    <div className="sap-info">
                        <span className="sap-ayah-badge">Ayah {juzData?.ayahs?.find(a => a.number === playingAyah)?.numberInSurah || playingAyah}</span>
                        <span className="sap-status">Playing</span>
                    </div>
                    
                    <div className="sap-speed-pills">
                        {[0.75, 1, 1.25, 1.5, 2].map(rate => (
                            <button 
                                key={rate} 
                                className={`speed-pill ${playbackRate === rate ? 'active' : ''}`}
                                onClick={() => setPlaybackRate(rate)}
                            >
                                {rate}x
                            </button>
                        ))}
                    </div>

                    <button className="sap-play-pause" onClick={() => {
                        if (audioRef.current.paused) {
                            audioRef.current.playbackRate = playbackRate;
                            audioRef.current.play().catch(err => console.error(err));
                        } else {
                            audioRef.current.pause();
                        }
                    }}>
                        {playingAyah !== null && isAudioPlaying ? PAUSE_ICON : PLAY_ICON}
                    </button>
                    
                    <button className="sap-close" onClick={() => {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                        setPlayingAyah(null);
                    }}>×</button>
                </div>
            )}
        </div>
    );
};

function HomePage() {
    const navigate = useNavigate();
    const [isLightMode] = useState(localStorage.getItem('theme') !== 'dark-mode');
    
    useEffect(() => {
        if (isLightMode) {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
        }
    }, [isLightMode]);

    const features = [
        {
            id: 'zakat',
            title: 'Muslim Plus',
            description: 'Calculate, track, and manage your Zakat obligations with precision.',
            icon: '💰',
            path: '/zakat',
            color: '#D4AF37'
        },
        {
            id: 'quran',
            title: 'Quran Reader',
            description: 'Read the Holy Quran with translations and track your Khatam progress.',
            icon: '📖',
            path: '/quran',
            color: '#2E7D32'
        }
    ];

    return (
        <div className={`home-selection-container ${isLightMode ? 'light-mode' : 'dark-mode'}`}>
            <header className="home-header">
                <img src="/muslim-plus-logo.png" alt="Logo" className="home-logo" />
                <h1>Islamic Ledger</h1>
                <p>Choose a feature to continue your journey</p>
            </header>
            
            <div className="features-grid">
                {features.map(f => (
                    <div key={f.id} className="feature-card" onClick={() => navigate(f.path)}>
                        <div className="feature-icon" style={{ backgroundColor: `${f.color}20`, color: f.color }}>
                            {f.icon}
                        </div>
                        <h3>{f.title}</h3>
                        <p>{f.description}</p>
                        <button className="btn-feature" style={{ backgroundColor: f.color }}>
                            Open {f.title}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DuasPageWrapper() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    return <DuasPage onBack={() => navigate(-1)} t={t} />;
}

function AsmaPageWrapper() {
    const navigate = useNavigate();
    return <AsmaUlHusna onBack={() => navigate(-1)} />;
}

function App() {
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
        return localStorage.getItem('app_onboarding_completed') === 'true';
    });

    useEffect(() => {
        if (!hasCompletedOnboarding) return;
        
        // Track app launch for rating
        let launches = parseInt(localStorage.getItem('zakat_launch_count') || '0', 10);
        launches += 1;
        localStorage.setItem('zakat_launch_count', launches.toString());

        if (!localStorage.getItem('zakat_first_launch')) {
            localStorage.setItem('zakat_first_launch', new Date().toISOString());
        }

        // Trigger rating check after a brief delay
        setTimeout(() => {
            if (window.checkAppRating) window.checkAppRating('launch');
        }, 3000);
    }, [hasCompletedOnboarding]);

    if (!hasCompletedOnboarding) {
        return <AppOnboarding onComplete={() => setHasCompletedOnboarding(true)} />;
    }

    return (
        <>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/home" element={<Dashboard />} />
                <Route path="/zakat" element={<UserDashboard />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/quran" element={<QuranPage />} />
                <Route path="/quran/bookmarks" element={<QuranBookmarksPage />} />
                <Route path="/quran/:id" element={<SurahDetailPage />} />
                <Route path="/quran/juz/:id" element={<JuzDetailPage />} />
                <Route path="/prayer" element={<PrayerTimes />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/qibla" element={<QiblaFinder />} />
                <Route path="/tasbih" element={<TasbihCounter />} />
                <Route path="/tasbih/history" element={<TasbihHistory />} />
                <Route path="/duas" element={<DuasPageWrapper />} />
                <Route path="/asma" element={<AsmaPageWrapper />} />
                <Route path="/womens-guidance" element={<WomensGuidance />} />
                <Route path="/hajj" element={<HajjGuide />} />
                <Route path="/umrah" element={<UmrahGuide />} />
                <Route path="/more" element={<MorePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/ratheeb" element={<RatheebHaddad />} />
                <Route path="*" element={<Dashboard />} />
            </Routes>
            <GenderPrompt />
            <UpdateManager />
            <RatingManager />
        </>
    );
}

export default App;
