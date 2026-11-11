import { readStoredJSON } from '../../services/storedJson.mjs';
import { appStorage } from '../../services/appStorage';
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../LanguageContext';
import { DHIKR_LIST } from './dhikrData';
import './DhikrLibraryModal.css';

export default function DhikrLibraryModal({ isOpen, onClose, onSelect, selectedId }) {
    const { t, lang } = useLanguage();
    
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    
    const [favorites, setFavorites] = useState([]);
    const [customDhikrs, setCustomDhikrs] = useState([]);
    const [recentDhikrs, setRecentDhikrs] = useState([]);

    const [showAddCustom, setShowAddCustom] = useState(false);
    const [newCustom, setNewCustom] = useState({ name: '', arabic: '', meaning_en: '', meaning_ml: '' });

    useEffect(() => {
        if (isOpen) {
            setFavorites(readStoredJSON(appStorage, 'tasbih_favorites', []));
            setCustomDhikrs(readStoredJSON(appStorage, 'tasbih_custom_dhikr', []));
            setRecentDhikrs(readStoredJSON(appStorage, 'tasbih_recent_dhikr', []));
            setSearch('');
            setActiveTab('All');
        }
    }, [isOpen]);

    const toggleFavorite = (e, dhikr) => {
        e.stopPropagation();
        let updatedFavs = [...favorites];
        if (updatedFavs.includes(dhikr.id)) {
            updatedFavs = updatedFavs.filter(id => id !== dhikr.id);
        } else {
            updatedFavs.push(dhikr.id);
        }
        setFavorites(updatedFavs);
        appStorage.setItem('tasbih_favorites', JSON.stringify(updatedFavs));
    };

    const handleSelect = (dhikr) => {
        // Save to recent
        let updatedRecents = [dhikr.id, ...recentDhikrs.filter(id => id !== dhikr.id)].slice(0, 5);
        appStorage.setItem('tasbih_recent_dhikr', JSON.stringify(updatedRecents));
        onSelect(dhikr);
    };

    const handleSaveCustom = () => {
        if (!newCustom.name || !newCustom.arabic) return;
        const customEntry = {
            id: `custom_${Date.now()}`,
            name: newCustom.name,
            arabic: newCustom.arabic,
            meaning_en: newCustom.meaning_en,
            meaning_ml: newCustom.meaning_ml || newCustom.meaning_en,
            audio: '', // no audio
            isCustom: true
        };
        const updated = [customEntry, ...customDhikrs];
        setCustomDhikrs(updated);
        appStorage.setItem('tasbih_custom_dhikr', JSON.stringify(updated));
        setShowAddCustom(false);
        setNewCustom({ name: '', arabic: '', meaning_en: '', meaning_ml: '' });
        setActiveTab('Custom');
    };

    const allAvailable = useMemo(() => [...DHIKR_LIST, ...customDhikrs], [customDhikrs]);

    const displayedList = useMemo(() => {
        let list = [];
        if (activeTab === 'All') list = allAvailable;
        if (activeTab === 'Favorites') list = allAvailable.filter(d => favorites.includes(d.id));
        if (activeTab === 'Custom') list = customDhikrs;
        if (activeTab === 'Recent') list = recentDhikrs.map(id => allAvailable.find(d => d.id === id)).filter(Boolean);

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(d => 
                (d.name || '').toLowerCase().includes(q) ||
                (d.arabic || '').toLowerCase().includes(q) ||
                (d.meaning_en || '').toLowerCase().includes(q) ||
                (d.meaning_ml || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [activeTab, allAvailable, favorites, customDhikrs, recentDhikrs, search]);

    if (!isOpen) return null;

    const tabs = [
        { id: 'All', label: t('all') },
        { id: 'Recent', label: t('recent') },
        { id: 'Favorites', label: t('favorites') }
    ];

    return (
        <div className="dhikr-lib-overlay" onClick={onClose}>
            <div className="dhikr-lib-content" onClick={e => e.stopPropagation()}>
                <div className="dhikr-lib-header">
                    <h2>{t('choose_dhikr')}</h2>
                    <button className="lib-close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="dhikr-search-box">
                    <input 
                        type="text" 
                        placeholder={t('search_dhikr_placeholder')}
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>

                <div className="dhikr-tabs">
                    {tabs.map(tab => (
                        <button key={tab.id} className={`lib-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="dhikr-list-body">
                    {displayedList.length === 0 ? (
                        <div className="lib-empty">{t('no_dhikr_found')}</div>
                    ) : (
                        displayedList.map(d => {
                            const isFav = favorites.includes(d.id);
                            const meaning = lang === 'ml' && d.meaning_ml ? d.meaning_ml : d.meaning_en;
                            return (
                                <div key={d.id} className={`lib-card ${selectedId === d.id ? 'selected' : ''}`} onClick={() => handleSelect(d)}>
                                    <div className="lib-card-top">
                                        <div className="lib-card-arabic">{d.arabic}</div>
                                        <button className={`lib-fav-btn ${isFav ? 'is-fav' : ''}`} onClick={(e) => toggleFavorite(e, d)} aria-label="Favorite">
                                            <svg viewBox="0 0 24 24" className="fav-star-icon" width="22" height="22">
                                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="lib-card-name">{d.name}</div>
                                    <div className="lib-card-meaning">"{meaning}"</div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
