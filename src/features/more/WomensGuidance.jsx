import { WELLNESS_DUAS, wellnessAudioUrl } from './wellnessDuas';
import { readStoredJSON } from '../../services/storedJson.mjs';
import { appStorage } from '../../services/appStorage';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';
import './WomensGuidance.css';


const SVGIcon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
    <path d={d} />
  </svg>
);

const Icons = {
  Flower: () => <SVGIcon d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM12 22c-4.97 0-9-4.03-9-9 4.97 0 9 4.03 9 9zM22 13c0-4.97-4.03-9-9-9 0 4.97 4.03 9 9 9zM2 13c0-4.97 4.03-9 9-9 0 4.97-4.03 9-9 9zM12 4V2" /> ,
  Drop: () => <SVGIcon d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />,
  Sparkles: () => <SVGIcon d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />,
  Message: () => <SVGIcon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  Beads: () => <SVGIcon d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 8v4 M12 16h.01" />,
  Book: () => <SVGIcon d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />,
  Hands: () => <SVGIcon d="M12 15c-3 0-5-2-5-5V4a2 2 0 0 1 4 0v4 M12 15c3 0 5-2 5-5V4a2 2 0 0 0-4 0v4" />,
  Mosque: () => <SVGIcon d="M12 2v2 M12 22V10 M6 22V14 M18 22V14 M4 14h16" />,
  Seedling: () => <SVGIcon d="M12 22V12 M12 12c-3-3-6-3-6 0s3 3 6 0 M12 12c3-3 6-3 6 0s-3 3-6 0" />,
  Pause: () => <SVGIcon d="M10 4H6v16h4V4z M18 4h-4v16h4V4z" />,
  Check: () => <SVGIcon d="M20 6 9 17l-5-5" />,
  Star: () => <SVGIcon d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  Clock: () => <SVGIcon d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2" />,
  Scroll: () => <SVGIcon d="M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01" />,
  Hourglass: () => <SVGIcon d="M5 22h14 M5 2h14 M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22 M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />,
  Lightning: () => <SVGIcon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
};

// SVG Icons
const BACK_ICON = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const MUTE_ICON = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
);

const UNMUTE_ICON = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
);

const HEART_ICON_EMPTY = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
);

const HEART_ICON_FILLED = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ff6b81' }}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
);

const PLAY_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const PAUSE_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
const STOP_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>;
const RESTART_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;
const OPEN_BOOK_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;

// Chevron for accordions
const CHEVRON_DOWN_ICON = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

// Helpful thumbs up
const THUMBS_UP_ICON = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
);

// Comfort Reminders
const REMINDERS = [
    {
        en: "“Allah knows your silent struggles and counts your silent tears.”",
        ml: "“ആരും കാണാത്ത നിങ്ങളുടെ നിശബ്ദമായ പോരാട്ടങ്ങളും കണ്ണീരും അല്ലാഹു കാണുന്നുണ്ട്.”"
    },
    {
        en: "“Rest is also a form of worship and mercy when done to care for the body Allah entrusted to you.”",
        ml: "“അല്ലാഹു നിങ്ങളെ ഏൽപ്പിച്ച ശരീരത്തെ പരിപാലിക്കാൻ വിശ്രമിക്കുന്നത് ഒരു തരം ആരാധനയും കാരുണ്യവുമാണ്.”"
    },
    {
        en: "“Your worth is never reduced in the eyes of Allah on days you cannot pray. Obedience is also found in resting.”",
        ml: "“പ്രാർത്ഥിക്കാൻ കഴിയാത്ത ദിവസങ്ങളിൽ അല്ലാഹുവിന്റെ അടുക്കൽ നിങ്ങളുടെ മൂല്യം കുറയുന്നില്ല. വിശ്രമത്തിലും അല്ലാഹുവോടുള്ള അനുസരണമുണ്ട്.”"
    },
    {
        en: "“Every dhikr you whisper heals the heart slowly, bringing you closer to Divine peace.”",
        ml: "“നിങ്ങൾ മന്ത്രിക്കുന്ന ഓരോ ദിക്റും ഹൃദയത്തെ സാവധാനം സുഖപ്പെടുത്തുകയും ദിവ്യമായ സമാധാനത്തിലേക്ക് നിങ്ങളെ നയിക്കുകയും ചെയ്യുന്നു.”"
    },
    {
        en: "“Allah does not burden a soul beyond what it can bear. Take a deep breath; He is always with you.”",
        ml: "“അല്ലാഹു ഒരാളോടും താങ്ങാൻ കഴിയുന്നതിലപ്പുറം പരീക്ഷിക്കാറില്ല. ആഴത്തിൽ ശ്വാസമെടുക്കൂ; He ഈസ് എപ്പോഴും നിങ്ങളോടൊപ്പമുണ്ട്.”"
    }
];

