import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import './GenderPrompt.css';

export default function GenderPrompt() {
    const { t } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const gender = localStorage.getItem('userGender');
        if (!gender) {
            setIsVisible(true);
        }
    }, []);

    const handleSelect = (gender) => {
        localStorage.setItem('userGender', gender);
        setIsVisible(false);
    };

    const handleSkip = () => {
        localStorage.setItem('userGender', 'not-specified');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="gender-prompt-overlay">
            <div className="gender-prompt-card fade-in">
                <div className="gender-prompt-header">
                    <h2>{t('personalize_experience')}</h2>
                    <p>{t('gender_prompt_desc')}</p>
                </div>
                
                <div className="gender-options">
                    <button className="gender-btn" onClick={() => handleSelect('female')}>
                        <span className="gender-icon">👩</span>
                        <span>{t('female')}</span>
                    </button>
                    <button className="gender-btn" onClick={() => handleSelect('male')}>
                        <span className="gender-icon">👨</span>
                        <span>{t('male')}</span>
                    </button>
                    <button className="gender-btn" onClick={() => handleSelect('not-specified')}>
                        <span className="gender-icon">⚪</span>
                        <span>{t('prefer_not_say')}</span>
                    </button>
                </div>

                <div className="gender-prompt-footer">
                    <button className="skip-link" onClick={handleSkip}>{t('skip_for_now')}</button>
                </div>
            </div>
        </div>
    );
}
