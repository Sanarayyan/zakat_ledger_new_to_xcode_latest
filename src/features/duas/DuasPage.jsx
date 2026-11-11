import { readStoredJSON } from '../../services/storedJson.mjs';
import { appStorage } from '../../services/appStorage';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DUAS_DATA, DEFAULT_DUAS_DATA } from '../../constants/duasData';
import { useLanguage } from '../../LanguageContext';
import './DuasPage.css';

const CHEVRON_ICON = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const STAR_ICON = (filled) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke={filled ? "#f59e0b" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

const SHARE_ICON = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
        <polyline points="16 6 12 2 8 6"></polyline>
        <line x1="12" y1="2" x2="12" y2="15"></line>
    </svg>
);

const SEARCH_ICON = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const DuaIconMap = ({ id }) => {
    const iconProps = { viewBox: "0 0 24 24", width: "20", height: "20", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
    
    switch(id) {
        // Categories
        case 'saved': return <svg {...iconProps} stroke="#f59e0b" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
        case 'daily': return <svg {...iconProps}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
        case 'azkar': return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; 
        case 'occasional': return <svg {...iconProps}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
        
        // Subcategories
        case 'saved_list': return <svg {...iconProps} stroke="#f59e0b"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
        case 'sleeping': case 'ramadan': return <svg {...iconProps}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
        case 'toilet': return <svg {...iconProps}><path d="M7 10v12"/><path d="M17 10v12"/><path d="M12 10v12"/><path d="M2 10h20"/><path d="M12 2v4"/><circle cx="12" cy="2" r="1"/></svg>; 
        case 'ablution': return <svg {...iconProps}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>; 
        case 'mosque': return <svg {...iconProps}><path d="M12 2a3 3 0 0 1 3 3v2h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4V5a3 3 0 0 1 3-3z"/><path d="M12 14v6"/><path d="M9 20h6"/></svg>;
        case 'prayer': case 'afterPrayer': case 'dailyDhikr': return <svg {...iconProps}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="20" y2="17"/></svg>; 
        case 'home': case 'family': return <svg {...iconProps}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
        case 'garment': return <svg {...iconProps}><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>;
        case 'travel': return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>; 
        case 'food': case 'rizq': return <svg {...iconProps}><path d="M18 8a6 6 0 0 0-12 0"/><line x1="4" y1="10" x2="20" y2="10"/><path d="M4 14a8 8 0 0 0 16 0"/><line x1="4" y1="14" x2="20" y2="14"/></svg>; 
        case 'morning': return <svg {...iconProps}><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/></svg>; 
        case 'evening': return <svg {...iconProps}><path d="M17 18a5 5 0 0 1-10 0"/><line x1="12" y1="9" x2="12" y2="2"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/></svg>; 
        case 'knowledge': case 'remembrance': return <svg {...iconProps}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
        case 'faith': return <svg {...iconProps}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>; 
        case 'istighfar': return <svg {...iconProps}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>; 
        case 'protection': return <svg {...iconProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; 
        case 'health': return <svg {...iconProps}><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 10v4"/><path d="M10 12h4"/></svg>; 
        case 'loss': case 'sorrow': case 'deceased': return <svg {...iconProps}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><path d="M12 14v4"/></svg>; 
        case 'hajj': return <svg {...iconProps}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
        case 'nature': return <svg {...iconProps}><path d="M12 22v-7l-2-2"/><path d="M12 15l2-2"/><path d="M12 8V2L9 5"/><path d="M12 2l3 3"/></svg>; 
        default: return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
    }
};

// Global TTS manager state removed; handled via refs in component

const DuasPage = ({ onBack }) => {
    const { lang, setLang, t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [openCategories, setOpenCategories] = useState(['daily']);
    const [openSubcategories, setOpenSubcategories] = useState([]);
    const [selectedDuaId, setSelectedDuaId] = useState(null);
    const [expandedDuaId, setExpandedDuaId] = useState(null);
    const [showFullVersion, setShowFullVersion] = useState(false);
    const [favorites, setFavorites] = useState(() => readStoredJSON(appStorage, 'dua_favorites', []));
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        appStorage.setItem('dua_favorites', JSON.stringify(favorites));
    }, [favorites]);

    const toggleFavorite = (duaId, e) => {
        e.stopPropagation();
        setFavorites(prev => {
            const isAdding = !prev.includes(duaId);
            const newFavs = isAdding ? [...prev, duaId] : prev.filter(id => id !== duaId);
            
            if (isAdding && window.checkAppRating) {
                setTimeout(() => window.checkAppRating('duas'), 500);
            }
            
            return newFavs;
        });
    };

    const getField = (obj, field, currentLang) => {
        if (!obj) return '';
        const mlValue = obj[`${field}_ml` || field + '_ml']; // Fallback for key name
        const enValue = obj[`${field}_en` || field + '_en'];
        
        const primary = currentLang === 'ml' ? mlValue : enValue;
        const secondary = currentLang === 'ml' ? enValue : mlValue;

        return primary && primary.trim() !== '' ? primary : (secondary || '');
    };

    const handleShare = (dua, e) => {
        e.stopPropagation();
        const activeDua = showFullVersion && dua.secondary ? dua.secondary : dua;
        const title = getField(dua, 'title', lang);
        const translation = getField(activeDua, 'translation', lang);
        
        if (navigator.share) {
            navigator.share({
                title: title,
                text: `${activeDua.arabic}\n\n${translation}\n\nReference: ${activeDua.reference}`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            alert(t('share_not_supported') || "Sharing not supported in this browser.");
        }
    };

    const toggleCategory = (catId) => {
        setOpenCategories(prev => prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]);
    };

    const toggleSubcategory = (subId) => {
        setOpenSubcategories(prev => prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]);
    };

    const categoriesArray = useMemo(() => {
        // Safe check for data
        const data = DUAS_DATA || DEFAULT_DUAS_DATA;
        
        // Safety Check as requested
        if (!data.daily || !data.azkar || !data.occasional) {
            console.error("Missing dua sections: ", {
                daily: !!data.daily,
                azkar: !!data.azkar,
                occasional: !!data.occasional
            });
        }

        // Define desired order
        const order = ['daily', 'azkar', 'occasional'];
        
        return order.map(key => {
            const category = data[key];
            if (!category) return null;
            
            // Transform sections object to array for rendering
            const subcategories = category.sections ? Object.keys(category.sections).map(sKey => ({
                id: sKey,
                ...category.sections[sKey]
            })) : [];
            
            return {
                ...category,
                subcategories
            };
        }).filter(Boolean);
    }, [lang]);

    const savedDuasList = useMemo(() => {
        const list = [];
        categoriesArray.forEach(cat => {
            cat.subcategories.forEach(sub => {
                sub.duas.forEach(dua => {
                    if (favorites.includes(dua.id)) {
                        if (!list.some(d => d.id === dua.id)) {
                            list.push({
                                ...dua,
                                categoryName: getField(cat, 'title', lang),
                                subcategoryName: getField(sub, 'title', lang),
                                categoryId: cat.id,
                                subcategoryId: sub.id
                            });
                        }
                    }
                });
            });
        });
        return list;
    }, [categoriesArray, favorites, lang]);

    const filteredData = useMemo(() => {
        let data = categoriesArray;
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return data.map(cat => ({
                ...cat,
                subcategories: cat.subcategories.map(sub => ({
                    ...sub,
                    duas: sub.duas.filter(dua => {
                        const title = (lang === 'ml' ? dua.title_ml : dua.title_en).toLowerCase();
                        const translation = (lang === 'ml' ? dua.translation_ml : dua.translation_en).toLowerCase();
                        return title.includes(query) || 
                               translation.includes(query) ||
                               dua.transliteration.toLowerCase().includes(query) ||
                               dua.arabic.includes(query);
                    })
                })).filter(sub => sub.duas.length > 0)
            })).filter(cat => cat.subcategories.length > 0);
        }
        
        return data;
    }, [categoriesArray, searchQuery, lang]);

    return (
        <div className={`duas-page-refined fade-in lang-${lang}`}>
            <header className="duas-nav-header">
                <div className="header-top">
                    <button className="nav-icon-btn back-btn" onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                    </button>
                    <h1 className="header-title">{t('duas_dhikr')}</h1>
                    <button className="nav-icon-btn header-fav-btn" onClick={() => setIsModalOpen(true)}>
                        {STAR_ICON(favorites.length > 0)}
                    </button>
                </div>

                <div className="search-bar-container">
                    <div className="search-input-wrapper">
                        {SEARCH_ICON}
                        <input 
                            type="text" 
                            placeholder={t('search_duas') || 'Search duas or dhikr...'} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
                        )}
                    </div>
                </div>
            </header>

            <main className="duas-content-scroll">
                {filteredData.length === 0 ? (
                    <div className="empty-state">
                        <p>{t('no_duas_found')}</p>
                    </div>
                ) : (
                    filteredData.map(category => (
                        <div key={category.id} className="dua-category-section">
                            <div 
                                className={`category-header ${openCategories.includes(category.id) ? 'expanded' : ''}`}
                                onClick={() => toggleCategory(category.id)}
                            >
                                <div className="cat-title-group">
                                    <span className="category-icon"><DuaIconMap id={category.id} /></span>
                                    <h2>{getField(category, 'title', lang)}</h2>
                                </div>
                                <span className="chevron">{CHEVRON_ICON}</span>
                            </div>

                            {openCategories.includes(category.id) && (
                                <div className="subcategory-list">
                                    {category.subcategories.map(sub => (
                                        <div key={sub.id} className="subcategory-item">
                                            <div 
                                                className={`subcategory-header ${openSubcategories.includes(sub.id) || searchQuery ? 'expanded' : ''}`}
                                                onClick={() => toggleSubcategory(sub.id)}
                                            >
                                                <div className="sub-title-group">
                                                    <span className="sub-icon"><DuaIconMap id={sub.id} /></span>
                                                    <h3>{getField(sub, 'title', lang)}</h3>
                                                </div>
                                                <div className="sub-meta">
                                                    <span className="sub-count">{sub.duas.length}</span>
                                                    <span className="chevron-small">{CHEVRON_ICON}</span>
                                                </div>
                                            </div>

                                            {(openSubcategories.includes(sub.id) || searchQuery) && (
                                                <div className="duas-list-premium">
                                                    {sub.duas.map(dua => {
                                                            const duaTitle = getField(dua, 'title', lang);
                                                            const isSelected = selectedDuaId === dua.id;
                                                            
                                                            if (!isSelected) {
                                                            return (
                                                                <div 
                                                                    key={dua.id} 
                                                                    className="dua-list-item-minimal fade-in-smooth"
                                                                    onClick={() => setSelectedDuaId(dua.id)}
                                                                >
                                                                    <span className="dua-minimal-title">{duaTitle}</span>
                                                                    <span className="dua-minimal-chevron">{CHEVRON_ICON}</span>
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div id={`dua-item-${dua.id}`} key={dua.id} className="dua-card-modern selected-dua fade-in-smooth">
                                                                <div className="dua-card-header" onClick={() => {
                                                                    setSelectedDuaId(null);
                                                                    setExpandedDuaId(null);
                                                                }}>
                                                                    <h4 className="dua-title">{duaTitle}</h4>
                                                                    <div className="dua-header-actions">
                                                                        <button 
                                                                            className={`top-fav-btn ${favorites.includes(dua.id) ? 'active' : ''}`}
                                                                            onClick={(e) => toggleFavorite(dua.id, e)}
                                                                        >
                                                                            {STAR_ICON(favorites.includes(dua.id))}
                                                                        </button>
                                                                        <span className="dua-collapse-icon">✕</span>
                                                                    </div>
                                                                </div>
                                                                    {dua.secondary && (
                                                                        <div className="dua-version-tabs">
                                                                            <button 
                                                                                className={`tab-btn ${!showFullVersion ? 'active' : ''}`}
                                                                                onClick={() => setShowFullVersion(false)}
                                                                            >
                                                                                {t('short_dua')}
                                                                            </button>
                                                                            <button 
                                                                                className={`tab-btn ${showFullVersion ? 'active' : ''}`}
                                                                                onClick={() => setShowFullVersion(true)}
                                                                            >
                                                                                {t('full_dua')}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                
                                                                <div className="dua-card-body">
                                                                    <div className={`dua-arabic-centered fade-in-smooth ${expandedDuaId === dua.id ? 'full-view' : 'truncated-view'}`}>
                                                                        {(() => {
                                                                            const text = showFullVersion && dua.secondary ? dua.secondary.arabic : dua.arabic;
                                                                            const isExpanded = expandedDuaId === dua.id;
                                                                            if (!isExpanded && text.length > 150) {
                                                                                return text.substring(0, 150) + "...";
                                                                            }
                                                                            return text;
                                                                        })()}
                                                                    </div>
                                                                </div>

                                                                <div className="dua-card-footer">
                                                                    <button 
                                                                        className="show-more-toggle"
                                                                        onClick={() => setExpandedDuaId(expandedDuaId === dua.id ? null : dua.id)}
                                                                    >
                                                                        {expandedDuaId === dua.id ? t('show_less') : t('show_more')}
                                                                    </button>

                                                                    <div className="dua-actions-right">
                                                                        <button 
                                                                            className="action-btn share-btn"
                                                                            onClick={(e) => handleShare(dua, e)}
                                                                        >
                                                                            {SHARE_ICON}
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {expandedDuaId === dua.id && (
                                                                    <div className="dua-details-expanded fade-in">
                                                                        <div className="dua-transliteration">
                                                                            {showFullVersion && dua.secondary ? dua.secondary.transliteration : dua.transliteration}
                                                                        </div>
                                                                        <div className="dua-translation">
                                                                            {lang === 'ml' 
                                                                                ? getField(showFullVersion && dua.secondary ? dua.secondary : dua, 'translation', 'ml')
                                                                                : getField(showFullVersion && dua.secondary ? dua.secondary : dua, 'translation', 'en')}
                                                                        </div>
                                                                        <div className="dua-reference">
                                                                            {t('reference_label')}: {showFullVersion && dua.secondary ? dua.secondary.reference : dua.reference}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </main>

            {isModalOpen && (
                <div className="modal-overlay fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="saved-duas-modal slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{lang === 'ml' ? 'സംരക്ഷിച്ച ദുആകൾ' : 'Saved Duas'}</h2>
                            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <div className="saved-duas-content">
                            {savedDuasList.length === 0 ? (
                                <div className="empty-saved-state">
                                    <div className="empty-icon">{STAR_ICON(false)}</div>
                                    <p className="empty-title">{lang === 'ml' ? 'സംരക്ഷിച്ച ദുആകൾ ഒന്നുമില്ല' : 'No saved duas yet'}</p>
                                    <p className="empty-subtitle">{lang === 'ml' ? 'ഒരു ദുആ സംരക്ഷിക്കാൻ സ്റ്റാർ ഐക്കണിൽ ടാപ്പ് ചെയ്യുക.' : 'Tap the star icon on any dua to save it here.'}</p>
                                </div>
                            ) : (
                                savedDuasList.map(dua => (
                                    <div key={dua.id} className="saved-dua-item fade-in-smooth">
                                        <div className="saved-dua-info">
                                            <h4>{getField(dua, 'title', lang)}</h4>
                                            <p>{dua.categoryName} • {dua.subcategoryName}</p>
                                        </div>
                                        <div className="saved-dua-actions">
                                            <button 
                                                className="quick-open-btn"
                                                onClick={() => {
                                                    setIsModalOpen(false);
                                                    if (!openCategories.includes(dua.categoryId)) setOpenCategories(prev => [...prev, dua.categoryId]);
                                                    if (!openSubcategories.includes(dua.subcategoryId)) setOpenSubcategories(prev => [...prev, dua.subcategoryId]);
                                                    setTimeout(() => {
                                                        setSelectedDuaId(dua.id);
                                                        setExpandedDuaId(dua.id);
                                                        document.getElementById(`dua-item-${dua.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }, 300);
                                                }}
                                            >
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                                </svg>
                                            </button>
                                            <button 
                                                className="remove-fav-btn active"
                                                onClick={(e) => toggleFavorite(dua.id, e)}
                                            >
                                                {STAR_ICON(true)}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DuasPage;