export default function WomensGuidance() {
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    const audioRef = useRef(null);

    // States
    const [activeTab, setActiveTab] = useState('tracker');
    const [isOnPeriod, setIsOnPeriod] = useState(() => appStorage.getItem('isOnPeriod') === 'true');
    const [periodStartDate, setPeriodStartDate] = useState(() => appStorage.getItem('periodStartDate') || '');
    const [cycleLength, setCycleLength] = useState(() => parseInt(appStorage.getItem('cycleLength') || '28', 10));
    const [favoriteReminders, setFavoriteReminders] = useState(() => {
        return readStoredJSON(appStorage, 'favReminders', []);
    });
    const [isMuted, setIsMuted] = useState(() => appStorage.getItem('tasbihMuted') === 'true');
    const [toastMessage, setToastMessage] = useState(null);

    // Master Playback States
    const [playingType, setPlayingType] = useState(null); // 'dhikr' or 'quran' or null
    const [activeAudioId, setActiveAudioId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [isLooping, setIsLooping] = useState(false);

    // Favorites & Bookmarks States
    const [favoritedSurahs, setFavoritedSurahs] = useState(() => {
        return readStoredJSON(appStorage, 'favSurahs', []);
    });
    const [audioBookmarks, setAudioBookmarks] = useState(() => {
        return readStoredJSON(appStorage, 'womens_audio_bookmarks', {});
    });

    // Q&A SPECIFIC STATES
    const [qaSearchQuery, setQaSearchQuery] = useState('');
    const [qaActiveCategory, setQaActiveCategory] = useState('all');
    const [expandedQuestionId, setExpandedQuestionId] = useState(null);
    
    // Q&A Favorites persisted
    const [qaFavorites, setQaFavorites] = useState(() => {
        return readStoredJSON(appStorage, 'womens_fav_questions', []);
    });

    // Q&A Recently Viewed persisted
    const [qaRecentlyViewed, setQaRecentlyViewed] = useState(() => {
        return readStoredJSON(appStorage, 'womens_recent_questions', []);
    });

    // Help reactions saved locally per question id (boolean state: true/false)
    const [qaHelpfulReactions, setQaHelpfulReactions] = useState(() => {
        return readStoredJSON(appStorage, 'womens_helpful_reactions', {});
    });

    // Simulated Helpful counts base seed
    const [helpfulCounts, setHelpfulCounts] = useState(() => {
        // Base helpful seeds for each question
        const seeds = {};
        for (let i = 1; i <= 20; i++) {
            seeds[`q_${i}`] = 42 + (i * 7) % 23;
        }
        return seeds;
    });

    // Daily Reminder Index Picker
    const [dailyIndex] = useState(() => {
        const today = new Date().getDate();
        return today % REMINDERS.length;
    });

    // Dua Category Filter
    const [activeDuaCategory, setActiveDuaCategory] = useState('All');

    // Elegant Toast trigger helper
    const triggerToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Save states to localstorage
    useEffect(() => {
        appStorage.setItem('isOnPeriod', isOnPeriod.toString());
    }, [isOnPeriod]);

    useEffect(() => {
        appStorage.setItem('periodStartDate', periodStartDate);
    }, [periodStartDate]);

    useEffect(() => {
        appStorage.setItem('cycleLength', cycleLength.toString());
    }, [cycleLength]);

    useEffect(() => {
        appStorage.setItem('favReminders', JSON.stringify(favoriteReminders));
    }, [favoriteReminders]);

    useEffect(() => {
        appStorage.setItem('favSurahs', JSON.stringify(favoritedSurahs));
    }, [favoritedSurahs]);

    useEffect(() => {
        appStorage.setItem('womens_audio_bookmarks', JSON.stringify(audioBookmarks));
    }, [audioBookmarks]);

    // Q&A storage syncs
    useEffect(() => {
        appStorage.setItem('womens_fav_questions', JSON.stringify(qaFavorites));
    }, [qaFavorites]);

    useEffect(() => {
        appStorage.setItem('womens_recent_questions', JSON.stringify(qaRecentlyViewed));
    }, [qaRecentlyViewed]);

    useEffect(() => {
        appStorage.setItem('womens_helpful_reactions', JSON.stringify(qaHelpfulReactions));
    }, [qaHelpfulReactions]);

    // Handle mute state change
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
        appStorage.setItem('tasbihMuted', isMuted.toString());
    }, [isMuted]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    const toggleMute = () => {
        setIsMuted(prev => !prev);
    };

    // Triggered when audio metadata / duration loads
    const handleLoadedMetadata = () => {
        setIsBuffering(false);
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackSpeed;
            // Seek to bookmark if any exists
            if (activeAudioId && audioBookmarks[activeAudioId]) {
                audioRef.current.currentTime = audioBookmarks[activeAudioId];
            }
        }
    };

    // Save playing timestamp periodically
    const handleTimeUpdate = () => {
        if (audioRef.current && isPlaying && activeAudioId) {
            setAudioBookmarks(prev => ({
                ...prev,
                [activeAudioId]: audioRef.current.currentTime
            }));
        }
    };

    // Audio end event handler
    const handleAudioEnded = () => {
        if (isLooping && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log('Playback error:', e));
        } else {
            setIsPlaying(false);
            setPlayingType(null);
            setActiveAudioId(null);
        }
    };

    // Audio error event handler
    const handleAudioError = () => {
        setIsPlaying(false);
        setIsBuffering(false);
        setPlayingType(null);
        setActiveAudioId(null);
        triggerToast(lang === 'ml' ? "ഓഡിയോ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല" : "Unable to load audio");
    };

    // Arabic Playback for Wellness Duas from local files
    const playTTSDua = (id) => {
        try {
            const audioUrl = wellnessAudioUrl(id);
            if (!audioUrl) { handleAudioError(); return; }
            togglePlayback('dua', id, audioUrl);
        } catch (e) {
            handleAudioError();
        }
    };

    // Unified Audio play/pause toggler
    const togglePlayback = (type, id, url) => {
        if (!audioRef.current) return;

        // Same track clicked
        if (playingType === type && activeAudioId === id) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                setIsBuffering(true);
                audioRef.current.play()
                    .then(() => {
                        setIsPlaying(true);
                        setIsBuffering(false);
                    })
                    .catch(() => handleAudioError());
            }
        } else {
            // New track clicked
            if (isPlaying && audioRef.current) {
                audioRef.current.pause();
            }

            setIsBuffering(true);
            setIsPlaying(false);
            setPlayingType(type);
            setActiveAudioId(id);

            // Configure loop based on type (dhikrs loop gently by default, Quran does not)
            const shouldLoop = type === 'dhikr';
            setIsLooping(shouldLoop);

            // Change source
            audioRef.current.src = url;
            audioRef.current.load();
            audioRef.current.muted = isMuted;

            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                    setIsBuffering(false);
                })
                .catch(() => handleAudioError());
        }
    };

    const stopPlayback = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setPlayingType(null);
        setActiveAudioId(null);
        setIsBuffering(false);
    };

    const restartPlayback = () => {
        if (audioRef.current) {
            setIsBuffering(true);
            audioRef.current.currentTime = 0;
            audioRef.current.play().then(() => {
                setIsPlaying(true);
                setIsBuffering(false);
            }).catch(() => handleAudioError());
        }
    };

    // Toggle Favorite Reminder
    const toggleFavReminder = (index) => {
        if (favoriteReminders.includes(index)) {
            setFavoriteReminders(prev => prev.filter(i => i !== index));
        } else {
            setFavoriteReminders(prev => [...prev, index]);
        }
    };

    // Toggle Favorite Surah
    const toggleFavSurah = (id) => {
        if (favoritedSurahs.includes(id)) {
            setFavoritedSurahs(prev => prev.filter(x => x !== id));
        } else {
            setFavoritedSurahs(prev => [...prev, id]);
        }
    };

    // Predict Next Period Day
    const getNextPeriodPrediction = () => {
        if (!periodStartDate) return null;
        const start = new Date(periodStartDate);
        start.setDate(start.getDate() + cycleLength);
        return start.toLocaleDateString(lang === 'ml' ? 'ml-IN' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Playback Speed control
    const changePlaybackSpeed = (speed) => {
        setPlaybackSpeed(speed);
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
    };

    // Comfort Dhikrs Data
    const COMFORT_DHIKRS = [
        {
            id: 'hasbunallah',
            arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
            trans: "Hasbunallahu wa ni’mal wakeel",
            en: "Sufficient for us is Allah, and He is the best Disposer of affairs.",
            ml: "ഞങ്ങൾക്ക് അല്ലാഹു മതി, അവൻ എല്ലാ കാര്യങ്ങളും ഭരമേൽപ്പിക്കാൻ ഏറ്റവും ഉത്തമനായവനാണ്.",
            category: lang === 'ml' ? "ഭയം / സ്ട്രെസ്സ്" : "Fear / Stress",
            audio: "/audio/tasbih/hasbunallah.mp3"
        },
        {
            id: 'astaghfirullah',
            arabic: "أَسْتَغْفِرُ اللَّهَ",
            trans: "Astaghfirullah",
            en: "I seek forgiveness from Allah.",
            ml: "ഞാൻ അല്ലാഹുവോട് പാപമോചനം തേടുന്നു.",
            category: lang === 'ml' ? "മാനസിക വിഷമം" : "Overthinking / Guilt",
            audio: "/audio/tasbih/astaghfirullah.mp3"
        },
        {
            id: 'ya_latheef',
            arabic: "يَا لَطِيفُ",
            trans: "Ya Lateef",
            en: "O Gentle, O Most Kind One.",
            ml: "ഏറ്റവും ദയാലുവായവനേ, സൗമ്യനായവനേ...",
            category: lang === 'ml' ? "വേദന നിറഞ്ഞ ദിവസങ്ങൾ" : "Period Pain / Sadness",
            audio: "/audio/tasbih/ya_latheef.mp3"
        },
        {
            id: 'la_hawla',
            arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
            trans: "La hawla wa la quwwata illa billah",
            en: "There is no might nor power except in Allah.",
            ml: "അല്ലാഹുവിനെക്കൊണ്ടല്ലാതെ യാതൊരു ശക്തിയും കഴിവുമില്ല.",
            category: lang === 'ml' ? "ക്ഷീണം / തളർച്ച" : "Fatigue / Loneliness",
            audio: "/audio/tasbih/la_hawla.mp3"
        }
    ];

    // Recitations Data
    const QURAN_RECITATIONS = [
        {
            id: 'maryam',
            surahNum: 19,
            title_en: "Surah Maryam (Patience & Faith)",
            title_ml: "സൂറത്ത് മറിയം (ക്ഷമയും വിശ്വാസവും)",
            desc_en: "A beautiful surah that brings emotional strength, highlighting how Maryam (AS) faced divine trials with miraculous patience.",
            desc_ml: "ആത്മവിശ്വാസവും ശക്തിയും നൽകുന്ന സൂറത്ത്. മറിയം ബീവി പരീക്ഷണങ്ങളെ അത്ഭുതകരമായ ക്ഷമയോടെ എങ്ങനെ നേരിട്ടു എന്ന് വ്യക്തമാക്കുന്നു.",
            audio: "https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/19.mp3"
        },
        {
            id: 'rahman',
            surahNum: 55,
            title_en: "Surah Ar-Rahman (The Ultimate Comfort)",
            title_ml: "സൂറത്ത് അർ-റഹ്മാൻ (പരമമായ സമാധാനം)",
            desc_en: "An incredibly peaceful recitation demonstrating Allah's infinite compassion and constant blessings upon His servants.",
            desc_ml: "തന്റെ ദാസന്മാരോടുള്ള അല്ലാഹുവിന്റെ അനന്തമായ കരുണയും അനുഗ്രഹങ്ങളും ഓർമ്മിപ്പിക്കുന്ന അതിമനോഹരമായ സൂറത്ത്.",
            audio: "https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/55.mp3"
        },
        {
            id: 'yaseen',
            surahNum: 36,
            title_en: "Surah Yaseen (The Heart of the Quran)",
            title_ml: "സൂറത്ത് യാസീൻ (ഖുർആന്റെ ഹൃദയം)",
            desc_en: "The heart of the Quran. Recited globally to calm troubled souls and invoke mercy upon painful times.",
            desc_ml: "ഖുർആന്റെ ഹൃദയം. പ്രയാസകരമായ സമയങ്ങളിൽ മനസ്സിന് സമാധാനം നേടാനും അനുഗ്രഹങ്ങൾ തേടാനും ഇത് സഹായിക്കുന്നു.",
            audio: "https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/36.mp3"
        },
        {
            id: 'duha',
            surahNum: 93,
            title_en: "Surah Ad-Duha (Hope after Darkness)",
            title_ml: "സൂറത്ത് അദ്-ദുഹാ (പ്രത്യാശയുടെ കിരണം)",
            desc_en: "Revealed specifically to comfort the Prophet's heart during a period of sadness. A perfect reminder that Allah has not abandoned you.",
            desc_ml: "വിഷമകരമായ സമയങ്ങളിൽ പ്രവാചകന്റെ ഹൃദയത്തെ ആശ്വസിപ്പിക്കാൻ അവതരിപ്പിക്കപ്പെട്ട സൂറത്ത്. അല്ലാഹു നിങ്ങളെ ഉപേക്ഷിച്ചിട്ടില്ലെന്ന ഓർമ്മപ്പെടുത്തൽ.",
            audio: "https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/93.mp3"
        }
    ];

    // Duas Data

    const duaCategories = ['All', ...new Set(WELLNESS_DUAS.map(dua => dua.filterCategory))];

    // Stories Data
    const HEROINES_STORIES = [
        {
            name_en: "Sayyida Khadija (RA)",
            name_ml: "സയ്യിദത്ത് ഖദീജ (റ)",
            role_en: "The Devoted Pillar of Support",
            role_ml: "ആദ്യ വിശ്വാസിയും താങ്ങും",
            desc_en: "The first believer and companion who wrapped the Prophet ﷺ in comfort and reassurance during early revelations, standing firm through extreme societal boycotts with her immense wealth and absolute faith.",
            desc_ml: "ആദ്യമായി ഇസ്ലാം സ്വീകരിച്ച മഹതി. വെളിപാടുകൾ ആരംഭിച്ച പ്രയാസകരമായ ഘട്ടത്തിൽ നബി ﷺ യെ ആശ്വസിപ്പിക്കുകയും കൂടെ നിൽക്കുകയും ചെയ്തു.",
            lessons_en: ["Unconditional companionship", "Unshakable moral resolve", "Selfless resource support"],
            lessons_ml: ["നിരുപാധികമായ പിന്തുണ", "ഉറച്ച ആത്മവിശ്വാസം", "സ്നേഹവും കാരുണ്യവും"],
            color: 'rose'
        },
        {
            name_en: "Sayyida Aisha (RA)",
            name_ml: "സയ്യിദത്ത് ആയിഷ (റ)",
            role_en: "The Mother of Intellectual Knowledge",
            role_ml: "ജ്ഞാനത്തിന്റെ മാതാവ്",
            desc_en: "The Mother of Believers, a brilliant and articulate scholar who narrated over 2,200 Hadiths, serving as the leading educator of law, poetry, and theology for the entire Ummah.",
            desc_ml: "വിശ്വാസികളുടെ മാതാവ്. ഇസ്ലാമിക വിജ്ഞാനങ്ങളുടെ വലിയൊരു പങ്ക് ഉദ്ധരിച്ച പ്രഗത്ഭ പണ്ഡിതയും അധ്യാപികയുമാണ് ആയിഷ ബീവി.",
            lessons_en: ["Boundless pursuit of education", "Articulate eloquence", "Independent leadership"],
            lessons_ml: ["വിജ്ഞാനത്തോടുള്ള താല്പര്യം", "വ്യക്തമായ ആശയവിനിമയം", "മാതൃകാപരമായ നേതൃത്വം"],
            color: 'teal'
        },
        {
            name_en: "Sayyida Fatima (RA)",
            name_ml: "സയ്യിദത്ത് ഫാത്തിമ (റ)",
            role_en: "The Resilient Flower of Paradise",
            role_ml: "സ്വർഗ്ഗത്തിലെ സ്ത്രീകളുടെ നേതാവ്",
            desc_en: "The beloved daughter of the Prophet ﷺ, known as the leader of the women of Paradise. Her life was defined by extreme devotion, pure simplicity, and breathtaking patience during hardships.",
            desc_ml: "പ്രവാചകൻ ﷺ യുടെ പ്രിയപുത്രി. അതീവ ലളിതമായ ജീവിതരീതിയിലൂടെയും പ്രയാസങ്ങളിലെ അപാരമായ ക്ഷമയിലൂടെയും സ്വർഗ്ഗത്തിലെ സ്ത്രീകളുടെ മാതൃകയായി.",
            lessons_en: ["Devotional humility", "Boundless family warmth", "Elegant patience"],
            lessons_ml: ["വിനയവും ലളിത ജീവിതവും", "കുടുംബസ്നേഹം", "ക്ഷമാശീലം"],
            color: 'lavender'
        }
    ];

    // Self Care Data
    const SELF_CARE_TIPS = [
        {
            title_en: "Sacred Rest & Recovery",
            title_ml: "വിശ്രമവും ആശ്വാസവും",
            desc_en: "Your body has divine rights over you. Resting is not laziness; it is an act of obedience to the Creator who designed sleep for complete restoration.",
            desc_ml: "നിങ്ങളുടെ ശരീരത്തിന് നിങ്ങളോട് ചില അവകാശങ്ങളുണ്ട്. ആവശ്യത്തിന് വിശ്രമിക്കുന്നത് മടിയല്ല, മറിച്ച് സൃഷ്ടാവിന്റെ കൽപ്പന അനുസരിക്കലാണ്.",
            icon: <Icons.Flower />
        },
        {
            title_en: "Pure Mindful Hydration",
            title_ml: "ശരീരത്തെ ഈർപ്പമുള്ളതാക്കുക",
            desc_en: "Water is a miracle blessing that washes away physical exhaustion and cleanses the soul. Keep yourself properly hydrated to ward off emotional fatigue.",
            desc_ml: "ശാരീരിക ക്ഷീണം മാറ്റാനും ഉന്മേഷം നൽകാനും സഹായിക്കുന്ന അല്ലാഹുവിന്റെ അനുഗ്രഹമാണ് ജലം. ആവശ്യത്തിന് വെള്ളം കുടിക്കുക.",
            icon: <Icons.Drop />
        },
        {
            title_en: "Self-Kindness & Gentle Speech",
            title_ml: "സ്വയം ദയ കാണിക്കുക",
            desc_en: "Speak gently to yourself. The Prophet ﷺ was described as an embodiment of mercy; practice that mercy on your own heart during painful days.",
            desc_ml: "സ്വയം ദയയോടെ സംസാരിക്കുക. പ്രവാചകൻ ﷺ കാരുണ്യത്തിന്റെ പ്രതീകമായിരുന്നു. പ്രയാസകരമായ സമയങ്ങളിൽ ആ കാരുണ്യം സ്വന്തം മനസ്സിനും നൽകുക.",
            icon: <Icons.Sparkles />
        }
    ];

    // Q&A 20 Compelling Questions Dataset
    const QA_DATA = [
        {
            id: 'q_1',
            category: 'quran',
            q_en: "Can I recite Quran during my period?",
            q_ml: "മാസമുറ സമയത്ത് എനിക്ക് ഖുർആൻ ഓതാമോ?",
            a_en: "There are different scholarly opinions regarding reciting the Quran during menstruation.\n\nMany scholars say that a woman should avoid directly reciting the Quran in Arabic until her period ends, especially from a physical Mushaf (printed Quran).\n\nSome scholars allow recitation from memory or through a phone for learning, dhikr, or protection, particularly if there is a need such as studying or fear of forgetting memorization.\n\nHowever, most scholars agree that:\n• Dhikr is allowed\n• Dua is allowed\n• Listening to Quran is allowed\n• Reading translations and tafsir is allowed\n\nIt is best for users to follow the guidance they trust from knowledgeable scholars or their local madhhab.",
            a_ml: "മാസമുറ സമയത്ത് ഖുർആൻ പാരായണം ചെയ്യുന്നതിനെക്കുറിച്ച് ഇസ്ലാമിക പണ്ഡിതന്മാർക്കിടയിൽ വ്യത്യസ്ത അഭിപ്രായങ്ങളുണ്ട്.\n\nപല പണ്ഡിതന്മാരുടെയും അഭിപ്രായത്തിൽ, പീരിയഡ്സ് തീരുന്നതുവരെ ഭൗതികമായ ഖുർആൻ (പ്രിന്റഡ് മുസ്ഹഫ്) നോക്കി നേരിട്ട് അറബിയിൽ ഓതുന്നത് ഒഴിവാക്കണം.\n\nഎന്നാൽ പഠനാവശ്യങ്ങൾക്കോ, ഹൃദിസ്ഥമാക്കിയത് മറന്നുപോകാതിരിക്കാനോ, അല്ലെങ്കിൽ പ്രാർത്ഥനയ്ക്കും സംരക്ഷണത്തിനുമായി ഫോണിലൂടെയോ ഓർമ്മയിൽ നിന്നോ ഓതാവുന്നതാണെന്ന് മറ്റ് ചില പണ്ഡിതന്മാർ അഭിപ്രായപ്പെടുന്നു.\n\nഎന്നിരുന്നാലും, താഴെ പറയുന്ന കാര്യങ്ങളിൽ പണ്ഡിതന്മാർ ഒരേപോലെ യോജിക്കുന്നു:\n• ദിക്റുകൾ ചൊല്ലാം\n• ദുആകൾ ചെയ്യാം\n• ഖുർആൻ കേൾക്കാം\n• തർജ്ജമകളും വ്യാഖ്യാനങ്ങളും (തഫ്സീർ) വായിക്കാം\n\nഅതിനാൽ, നിങ്ങളുടെ പ്രാദേശിക മദ്ഹബിലെ പണ്ഡിതന്മാരിൽ നിന്നോ നിങ്ങൾ വിശ്വസിക്കുന്ന മാർഗ്ഗനിർദ്ദേശങ്ങളിൽ നിന്നോ ഉള്ള സൗമ്യമായ അഭിപ്രായം പിന്തുടരുന്നതാണ് ഏറ്റവും ഉചിതം.",
            ref_en: "This matter contains scholarly differences among Islamic schools of thought.",
            ref_ml: "വിവിധ ഇസ്ലാമിക കർമ്മശാസ്ത്ര സരണി (മദ്ഹബ്) പണ്ഡിതന്മാർക്കിടയിൽ അഭിപ്രായവ്യത്യാസങ്ങളുള്ള ഒരു വിഷയമാണിത്.",
            dua_suggest_en: "“O Allah, make the Quran the spring of my heart.”",
            dua_suggest_ml: "“അല്ലാഹുവേ, ഖുർആനെ എന്റെ ഹൃദയത്തിന്റെ വസന്തമാക്കേണമേ.”",
            related_dhikr: 'astaghfirullah'
        },
        {
            id: 'q_2',
            category: 'quran',
            q_en: "Is listening to Quran allowed during menstruation?",
            q_ml: "മാസമുറ സമയത്ത് ഖുർആൻ കേൾക്കുന്നത് അനുവദനീയമാണോ?",
            a_en: "Yes, listening to the Quran is highly encouraged and serves as a soothing balm for the heart. The Prophet ﷺ used to lean on Sayyida Aisha (RA) while she was on her period and recite the Quran, showcasing divine closeness and warmth.",
            a_ml: "അതെ, ഖുർആൻ പാരായണം ശ്രവിക്കുന്നത് ഹൃദയത്തിന് വലിയ ആശ്വാസവും സമാധാനവും നൽകുന്ന കാര്യമാണ്. ആയിഷ ബീവി (റ) പീരിയഡ്സ് ആയിരുന്നപ്പോൾ പ്രവാചകൻ ﷺ അവരുടെ മടിയിൽ കിടന്നുകൊണ്ട് ഖുർആൻ ഓതിക്കേൾപ്പിക്കാറുണ്ടായിരുന്നു.",
            ref_en: "Sahih al-Bukhari 297",
            ref_ml: "സ്വഹീഹ് അൽ-ബുഖാരി 297",
            related_dhikr: 'hasbunallah'
        },
        {
            id: 'q_3',
            category: 'worship',
            q_en: "Can I make sincere dua and personal prayers during my period?",
            q_ml: "ഈ സമയത്ത് എനിക്ക് ദുആ ചെയ്യാൻ സാധിക്കുമോ?",
            a_en: "Of course! Dua is the very essence of worship and is open to you at all times, with no state of physical impurity ever blocking your heart's conversation with Allah. He hears every whisper of your soul.",
            a_ml: "തീർച്ചയായും! ദുആ എന്നത് ആരാധനകളുടെ കാതലാണ്. അല്ലാഹുവോട് പ്രാർത്ഥിക്കുന്നതിനും മനസ്സ് തുറക്കുന്നതിനും ശാരീരിക അവസ്ഥകൾ യാതൊരു തടസ്സവുമല്ല. അവൻ നിങ്ങളുടെ ഹൃദയമിടിപ്പ് പോലും അറിയുന്നു.",
            ref_en: "Prophetic tradition: 'Dua is the brain of worship.'",
            ref_ml: "പ്രവാചക വചനം: 'പ്രാർത്ഥന ആരാധനയുടെ കാതലാണ്.'",
            dua_suggest_en: "“O Allah, guide me, sustain me, and heal me.”",
            dua_suggest_ml: "“അല്ലാഹുവേ, എന്നെ നയിക്കേണമേ, എനിക്ക് ഭക്ഷണം നൽകേണമേ, സൗഖ്യം നൽകേണമേ.”"
        },
        {
            id: 'q_4',
            category: 'quran',
            q_en: "Is it allowed to do dhikr and tasbih during periods?",
            q_ml: "മാസമുറ സമയത്ത് ദിക്റും തസ്ബീഹും ചെയ്യാമോ?",
            a_en: "Yes, keeping your tongue moist with Subhanallah, Alhamdulillah, and Astaghfirullah is beautiful and highly rewarded. There is no barrier between your remembrance of Allah and His immense mercy.",
            a_ml: "അതെ, 'സുബ്ഹാനല്ലാഹ്', 'അൽഹംദുലില്ലാഹ്', 'അസ്തഗ്ഫിറുള്ളാഹ്' തുടങ്ങിയ ദിക്റുകൾ ചൊല്ലി നാവിനെ ഈർപ്പമുള്ളതാക്കുന്നത് ഏറെ പുണ്യമാണ്. നാഥനെ സ്മരിക്കുന്നതിന് യാതൊരു ശാരീരിക വിലക്കുകളുമില്ല.",
            ref_en: "Quran 3:191 (remembrance in all states)",
            ref_ml: "വിശുദ്ധ ഖുർആൻ 3:191 (എല്ലാ അവസ്ഥകളിലും അല്ലാഹുവെ സ്മരിക്കുക)"
        },
        {
            id: 'q_5',
            category: 'practical',
            q_en: "Can I enter or pass through the mosque during my period?",
            q_ml: "ഈ സമയത്ത് എനിക്ക് പള്ളിയിൽ പ്രവേശിക്കാമോ?",
            a_en: "While traditional jurists advise against lingering inside the prayer hall, you can absolutely enter to attend educational classes, seek sanctuary in administrative/outer halls, or walk through out of necessity, with ease and peace of mind.",
            a_ml: "നമസ്കരിക്കുന്ന പ്രധാന ഹാളിൽ ഇരിക്കുന്നത് പണ്ഡിതന്മാർ സാധാരണയായി പ്രോത്സാഹിപ്പിക്കാറില്ലെങ്കിലും, പള്ളിയോട് ചേർന്നുള്ള ക്ലാസ്സ് മുറികളിലോ പൊതുഹാളുകളിലോ പഠനാവശ്യങ്ങൾക്കും ക്ലാസ്സുകൾക്കുമായി നിങ്ങൾക്ക് സമാധാനത്തോടെ പ്രവേശിക്കാവുന്നതാണ്.",
            ref_en: "Islamic principles of facilitation and ease.",
            ref_ml: "ലളിതവൽക്കരണത്തിന്റെയും ഇളവുകളുടെയും പൊതുവായ ഇസ്ലാമിക തത്വം."
        },
        {
            id: 'q_6',
            category: 'worship',
            q_en: "Do I need to make up the prayers I missed during my period?",
            q_ml: "ഈ ദിവസങ്ങളിൽ നഷ്ടപ്പെട്ട നമസ്കാരങ്ങൾ പിന്നീട് മടക്കി നമസ്കരിക്കേണ്ടതുണ്ടോ?",
            a_en: "No, Allah has mercifully excused women from making up missed prayers as a divine relief and kindness. You do not carry any spiritual debt or guilt for not praying during these days.",
            a_ml: "ഇല്ല, സ്ത്രീകൾക്ക് ലഭിച്ച വലിയൊരു ഇളവാണിത്. ഈ ദിവസങ്ങളിലെ നമസ്കാരങ്ങൾ പിന്നീട് മടക്കി നമസ്കരിക്കേണ്ടതില്ല. അതിൽ നിങ്ങൾക്ക് യാതൊരുവിധ കുറ്റബോധമോ ബാധ്യതയോ ഇല്ല.",
            ref_en: "Sahih al-Bukhari 321",
            ref_ml: "സ്വഹീഹ് അൽ-ബുഖാരി 321"
        },
        {
            id: 'q_7',
            category: 'worship',
            q_en: "Do I need to make up missed Ramadan fasts?",
            q_ml: "റമദാനിൽ നഷ്ടപ്പെട്ട നോമ്പുകൾ പിന്നീട് നോക്കേണ്ടതുണ്ടോ?",
            a_en: "Yes, while you are excused from fasting during periods to protect your health, you should gently make up those days later in the year, when you are strong, refreshed, and clean.",
            a_ml: "അതെ, പീരിയഡ്സ് സമയത്ത് നോമ്പെടുക്കുന്നത് ഒഴിവാക്കാനും പിന്നീട് സൗകര്യപ്രദമായ സമയത്ത് നോമ്പ് നോറ്റ് വീട്ടാനും അല്ലാഹു നിർദ്ദേശിച്ചിട്ടുണ്ട്. ഇത് ശരീരത്തിന് ക്ഷീണം വരാതിരിക്കാനുള്ള ഇളവാണ്.",
            ref_en: "Consensus based on Aisha's (RA) narration.",
            ref_ml: "ആയിഷ ബീവി (റ) ഉദ്ധരിച്ച ഹദീസിന്റെ അടിസ്ഥാനത്തിലുള്ള പണ്ഡിത ഐക്യം."
        },
        {
            id: 'q_8',
            category: 'quran',
            q_en: "Can I touch the physical Arabic Quran during periods?",
            q_ml: "പീരിയഡ്സ് സമയത്ത് എനിക്ക് ഖുർആൻ തൊടാമോ?",
            a_en: "To show deep reverence for the sacred pages, it is recommended to use a clean cloth or gloves when handling the physical Arabic Mushaf, or read from translation books where the translation text is more than the Arabic.",
            a_ml: "വിശുദ്ധ ഖുർആനോടുള്ള ആദരസൂചകമായി, നേരിട്ട് അറബി വചനങ്ങൾ തൊടുന്നതിന് പകരം ഒരു തുണി ഉപയോഗിച്ചോ ഗ്ലൗസ് ധരിച്ചോ തൊടാവുന്നതാണ്. എന്നാൽ തർജ്ജമ ഗ്രന്ഥങ്ങളും മൊബൈൽ ആപ്പുകളും നിങ്ങൾക്ക് സാധാരണ പോലെ ഉപയോഗിക്കാം.",
            ref_en: "Classical etiquettes of Quran handling.",
            ref_ml: "ഖുർആനോടുള്ള പരമ്പരാഗത ആദരവിന്റെ മര്യാദകൾ."
        },
        {
            id: 'q_9',
            category: 'quran',
            q_en: "Can I read Quran from my phone or tablet screen?",
            q_ml: "മൊബൈൽ ഫോൺ ഉപയോഗിച്ച് ഖുർആൻ വായിക്കാമോ?",
            a_en: "Yes, absolutely! Since digital screens are not considered physical Mushaf pages, you are fully allowed to read, scroll, and learn Quran from digital apps at any time, in any physical state.",
            a_ml: "അതെ, തീർച്ചയായും! മൊബൈൽ സ്ക്രീൻ ഭൗതികമായ ഖുർആൻ താളുകളായി കണക്കാക്കാത്തതിനാൽ നിങ്ങൾക്ക് ഏത് സമയത്തും ഫോണിലൂടെ ഖുർആൻ സൂക്തങ്ങൾ സമാധാനത്തോടെ ഓതാവുന്നതാണ്.",
            ref_en: "Contemporary Fatwa of Islamic Jurisprudence Council.",
            ref_ml: "ആധുനിക ഇസ്ലാമിക ഫിഖ്ഹ് കൗൺസിലിന്റെ ഫത്‌വ."
        },
        {
            id: 'q_10',
            category: 'worship',
            q_en: "Is it sinful or lazy to miss prayers during menstruation?",
            q_ml: "ഈ ദിവസങ്ങളിൽ നമസ്കരിക്കാത്തതിൽ എനിക്ക് പാപമുണ്ടോ?",
            a_en: "Not at all! Refraining from prayer during your period is an act of submission to Allah's decree. You are being rewarded for following His permission to rest, just as you are rewarded for praying when clean.",
            a_ml: "ഒരിക്കലുമില്ല! അല്ലാഹുവിന്റെ കല്പന അനുസരിച്ച് നമസ്കാരം ഒഴിവാക്കുന്നതും ആരാധനയാണ്. ശുദ്ധിയുള്ളപ്പോൾ നമസ്കരിക്കാൻ കല്പിച്ച അല്ലാഹു തന്നെയാണ് ഈ സമയത്ത് വിശ്രമിക്കാൻ കല്പിച്ചതും.",
            ref_en: "Based on complete submission to Divine boundaries.",
            ref_ml: "നാഥന്റെ ഇളവുകൾ സന്തോഷത്തോടെ സ്വീകരിക്കുന്നതിനുള്ള പ്രതിഫലം."
        },
        {
            id: 'q_11',
            category: 'quran',
            q_en: "Can I recite Ayatul Kursi for protection before sleep?",
            q_ml: "പീരിയഡ്സ് സമയത്ത് എനിക്ക് ആയത്തുൽ куർസി ഓതാമോ?",
            a_en: "Yes, reciting Ayatul Kursi, Surah al-Falaq, and Surah an-Nas before sleeping for protection and comfort is fully allowed and highly recommended during your period.",
            a_ml: "അതെ, ഉറങ്ങുന്നതിന് മുമ്പും മറ്റും സംരക്ഷണത്തിനായി ആയത്തുൽ കുർസിയും അൽ-ഫലഖ്, അൻ-നാസ് എന്നീ സൂറത്തുകളും ഓതുന്നത് പൂർണ്ണമായും അനുവദനീയവും വളരെ നല്ലതുമാണ്.",
            ref_en: "Prophetic protective Adhkar rules.",
            ref_ml: "പ്രവാചകൻ പഠിപ്പിച്ച പ്രതിരോധ ദിക്റുകളുടെ ഇളവുകൾ."
        },
        {
            id: 'q_12',
            category: 'quran',
            q_en: "Can women use prayer beads (tasbih) to praise Allah?",
            q_ml: "ഈ സമയത്ത് തസ്ബീഹ് മാല ഉപയോഗിച്ച് ദിക്ർ ചൊല്ലാമോ?",
            a_en: "Yes! Using prayer beads, counters, or your fingers to praise Allah is a beautiful act of worship that remains open and heavily rewarded throughout your cycle.",
            a_ml: "അതെ! തസ്ബീഹ് മാലയോ, ഡിജിറ്റൽ കൗണ്ടറോ, വിരലുകളോ ഉപയോഗിച്ച് അല്ലാഹുവിന് സ്തുതി പാടുന്നത് ഈ സമയത്തും അനുവദനീയവും ഏറെ പ്രതിഫലം ലഭിക്കുന്നതുമാണ്.",
            ref_en: "Consensus on remembrance practices.",
            ref_ml: "ദിക്ർ ചൊല്ലുന്നതിനുള്ള പൊതുവായ അനുവാദം.",
            related_dhikr: 'ya_latheef'
        },
        {
            id: 'q_13',
            category: 'maternity',
            q_en: "What is Nifas, and what are its general guidelines?",
            q_ml: "എന്താണ് നിഫാസ് (പ്രസവരക്തം)?",
            a_en: "Nifas is postpartum bleeding that occurs after giving birth. Islam mercifully excuses you from prayers and fasting during this time to focus fully on recovery and bonding. The maximum duration is typically 40 days.",
            a_ml: "പ്രസവത്തെ തുടർന്നുണ്ടാകുന്ന രക്തസ്രാവമാണ് നിഫാസ്. ഈ ഘട്ടത്തിൽ പൂർണ്ണമായും വിശ്രമിക്കാനും കുഞ്ഞിനെ പരിചരിക്കാനും ഇസ്ലാം നിങ്ങൾക്ക് സൗകര്യമൊരുക്കുന്നു. ഇതിന്റെ പരമാവധി ദൈർഘ്യം സാധാരണയായി 40 ദിവസമാണ്.",
            ref_en: "Fiqh guidelines regarding postpartum care.",
            ref_ml: "പ്രസവാനന്തര ശുദ്ധീകരണത്തെക്കുറിച്ചുള്ള ഫിഖ്ഹ് നിയമങ്ങൾ."
        },
        {
            id: 'q_14',
            category: 'maternity',
            q_en: "Can pregnant or breastfeeding women delay their Ramadan fasts?",
            q_ml: "ഗർഭിണികൾക്ക് റമദാൻ നോമ്പ് മാറ്റിവെക്കാമോ?",
            a_en: "Yes, if you fear for your health or your baby's health, Islam grants you full permission to delay your fasts. You can gently make them up later or feed the poor (Fidya) if unable to fast.",
            a_ml: "അതെ, ഗർഭിണികൾക്കോ മുലയൂട്ടുന്ന അമ്മമാർക്കോ സ്വന്തം ആരോഗ്യത്തെക്കുറിച്ചോ കുഞ്ഞിന്റെ ആരോഗ്യത്തെക്കുറിച്ചോ ആശങ്കയുണ്ടെങ്കിൽ നോമ്പ് മാറ്റിവെക്കാൻ പൂർണ്ണ അനുവാദമുണ്ട്. പിന്നീട് നോറ്റുവീട്ടുകയോ സാധിക്കാത്തവർ ഫിദ്യ നൽകുകയോ ചെയ്യാം.",
            ref_en: "Hadith of Anas bin Malik (Sunan an-Nasa'i 2274)",
            ref_ml: "അനസ് ബിൻ മാലിക് ഉദ്ധരിച്ച ഹദീസ് (സുനൻ അൻ-നസാഈ 2274)"
        },
        {
            id: 'q_15',
            category: 'worship',
            q_en: "What acts of worship are open to me during periods?",
            q_ml: "ഈ സമയത്ത് ചെയ്യാൻ സാധിക്കുന്ന ആരാധനകൾ എന്തൊക്കെയാണ്?",
            a_en: "Nearly all of them! You can do dhikr, send salawat on the Prophet ﷺ, make heartfelt duas, listen to the Quran, read Islamic books, give charity, and serve your family and community with kindness.",
            a_ml: "നമസ്കാരവും നോമ്പും ഒഴികെയുള്ള മിക്ക ആരാധനകളും നിങ്ങൾക്ക് ചെയ്യാം! ദിക്റുകൾ ചൊല്ലുക, സ്വലാത്ത് ചൊല്ലുക, മനസ്സ് നിറഞ്ഞ ദുആകൾ ചെയ്യുക, ദാനധർമ്മങ്ങൾ ചെയ്യുക, മറ്റുള്ളവരോട് കരുണയോടെ പെരുമാറുക തുടങ്ങിയവയെല്ലാം പ്രതിഫലാർഹമാണ്.",
            ref_en: "Islamic scope of holistic spiritual action.",
            ref_ml: "ഇസ്ലാമിലെ സമഗ്രമായ ആരാധനാ സങ്കൽപ്പം."
        },
        {
            id: 'q_16',
            category: 'wellness',
            q_en: "How can I maintain a spiritual routine when I cannot pray?",
            q_ml: "നമസ്കരിക്കാൻ സാധിക്കാത്തപ്പോൾ ആത്മീയത എങ്ങനെ നിലനിർത്താം?",
            a_en: "Use the times of Salah to sit quietly, make dua, or listen to Quran. This keeps your heart in the habit of worship and maintains a peaceful rhythm of divine connection.",
            a_ml: "ഓരോ നമസ്കാരത്തിന്റെ സമയങ്ങളിലും സാധാരണ നമസ്കരിക്കുന്ന സ്ഥലത്തിരുന്ന് അൽപസമയം ദുആ ചെയ്യുകയോ ദിക്ർ ചൊല്ലുകയോ ചെയ്യുക. ഇത് ആരാധനയുടെ ആത്മീയ താളം നിലനിർത്താൻ സഹായിക്കും.",
            ref_en: "Traditional practices of the righteous predecessors.",
            ref_ml: "ആദ്യകാല സദ്‌വൃത്തരായ വനിതകളുടെ ജീവിതരീതി.",
            related_dhikr: 'la_hawla'
        },
        {
            id: 'q_17',
            category: 'practical',
            q_en: "Am I allowed to attend Islamic study circles or classes?",
            q_ml: "ഈ സമയത്ത് ഇസ്ലാമിക ക്ലാസ്സുകളിൽ പങ്കെടുക്കാമോ?",
            a_en: "Yes, gathering with others to learn about Islam, peace, and spiritual growth is highly blessed and fully open to you during your period.",
            a_ml: "അതെ, മതപരമായ അറിവുകൾ നേടാനും സൽസഭകളിൽ പങ്കുകൊള്ളാനും സ്ത്രീകൾക്ക് യാതൊരു വിലക്കുകളുമില്ല. അത്തരം സദസ്സുകൾ വലിയ പുണ്യമുള്ളവയാണ്.",
            ref_en: "Hadith: 'Seeking knowledge is obligatory upon every Muslim.'",
            ref_ml: "ഹദീസ്: 'വിജ്ഞാനം തേടൽ ഓരോ മുസ്ലിമിനും നിർബന്ധമാണ്.'"
        },
        {
            id: 'q_18',
            category: 'wellness',
            q_en: "Is emotional exhaustion normal during my cycle in Islam?",
            q_ml: "ഈ ദിവസങ്ങളിലെ മാനസിക പ്രയാസങ്ങൾ സ്വാഭാവികമാണോ?",
            a_en: "Yes, Allah created your body with changing hormonal cycles. Your physical fatigue and emotional sensitivity are natural. Islam values your physical experience and encourages self-kindness and patient self-care.",
            a_ml: "അതെ, ഹോർമോൺ വ്യതിയാനങ്ങൾ മൂലം ഉണ്ടാകുന്ന ശാരീരികവും മാനസികവുമായ മാറ്റങ്ങൾ പൂർണ്ണമായും സ്വാഭാവികമാണ്. നിങ്ങളുടെ ആരോഗ്യവും മനസ്സിന്റെ അവസ്ഥയും അല്ലാഹു വിലമതിക്കുന്നു, ഈ സമയത്ത് സ്വയം സ്നേഹത്തോടെയും ശാന്തതയോടെയും ഇരിക്കുക.",
            ref_en: "Recognizing biological limits as a divine mercy.",
            ref_ml: "ശരീരത്തിന്റെ സ്വാഭാവിക മാറ്റങ്ങളെ നാഥന്റെ കാരുണ്യമായി കാണുക."
        },
        {
            id: 'q_19',
            category: 'wellness',
            q_en: "What short prayers can I recite on difficult or painful days?",
            q_ml: "പ്രയാസമുള്ള ദിവസങ്ങളിൽ ചൊല്ലാൻ സാധിക്കുന്ന പ്രാർത്ഥനകൾ എന്തൊക്കെയാണ്?",
            a_en: "Reciting 'Ya Allah, bring peace to my heart' or 'Allahumma inni a'udhu bika minal-hammi wal-hazan' offers comfort. Knowing that He is close to those who are hurting is a supreme source of wellness.",
            a_ml: " 'അല്ലാഹുവേ, എന്റെ മനസ്സിന് ശാന്തത നൽകേണമേ' എന്നോ 'ലാ ഹൗല വലാ ഖുവ്വത്ത ഇല്ലാ ബില്ലാഹ്' എന്നോ ഉള്ള ലളിതമായ പ്രാർത്ഥനകൾ വലിയ ആശ്വാസം നൽകും.",
            ref_en: "Prophetic comfort prayers for difficulty.",
            ref_ml: "പ്രയാസങ്ങൾ ലഘൂകരിക്കാൻ നബി ﷺ പഠിപ്പിച്ച പ്രാർത്ഥനകൾ."
        },
        {
            id: 'q_20',
            category: 'wellness',
            q_en: "What self-care practices does Islam celebrate?",
            q_ml: "ഇസ്ലാം പ്രോത്സാഹിപ്പിക്കുന്ന സ്വയം പരിചരണ രീതികൾ എന്തൊക്കെയാണ്?",
            a_en: "Islam values rest, cleanliness, nourishing your body, taking warm baths, and drinking water. The Prophet ﷺ taught that your body has rights over you, making rest and personal care a sacred duty.",
            a_ml: "ശരീരത്തിന് വിശ്രമം നൽകുക, വൃത്തിയായിരിക്കുക, നല്ല ഭക്ഷണം കഴിക്കുക, ആവശ്യത്തിന് വെള്ളം കുടിക്കുക എന്നിവയെല്ലാം പുണ്യമാണ്. പ്രവാചകൻ ﷺ പഠിപ്പിച്ചിട്ടുണ്ട്: 'തീർച്ചയായും നിങ്ങളുടെ ശരീരത്തിന് നിങ്ങളോട് അവകാശങ്ങളുണ്ട്.'",
            ref_en: "Sahih al-Bukhari 1975",
            ref_ml: "സ്വഹീഹ് അൽ-ബുഖാരി 1975"
        },
        {
            id: 'q_21',
            category: 'practical',
            q_en: "What if my period ends before Fajr?",
            q_ml: "ഫജ്ർ നമസ്കാരത്തിന് തൊട്ടുമുമ്പ് പീരിയഡ്സ് കഴിഞ്ഞാൽ എന്താണ് ചെയ്യേണ്ടത്?",
            a_en: "If you notice that your period has ended (manifested by complete dry white discharge or no trace of blood) before Fajr, it is recommended to make the intention to fast that day if it is Ramadan. You should perform Ghusl and pray Fajr. If time is extremely short, you can start your fast first, and then perform Ghusl after Fajr begins.",
            a_ml: "ഫജ്റിന് മുമ്പായി രക്തസ്രാവം പൂർണ്ണമായും നിലച്ചതായി (വെളുത്ത ദ്രാവകം വരികയോ അല്ലെങ്കിൽ ഒട്ടും നനവില്ലാതിരിക്കുകയോ ചെയ്താൽ) മനസ്സിലാക്കിയാൽ, റമദാനിൽ അന്നത്തെ നോമ്പിനായി നിയ്യത്ത് ചെയ്യാവുന്നതാണ്. തുടർന്ന് കുളിച്ച് ഫജ്ർ നമസ്കരിക്കണം. സമയം വളരെ കുറവാണെങ്കിൽ, ആദ്യം നോമ്പ് തുടങ്ങുകയും പിന്നീട് സുബ്ഹിക്ക് ശേഷം കുളിക്കുകയും ചെയ്യാം.",
            ref_en: "Based on classical fiqh consensus on fasting and ghusl timing.",
            ref_ml: "ശുദ്ധീകരണ സമയത്തെക്കുറിച്ചുള്ള പൊതുവായ പണ്ഡിത അഭിപ്രായം."
        },
        {
            id: 'q_22',
            category: 'practical',
            q_en: "Can I delay ghusl until the next morning?",
            q_ml: "പീരിയഡ്സ് കഴിഞ്ഞയുടൻ കുളിക്കുന്നത് പിറ്റേന്ന് രാവിലെ വരെ നീട്ടിവെക്കാമോ?",
            a_en: "Yes, you can gently delay your Ghusl if your period ends late at night and you are tired. However, you should ensure that you perform Ghusl in time to pray the upcoming obligatory prayer (such as Fajr) so that no prayer is missed unnecessarily.",
            a_ml: "അതെ, രാത്രി വൈകി പീരിയഡ്സ് പൂർണ്ണമായും മാറുകയും നിങ്ങൾക്ക് കഠിനമായ ക്ഷീണമുണ്ടാവുകയും ചെയ്താൽ രാവിലെ വരെ കുളി നീട്ടിവെക്കാവുന്നതാണ്. എന്നിരുന്നാലും, അടുത്ത നിർബന്ധ നമസ്കാരം (ഫജ്ർ പോലുള്ളവ) സമയം തെറ്റാതെ നിർവ്വഹിക്കാൻ പാകത്തിൽ കുളിക്കാൻ ശ്രദ്ധിക്കേണ്ടതാണ്.",
            ref_en: "Fiqh ease guidelines regarding purification timing.",
            ref_ml: "ശുദ്ധീകരണ സമയവുമായി ബന്ധപ്പെട്ട ഇസ്ലാമിക ഇളവുകൾ."
        },
        {
            id: 'q_23',
            category: 'practical',
            q_en: "Is light spotting or brown discharge considered part of menstruation?",
            q_ml: "ചെറിയ തോതിലുള്ള ബ്രൗൺ ഡിസ്ചാർജ് അല്ലെങ്കിൽ സ്പോട്ടിങ് ആർത്തവമായി കണക്കാക്കുമോ?",
            a_en: "There are different scholarly opinions regarding spotting or brown discharge. Many scholars state that if it occurs within the usual days of your period or is contiguous with active bleeding, it is considered part of menstruation. If it occurs outside your usual cycle or after clean white discharge (Tuhr) has been achieved, most scholars do not count it as menstruation, meaning you can pray and fast after performing wudu.",
            a_ml: "മാസമുറയ്ക്ക് മുമ്പോ ശേഷമോ ഉണ്ടാകുന്ന ചെറിയ ബ്രൗൺ ഡിസ്ചാർജിനെക്കുറിച്ച് പണ്ഡിതന്മാർക്കിടയിൽ വ്യത്യസ്ത അഭിപ്രായങ്ങളുണ്ട്. സാധാരണ പീരിയഡ്സ് ദിവസങ്ങളിലാണ് ഇത് ഉണ്ടാകുന്നതെങ്കിൽ ഇത് ആർത്തവമായി കണക്കാക്കാമെന്നാണ് ഭൂരിപക്ഷ അഭിപ്രായം. എന്നാൽ പൂർണ്ണമായും ശുദ്ധിയായ ശേഷമുള്ള ബ്രൗൺ ഡിസ്ചാർജ് സാധാരണയായി ആർത്തവമായി പരിഗണിക്കാറില്ല, ഇതിന് വുദു എടുത്തു നമസ്കരിക്കാവുന്നതാണ്.",
            ref_en: "Hadith of Umm Atiyyah (RA): 'We did not count brown or yellow discharge after purity as anything.'",
            ref_ml: "ഉമ്മു അത്വിയ്യ (റ) ഉദ്ധരിച്ച ഹദീസ്: 'ശുദ്ധിക്ക് ശേഷമുള്ള മഞ്ഞയോ തവിട്ടോ നിറത്തെ ഞങ്ങൾ ഒന്നായും കണക്കാക്കിയിരുന്നില്ല.'"
        },
        {
            id: 'q_24',
            category: 'practical',
            q_en: "What if bleeding continues for more than 15 days?",
            q_ml: "15 ദിവസത്തിലധികം രക്തസ്രാവം തുടർന്നാൽ എന്താണ് ചെയ്യേണ്ടത്?",
            a_en: "According to the majority of scholars, the maximum duration for a normal period is 15 days. Bleeding beyond this limit is generally classified as Istihadah (non-menstrual chronic bleeding). In this state, you are considered physically clean for worship; you should perform Ghusl once, then perform a fresh Wudu for each prayer, and you can resume praying and fasting normally.",
            a_ml: "ഭൂരിഭാഗം കർമ്മശാസ്ത്ര പണ്ഡിതന്മാരുടെയും അഭിപ്രായത്തിൽ സാധാരണ മാസമുറയുടെ പരമാവധി ദൈർഘ്യം 15 ദിവസമാണ്. അതിനുശേഷവും തുടരുന്ന രക്തസ്രാവത്തെ ഇസ്തിഹാളത്ത് (രോഗാവസ്ഥയിലുള്ള രക്തസ്രാവം) ആയി കണക്കാക്കുന്നു. ഈ അവസ്ഥയിൽ നിങ്ങൾ ഒരു തവണ വലിയ കുളി കുളിച്ച ശേഷം ഓരോ നമസ്കാരത്തിനും പുതിയ വുദു എടുത്ത് നമസ്കരിക്കുകയും നോമ്പെടുക്കുകയും ചെയ്യേണ്ടതാണ്.",
            ref_en: "Hadith of Fatima bint Abi Hubaish (Sahih al-Bukhari 306).",
            ref_ml: "ഫാത്തിമ ബിൻത് അബീ ഹുബൈഷ് ഉദ്ധരിച്ച ഹദീസ് (സ്വഹീഹ് അൽ-ബുഖാരി 306)."
        },
        {
            id: 'q_25',
            category: 'practical',
            q_en: "Can I sleep before performing Ghusl after my period ends?",
            q_ml: "പീരിയഡ്സ് തീർന്ന ഉടനെ കുളിക്കാതെ ഉറങ്ങാൻ സാധിക്കുമോ?",
            a_en: "Yes, you can sleep before performing Ghusl. However, it is highly recommended and spiritually clean to perform a simple Wudu (ablution) or wash yourself before sleeping, and then perform the full Ghusl when you wake up in time for the next prayer.",
            a_ml: "അതെ, പീരിയഡ്സ് കഴിഞ്ഞയുടൻ കുളിക്കാതെ ഉറങ്ങാൻ സാധിക്കും. എങ്കിലും ഉറങ്ങാൻ കിടക്കുന്നതിന് മുമ്പ് ശരീരഭാഗങ്ങൾ കഴുകി വുദു എടുക്കുന്നത് വളരെ നല്ലതാണ്. പിന്നീട് ഉണർന്ന ശേഷം അടുത്ത നമസ്കാരത്തിന് മുമ്പായി പൂർണ്ണരൂപത്തിൽ കുളിച്ചാൽ മതിയാകും.",
            ref_en: "Based on Prophetic recommendations for sleeping in states of major impurity.",
            ref_ml: "വലിയ അശുദ്ധിയിലായിരിക്കുമ്പോൾ ഉറങ്ങുന്നതുമായി ബന്ധപ്പെട്ട പ്രവാചക മര്യാദകൾ."
        },
        {
            id: 'q_26',
            category: 'worship',
            q_en: "Can I attend the Eid prayer grounds while menstruating?",
            q_ml: "പീരിയഡ്സ് സമയത്ത് പെരുന്നാൾ നമസ്കാര സ്ഥലങ്ങളിൽ പങ്കെടുക്കാമോ?",
            a_en: "Yes, absolutely! The Prophet ﷺ encouraged all women, including those menstruating, to attend the Eid gathering to witness the goodness, joy, and community supplications. However, menstruating women should sit slightly apart from the active prayer rows.",
            a_ml: "അതെ, തീർച്ചയായും! ആർത്തവമുള്ള സ്ത്രീകൾ ഉൾപ്പെടെയുള്ള എല്ലാ സ്ത്രീകളും പെരുന്നാൾ ഒത്തുചേരലുകളിൽ പങ്കെടുക്കാനും ദുആകളിൽ പങ്കുചേരാനും പ്രവാചകൻ ﷺ നിർദ്ദേശിച്ചിട്ടുണ്ട്. എന്നാൽ നമസ്കരിക്കുന്ന സ്ഥലത്ത് നിന്ന് അല്പം മാറി ഇരുന്ന് അവർക്ക് പെരുന്നാൾ സന്തോഷത്തിൽ പങ്കാളികളാകാം.",
            ref_en: "Sahih al-Bukhari 324.",
            ref_ml: "സ്വഹീഹ് അൽ-ബുഖാരി 324."
        },
        {
            id: 'q_27',
            category: 'practical',
            q_en: "Is it allowed to cut nails or trim hair during menstruation?",
            q_ml: "പീരിയഡ്സ് സമയത്ത് നഖം മുറിക്കുന്നതിനോ മുടി നീക്കം ചെയ്യുന്നതിനോ വിലക്കുണ്ടോ?",
            a_en: "Yes, it is fully permitted. Some historical cultural notions claim that hair or nails cut during major impurity must be washed or avoided, but these are cultural myths with no valid basis in authentic Islamic law. Personal hygiene remains encouraged at all times.",
            a_ml: "അതെ, പൂർണ്ണമായും അനുവദനീയമാണ്. മാസമുറ സമയത്ത് നഖം വെട്ടുന്നതും മുടി കളയുന്നതും ശരിയല്ലെന്നുള്ള പ്രചാരണങ്ങൾ ചില നാട്ടുനടപ്പുകൾ മാത്രമാണ്, ഇതിന് ഇസ്ലാമിക പ്രമാണങ്ങളിൽ യാതൊരു അടിസ്ഥാനവുമില്ല. വ്യക്തിശുദ്ധി എപ്പോഴും പാലിക്കപ്പെടേണ്ടതാണ്.",
            ref_en: "Consensus of classical jurisprudential councils.",
            ref_ml: "ഇസ്ലാമിക കർമ്മശാസ്ത്ര പണ്ഡിതന്മാരുടെ ഐകകണ്ഠേനയുള്ള അഭിപ്രായം."
        },
        {
            id: 'q_28',
            category: 'wellness',
            q_en: "Can a woman visit the graveyard during her period?",
            q_ml: "പീരിയഡ്സ് ഉള്ളപ്പോൾ സ്ത്രീകൾക്ക് ഖബർ സന്ദർശിക്കാമോ?",
            a_en: "There are different scholarly views. Most scholars allow women to visit graveyards to remember death and pray for the deceased, provided they maintain emotional composure and dignity. Being on your period does not physically bar you from this visitation according to the preferred scholarly opinions.",
            a_ml: "ഇതിൽ പണ്ഡിതന്മാർക്കിടയിൽ വ്യത്യസ്ത വീക്ഷണങ്ങളുണ്ട്. പരലോക ചിന്തയുണ്ടാകാനും മൺമറഞ്ഞുപോയവർക്ക് വേണ്ടി പ്രാർത്ഥിക്കാനുമായി സ്ത്രീകൾക്ക് ഖബർ സന്ദർശിക്കാവുന്നതാണെന്ന് ഭൂരിഭാഗം പണ്ഡിതന്മാരും അഭിപ്രായപ്പെടുന്നു. മാസമുറ ഇതിന് ഒരു തടസ്സമല്ല.",
            ref_en: "Prophetic advice to Aisha (RA) on visiting Al-Baqi.",
            ref_ml: "ആയിഷ ബീവിക്ക് പ്രവാചകൻ ﷺ ഖബർ സന്ദർശനം പഠിപ്പിച്ചു നൽകിയ ചരിത്രം."
        },
        {
            id: 'q_29',
            category: 'wellness',
            q_en: "Can I listen to Ruqyah or read protective verses during periods?",
            q_ml: "ഈ സമയത്ത് റുഖ്‌യ (പ്രാർത്ഥന ചികിത്സ) കേൾക്കാൻ സാധിക്കുമോ?",
            a_en: "Yes, listening to Ruqyah (spiritual healing prayers) and reciting protective Adhkar are highly recommended for peace and protection, especially when you are physically tired or emotionally sensitive during your period.",
            a_ml: "അതെ, ശാരീരികമായ ക്ഷീണമോ മാനസികമായ അസ്വസ്ഥതകളോ ഉള്ളപ്പോൾ റുഖ്‌യ കേൾക്കുന്നതും പ്രാർത്ഥനകൾ ചൊല്ലുന്നതും ഹൃദയത്തിന് വലിയ ആശ്വാസം നൽകുന്ന ഉത്തമമായ കാര്യമാണ്.",
            ref_en: "Consensus on healing through remembrance in all states.",
            ref_ml: "എല്ലാ ശാരീരിക അവസ്ഥകളിലും പ്രാർത്ഥന ചികിത്സ സ്വീകരിക്കുന്നതിനുള്ള അനുവാദം."
        },
        {
            id: 'q_30',
            category: 'quran',
            q_en: "Can I read Duas and Quran verses from a phone screen without wudu?",
            q_ml: "വുദു ഇല്ലാതെ മൊബൈൽ സ്ക്രീനിൽ നിന്ന് പ്രാർത്ഥനകളും ഖുർആനും വായിക്കാമോ?",
            a_en: "Yes, absolutely! Wudu is not a requirement for touching or reading from a mobile phone screen, as digital screens are not considered physical copies of the Mushaf. This makes it easy to stay connected with your daily prayers.",
            a_ml: "അതെ, തീർച്ചയായും! മൊബൈൽ ഫോൺ സ്ക്രീനിൽ ഖുർആൻ സൂക്തങ്ങളോ പ്രാർത്ഥനകളോ തെളിഞ്ഞു കാണുന്നത് സ്പർശിക്കാൻ വുദു നിർബന്ധമില്ല. ഇത് ദൈനംദിന പ്രാർത്ഥനകൾ എളുപ്പമാക്കുന്നു.",
            ref_en: "Contemporary fatwas on digital devices.",
            ref_ml: "ഡിജിറ്റൽ സ്ക്രീനുകളുമായി ബന്ധപ്പെട്ട ആധുനിക പണ്ഡിത ഫത്‌വകൾ."
        },
        {
            id: 'q_31',
            category: 'practical',
            q_en: "What should I do immediately after my period ends?",
            q_ml: "പീരിയഡ്സ് കഴിഞ്ഞാൽ ആദ്യം ചെയ്യേണ്ടത് എന്താണ്?",
            a_en: "Once you confirm your period has completely ended (through dry white discharge or no trace of blood), you should make the intention to purify yourself, perform Ghusl (the complete ritual bath), and resume your obligatory prayers.",
            a_ml: "പീരിയഡ്സ് പൂർണ്ണമായും നിന്നതായി ഉറപ്പാക്കിയാൽ (വെളുത്ത ദ്രാവകം വരികയോ പൂർണ്ണമായും നനവില്ലാതിരിക്കുകയോ ചെയ്താൽ) ആദ്യം ചെയ്യേണ്ടത് ശുദ്ധീകരണത്തിനായി നിയ്യത്ത് ചെയ്യുകയും വലിയ കുളി (ഗുസ്‌ൽ) കുളിച്ച് നമസ്കാരം പുനരാരംഭിക്കുകയുമാണ്.",
            ref_en: "Consensus on mandatory purification steps.",
            ref_ml: "ശുദ്ധീകരണത്തെക്കുറിച്ചുള്ള ഇസ്ലാമിക കർമ്മശാസ്ത്ര നിയമങ്ങൾ."
        },
        {
            id: 'q_32',
            category: 'worship',
            q_en: "Can I pray immediately after performing Ghusl?",
            q_ml: "കുളി കഴിഞ്ഞ ഉടനെ എനിക്ക് നമസ്കരിക്കാൻ സാധിക്കുമോ?",
            a_en: "Yes! A complete Ghusl includes and replaces Wudu according to most scholars, provided you did not invalidate your state of purity during or after the bath. You can stand to pray immediately with absolute confidence.",
            a_ml: "അതെ! പൂർണ്ണരൂപത്തിലുള്ള വലിയ കുളി കഴിയുന്നതോടെ വുദുവും അതിൽ ഉൾപ്പെടുന്നു. അതിനാൽ കുളിക്കുന്നതിനിടയിലോ ശേഷമോ വുദു മുറിയുന്ന കാര്യങ്ങൾ ഒന്നും സംഭവിച്ചില്ലെങ്കിൽ പ്രത്യേകമായി വുദു എടുക്കാതെ തന്നെ നിങ്ങൾക്ക് നമസ്കരിക്കാം.",
            ref_en: "Fiqh rule: 'Purification from major impurity includes minor impurity.'",
            ref_ml: "വലിയ അശുദ്ധിയിൽ നിന്നുള്ള ശുദ്ധിയിൽ ചെറിയ അശുദ്ധിയും ഉൾപ്പെടുന്നു എന്ന ഫിഖ്ഹ് തത്വം."
        },
        {
            id: 'q_33',
            category: 'practical',
            q_en: "What invalidates or breaks Ghusl?",
            q_ml: "കുളിയെ അസാധുവാക്കുന്ന (ബാത്ത് മുറിക്കുന്ന) കാര്യങ്ങൾ എന്തൊക്കെയാണ്?",
            a_en: "Once Ghusl is correctly performed, it remains valid unless you experience a state of major ritual impurity again (such as the start of a new menstrual cycle). Minor issues like using the restroom or sleeping only invalidate your Wudu, meaning you only need to perform a simple Wudu to pray, not repeat the entire Ghusl.",
            a_ml: "കുളി പൂർത്തിയായ ശേഷം പുതിയതായി വലിയ അശുദ്ധിയുണ്ടായാൽ മാത്രമേ കുളി വീണ്ടും നിർബന്ധമാവുകയുള്ളൂ. മലമൂത്രവിസർജ്ജനം നടത്തുകയോ ഉറങ്ങുകയോ ചെയ്താൽ വുദു മാത്രമേ മുറിയുകയുള്ളൂ, ഇതിനായി വീണ്ടും കുളിക്കേണ്ടതില്ല.",
            ref_en: "Standard purification guidelines.",
            ref_ml: "ശുദ്ധീകരണത്തെക്കുറിച്ചുള്ള പൊതു നിയമങ്ങൾ."
        },
        {
            id: 'q_34',
            category: 'practical',
            q_en: "Can I wear nail polish during Ghusl or Wudu?",
            q_ml: "നഖത്തിൽ നെയിൽ പോളിഷ് ഇട്ടുകൊണ്ട് കുളിക്കാമോ വുദു എടുക്കാമോ?",
            a_en: "Traditional nail polish forms a waterproof barrier, preventing water from touching the nail. For Ghusl and Wudu to be valid, water must touch all mandatory parts, including nails. It is recommended to remove polish before purifying, or use porous, water-permeable products if verified to allow water through.",
            a_ml: "സാധാരണ നെയിൽ പോളിഷ് നഖത്തിന് മുകളിൽ വെള്ളം തട്ടാത്ത വിധത്തിൽ ഒരു കട്ടി ഉണ്ടാക്കുന്നു. കുളിയും വുദുവും ശരിയാകാൻ നഖങ്ങളിൽ വെള്ളം തട്ടൽ നിർബന്ധമാണ്. അതിനാൽ കുളിക്കുന്നതിന് മുമ്പായി ഇത് നീക്കം ചെയ്യാൻ ശ്രദ്ധിക്കുക.",
            ref_en: "Consensus on mandatory physical contact of water during purification.",
            ref_ml: "ശുദ്ധീകരണ സമയത്ത് ശരീരത്തിൽ വെള്ളം ചേരേണ്ടതിന്റെ പ്രാധാന്യം."
        },
        {
            id: 'q_35',
            category: 'worship',
            q_en: "Can I fast if my period ends just before Fajr but I have not bathed yet?",
            q_ml: "സുബ്ഹിക്ക് മുമ്പ് പീരിയഡ്സ് മാറിയെങ്കിലും കുളിക്കാൻ കഴിഞ്ഞില്ലെങ്കിൽ നോമ്പെടുക്കാമോ?",
            a_en: "Yes, absolutely! If your bleeding stops completely before the Fajr adhan, your fast is valid even if you only perform Ghusl after Fajr has started. The fast is tied to the absence of bleeding, not the timing of your bath.",
            a_ml: "അതെ, തീർച്ചയായും! സുബ്ഹി ബാങ്കിന് തൊട്ടുമുമ്പ് രക്തസ്രാവം നിലച്ചാൽ അന്നത്തെ നോമ്പ് നിങ്ങൾക്ക് അനുഷ്ഠിക്കാവുന്നതാണ്. ബാങ്ക് വിളിച്ച ശേഷമാണ് നിങ്ങൾ കുളിക്കുന്നതെങ്കിലും നോമ്പ് പൂർണ്ണമായും ശരിയാകും.",
            ref_en: "Sahih al-Bukhari 1926 (Prophetic practice regarding major impurity at dawn).",
            ref_ml: "സുബഹിക്ക് ശേഷമുള്ള ശുദ്ധീകരണം നോമ്പിനെ ബാധിക്കില്ലെന്ന പ്രവാചക ചര്യ (ബുഖാരി 1926)."
        },
        {
            id: 'q_36',
            category: 'worship',
            q_en: "What if my period starts just minutes before Maghrib while fasting?",
            q_ml: "Note: if the period begins even moments before the Maghrib adhan, that day's fast is invalidated, and you will need to make it up later. Though it can feel disappointing, remember that accepting this is an act of obedience, and your reward for fasting most of the day is secure with Allah.",
            a_en: "If your period begins even moments before the Maghrib adhan, that day's fast is invalidated, and you will need to make it up later. Though it can feel disappointing, remember that accepting this is an act of obedience, and your reward for fasting most of the day is secure with Allah.",
            a_ml: "മഗ്‌രിബ് ബാങ്കിന് തൊട്ടുമുമ്പാണ് രക്തം കണ്ടതെങ്കിലും അന്നത്തെ നോമ്പ് അസാധുവാകും. ആ നോമ്പ് പിന്നീട് നോറ്റ് വീട്ടേണ്ടതുണ്ട്. ഇതിൽ നിരാശ തോന്നേണ്ടതില്ല, കാരണം അല്ലാഹുവിന്റെ കല്പന അനുസരിക്കുന്നതിലൂടെ അന്നത്തെ പകൽ മുഴുവൻ നോമ്പെടുത്ത പ്രതിഫലം നിങ്ങൾക്ക് ലഭിക്കും.",
            ref_en: "Consensus of jurisprudential schools on fasting boundaries.",
            ref_ml: "നോമ്പ് മുറിയുന്ന കാര്യങ്ങളെക്കുറിച്ചുള്ള പണ്ഡിത അഭിപ്രായം."
        },
        {
            id: 'q_37',
            category: 'practical',
            q_en: "What should I do if I am unsure whether my period has fully ended?",
            q_ml: "പീരിയഡ്സ് മാറിയോ എന്ന് ഉറപ്പില്ലെങ്കിൽ ഞാൻ എന്താണ് ചെയ്യേണ്ടത്?",
            a_en: "It is best not to rush. Women during the Prophet's time would show Aisha (RA) cotton pads with yellow traces, and she would tell them: 'Do not rush until you see the white discharge (al-Qassah al-Bayda).' Wait for clear signs of purity before performing Ghusl.",
            a_ml: "ഇത്തരം കാര്യങ്ങളിൽ ധൃതി കൂട്ടാതിരിക്കുകയാണ് നല്ലത്. ആയിഷ ബീവി (റ) സ്ത്രീകളോട് പറയാറുണ്ടായിരുന്നു: 'വെളുത്ത ദ്രാവകം കണ്ട് പൂർണ്ണമായും ശുദ്ധിയാകുന്നതുവരെ നിങ്ങൾ ധൃതി കാണിക്കരുത്.' പൂർണ്ണമായ ശുദ്ധി ഉറപ്പാക്കിയ ശേഷം മാത്രം കുളിക്കുക.",
            ref_en: "Muwatta Imam Malik (Book of Menstruation).",
            ref_ml: "മുവത്വ ഇമാം മാലിക് (ശുദ്ധീകരണ അധ്യായം)."
        },
        {
            id: 'q_38',
            category: 'worship',
            q_en: "Can I perform Hajj or Umrah rituals during my period?",
            q_ml: "പീരിയഡ്സ് സമയത്ത് ഹജ്ജ് അല്ലെങ്കിൽ ഉംറ കർമ്മങ്ങൾ ചെയ്യാമോ?",
            a_en: "You can perform all the rituals of Hajj or Umrah, including putting on Ihram, standing at Arafah, and reciting supplications, except for Tawaf (circumambulating the Kaaba). You should delay the Tawaf until your period ends and you perform Ghusl.",
            a_ml: "തവാഫ് ഒഴികെയുള്ള ഹജ്ജ്, ഉംറ കർമ്മങ്ങളെല്ലാം നിങ്ങൾക്ക് ചെയ്യാവുന്നതാണ്. അറഫയിൽ നിൽക്കുക, ദുആ ചെയ്യുക, ഇഹ്‌റാമിൽ പ്രവേശിക്കുക എന്നിവയെല്ലാം ചെയ്യാം. പീരിയഡ്സ് മാറിയ ശേഷം കുളിച്ച് ശുദ്ധിയായ ശേഷമേ കഅ്ബ തവാഫ് ചെയ്യാൻ പാടുള്ളൂ.",
            ref_en: "Prophetic instruction to Aisha (RA): 'Do what a pilgrim does, but do not circumambulate the House until you are clean.'",
            ref_ml: "ആയിഷ ബീവിയോട് നബി ﷺ നിർദ്ദേശിച്ചത്: 'ഹജ്ജ് ചെയ്യുന്നവർ ചെയ്യുന്നതെല്ലാം ചെയ്യുക, എന്നാൽ ശുദ്ധിയാകുന്നതുവരെ കഅ്ബ ചുറ്റരുത്.'"
        },
        {
            id: 'q_39',
            category: 'wellness',
            q_en: "Can I make dhikr and pray while lying down during painful periods?",
            q_ml: "വേദനയുള്ള ദിവസങ്ങളിൽ കിടന്നുകൊണ്ട് ദിക്ർ ചൊല്ലാൻ സാധിക്കുമോ?",
            a_en: "Yes, absolutely. Allah remembers those who remember Him standing, sitting, or lying on their sides. On painful menstrual days, resting your body while keeping your tongue and heart engaged in dhikr is extremely beloved and rewarded.",
            a_ml: "അതെ, തീർച്ചയായും. കിടന്നുകൊണ്ടോ ഇരുന്നുകൊണ്ടോ ഒക്കെ അല്ലാഹുവിനെ ഓർക്കാൻ ഇസ്ലാം അനുവദിക്കുന്നുണ്ട്. ശാരീരിക വേദനയുള്ളപ്പോൾ വിശ്രമിച്ചുകൊണ്ട് തന്നെ നാക്കുകൊണ്ടും ഹൃദയം കൊണ്ടും അല്ലാഹുവെ സ്മരിക്കാം.",
            ref_en: "Quran 3:191 (remembrance in all physical postures).",
            ref_ml: "വിശുദ്ധ ഖുർആൻ 3:191 (കിടക്കുമ്പോഴും ഇരിക്കുമ്പോഴും അല്ലാഹുവെ സ്മരിക്കുന്നവരെക്കുറിച്ചുള്ള പ്രശംസ)."
        },
        {
            id: 'q_40',
            category: 'wellness',
            q_en: "Is emotional stress or feeling low during periods considered sinful?",
            q_ml: "ഈ സമയത്തുണ്ടാകുന്ന മാനസിക സമ്മർദ്ദങ്ങളും വിഷമങ്ങളും പാപമാണോ?",
            a_en: "Not at all. Emotional fluctuations are a natural biological response to hormonal changes designed by the Creator. Islam does not hold you accountable for involuntary feelings or natural physical weakness. Patience during this time is highly rewarded.",
            a_ml: "ഒരിക്കലുമില്ല. സൃഷ്ടാവ് നൽകിയ ശരീരഘടനയുടെ ഭാഗമായി ഉണ്ടാകുന്ന മാറ്റങ്ങളാണിത്. ഇതിലൂടെ അനുഭവപ്പെടുന്ന വിഷമങ്ങളിൽ നിങ്ങൾക്ക് യാതൊരുവിധ കുറ്റബോധവും തോന്നേണ്ടതില്ല, മറിച്ച് ക്ഷമയോടെ നേരിടുന്നതിന് വലിയ പ്രതിഫലം ലഭിക്കും.",
            ref_en: "Principles of divine compassion and biological empathy.",
            ref_ml: "നാഥന്റെ കരുണയും മനുഷ്യന്റെ ശാരീരിക അവസ്ഥകളോടുള്ള പരിഗണനയും."
        },
        {
            id: 'q_41',
            category: 'wellness',
            q_en: "Can I seek reward through patience during my period?",
            q_ml: "പീരിയഡ്സ് സമയത്തെ പ്രയാസങ്ങളിൽ ക്ഷമിച്ചാൽ പ്രതിഫലമുണ്ടോ?",
            a_en: "Yes, beautifully so. Every moment of discomfort, pain, or fatigue that a believer experiences with patience wipes away minor sins and elevates her spiritual status with Allah. Your quiet patience is a high form of worship.",
            a_ml: "അതെ, തീർച്ചയായും വലിയ പ്രതിഫലമുണ്ട്. ഒരു വിശ്വാസിക്ക് അനുഭവപ്പെടുന്ന ഏതൊരു ശാരീരിക വേദനയും പ്രയാസവും അവരുടെ ചെറിയ പാപങ്ങളെ മായ്ച്ചുകളയുകയും അല്ലാഹുവിന്റെ അടുക്കൽ പദവി ഉയർത്തുകയും ചെയ്യും.",
            ref_en: "Hadith: 'No fatigue, illness, or anxiety afflicts a Muslim but that Allah expiates some of their sins.'",
            ref_ml: "പ്രവാചക വചനം: 'ഒരു വിശ്വാസിക്ക് നേരിടുന്ന ക്ഷീണവും രോഗവും വിഷമങ്ങളും അവരുടെ പാപങ്ങൾ മായ്ക്കപ്പെടാൻ കാരണമാകും.'"
        },
        {
            id: 'q_42',
            category: 'quran',
            q_en: "Can I hold or read a Tafsir book that contains Arabic Quran verses?",
            q_ml: "ഖുർആൻ സൂക്തങ്ങളുള്ള തഫ്സീർ (വ്യാഖ്യാന) ഗ്രന്ഥങ്ങൾ പീരിയഡ്സ് സമയത്ത് തൊടാമോ?",
            a_en: "Yes, you can hold and read Tafsir books. Since Tafsir books contain more explanatory human text than the actual Arabic Quranic verses, they are not classified under the same strict touching rules as a pure Arabic Mushaf, making it safe and highly beneficial to read.",
            a_ml: "അതെ, തഫ്സീർ ഗ്രന്ഥങ്ങൾ നിങ്ങൾക്ക് വായിക്കാം. വ്യാഖ്യാന ഗ്രന്ഥങ്ങളിൽ ഖുർആൻ വചനങ്ങളെക്കാൾ കൂടുതൽ വിശദീകരണ വരികൾ ഉള്ളതിനാൽ അവ സാധാരണ പുസ്തകം പോലെ കൈകാര്യം ചെയ്യാം, ഇതിന് വിലക്കുകളില്ല.",
            ref_en: "Consensus among classical and contemporary jurists.",
            ref_ml: "പൂർവ്വകാല പണ്ഡിതന്മാരുടെയും ആധുനിക പണ്ഡിതന്മാരുടെയും പൊതുവായ അഭിപ്രായം."
        },
        {
            id: 'q_43',
            category: 'worship',
            q_en: "What should I do if my period starts while I am in the middle of praying?",
            q_ml: "നമസ്കരിച്ചു കൊണ്ടിരിക്കുമ്പോൾ പീരിയഡ്സ് തുടങ്ങിയാൽ എന്താണ് ചെയ്യേണ്ടത്?",
            a_en: "If you become aware that your period has started while you are performing prayer, you should immediately stop praying. That prayer is excused, and you do not need to make it up later. You are completely free of blame.",
            a_ml: "നമസ്കാരത്തിനിടയിലാണ് പീരിയഡ്സ് തുടങ്ങിയതെന്ന് മനസ്സിലാക്കിയാൽ ഉടൻ തന്നെ നമസ്കാരം നിർത്തേണ്ടതാണ്. ആ നമസ്കാരം പിന്നീട് മടക്കി നമസ്കരിക്കേണ്ടതില്ല.",
            ref_en: "Consensus on immediate cessation of worship at period onset.",
            ref_ml: "ആർത്തവം ആരംഭിച്ച ഉടൻ ആരാധനകളിൽ നിന്ന് വിട്ടുനിൽക്കണമെന്ന കർമ്മശാസ്ത്ര നിയമം."
        },
        {
            id: 'q_44',
            category: 'worship',
            q_en: "Can I recite morning and evening Adhkar during my period?",
            q_ml: "ഈ ദിവസങ്ങളിൽ രാവിലെയും വൈകുന്നേരവുമുള്ള ദിക്റുകൾ ചൊല്ലാമോ?",
            a_en: "Yes, absolutely. The morning and evening Adhkar consist of protective supplications and praises of Allah. These do not require physical ritual purity (Wudu or Ghusl) and should be continued daily for constant peace and spiritual protection.",
            a_ml: "അതെ, തീർച്ചയായും ചൊല്ലാം. പ്രഭാത-പ്രദോഷ പ്രാർത്ഥനകളും പ്രതിരോധ ദിക്റുകളും ചൊല്ലുന്നതിന് ശാരീരിക ശുദ്ധി നിർബന്ധമില്ല. ഇത് ദിവസവും പതിവാക്കുന്നത് വലിയ ആത്മീയ സംരക്ഷണം നൽകും.",
            ref_en: "Prophetic tradition on regular protective remembrance.",
            ref_ml: "നിത്യേനയുള്ള പ്രാർത്ഥനകളുടെ പ്രാധാന്യം."
        },
        {
            id: 'q_45',
            category: 'practical',
            q_en: "What are the rules regarding marital intimacy during menstruation?",
            q_ml: "മാസമുറ സമയത്ത് ദാമ്പത്യ ബന്ധത്തിൽ എന്തൊക്കെ കാര്യങ്ങളാണ് ശ്രദ്ധിക്കേണ്ടത്?",
            a_en: "In Islam, direct marital intercourse is prohibited during menstruation to ensure physical health, cleanliness, and comfort. However, all other forms of affection, hugging, kissing, and closeness between spouses are fully permitted and encouraged to maintain emotional connection.",
            a_ml: "ശാരീരികവും ആരോഗ്യപരവുമായ കാരണങ്ങളാൽ മാസമുറ സമയത്ത് ലൈംഗിക ബന്ധം ഇസ്ലാം വിലക്കിയിട്ടുണ്ട്. എന്നാൽ പരസ്പരം ചുംബിക്കുന്നതിനോ, കെട്ടിപ്പിടിക്കുന്നതിനോ, മറ്റുള്ള ദാമ്പത്യ സ്നേഹപ്രകടനങ്ങൾക്കോ യാതൊരു വിലക്കുമില്ല.",
            ref_en: "Quran 2:222 & Sahih al-Bukhari 302.",
            ref_ml: "വിശുദ്ധ ഖുർആൻ 2:222 ഉം സ്വഹീഹ് അൽ-ബുഖാരി 302 ഉം."
        },
        {
            id: 'q_46',
            category: 'practical',
            q_en: "Can I do general dhikr and say Salawat without Wudu?",
            q_ml: "വുദു ഇല്ലാതെ ദിക്റുകളും സ്വലാത്തുകളും ചൊല്ലാമോ?",
            a_en: "Yes, general dhikr, saying 'Alhamdulillah', and sending Salawat (blessings upon the Prophet ﷺ) do not require Wudu at all. You can do them in any state, whether walking, working, resting, or menstruating.",
            a_ml: "അതെ, സാധാരണ ദിക്റുകൾ ചൊല്ലുന്നതിനും സ്വലാത്തുകൾ ചൊല്ലുന്നതിനും വുദു ആവശ്യമില്ല. നടക്കുമ്പോഴും, ജോലി ചെയ്യുമ്പോഴും, വിശ്രമിക്കുമ്പോഴും നിങ്ങൾക്ക് ഈ സൽകർമ്മങ്ങളിൽ ഏർപ്പെടാം.",
            ref_en: "Consensus on remembrance in states of minor and major impurity.",
            ref_ml: "ചെറിയ അശുദ്ധിയിലും വലിയ അശുദ്ധിയിലും ദിക്ർ ചൊല്ലുന്നതിനുള്ള പൊതു അനുവാദം."
        },
        {
            id: 'q_47',
            category: 'practical',
            q_en: "Can I apply henna or hair dye during my period?",
            q_ml: "ഈ സമയത്ത് നഖങ്ങളിലോ മുടിയിലോ മൈലാഞ്ചി ഇടാമോ?",
            a_en: "Yes, applying henna (mehendi) or safe hair dyes is fully allowed during menstruation. Henna acts as a natural stain and does not form a waterproof barrier, meaning it will not affect your future Ghusl when your period ends.",
            a_ml: "അതെ, പൂർണ്ണമായും അനുവദനീയമാണ്. മൈലാഞ്ചി നഖങ്ങളിലോ മുടിയിലോ ഇടുന്നത് കൊണ്ട് ഭാവിയിലെ കുളി ശരിയാകാതിരിക്കില്ല. കാരണം മൈലാഞ്ചി വെള്ളത്തെ തടഞ്ഞു നിർത്തുന്ന ഒരു കട്ടി ഉണ്ടാക്കുന്നില്ല.",
            ref_en: "Consensus on natural staining products and purification.",
            ref_ml: "മൈലാഞ്ചി പോലുള്ള പ്രകൃതിദത്ത ചായങ്ങളുടെ ഉപയോഗത്തെക്കുറിച്ചുള്ള പണ്ഡിത വീക്ഷണം."
        },
        {
            id: 'q_48',
            category: 'practical',
            q_en: "What is the white discharge, and how does it signal purity?",
            q_ml: "വെളുത്ത ദ്രാവകം (തുഹ്‌ർ) എന്നാൽ എന്താണ്?",
            a_en: "The white discharge (known as al-Qassah al-Bayda) is a natural, clear white secretion that appears when menstruation has fully concluded. For many women, it is the primary physical signal that they are now clean and should perform Ghusl.",
            a_ml: "മാസമുറ പൂർണ്ണമായും അവസാനിച്ചതിന് ശേഷം കാണുന്ന വെളുത്ത ദ്രാവകമാണ് 'തുഹ്‌ർ' അഥവാ അൽ-ഖസ്സത്തുൽ ബൈളാ. ഇത് നിങ്ങൾ ശുദ്ധിയായി എന്ന് മനസ്സിലാക്കാനുള്ള പ്രധാന ശാരീരിക അടയാളമാണ്.",
            ref_en: "Classical clinical markers of menstrual termination.",
            ref_ml: "ആർത്തവ ശുദ്ധി ഉറപ്പാക്കുന്നതിനുള്ള ക്ലാസിക്കൽ അടയാളങ്ങൾ."
        },
        {
            id: 'q_49',
            category: 'wellness',
            q_en: "Can I compile and read custom duas from my phone?",
            q_ml: "മൊബൈലിൽ സ്വന്തമായി ദുആകൾ തയാറാക്കി വെച്ച് പ്രാർത്ഥിക്കാമോ?",
            a_en: "Yes, compiling a list of heartfelt personal duas or scriptural prayers on your phone is a wonderful way to maintain a strong spiritual routine, especially on days when you cannot perform physical prayer.",
            a_ml: "അതെ, നിങ്ങൾക്ക് ഇഷ്ടപ്പെട്ട പ്രാർത്ഥനകൾ ഫോണിൽ കുറിച്ചുവെച്ച് പ്രാർത്ഥിക്കുന്നത് ആത്മീയമായി സജീവമായിരിക്കാൻ സഹായിക്കുന്ന ഒരു മികച്ച രീതിയാണ്.",
            ref_en: "Encouraged practices of mindfulness and personalized devotion.",
            ref_ml: "സ്വന്തമായ പ്രാർത്ഥനകൾ സമാഹരിക്കുന്നതിന്റെ ആത്മീയ ഗുണങ്ങൾ."
        },
        {
            id: 'q_50',
            category: 'wellness',
            q_en: "How is resting during menstruation considered a form of worship?",
            q_ml: "മാസമുറ സമയത്ത് വിശ്രമിക്കുന്നത് എങ്ങനെയാണ് ആരാധനയാകുന്നത്?",
            a_en: "Worship in Islam is defined by obeying Allah's limits. When Allah commands you not to pray or fast during your period, choosing to rest and take care of your health in compliance with His law is itself an act of beautiful obedience and worship.",
            a_ml: "അല്ലാഹുവിന്റെ കൽപ്പനകൾ അനുസരിക്കലാണ് ആരാധന. പീരിയഡ്സ് സമയത്ത് നമസ്കരിക്കരുതെന്നും വിശ്രമിക്കണമെന്നും കല്പിച്ചത് നാഥനാണ്. അത് സന്തോഷത്തോടെ അനുസരിച്ച് വിശ്രമിക്കുന്നതും വലിയ പുണ്യമാണ്.",
            ref_en: "Fiqh rule: 'Leaving a prohibited act out of obedience is rewarded.'",
            ref_ml: "അല്ലാഹുവിന്റെ ഇളവുകൾ സ്വീകരിക്കുന്നത് പുണ്യമാണെന്ന കർമ്മശാസ്ത്ര തത്വം."
        }
    ];

    // Predictive Next Period Day
    const getNextPeriodPredictionVal = () => {
        if (!periodStartDate) return null;
        const start = new Date(periodStartDate);
        start.setDate(start.getDate() + cycleLength);
        return start.toLocaleDateString(lang === 'ml' ? 'ml-IN' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Filtered Questions list
    const getFilteredQuestions = () => {
        return QA_DATA.filter(item => {
            // Category filter
            if (qaActiveCategory !== 'all' && item.category !== qaActiveCategory) {
                return false;
            }
            // Search query filter
            if (qaSearchQuery.trim() !== '') {
                const search = qaSearchQuery.toLowerCase();
                const qText = lang === 'ml' ? item.q_ml.toLowerCase() : item.q_en.toLowerCase();
                const aText = lang === 'ml' ? item.a_ml.toLowerCase() : item.a_en.toLowerCase();
                return qText.includes(search) || aText.includes(search);
            }
            return true;
        });
    };

    // Toggle Favorite Q&A Question
    const toggleQaFavorite = (id) => {
        if (qaFavorites.includes(id)) {
            setQaFavorites(prev => prev.filter(x => x !== id));
            triggerToast(lang === 'ml' ? "ചോദ്യം സൂക്ഷിച്ചവയിൽ നിന്നും നീക്കി" : "Removed question from saved");
        } else {
            setQaFavorites(prev => [...prev, id]);
            triggerToast(lang === 'ml' ? "ചോദ്യം വിജയകരമായി സംരക്ഷിച്ചു" : "Question saved successfully");
        }
    };

    // Handle Accordion click and update recently viewed list
    const handleQuestionAccordionClick = (id) => {
        if (expandedQuestionId === id) {
            setExpandedQuestionId(null);
        } else {
            setExpandedQuestionId(id);
            // Append to recently viewed (avoid duplicates, cap at 5)
            setQaRecentlyViewed(prev => {
                const filtered = prev.filter(x => x !== id);
                return [id, ...filtered].slice(0, 5);
            });
        }
    };

    // Toggle Helpful Reaction locally
    const handleToggleHelpful = (id) => {
        setQaHelpfulReactions(prev => {
            const isCurrentlyHelpful = !!prev[id];
            const updated = { ...prev, [id]: !isCurrentlyHelpful };
            
            // Adjust local helpful counts state dynamically
            setHelpfulCounts(prevCounts => ({
                ...prevCounts,
                [id]: isCurrentlyHelpful ? prevCounts[id] - 1 : prevCounts[id] + 1
            }));

            triggerToast(
                isCurrentlyHelpful 
                    ? (lang === 'ml' ? "പ്രതികരണം പിൻവലിച്ചു" : "Reaction removed")
                    : (lang === 'ml' ? "സഹായകരമെന്ന് രേഖപ്പെടുത്തി!" : "Marked as helpful!")
            );

            return updated;
        });
    };

    return (
        <div className="womens-guidance-root">
            {/* Master HTML5 Audio Element */}
            <audio 
                ref={audioRef} 
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleAudioEnded}
                onError={handleAudioError}
                style={{ display: 'none' }} 
            />

            {/* Elegant Toast Notifications */}
            {toastMessage && (
                <div className="womens-toast animated fade-in">
                    <span><Icons.Flower /></span> {toastMessage}
                </div>
            )}

            {/* Clean Premium Symmetrical Header */}
            <header className="womens-header">
                <button className="back-btn-glowing" onClick={() => navigate('/more')} aria-label="Go back">
                    {BACK_ICON}
                </button>
                <h1 className="header-title">
                    {t('womens_guidance_title') || (lang === 'ml' ? "സ്ത്രീകൾക്കായുള്ള മാർഗ്ഗനിർദ്ദേശങ്ങൾ" : "Women’s Guidance")}
                </h1>
                <button className={`header-mute-btn ${isMuted ? 'muted' : 'active'}`} onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
                    {isMuted ? MUTE_ICON : UNMUTE_ICON}
                </button>
            </header>

            {/* Daily Gentle Reminder Card */}
            <div className="daily-reminder-card card-gradient">
                <div className="reminder-accent-glow"></div>
                <div className="reminder-header">
                    <span className="reminder-badge"><Icons.Sparkles /> {lang === 'ml' ? "ഇന്നത്തെ ശാന്തമായ ഓർമ്മപ്പെടുത്തൽ" : "Daily Gentle Reminder"}</span>
                    <button className="fav-heart-btn" onClick={() => toggleFavReminder(dailyIndex)}>
                        {favoriteReminders.includes(dailyIndex) ? HEART_ICON_FILLED : HEART_ICON_EMPTY}
                    </button>
                </div>
                <p className="reminder-body">{lang === 'ml' ? REMINDERS[dailyIndex].ml : REMINDERS[dailyIndex].en}</p>
                <div className="reminder-footer">
                    <span><Icons.Flower /> {lang === 'ml' ? "വിശ്രമവും ഒരു കാരുണ്യമാണ്" : "Rest is also a mercy"}</span>
                </div>
            </div>

            {/* Scrollable Aesthetic Category Navigation */}
            <nav className="category-scroll-nav">
                {[
                    { id: 'tracker', icon: <Icons.Flower />, label_en: "Tracker", label_ml: "ട്രാക്കർ" },
                    { id: 'qa', icon: <Icons.Message />, label_en: "Gentle Q&A", label_ml: "സംശയനിവാരണം" },
                    { id: 'dhikr', icon: <Icons.Beads />, label_en: "Comfort Dhikr", label_ml: "ശാന്തമായ ദിക്റുകൾ" },
                    { id: 'quran', icon: <Icons.Book />, label_en: "Peaceful Quran", label_ml: "ഖുർആൻ പാരായണം" },
                    { id: 'duas', icon: <Icons.Hands />, label_en: "Wellness Duas", label_ml: "സൗഖ്യ ദുആകൾ" },
                    { id: 'stories', icon: <Icons.Mosque />, label_en: "Mothers of Islam", label_ml: "മാതൃകകളായ വനിതകൾ" },
                    { id: 'selfcare', icon: <Icons.Seedling />, label_en: "Self Care", label_ml: "സ്വയം പരിചരണം" }
                ].map(cat => (
                    <button 
                        key={cat.id} 
                        className={`nav-pill ${activeTab === cat.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(cat.id)}
                    >
                        {cat.icon} {lang === 'ml' ? cat.label_ml : cat.label_en}
                    </button>
                ))}
            </nav>

            {/* Dashboard Content Port */}
            <div className="guidance-dashboard-content fade-in-up">

                {/* <Icons.Flower /> TRACKER TAB */}
                {activeTab === 'tracker' && (
                    <div className="tracker-subview tab-view animated">
                        <div className="tracker-header">
                            <h3>{lang === 'ml' ? "ആത്മീയമായ പീരിയഡ് ട്രാക്കർ" : "Spiritually Supported Period Tracker"}</h3>
                            <p>{lang === 'ml' ? "നിങ്ങളുടെ ശാരീരിക അവസ്ഥയ്‌ക്ക് അനുയോജ്യമായ ആരാധനാ മാർഗ്ഗനിർദ്ദേശങ്ങൾ സ്വന്തമാക്കൂ." : "Keep track of your cycle and obtain customized worship guidelines built on kindness."}</p>
                        </div>

                        {/* Tracker Settings/Status Cards */}
                        <div className="tracker-action-grid">
                            <div className="status-toggle-card card-premium">
                                <div className="toggle-text">
                                    <h4>{lang === 'ml' ? "മാസമുറ മോഡ്" : "Menstruation Active"}</h4>
                                    <p>{isOnPeriod ? (lang === 'ml' ? "നിലവിൽ ഈ മോഡ് ഓൺ ആണ്." : "Worship guidelines are currently tailored to your rest.") : (lang === 'ml' ? "നിങ്ങൾ ശുദ്ധിയുള്ള അവസ്ഥയിലാണ്." : "Tailored to your active worship state.")}</p>
                                </div>
                                <button className={`rose-toggle-btn ${isOnPeriod ? 'active' : ''}`} onClick={() => setIsOnPeriod(!isOnPeriod)}>
                                    <span className="slider"></span>
                                </button>
                            </div>

                            <div className="date-input-card card-premium">
                                <h4>{lang === 'ml' ? "ആരംഭ തീയതി" : "Last Period Start Date"}</h4>
                                <input 
                                    type="date" 
                                    className="rose-date-picker" 
                                    value={periodStartDate}
                                    onChange={(e) => setPeriodStartDate(e.target.value)} 
                                />
                            </div>

                            <div className="length-picker-card card-premium">
                                <h4>{lang === 'ml' ? "ചക്രം ദൈർഘ്യം" : "Average Cycle Length"}</h4>
                                <div className="length-control">
                                    <button onClick={() => setCycleLength(prev => Math.max(20, prev - 1))}>-</button>
                                    <span>{cycleLength} {lang === 'ml' ? "ദിവസം" : "Days"}</span>
                                    <button onClick={() => setCycleLength(prev => Math.min(45, prev + 1))}>+</button>
                                </div>
                            </div>
                        </div>

                        {/* Live Prediction Reassurance */}
                        {periodStartDate && (
                            <div className="prediction-banner card-premium">
                                <span className="banner-icon"><Icons.Flower /></span>
                                <div className="banner-text">
                                    <strong>{lang === 'ml' ? "അടുത്ത പീരിയഡ് പ്രവചനം:" : "Predicted Next Cycle Start:"}</strong>
                                    <span> {getNextPeriodPredictionVal()}</span>
                                </div>
                            </div>
                        )}

                        {/* Worship Guidelines Based On Cycle */}
                        <div className="worship-guidelines-section">
                            <h3>{isOnPeriod ? (lang === 'ml' ? "ഈ ദിനങ്ങളിലെ അനുയോജ്യമായ ആരാധനകൾ" : "Your Recommended Worship Options") : (lang === 'ml' ? "ശുദ്ധിക്ക് ശേഷമുള്ള മടങ്ങിവരവ്" : "Post-Period Worship Renewal")}</h3>
                            
                            {isOnPeriod ? (
                                <div className="guidelines-list">
                                    <div className="guideline-item">
                                        <div className="guideline-badge paused"><Icons.Pause /> {lang === 'ml' ? "പ്രാർത്ഥന മാറ്റിവെക്കാം" : "Salah Paused"}</div>
                                        <p>{lang === 'ml' ? "വിശ്രമം അല്ലാഹുവിന്റെ ഒരു കാരുണ്യമാണ്. പ്രാർത്ഥന ഒഴിവാക്കാനുള്ള അവന്റെ കൽപ്പന അനുസരിക്കുന്നതിലൂടെ നിങ്ങൾ പ്രതിഫലം നേടുന്നു." : "Your salah is paused by divine command. Your rest is an act of obedience which carries immense reward."}</p>
                                    </div>
                                    <div className="guideline-item">
                                        <div className="guideline-badge active"><Icons.Check /> {lang === 'ml' ? "ദിക്റുകൾ ചൊല്ലാം" : "Dhikr Encouraged"}</div>
                                        <p>{lang === 'ml' ? "അല്ലാഹുവെ സ്മരിച്ചുകൊണ്ട് നിങ്ങളുടെ നാവിനെ എപ്പോഴും ഈർപ്പമുള്ളതാക്കുക. ഹൃദയത്തെ ശാന്തമാക്കാൻ ദിക്റുകൾ സഹായിക്കും." : "Keep your tongue moist with remembrance. Whispering subhanallah or astaghfirullah brings tranquility."}</p>
                                    </div>
                                    <div className="guideline-item">
                                        <div className="guideline-badge active"><Icons.Check /> {lang === 'ml' ? "ഖുർആൻ കേൾക്കാം" : "Quran Listening"}</div>
                                        <p>{lang === 'ml' ? "സൃഷ്ടാവിന്റെ സമാധാനപരമായ വചനങ്ങൾ കേൾക്കുക. സമാശ്വാസമുണ്ടാക്കുന്ന സൂറത്തുകൾ കേൾക്കാൻ ഈ സമയം ഉപയോഗിക്കാം." : "Listen to soft recordings of surahs like Maryam or Rahman to heal and comfort the mind."}</p>
                                    </div>
                                    <div className="guideline-item">
                                        <div className="guideline-badge active"><Icons.Check /> {lang === 'ml' ? "ദുആകൾ വർദ്ധിപ്പിക്കാം" : "Sincere Duas"}</div>
                                        <p>{lang === 'ml' ? "അല്ലാഹുവുമായുള്ള നിങ്ങളുടെ നിശബ്ദ സംഭാഷണങ്ങളിൽ നിങ്ങളുടെ ഹൃദയം തുറക്കുക. അല്ലാഹു നിങ്ങളുടെ ഹൃദയമിടിപ്പ് പോലും കേൾക്കുന്നു." : "Pour your heart out in silent prayers. The doors of dua are always open to you without any barrier."}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="guidelines-list">
                                    <div className="ghusl-guidance card-premium">
                                        <div className="ghusl-header">
                                            <span><Icons.Star /></span>
                                            <h4>{lang === 'ml' ? "ലളിതമായ ഘുസ്‌ൽ ഗൈഡ്" : "Sincere Ghusl Reminders"}</h4>
                                        </div>
                                        <p className="ghusl-desc">
                                            {lang === 'ml' 
                                                ? "പീരിയഡ് അവസാനിച്ച ശേഷം ശുദ്ധിയാകാനായി താഴെ പറയുന്ന ലളിതമായ ഘട്ടങ്ങളിലൂടെ ഘുസ്‌ൽ നിർവ്വഹിക്കുക:" 
                                                : "When you are ready to transition back to salah, perform ghusl gently with ease following these basic steps:"}
                                        </p>
                                        <ol className="ghusl-steps">
                                            <li><strong>{lang === 'ml' ? "നിയ്യത്ത് (ഉദ്ദേശം) കരുതുക" : "Intention"}</strong>: {lang === 'ml' ? "ശുദ്ധിയാകാൻ മനസ്സിൽ കരുതുക." : "Intend in your heart to purify yourself for worship."}</li>
                                            <li><strong>{lang === 'ml' ? "കൈകൾ കഴുകുക" : "Wash Hands"}</strong>: {lang === 'ml' ? "രണ്ട് മുൻകൈകളും വൃത്തിയായി കഴുകുക." : "Begin by washing your hands and any impurities."}</li>
                                            <li><strong>{lang === 'ml' ? "വുദു ചെയ്യുക" : "Perform Wudu"}</strong>: {lang === 'ml' ? "സാധാരണ നമസ്കാരത്തിന് വുദു ചെയ്യും പോലെ വുദു ചെയ്യുക." : "Complete a full ablution like you do before prayers."}</li>
                                            <li><strong>{lang === 'ml' ? "വെള്ളമൊഴിക്കുക" : "Pour Water Over Body"}</strong>: {lang === 'ml' ? "തലയിലും തുടർന്ന് ശരീരം മുഴുവനും വെള്ളം ഒഴിച്ച് കഴുകുക. ഒരിടവും ഉണങ്ങിയിരിക്കരുത്." : "Ensure water reaches all parts of your hair and body thoroughly, washing away fatigue."}</li>
                                        </ol>
                                        <span className="ghusl-footer"><Icons.Sparkles /> {lang === 'ml' ? "നിങ്ങൾ വീണ്ടും പ്രാർത്ഥനയിലേക്ക് പൂർണ്ണ ശുദ്ധിയോടെ മടങ്ങുക." : "Step back onto your prayer mat with joy and peaceful hearts."}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* <Icons.Message /> GENTLE Q&A TAB (NEW FEATURE SECTION) */}
                {activeTab === 'qa' && (
                    <div className="qa-subview tab-view animated">
                        <div className="subview-header">
                            <h3>{lang === 'ml' ? "സംശയനിവാരണവും കാരുണ്യ വഴികളും" : "Gentle Questions & Guidance"}</h3>
                            <p>{lang === 'ml' ? "മാസമുറ, ഗർഭകാലം, മാനസികാരോഗ്യം, ആരാധനകൾ എന്നിവയെക്കുറിച്ചുള്ള സമാശ്വാസപരമായ ഉത്തരങ്ങൾ." : "Compassionate, educational, and completely non-judgmental guidance for your spiritual questions."}</p>
                        </div>

                        {/* Search bar inside Q&A */}
                        <div className="qa-search-container">
                            <input 
                                type="text" 
                                className="qa-search-input"
                                placeholder={lang === 'ml' ? "ചോദ്യങ്ങളോ വിഷയങ്ങളോ തിരയുക..." : "Search guidance or topics..."}
                                value={qaSearchQuery}
                                onChange={(e) => setQaSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Category filter pills inside Q&A */}
                        <div className="qa-filter-row">
                            {[
                                { id: 'all', label_en: "All", label_ml: "എല്ലാം" },
                                { id: 'worship', label_en: "Worship", label_ml: "ആരാധനകൾ" },
                                { id: 'quran', label_en: "Quran/Dhikr", label_ml: "ഖുർആൻ/ദിക്ർ" },
                                { id: 'practical', label_en: "Cleanliness", label_ml: "ശുദ്ധി" },
                                { id: 'maternity', label_en: "Maternity", label_ml: "മാതൃത്വം" },
                                { id: 'wellness', label_en: "Wellness", label_ml: "മാനസികാവസ്ഥ" }
                            ].map(cat => (
                                <button 
                                    key={cat.id} 
                                    className={`qa-filter-pill ${qaActiveCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => setQaActiveCategory(cat.id)}
                                >
                                    {lang === 'ml' ? cat.label_ml : cat.label_en}
                                </button>
                            ))}
                        </div>

                        {/* Recently Viewed horizontal chips list if populated */}
                        {qaRecentlyViewed.length > 0 && (
                            <div className="qa-recent-container">
                                <span className="qa-recent-title"><Icons.Clock /> {lang === 'ml' ? "അടുത്തിടെ വായിച്ചവ:" : "Recently Viewed:"}</span>
                                <div className="qa-recent-list">
                                    {qaRecentlyViewed.map(id => {
                                        const qItem = QA_DATA.find(x => x.id === id);
                                        if (!qItem) return null;
                                        return (
                                            <button 
                                                key={id} 
                                                className="qa-recent-chip"
                                                onClick={() => setExpandedQuestionId(id)}
                                            >
                                                {lang === 'ml' ? qItem.q_ml.slice(0, 25) + '...' : qItem.q_en.slice(0, 25) + '...'}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Dynamic Questions List */}
                        <div className="qa-accordion-list">
                            {getFilteredQuestions().length > 0 ? (
                                getFilteredQuestions().map((item) => {
                                    const isExpanded = expandedQuestionId === item.id;
                                    const isHelpful = !!qaHelpfulReactions[item.id];
                                    const isFav = qaFavorites.includes(item.id);

                                    return (
                                        <div 
                                            key={item.id} 
                                            className={`qa-accordion-card card-premium ${isExpanded ? 'expanded' : ''}`}
                                        >
                                            <div 
                                                className="qa-card-header"
                                                onClick={() => handleQuestionAccordionClick(item.id)}
                                            >
                                                <h4 className="qa-card-title">
                                                    {lang === 'ml' ? item.q_ml : item.q_en}
                                                </h4>
                                                <div className="qa-header-actions-row">
                                                    <button 
                                                        className="qa-fav-star-btn"
                                                        onClick={(e) => { e.stopPropagation(); toggleQaFavorite(item.id); }}
                                                        aria-label="Save question"
                                                    >
                                                        {isFav ? HEART_ICON_FILLED : HEART_ICON_EMPTY}
                                                    </button>
                                                    <span className={`qa-card-icon ${isExpanded ? 'rotated' : ''}`}>
                                                        {CHEVRON_DOWN_ICON}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Expandable answer panel */}
                                            {isExpanded && (
                                                <div className="qa-card-body animated slide-down">
                                                    <p className="qa-card-answer">
                                                        {lang === 'ml' ? item.a_ml : item.a_en}
                                                    </p>
                                                    
                                                    {/* References/Hadith Block */}
                                                    {item.ref_en && (
                                                        <div className="qa-card-reference">
                                                            <strong><Icons.Scroll /> {lang === 'ml' ? "അവലംബം:" : "Reference:"}</strong> {lang === 'ml' ? item.ref_ml : item.ref_en}
                                                        </div>
                                                    )}

                                                    {/* Suggestions du jour (Related comfort items) */}
                                                    {item.dua_suggest_en && (
                                                        <div className="qa-related-tip card-gradient">
                                                            <strong><Icons.Hands /> {lang === 'ml' ? "നിർദ്ദേശിക്കുന്ന പ്രാർത്ഥന:" : "Related Dua Suggestion:"}</strong>
                                                            <p className="suggest-dua-text">"{lang === 'ml' ? item.dua_suggest_ml : item.dua_suggest_en}"</p>
                                                        </div>
                                                    )}

                                                    {/* Related Dhikr shortcut launcher */}
                                                    {item.related_dhikr && (
                                                        <div className="qa-related-tip related-dhikr-trigger card-gradient">
                                                            <div className="related-dhikr-left">
                                                                <strong><Icons.Beads /> {lang === 'ml' ? "ബന്ധപ്പെട്ട ദിക്ർ:" : "Related Comfort Dhikr:"}</strong>
                                                                <span>{lang === 'ml' ? "നാവുകൊണ്ട് ചൊല്ലി സമാധാനം നേടുക." : "Click play to listen and ease your heart."}</span>
                                                            </div>
                                                            <button 
                                                                className="play-chime-btn" 
                                                                onClick={() => {
                                                                    const dObj = COMFORT_DHIKRS.find(d => d.id === item.related_dhikr);
                                                                    if (dObj) togglePlayback('dhikr', dObj.id, dObj.audio);
                                                                }}
                                                            >
                                                                {playingType === 'dhikr' && activeAudioId === item.related_dhikr && isPlaying ? PAUSE_ICON : PLAY_ICON}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Reactions line */}
                                                    <div className="qa-card-footer">
                                                        <button 
                                                            className={`helpful-btn ${isHelpful ? 'helpful-active' : ''}`}
                                                            onClick={() => handleToggleHelpful(item.id)}
                                                        >
                                                            {THUMBS_UP_ICON}
                                                            <span>
                                                                {lang === 'ml' ? "സഹായകരമായി" : "Helpful"}{' '}
                                                                ({helpfulCounts[item.id] || 0})
                                                            </span>
                                                        </button>
                                                        <span className="qa-card-category-badge">{item.category}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="qa-empty-state card-premium">
                                    <p>{lang === 'ml' ? "ചോദ്യങ്ങളൊന്നും കണ്ടെത്താൻ കഴിഞ്ഞില്ല." : "No guidance found matching your search."}</p>
                                    <button onClick={() => { setQaSearchQuery(''); setQaActiveCategory('all'); }} className="surah-play-btn card-gradient">
                                        {lang === 'ml' ? "തിരച്ചിൽ റദ്ദാക്കുക" : "Reset Filter"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* <Icons.Beads /> COMFORT DHIKR TAB */}
                {activeTab === 'dhikr' && (
                    <div className="dhikr-subview tab-view animated">
                        <div className="subview-header">
                            <h3>{lang === 'ml' ? "പ്രയാസകരമായ ദിനങ്ങളിലെ സമാശ്വാസ ദിക്റുകൾ" : "Comfort Dhikr for Difficult Days"}</h3>
                            <p>{lang === 'ml' ? "സ്ട്രെസ്സ്, ആകുലത, വേദന എന്നിവയിൽ നിന്ന് ശാന്തത നേടാൻ താഴെയുള്ള ദിക്റുകൾ സഹായിക്കും. കേൾക്കാൻ പ്ലേ ബട്ടൺ അമർത്തുക." : "Curated dhikrs to soothe anxiety, sadness, and fatigue. Click play to listen immediately."}</p>
                        </div>

                        <div className="comfort-dhikr-container">
                            {COMFORT_DHIKRS.map((dhikr) => {
                                const isCurrentPlaying = playingType === 'dhikr' && activeAudioId === dhikr.id;
                                return (
                                    <div key={dhikr.id} className={`comfort-dhikr-card card-premium ${isCurrentPlaying ? 'active-playing-dhikr' : ''}`}>
                                        <div className="dhikr-card-top">
                                            <span className="dhikr-category">{dhikr.category}</span>
                                            <button 
                                                className={`play-chime-btn ${isCurrentPlaying && isPlaying ? 'playing' : ''} ${isBuffering && isCurrentPlaying ? 'buffering' : ''}`} 
                                                onClick={() => togglePlayback('dhikr', dhikr.id, dhikr.audio)}
                                                aria-label={isCurrentPlaying && isPlaying ? "Pause" : "Play"}
                                            >
                                                {isCurrentPlaying && isPlaying ? PAUSE_ICON : PLAY_ICON}
                                            </button>
                                        </div>
                                        <div className="dhikr-arabic-text">{dhikr.arabic}</div>
                                        <div className="dhikr-meta-block">
                                            <span className="dhikr-trans-text">"{dhikr.trans}"</span>
                                            <p className="dhikr-meaning-text">{lang === 'ml' ? dhikr.ml : dhikr.en}</p>
                                        </div>
                                        
                                        {/* Waveform visualizer glow when active */}
                                        {isCurrentPlaying && isPlaying && (
                                            <div className="dhikr-wave-indicator">
                                                <span className="bar bar1"></span>
                                                <span className="bar bar2"></span>
                                                <span className="bar bar3"></span>
                                                <span className="bar bar4"></span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="comfort-dhikr-footer-note card-premium">
                            <span className="sparkle"><Icons.Sparkles /></span>
                            <p>{lang === 'ml' ? "“മറ്റാരും കാണാത്ത നിങ്ങളുടെ ഉള്ളിലെ വേദനകൾ പോലും നിങ്ങളുടെ നാഥൻ കാണുന്നുണ്ട്.”" : "“Allah sees your silent pain even when nobody else does. You are never unseen.”"}</p>
                        </div>
                    </div>
                )}

                {/* <Icons.Book /> PEACEFUL QURAN TAB */}
                {activeTab === 'quran' && (
                    <div className="quran-subview tab-view animated">
                        <div className="subview-header">
                            <h3>{lang === 'ml' ? "ഹാർമോണിയസ് ഖുർആൻ പാരായണങ്ങൾ" : "Peaceful Quran Recitations"}</h3>
                            <p>{lang === 'ml' ? "നിങ്ങളുടെ ഹൃദയത്തിന് ശാന്തത നൽകാൻ Curated ചെയ്ത സൂറത്തുകൾ കേൾക്കൂ. വേഗത ക്രമീകരിക്കാൻ താഴെയുള്ള Controls ഉപയോഗിക്കാം." : "Specially curated Surahs for women, supporting resume bookmarks and playback speed control."}</p>
                        </div>

                        <div className="quran-recitations-grid">
                            {QURAN_RECITATIONS.map(surah => {
                                const isCurrentPlaying = playingType === 'quran' && activeAudioId === surah.id;
                                return (
                                    <div key={surah.id} className={`quran-surah-card card-premium ${isCurrentPlaying ? 'active-playing' : ''}`}>
                                        <div className="surah-card-header">
                                            <h4>{lang === 'ml' ? surah.title_ml : surah.title_en}</h4>
                                            <div className="surah-actions-header">
                                                <button className="fav-surah-btn" onClick={() => toggleFavSurah(surah.id)}>
                                                    {favoritedSurahs.includes(surah.id) ? HEART_ICON_FILLED : HEART_ICON_EMPTY}
                                                </button>
                                            </div>
                                        </div>
                                        <p className="surah-desc">{lang === 'ml' ? surah.desc_ml : surah.desc_en}</p>
                                        
                                        {/* Continuous playback bookmarks indicator */}
                                        {audioBookmarks[surah.id] > 0 && (
                                            <div className="bookmark-pill">
                                                <Icons.Hourglass /> {lang === 'ml' ? "സംരക്ഷിച്ച ഭാഗത്ത് നിന്ന് തുടരുന്നു" : "Resumes from bookmarked timestamp"}
                                            </div>
                                        )}

                                        {/* Speeds & Inline playback control bar when active */}
                                        {isCurrentPlaying && (
                                            <div className="surah-speed-control-panel">
                                                <span className="speed-label"><Icons.Lightning /> {lang === 'ml' ? "വേഗത:" : "Speed:"}</span>
                                                <div className="speed-chips-row">
                                                    {[0.5, 0.75, 1.0, 1.25, 1.5].map(sp => (
                                                        <button 
                                                            key={sp} 
                                                            className={`speed-chip ${playbackSpeed === sp ? 'active' : ''}`}
                                                            onClick={() => changePlaybackSpeed(sp)}
                                                        >
                                                            {sp}x
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="surah-advanced-controls">
                                            {isCurrentPlaying ? (
                                                <div className="surah-active-controls">
                                                    <button className="surah-ctrl-btn primary card-gradient" onClick={() => togglePlayback('quran', surah.id, surah.audio)}>
                                                        {isPlaying ? PAUSE_ICON : PLAY_ICON}
                                                        <span>{isPlaying ? (lang === 'ml' ? "നിർത്തുക" : "Pause") : (isBuffering ? (lang === 'ml' ? "ലോഡ്..." : "Buffering...") : (lang === 'ml' ? "തുടരുക" : "Resume"))}</span>
                                                    </button>
                                                    <button className="surah-ctrl-btn outline" onClick={restartPlayback} title={lang === 'ml' ? "തുടക്കം മുതൽ കേൾക്കുക" : "Restart"}>
                                                        {RESTART_ICON}
                                                    </button>
                                                    <button className="surah-ctrl-btn outline" onClick={stopPlayback} title={lang === 'ml' ? "അവസാനിപ്പിക്കുക" : "Stop"}>
                                                        {STOP_ICON}
                                                    </button>
                                                    <button className="surah-open-quran-btn" onClick={() => navigate(`/quran/${surah.surahNum}`)}>
                                                        {OPEN_BOOK_ICON}
                                                        <span>{lang === 'ml' ? "ഖുർആനിൽ തുറക്കുക" : "Open in Quran"}</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="surah-inactive-controls">
                                                    <button className="surah-play-btn card-gradient" onClick={() => togglePlayback('quran', surah.id, surah.audio)}>
                                                        {PLAY_ICON}
                                                        <span>{lang === 'ml' ? "കേൾക്കുക" : "Play & Listen"}</span>
                                                    </button>
                                                    <button className="surah-open-quran-btn" onClick={() => navigate(`/quran/${surah.surahNum}`)}>
                                                        {OPEN_BOOK_ICON}
                                                        <span>{lang === 'ml' ? "ഖുർആനിൽ തുറക്കുക" : "Go to Full Surah"}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* <Icons.Hands /> WELLNESS DUAS TAB */}
                {activeTab === 'duas' && (
                    <div className="duas-subview tab-view animated">
                        <div className="subview-header">
                            <h3>{lang === 'ml' ? "മാനസിക സൗഖ്യത്തിനായുള്ള പ്രത്യേക ദുആകൾ" : "Emotional Wellness Dua"}</h3>
                            <p>{lang === 'ml' ? "ഹൃദയത്തിന് തളർച്ച നേരിടുന്ന സമയങ്ങളിൽ ഈ പ്രാർത്ഥനകൾ ഉരുവിടുന്നത് ആത്മീയമായ ശക്തി നൽകുന്നു." : "Prophetic supplications focused on healing emotional burdens, grief, and fatigue."}</p>
                        </div>

                        <div className="dua-category-filter">
                            {duaCategories.map(cat => (
                                <button 
                                    key={cat} 
                                    className={`nav-pill ${activeDuaCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveDuaCategory(cat)}
                                >
                                    {cat === 'All' ? (lang === 'ml' ? 'എല്ലാം' : 'All') : cat}
                                </button>
                            ))}
                        </div>

                        <div className="wellness-duas-grid">
                            {(activeDuaCategory === 'All' 
                                ? WELLNESS_DUAS 
                                : WELLNESS_DUAS.filter(dua => dua.filterCategory === activeDuaCategory)
                            ).map((dua) => {
                                const isCurrentPlaying = playingType === 'dua' && activeAudioId === dua.id;
                                return (
                                    <div key={dua.id} className={`wellness-dua-card card-premium ${isCurrentPlaying ? 'active-playing-dhikr' : ''}`}>
                                        <div className="dua-top-row">
                                            <span className="dua-tag">{lang === 'ml' ? dua.category_ml : dua.category_en}</span>
                                            {dua.audioUrl ? (
                                            <button 
                                                className={`play-chime-btn ${isCurrentPlaying && isPlaying ? 'playing' : ''}`} 
                                                onClick={() => playTTSDua(dua.id)}
                                                aria-label={isCurrentPlaying && isPlaying ? "Pause" : "Play"}
                                            >
                                                {isCurrentPlaying && isPlaying ? PAUSE_ICON : PLAY_ICON}
                                            </button>
                                            ) : <span>{lang === 'ml' ? 'ഓഡിയോ ലഭ്യമല്ല' : 'Recording unavailable'}</span>}
                                        </div>
                                        <div className="dua-arabic-text">{dua.arabic}</div>
                                        <div className="dua-meta-info">
                                            <span className="dua-trans-text">"{dua.trans}"</span>
                                            <p className="dua-meaning-text">{lang === 'ml' ? dua.ml : dua.en}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* <Icons.Mosque /> MOTHERS OF ISLAM TAB */}
                {activeTab === 'stories' && (
                    <div className="stories-subview tab-view animated">
                        <div className="subview-header">
                            <h3>{lang === 'ml' ? "മാതൃകകളായ ഇസ്ലാമിക വനിതകൾ" : "Inspirational Women of Islam"}</h3>
                            <p>{lang === 'ml' ? "ചരിത്രത്തിലെ മഹതികളുടെ കഥകളിൽ നിന്നും ജീവിത പാഠങ്ങളിൽ നിന്നും പ്രചോദനം ഉൾക്കൊള്ളൂ." : "Inspirational historical stories detailing the immense scholar, emotional and leadership roles of Muslim women."}</p>
                        </div>

                        <div className="heroines-stories-grid">
                            {HEROINES_STORIES.map((story, i) => (
                                <div key={i} className={`story-card card-premium color-${story.color}`}>
                                    <div className="story-header-glow"></div>
                                    <div className="story-card-top">
                                        <h4 className="story-name">{lang === 'ml' ? story.name_ml : story.name_en}</h4>
                                        <span className="story-badge-role">{lang === 'ml' ? story.role_ml : story.role_en}</span>
                                    </div>
                                    <p className="story-summary-text">{lang === 'ml' ? story.desc_ml : story.desc_en}</p>
                                    
                                    <div className="story-lessons-block">
                                        <h5><Icons.Star /> {lang === 'ml' ? "പ്രധാന പാഠങ്ങൾ:" : "Key Takeaways & Lessons:"}</h5>
                                        <div className="lessons-list">
                                            {(lang === 'ml' ? story.lessons_ml : story.lessons_en).map((lesson, idx) => (
                                                <span key={idx} className="lesson-chip">{lesson}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* <Icons.Seedling /> SELF CARE TAB */}
                {activeTab === 'selfcare' && (
                    <div className="selfcare-subview tab-view animated">
                        <div className="subview-header">
                            <h3>{lang === 'ml' ? "ഇസ്ലാമിലെ സ്വയം പരിചരണ മാർഗ്ഗങ്ങൾ" : "Self Care from an Islamic Perspective"}</h3>
                            <p>{lang === 'ml' ? "നിങ്ങളുടെ ശരീരവും മനസ്സും അല്ലാഹുവിന്റെ അമാനത്താണ്. അവ സംരക്ഷിക്കുന്നത് പുണ്യമാണ്." : "Your body and mind carry sacred rights over you. Islamic guidelines for peaceful personal restoration."}</p>
                        </div>

                        <div className="selfcare-cards-grid">
                            {SELF_CARE_TIPS.map((tip, idx) => (
                                <div key={idx} className="selfcare-card card-premium">
                                    <div className="selfcare-icon">{tip.icon}</div>
                                    <div className="selfcare-body">
                                        <h4>{lang === 'ml' ? tip.title_ml : tip.title_en}</h4>
                                        <p>{lang === 'ml' ? tip.desc_ml : tip.desc_en}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="selfcare-banner card-premium">
                            <span className="banner-logo"><Icons.Seedling /></span>
                            <p>{lang === 'ml' ? "...സ്വയം ശ്രദ്ധിക്കുന്നതും സ്നേഹിക്കുന്നതും സ്വാർത്ഥതയല്ല, മറിച്ച് അല്ലാഹുവിന് നന്ദി പ്രകടിപ്പിക്കുന്നതിനുള്ള മാർഗ്ഗമാണ്.”" : "“Taking care of your mental and physical health is not selfish. It is a beautiful way of thanking Allah for your life.”"}</p>
                        </div>
                    </div>
                )}

            </div>

            <div style={{ height: '100px' }}></div>
        </div>
    );
}
