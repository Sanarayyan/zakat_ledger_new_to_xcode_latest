import * as Icons from '../../components/IconLibrary';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ReadingSettingsModal.css';

const ReadingSettingsModal = ({
    isOpen,
    onClose,
    t,
    // Display States
    quranTheme,
    setQuranTheme,
    viewMode,
    setViewMode,
    // Text States
    fontSize,
    setFontSize,
    showTranslation,
    setShowTranslation,
    showTransliteration,
    setShowTransliteration,
    // Audio States
    reciter,
    setReciter,
    playbackRate,
    setPlaybackRate
}) => {
    const [activeTab, setActiveTab] = useState('display'); // 'display', 'text', 'audio'

    const themes = [
        { id: 'modern', name: 'Modern', bgClass: 'theme-preview-modern', desc: 'Clean standard look' },
        { id: 'paper', name: 'Paper', bgClass: 'theme-preview-paper', desc: 'Warm cozy sepia' },
        { id: 'dark', name: 'Dark', bgClass: 'theme-preview-dark', desc: 'Comfortable night' },
        { id: 'emerald', name: 'Islamic Emerald', bgClass: 'theme-preview-emerald', desc: 'Premium mosque gold' }
    ];

    const recitersList = [
        { id: 'ar.alafasy', name: 'Mishary Alafasy' },
        { id: 'ar.abdulsamad', name: 'Abdul Basit' },
        { id: 'ar.minshawi', name: 'Siddiq Al-Minshawi' },
        { id: 'ar.hudhaify', name: 'Ali Al-Hudhaify' }
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                className="rsm-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div 
                    className="rsm-container"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                >
                    {/* Header */}
                    <div className="rsm-header">
                        <div className="rsm-header-left">
                            <span className="rsm-header-icon"><Icons.MosqueIcon /></span>
                            <h2>{t('settings') || 'Reading Settings'}</h2>
                        </div>
                        <button className="rsm-close-btn" onClick={onClose}>×</button>
                    </div>

                    {/* Nav Tabs */}
                    <div className="rsm-tabs">
                        <button 
                            className={`rsm-tab-btn ${activeTab === 'display' ? 'active' : ''}`}
                            onClick={() => setActiveTab('display')}
                        >
                            <Icons.PaletteIcon /> {t('tab_display') || 'Display'}
                        </button>
                        <button 
                            className={`rsm-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                            onClick={() => setActiveTab('text')}
                        >
                            <Icons.PenIcon /> {t('tab_text') || 'Text'}
                        </button>
                        <button 
                            className={`rsm-tab-btn ${activeTab === 'audio' ? 'active' : ''}`}
                            onClick={() => setActiveTab('audio')}
                        >
                            <Icons.SpeakerIcon /> {t('tab_audio') || 'Audio'}
                        </button>
                    </div>

                    {/* Content Section */}
                    <div className="rsm-content">
                        {activeTab === 'display' && (
                            <div className="rsm-section fade-in">
                                <h3>{t('select_theme') || 'Theme Style'}</h3>
                                <div className="rsm-themes-grid">
                                    {themes.map(theme => (
                                        <div 
                                            key={theme.id}
                                            className={`rsm-theme-card ${quranTheme === theme.id ? 'active' : ''}`}
                                            onClick={() => {
                                                setQuranTheme(theme.id);
                                                localStorage.setItem('quran_theme', theme.id);
                                            }}
                                        >
                                            <div className={`rsm-theme-preview ${theme.bgClass}`}>
                                                <span className="preview-text">بِسْمِ اللَّهِ</span>
                                            </div>
                                            <div className="rsm-theme-info">
                                                <h4>{theme.name}</h4>
                                                <p>{theme.desc}</p>
                                            </div>
                                            {quranTheme === theme.id && <span className="rsm-theme-check"><Icons.CheckIcon /></span>}
                                        </div>
                                    ))}
                                </div>

                                <div className="rsm-setting-row">
                                    <div className="row-info">
                                        <h4>{t('reading_view') || 'Layout View'}</h4>
                                        <p>{t('reading_view_desc') || 'Switch between Ayah-by-Ayah list or Mushaf page view'}</p>
                                    </div>
                                    <div className="rsm-toggle-group">
                                        <button 
                                            className={`toggle-btn ${viewMode === 'ayah' ? 'active' : ''}`}
                                            onClick={() => setViewMode('ayah')}
                                        >
                                            <Icons.BookIcon /> Ayah List
                                        </button>
                                        <button 
                                            className={`toggle-btn ${viewMode === 'page' ? 'active' : ''}`}
                                            onClick={() => setViewMode('page')}
                                        >
                                            <Icons.DocumentIcon /> Mushaf Page
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'text' && (
                            <div className="rsm-section fade-in">
                                <h3>{t('font_size') || 'Text Sizes'}</h3>
                                <div className="rsm-size-control">
                                    <span className="size-label small">Aa</span>
                                    <input 
                                        type="range" 
                                        min="16" 
                                        max="48" 
                                        value={fontSize} 
                                        onChange={(e) => {
                                            const sz = parseInt(e.target.value);
                                            setFontSize(sz);
                                            localStorage.setItem('quran_font_size', sz);
                                        }}
                                        className="rsm-slider"
                                    />
                                    <span className="size-label large">Aa</span>
                                    <span className="size-value-badge">{fontSize}px</span>
                                </div>

                                <div className="rsm-setting-row toggle-row">
                                    <div className="row-info">
                                        <h4>{t('show_translation') || 'Translations'}</h4>
                                        <p>{t('translation_desc') || 'Display English or localized translation'}</p>
                                    </div>
                                    <label className="rsm-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={showTranslation} 
                                            onChange={(e) => {
                                                setShowTranslation(e.target.checked);
                                                localStorage.setItem('quran_show_translation', e.target.checked);
                                            }}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>

                                <div className="rsm-setting-row toggle-row">
                                    <div className="row-info">
                                        <h4>{t('show_transliteration') || 'Transliteration'}</h4>
                                        <p>{t('transliteration_desc') || 'Show phonetic reading helper'}</p>
                                    </div>
                                    <label className="rsm-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={showTransliteration} 
                                            onChange={(e) => {
                                                setShowTransliteration(e.target.checked);
                                                localStorage.setItem('quran_show_transliteration', e.target.checked);
                                            }}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'audio' && (
                            <div className="rsm-section fade-in">
                                <h3>{t('change_reciter') || 'Reciter Selection'}</h3>
                                <div className="rsm-reciter-select-grid">
                                    {recitersList.map(rec => (
                                        <div 
                                            key={rec.id}
                                            className={`rsm-reciter-card ${reciter === rec.id ? 'active' : ''}`}
                                            onClick={() => setReciter(rec.id)}
                                        >
                                            <span className="reciter-avatar"><Icons.MicIcon /></span>
                                            <div className="reciter-name">{rec.name}</div>
                                            {reciter === rec.id && <span className="rsm-reciter-check"><Icons.CheckIcon /></span>}
                                        </div>
                                    ))}
                                </div>

                                <h3>{t('playback_speed') || 'Playback Speed'}</h3>
                                <div className="rsm-speed-pills">
                                    {[0.75, 1, 1.25, 1.5, 2].map(speed => (
                                        <button 
                                            key={speed}
                                            className={`rsm-speed-pill-btn ${playbackRate === speed ? 'active' : ''}`}
                                            onClick={() => setPlaybackRate(speed)}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ReadingSettingsModal;
