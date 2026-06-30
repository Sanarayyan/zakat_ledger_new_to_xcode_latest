import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './AsmaUlHusna.css';
import namesData from '../../constants/asmaulhusna.json';
import { useLanguage } from '../../LanguageContext';

// --- Icons ---
const BACK_ICON = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
const GRID_ICON = <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6-12h4v4h-4V4zm0 6h4v4h-4v-4zm0 6h4v4h-4v-4z"/></svg>;
const TASBIH_ICON = <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>;
const SEARCH_ICON = <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

// --- GridView Sub-Component ---
const GridView = ({ data, activeIndex, onSelect }) => {
    const { t, lang } = useLanguage();
    if (data.length === 0) {
        return <div className="no-results-msg">{t('no_names_found')}</div>;
    }

    return (
        <div className="asma-grid-container">
            {data.map((name) => {
                const actualIdx = namesData.indexOf(name);
                const isActive = actualIdx === activeIndex;
                return (
                    <div 
                        key={name.id} 
                        id={`name-card-${actualIdx}`}
                        className={`name-grid-card ${isActive ? 'active-highlight' : ''}`}
                        onClick={() => onSelect(actualIdx)}
                    >
                        <div className="grid-arabic">{name.arabic}</div>
                        <div className="grid-name">{name.transliteration}</div>
                        <div className="grid-meaning">{lang === 'ml' ? name.meaning_ml : name.name_en}</div>
                    </div>
                );
            })}
        </div>
    );
};

// --- TasbeehView Sub-Component ---
const TasbeehView = ({ data, currentIndex, onNext }) => {
    const { t } = useLanguage();
    const renderOffsets = [-2, -1, 0, 1, 2];
    const total = data.length;

    if (total === 0) return <div className="no-results-msg">{t('no_names_found')}</div>;

    return (
        <div className="tasbeeh-container" onClick={onNext}>
            <div className="circles-wrapper">
                {renderOffsets.map((offset) => {
                    const nameIndex = (currentIndex + offset + total) % total;
                    const name = data[nameIndex];
                    if (!name) return null;

                    return (
                        <div 
                            key={`${name.id}-${offset}`}
                            className={`circle ${offset === 0 ? 'active' : ''}`}
                        >
                            <div className="circle-arabic">{name.arabic}</div>
                            {offset === 0 && (
                                <motion.div 
                                    className="circle-trans"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {name.transliteration}
                                </motion.div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Main Module ---
export default function AsmaUlHusna() {
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    const [mode, setMode] = useState("list"); 
    const [searchQuery, setSearchQuery] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        setSearchQuery("");
    }, [mode]);

    // Filtered names
    const filteredNames = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return namesData;
        return namesData.filter(name =>
            name.transliteration.toLowerCase().includes(query) ||
            name.arabic.includes(query) ||
            name.name_en.toLowerCase().includes(query) ||
            name.meaning_en.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const total = filteredNames.length;

    // Body scroll lock in tasbeeh mode
    useEffect(() => {
        if (mode === "tasbeeh") {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => { document.body.style.overflow = "auto"; };
    }, [mode]);

    const handleSelectFromList = (actualIndex) => {
        setCurrentIndex(actualIndex);
        setShowDetailModal(true);
    };

    const handleNextBead = () => {
        if (total === 0) return;
        const nextIdx = (currentIndex + 1) % namesData.length;
        setCurrentIndex(nextIdx);
        if (window.navigator?.vibrate) window.navigator.vibrate(40);
    };

    const handleBack = () => {
        if (mode === "tasbeeh") {
            setMode("list");
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="asma-root">
            {/* Header */}
            <div className="asma-fixed-header">
                <div className="header-top">
                    <button className="back-btn-fixed" onClick={handleBack}>{BACK_ICON}</button>
                    <h1 className="asma-title-centered">{t('asmaul_husna')}</h1>
                    <div className="right-space-balance"></div>
                </div>

                <div className="asma-search-wrapper">
                    <span className="search-icon-fixed">{SEARCH_ICON}</span>
                    <input 
                        type="text"
                        className="search-bar"
                        placeholder={t('asma_search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Viewport */}
            <div className="asma-content-viewport">
                {mode === "list" ? (
                    <GridView 
                        data={filteredNames}
                        activeIndex={currentIndex}
                        onSelect={handleSelectFromList} 
                    />
                ) : (
                    <TasbeehView 
                        data={filteredNames}
                        currentIndex={currentIndex}
                        onNext={handleNextBead}
                    />
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {showDetailModal && (
                    <motion.div 
                        className="asma-detail-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDetailModal(false)}
                    >
                        <motion.div 
                            className="asma-detail-modal"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-drag-handle" onClick={() => setShowDetailModal(false)}></div>
                            <div className="modal-content">
                                <h2 className="modal-arabic">{namesData[currentIndex].arabic}</h2>
                                <h3 className="modal-trans">{namesData[currentIndex].transliteration}</h3>
                                <p className="modal-name-en">{lang === 'ml' ? namesData[currentIndex].meaning_ml : namesData[currentIndex].name_en}</p>
                                <div className="modal-meaning-box">
                                    <h4>{t('meaning') || 'Meaning'}</h4>
                                    <p>{lang === 'ml' ? (namesData[currentIndex].desc_ml || namesData[currentIndex].meaning_ml) : namesData[currentIndex].meaning_en}</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer Navigation */}
            <div className="asma-tabs-footer">
                <button 
                    className={`tab-pill ${mode === 'list' ? 'active' : ''}`} 
                    onClick={() => setMode("list")}
                >
                    {GRID_ICON}
                    <span>{t('list_view')}</span>
                </button>
                <button 
                    className={`tab-pill ${mode === 'tasbeeh' ? 'active' : ''}`} 
                    onClick={() => setMode("tasbeeh")}
                >
                    {TASBIH_ICON}
                    <span>{t('tasbih_view')}</span>
                </button>
            </div>
        </div>
    );
}
