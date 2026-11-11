import { appStorage } from './services/appStorage';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { TRANSLATIONS } from './translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [lang, setLangState] = useState(appStorage.getItem('zakat_lang') || 'en');

    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'zakat_lang') {
                setLangState(e.newValue || 'en');
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const setLang = (newLang) => {
        setLangState(newLang);
        appStorage.setItem('zakat_lang', newLang);
        window.dispatchEvent(new StorageEvent('storage', { key: 'zakat_lang', newValue: newLang }));
    };

    const t = (key) => {
        return TRANSLATIONS[lang]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
