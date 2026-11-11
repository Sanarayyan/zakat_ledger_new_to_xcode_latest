import { readStoredJSON } from '../../services/storedJson.mjs';
import { appStorage } from '../../services/appStorage';
import * as Icons from '../../components/IconLibrary';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../LanguageContext';
import './TasbihCounter.css';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

import { DHIKR_LIST } from './dhikrData';
import DhikrLibraryModal from './DhikrLibraryModal';
import TasbihBackground from './TasbihBackground';

// Immersive background images for preview thumbnails
import thasbeeh1Video from '../../assets/thasbeeh1.mov';
import thasbeeh2Video from '../../assets/thasbeeh2.mov';
import thasbeeh3Video from '../../assets/thasbeeh3.mov';
import thasbeeh6Video from '../../assets/thasbeeh6.mov';
import thasbeeh4Video from '../../assets/thasbeeh4.mov';
import thasbeeh5Video from '../../assets/thasbeeh5.mov';

// Configurable Auto Tasbih speed
const AUTO_TASBIH_INTERVAL = 1500; // 1.5 seconds per count

// Reusable Web Audio API context for zero-latency bead sounds
let audioCtx = null;
const playBeadClickSound = (themeId = 'glass') => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const time = audioCtx.currentTime;
        const variation = Math.random(); // Ensures infinite natural variations
        
        // Determine material acoustic profile from theme ID
        let material = 'glass';
        if (themeId.includes('marble') || themeId.includes('stone') || themeId.includes('onyx')) material = 'marble';
        else if (themeId.includes('wood')) material = 'wood';
        else if (themeId.includes('pearl') || themeId.includes('opal')) material = 'pearl';
        else if (themeId.includes('gold')) material = 'gold';

        if (material === 'glass') {
            // Glass / Crystal (Soft cling, elegant, delicate)
            const baseFreq = 3400 + (variation * 300); 
            
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(baseFreq, time);
            gain1.gain.setValueAtTime(0, time);
            gain1.gain.linearRampToValueAtTime(0.08, time + 0.002); 
            gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(baseFreq * 1.85, time); 
            gain2.gain.setValueAtTime(0, time);
            gain2.gain.linearRampToValueAtTime(0.04, time + 0.002);
            gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.08); 
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);

            const osc3 = audioCtx.createOscillator();
            const gain3 = audioCtx.createGain();
            osc3.type = 'sine';
            osc3.frequency.setValueAtTime(900 + (variation * 100), time);
            osc3.frequency.exponentialRampToValueAtTime(400, time + 0.02); 
            gain3.gain.setValueAtTime(0, time);
            gain3.gain.linearRampToValueAtTime(0.12, time + 0.002);
            gain3.gain.exponentialRampToValueAtTime(0.001, time + 0.03); 
            osc3.connect(gain3);
            gain3.connect(audioCtx.destination);
            
            osc1.start(time); osc2.start(time); osc3.start(time);
            osc1.stop(time + 0.15); osc2.stop(time + 0.1); osc3.stop(time + 0.05);
            
        } else if (material === 'marble') {
            // Marble (Heavier tok, soft stone contact)
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle'; // Fuller, rounder thud
            osc.frequency.setValueAtTime(400 + (variation * 50), time);
            osc.frequency.exponentialRampToValueAtTime(100, time + 0.04);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.20, time + 0.002);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(time);
            osc.stop(time + 0.1);
            
        } else if (material === 'wood') {
            // Wooden / Sandalwood (Warm tak/tok, natural organic feel)
            const baseFreq = 500 + (variation * 150);
            
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(baseFreq, time);
            osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, time + 0.03);
            
            gain1.gain.setValueAtTime(0, time);
            gain1.gain.linearRampToValueAtTime(0.3, time + 0.002);
            gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
            
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            
            // Sharp attack transient 'click' for wood
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(1200 + (variation * 200), time);
            
            gain2.gain.setValueAtTime(0, time);
            gain2.gain.linearRampToValueAtTime(0.02, time + 0.001);
            gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
            
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            
            osc1.start(time); osc2.start(time);
            osc1.stop(time + 0.05); osc2.stop(time + 0.02);

        } else if (material === 'pearl') {
            // Pearl (Delicate smooth tik)
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200 + (variation * 200), time);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.12, time + 0.002);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(time);
            osc.stop(time + 0.06);
            
        } else if (material === 'gold') {
            // Gold (Premium subtle metallic ting)
            const baseFreq = 2500 + (variation * 200);
            
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(baseFreq, time);
            
            gain1.gain.setValueAtTime(0, time);
            gain1.gain.linearRampToValueAtTime(0.06, time + 0.002);
            gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(baseFreq * 2.1, time);
            
            gain2.gain.setValueAtTime(0, time);
            gain2.gain.linearRampToValueAtTime(0.03, time + 0.002);
            gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
            
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            
            osc1.start(time); osc2.start(time);
            osc1.stop(time + 0.2); osc2.stop(time + 0.15);
        }
        
    } catch(e) {
        console.log('Web Audio API bead sound failed', e);
    }
};

const BEAD_THEMES = [
    { id: "marble-white", name: "Marble", translationKey: "bead_marble" },
    { id: "turquoise-marble", name: "Turquoise", translationKey: "bead_turquoise" },
    { id: "walnut-wood", name: "Sandalwood", translationKey: "bead_sandalwood" },
    { id: "amber-crystal", name: "Amber Resin", translationKey: "bead_amber" },
    { id: "black-obsidian", name: "Black Onyx", translationKey: "bead_onyx" },
    { id: "emerald-stone", name: "Emerald", translationKey: "bead_emerald" },
    { id: "rose-pearl", name: "Pearl", translationKey: "bead_pearl" },
    { id: "ocean-pearl", name: "Ocean Pearl", translationKey: "bead_ocean" },
    { id: "cloud-opal", name: "Cloud Opal", translationKey: "bead_cloud" },
    { id: "sakura-pearl", name: "Sakura Pearl", translationKey: "bead_sakura" },
    { id: "honey-amber", name: "Honey Amber", translationKey: "bead_honey" },
    { id: "blueberry-night", name: "Blueberry", translationKey: "bead_blueberry" },
    { id: "watermelon", name: "Watermelon", translationKey: "bead_watermelon" },
    { id: "strawberry-quartz", name: "Strawberry", translationKey: "bead_strawberry" }
];

const TRANQUILITY_SCENES = [
    { id: 'thasbeeh1_video', name: 'Cinematic Nature', image: thasbeeh1Video },
    { id: 'thasbeeh2_video', name: 'Living Nature', image: thasbeeh2Video },
    { id: 'thasbeeh3_video', name: 'Peaceful Stream', image: thasbeeh3Video },
    { id: 'thasbeeh6_video', name: 'Deep Serenity', image: thasbeeh6Video },
    { id: 'thasbeeh4_video', name: 'Morning Garden', image: thasbeeh4Video },
    { id: 'thasbeeh5_video', name: 'Immersive Flow', image: thasbeeh5Video }
];

export default function TasbihCounter() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, lang } = useLanguage();

    const [sessionId, setSessionId] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [goal, setGoal] = useState('unlimited');
    const [customGoalInput, setCustomGoalInput] = useState('');
    const [customGoalError, setCustomGoalError] = useState('');
    
    const [selectedTheme, setSelectedTheme] = useState(BEAD_THEMES[0]);
    const [selectedDhikr, setSelectedDhikr] = useState(DHIKR_LIST[0]);
    
    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = appStorage.getItem('tasbihMuted');
        return saved !== 'true'; // Defaults to true (sound enabled)
    });
    const [vibrationOn, setVibrationOn] = useState(true);
    
    const [showDhikrModal, setShowDhikrModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [tranquilBg, setTranquilBg] = useState(() => {
        const saved = appStorage.getItem('tasbih_tranquil_scene');
        if (saved === 'thasbeeh4') return 'thasbeeh4_video';
        if (saved === 'thasbeeh3') return 'thasbeeh3_video';
        if (saved === 'thasbeeh3_gif') return 'thasbeeh6_video';
        if (saved === 'thasbeeh2_gif') return 'thasbeeh2_video';
        return saved && TRANQUILITY_SCENES.some(s => s.id === saved) ? saved : 'thasbeeh3_video';
    });
    const [showTranquilPopup, setShowTranquilPopup] = useState(false);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    
    const [showCompletionCard, setShowCompletionCard] = useState(false);
    const [hasAcknowledgedCompletion, setHasAcknowledgedCompletion] = useState(false);
    const [resumeData, setResumeData] = useState(null);
    const [playbackSpeed, setPlaybackSpeed] = useState(() => {
        const saved = appStorage.getItem("tasbih_playback_speed");
        return saved ? parseFloat(saved) : 1.0;
    });
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [autoDhikrAudio, setAutoDhikrAudio] = useState(() => {
        const saved = appStorage.getItem('tasbih_auto_audio');
        return saved === 'true'; // Defaults to false
    });
    
    // Internal state to track if the automatic loop is actively running (triggered by first tap)
    const [isAutoRunning, setIsAutoRunning] = useState(false);

    // If the master auto-dhikr toggle is turned off, immediately stop running
    useEffect(() => {
        if (!autoDhikrAudio) {
            setIsAutoRunning(false);
        }
    }, [autoDhikrAudio]);

    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        const diffX = touchStartX.current - touchEndX.current;
        const threshold = 50; // Minimum swipe distance in pixels

        if (Math.abs(diffX) > threshold) {
            setIsAutoRunning(false); // Stop auto tasbih on swipe
            const currentIdx = DHIKR_LIST.findIndex(d => d.id === selectedDhikr.id);
            if (diffX > 0) {
                // Swipe Left -> Next Dhikr
                const nextIdx = (currentIdx + 1) % DHIKR_LIST.length;
                setSelectedDhikr(DHIKR_LIST[nextIdx]);
            } else {
                // Swipe Right -> Previous Dhikr
                const prevIdx = (currentIdx - 1 + DHIKR_LIST.length) % DHIKR_LIST.length;
                setSelectedDhikr(DHIKR_LIST[prevIdx]);
            }
        }
        // Reset positions cleanly
        touchStartX.current = 0;
        touchEndX.current = 0;
    };

    const audioRef = useRef(null);
    const beadCount = 33; // Fixed simple 33-bead tasbih

    const incrementRef = useRef();
    
    useEffect(() => {
        incrementRef.current = increment;
    });

    // Automatic Tasbih Progression (Auto Recitation)
    useEffect(() => {
        let intervalId = null;
        if (autoDhikrAudio && isAutoRunning) {
            console.log(`[Auto Tasbih] Started (Interval: ${AUTO_TASBIH_INTERVAL}ms)`);
            intervalId = setInterval(() => {
                if (incrementRef.current) {
                    incrementRef.current();
                }
            }, AUTO_TASBIH_INTERVAL);
        }
        
        return () => {
            if (intervalId) {
                console.log('[Auto Tasbih] Stopped');
                clearInterval(intervalId);
            }
        };
    }, [autoDhikrAudio, isAutoRunning]);

    // Initialize HTML5 Audio object dynamically for future authentic audio support
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, []);

    // Stop or start auto-progression when user interacts
    const handleUserInteraction = () => {
        if (autoDhikrAudio) {
            setIsAutoRunning(prev => {
                const next = !prev;
                console.log(next ? '[Auto Tasbih] Auto-counting started by user tap' : '[Auto Tasbih] Auto-counting stopped by user tap');
                return next;
            });
        }
    };

    useEffect(() => {
        appStorage.setItem('tasbih_tranquil_scene', tranquilBg);
    }, [tranquilBg]);

    // Initial Load & Resume Logic
    useEffect(() => {
      // Load vibration setting
      const vibrationSetting = appStorage.getItem('tasbihVibration');
      if (vibrationSetting !== null) setVibrationOn(vibrationSetting === 'true');

      // Handle navigation state for new session or resume
      if (location.state?.startNew) {
        startNewSession();
        return;
      }
      if (location.state?.resumeSessionId) {
        loadSession(location.state.resumeSessionId);
        return;
      }

      // Determine last session
      const storedSessions = readStoredJSON(appStorage, 'tasbih_sessions', []);
      storedSessions.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
      const lastSession = storedSessions[0];

      if (lastSession && lastSession.count > 0 && !lastSession.finished) {
        setResumeData(lastSession);
        setShowResumePrompt(true);
      } else {
        startNewSession();
      }
    }, [location]);

    const startNewSession = () => {
        setSessionId(Date.now().toString());
        setTotalCount(0);
        setHasAcknowledgedCompletion(false);
        setShowResumePrompt(false);
        const savedThemeId = appStorage.getItem('selectedBeadTheme');
        if (savedThemeId) {
            const theme = BEAD_THEMES.find(t => t.id === savedThemeId);
            setSelectedTheme(theme || BEAD_THEMES[0]);
        } else {
            setSelectedTheme(BEAD_THEMES[0]);
        }
    };

    const loadSession = (idToLoad) => {
        const storedSessions = readStoredJSON(appStorage, 'tasbih_sessions', []);
        const sess = storedSessions.find(s => s.id === idToLoad);
        if (sess) {
            setSessionId(sess.id);
            setTotalCount(sess.count || 0);
            setGoal(sess.goal || 'unlimited');
            setHasAcknowledgedCompletion(sess.finished || false);
            
            const dhikr = DHIKR_LIST.find(d => d.id === sess.dhikrId);
            if (dhikr) setSelectedDhikr(dhikr);
            
            const theme = BEAD_THEMES.find(t => t.id === sess.themeId);
            if (theme) setSelectedTheme(theme);
            else setSelectedTheme(BEAD_THEMES[0]);
        }
        setShowResumePrompt(false);
    };

    // Auto-Save Session
    const currentRound = Math.floor(totalCount / beadCount);
    const activeBead = totalCount % beadCount;
    const isCompleted = goal !== 'unlimited' && totalCount >= parseInt(goal);

    useEffect(() => {
        if (!sessionId) return;
        const sessions = readStoredJSON(appStorage, 'tasbih_sessions', []);
        const idx = sessions.findIndex(s => s.id === sessionId);
        
        const sessionObj = {
            id: sessionId,
            dhikrId: selectedDhikr.id,
            dhikrName: selectedDhikr.name,
            count: totalCount,
            goal: goal,
            themeId: selectedTheme.id,
            completed: isCompleted,
            finished: hasAcknowledgedCompletion,
            lastActive: new Date().toISOString()
        };

        if (idx >= 0) sessions[idx] = { ...sessions[idx], ...sessionObj };
        else sessions.push(sessionObj);
        
        appStorage.setItem('tasbih_sessions', JSON.stringify(sessions));

        appStorage.setItem('tasbihMuted', (!soundEnabled).toString());
        appStorage.setItem('tasbihVibration', vibrationOn);
        appStorage.setItem('selectedBeadTheme', selectedTheme.id);

    }, [totalCount, sessionId, selectedDhikr, selectedTheme, soundEnabled, vibrationOn, goal, isCompleted, hasAcknowledgedCompletion]);

    // Preload the current selected dhikr audio track cleanly
    useEffect(() => {
        if (!audioRef.current) return;
        const audio = audioRef.current;

        // Stop current audio and reset
        audio.pause();
        audio.currentTime = 0;

        const audioSrc = selectedDhikr.audio || '/audio/dhikr/subhanallah.mp3';
        audio.src = audioSrc;
        audio.load();
        audio.loop = false; // Never play in a continuous loop
        audio.playbackRate = playbackSpeed;
        audio.volume = 0.55;

        return () => {
            audio.pause();
        };
    }, [selectedDhikr, playbackSpeed]);

    const playAudio = () => {
        // TEMPORARY SOLUTION: Play gentle bead click instead of robotic dhikr voice
        // This is perfectly synchronized with no delays, as requested.
        if (soundEnabled) {
            playBeadClickSound(selectedTheme.id);

            /* FUTURE AUTHENTIC AUDIO READY ARCHITECTURE
               Uncomment the below section when authentic recorded dhikr audio is available.
               Currently disabled to avoid robotic TTS pronunciation.
               
            if (audioRef.current) {
                try {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(e => console.log('Dhikr recitation play failed:', e));
                } catch (e) {
                    console.log('Dhikr recitation play exception:', e);
                }
            }
            */
        }
    };

    const triggerFeedback = async () => {
        if (vibrationOn) {
            try {
                await Haptics.impact({ style: ImpactStyle.Light });
            } catch (e) {
                if (navigator.vibrate) navigator.vibrate(15);
            }
        }
        playAudio();
    };

    const increment = () => {
        triggerFeedback();
        setTotalCount(prev => {
            const next = prev + 1;
            
            // Completion Check
            if (goal !== 'unlimited' && next === parseInt(goal) && !hasAcknowledgedCompletion) {
                if (vibrationOn) {
                    try {
                        Haptics.notification({ type: NotificationType.Success });
                    } catch (e) {
                        if (navigator.vibrate) navigator.vibrate([30, 50, 30, 50, 30]);
                    }
                }
                setShowCompletionCard(true);
                if (window.checkAppRating) window.checkAppRating('tasbih');
            }
            return next;
        });
        
        // Analytics
        const analytics = readStoredJSON(appStorage, 'tasbih_analytics', {});
        const today = new Date().toDateString();
        
        let streak = analytics.currentStreak || 0;
        const lastActiveDateStr = analytics.lastActiveDate;
        
        if (lastActiveDateStr !== today) {
            if (lastActiveDateStr) {
                const lastDate = new Date(lastActiveDateStr);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (lastDate.toDateString() === yesterday.toDateString()) {
                    streak += 1;
                } else {
                    streak = 1; // Reset streak if a day is missed
                }
            } else {
                streak = 1; // First day of activity
            }
        } else if (streak === 0) {
            streak = 1; // Ensure it's at least 1 if active today
        }

        analytics.currentStreak = streak;
        analytics.lifetimeTotal = (analytics.lifetimeTotal || 0) + 1;
        if (!analytics.dailyTotals) analytics.dailyTotals = {};
        if (!analytics.dailyTotals[today]) analytics.dailyTotals[today] = {};
        analytics.dailyTotals[today][selectedDhikr.id] = (analytics.dailyTotals[today][selectedDhikr.id] || 0) + 1;
        analytics.lastActiveDate = today;
        appStorage.setItem('tasbih_analytics', JSON.stringify(analytics));
    };

    const decrement = async () => {
        if (vibrationOn) {
            try {
                await Haptics.impact({ style: ImpactStyle.Light });
            } catch (e) {
                if (navigator.vibrate) navigator.vibrate(10);
            }
        }
        setTotalCount(prev => (prev > 0 ? prev - 1 : 0));
    };

    const beads = Array.from({ length: beadCount });
    
    const maxRadius = 152;
    
    // Reduce size on mobile for better breathing room
    const isMobile = dimensions.width <= 480;
    const widthFactor = isMobile ? 0.35 : 0.375; // Approx 70% of width
    const heightFactor = isMobile ? 0.18 : 0.24; // Safe scale to fit inside flex main-screen
    
    // Ensure perfectly round circle that shrinks on both small width AND small height screens
    const calculatedRadius = Math.min(
        dimensions.width * widthFactor, 
        dimensions.height * heightFactor, // Prevents overflow on short screens
        maxRadius
    );
    
    const radius = calculatedRadius;
    const radiusX = calculatedRadius;
    const radiusY = calculatedRadius;
    const dynamicSize = Math.max(15, Math.min(28, radius * 0.19));

    const handleCustomGoalSubmit = () => {
        const displayVal = customGoalInput !== '' ? customGoalInput : (goal !== 'unlimited' && ![33, 55, 99, 100].includes(parseInt(goal)) ? goal : '');
        const val = parseInt(displayVal);
        if (!val || isNaN(val) || val < 1) {
            setCustomGoalError('Please enter a valid number greater than 0');
            return;
        }
        setCustomGoalError('');
        setCustomGoalInput('');
        setGoal(val);
        setShowGoalModal(false);
    };

    if (showResumePrompt && resumeData) {
        return (
            <div className="tasbih-wrapper flex-center">
                {/* Clean Top-Left Back Button */}
                <button 
                    className="tasbih-btn-icon back-btn-top-left" 
                    onClick={() => {
                        if (window.history.length > 1) {
                            navigate(-1);
                        } else {
                            navigate('/');
                        }
                    }}
                    aria-label={t('back') || 'Back'}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>

                <div className="resume-prompt-card">
                    <h2>{t('continue_previous_dhikr')}</h2>
                    <div className="resume-details">
                        <div className="res-dhikr">{resumeData.dhikrName}</div>
                        <div className="res-simple-stats">
                            {resumeData.count} {resumeData.goal !== 'unlimited' ? `/ ${resumeData.goal}` : ''}
                        </div>
                        <div className="res-time-ago">{t('last_active_recent')}</div>
                    </div>
                    <div className="resume-actions">
                        <button className="btn-resume-primary" onClick={() => loadSession(resumeData.id)}>{t('resume')}</button>
                        <button className="btn-resume-secondary" onClick={startNewSession}>{t('start_new_dhikr')}</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="tasbih-wrapper">
            <TasbihBackground scene={tranquilBg} />

            <header className="tasbih-header">
                {/* LEFT: back + reset + goal */}
                <div className="tap-left-controls">
                    <button className="tasbih-btn-icon" onClick={() => navigate(-1)} aria-label="Back">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>

                </div>

                {/* CENTER: Title */}
                <div className="tasbih-header-title">{t('tasbih')}</div>

                {/* RIGHT: audio + environment + settings */}
                <div className="tap-right-controls">
                    <button 
                        className={`tasbih-btn-icon audio-toggle-btn ${soundEnabled ? 'active' : 'muted'}`} 
                        onClick={(e) => { e.stopPropagation(); setSoundEnabled(!soundEnabled); }} 
                        aria-label={soundEnabled ? t('sound_on') : t('muted')}
                    >
                        {!soundEnabled ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M11 5L6 9H2V15H6L11 19V5Z" />
                                <line x1="22" y1="9" x2="16" y2="15" />
                                <line x1="16" y1="9" x2="22" y2="15" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                        )}
                    </button>
                    <button className="tasbih-btn-icon" onClick={(e) => { e.stopPropagation(); setShowTranquilPopup(true); }} aria-label="Environment">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </button>
                    <button className="tasbih-btn-icon" onClick={(e) => { e.stopPropagation(); setShowSettingsModal(true); }} aria-label="Settings">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    </button>
                </div>
            </header>

            <div 
                className="tap-left" 
                onPointerDown={(e) => {
                    e.preventDefault();
                    handleUserInteraction();
                    decrement();
                }}
                onContextMenu={(e) => e.preventDefault()}
            ></div>
            <div 
                className="tap-right" 
                onPointerDown={(e) => {
                    e.preventDefault();
                    handleUserInteraction();
                    increment();
                }}
                onContextMenu={(e) => e.preventDefault()}
            ></div>

            <div className="active-dhikr-container" onClick={e => e.stopPropagation()}>
                <div className="active-dhikr-display">
                    <div className="dhikr-arabic-row">
                        <span className="dhikr-arabic">{selectedDhikr.arabic}</span>
                    </div>
                    <div className="dhikr-english-column">
                        <div className="dhikr-name">{selectedDhikr.name}</div>
                        <div className="dhikr-meaning">{lang === 'ml' && selectedDhikr.meaning_ml ? selectedDhikr.meaning_ml : selectedDhikr.meaning_en}</div>
                    </div>
                </div>
                <button className="view-all-dhikr-btn" onClick={() => setShowDhikrModal(true)}>
                    {t('view_all_dhikr')}
                </button>
            </div>

<div className="floating-controls-row">
    <button className="tasbih-btn-icon" onClick={(e) => { e.stopPropagation(); setShowResetConfirm(true); }} aria-label="Reset">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
    </button>
    <button className="tasbih-btn-icon goal-btn" onClick={(e) => { e.stopPropagation(); setShowGoalModal(true); }} aria-label="Max Limit">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
        </svg>
    </button>
</div>

            <main 
                className="main-screen"
                style={{ minHeight: radius * 2 + 34 }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onPointerDown={handleUserInteraction}
            >
                <div className="bead-container" style={{ width: radius * 2, height: radius * 2 }}>
                    <div className="tasbih-display">
                        <div className={`tasbih-main-number ${isCompleted ? 'goal-glow' : ''}`} 
                             style={{ 
                                 fontSize: `clamp(1.75rem, ${radius * (goal === 'unlimited' ? 0.53 : 0.39)}px, 5rem)`,
                                 transition: 'font-size 0.3s ease'
                             }}>
                            {goal !== 'unlimited' ? (
                                <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                                    {totalCount} <span style={{ fontSize: '0.6em', color: 'var(--text-muted)', fontWeight: '400' }}>/ {goal}</span>
                                </span>
                            ) : (
                                totalCount
                            )}
                        </div>
                        
                        {isCompleted && (
                            <div className="tasbih-success-badge">{t('goal_completed')}</div>
                        )}

                        {currentRound > 0 && (
                            <div className="tasbih-loop-label">
                                {t('round')} {currentRound}
                            </div>
                        )}
                    </div>

                    <div className="bead-thread"></div>
                    <div 
                        className={`imam-bead ${selectedTheme.id}`} 
                        style={{ marginTop: `${radius - 1}px` }}
                    ></div>
                    
                    {beads.map((_, index) => {
                        const isActive = index === activeBead;
                        const startAngle = 15;
                        const endAngle = 345;
                        const angle = startAngle + (index / (beadCount - 1 || 1)) * (endAngle - startAngle);
                        
                        const x = Math.sin(angle * Math.PI / 180) * radiusX;
                        const y = Math.cos(angle * Math.PI / 180) * radiusY; 
                        
                        const scale = isActive ? 1.15 : 0.9;
                        
                        const hasTexture = ["marble-white", "turquoise-marble", "walnut-wood", "amber-crystal", "emerald-stone", "ivory-marble", "ocean-pearl", "cloud-opal", "sakura-pearl", "honey-amber", "blueberry-night", "watermelon", "strawberry-quartz"].includes(selectedTheme.id);
                        const bgPosition = hasTexture 
                            ? `center, ${(index * 37) % 100}% ${(index * 61) % 100}%, center` 
                            : 'center';

                        return (
                            <div 
                                key={index} 
                                className={`bead ${selectedTheme.id} ${isActive ? 'active' : ''}`}
                                style={{
                                    width: `${dynamicSize}px`,
                                    height: `${dynamicSize}px`,
                                    marginLeft: `-${dynamicSize/2}px`,
                                    marginTop: `-${dynamicSize/2}px`,
                                    transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                                    backgroundPosition: bgPosition,
                                    opacity: 1,
                                    zIndex: isActive ? 10 : 1
                                }}
                            />
                        );
                    })}
                </div>
            </main>

            {/* Bottom Controls Container */}
            <div className="bottom-section-wrapper" onClick={e => e.stopPropagation()}>
                <div className="gesture-hint">
                    <span className="gesture-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                            <path d="M8 18L4 14l4-4" />
                            <path d="M4 14h16" />
                            <path d="M16 6l4 4-4 4" />
                        </svg>
                        {lang === 'ml' ? 'എണ്ണാൻ ടാപ്പ് ചെയ്യുക · ദിക്ർ മാറ്റാൻ സ്വൈപ്പ് ചെയ്യുക' : 'Tap to count · Swipe to change dhikr'}
                    </span>
                </div>

                {/* Premium Horizontal Bead Selector */}
                <div className="bottom-bead-selector-container">
                    <div className="bottom-bead-selector">
                        {BEAD_THEMES.map(theme => {
                            const isSelected = selectedTheme.id === theme.id;
                            return (
                                <div 
                                    key={theme.id} 
                                    className={`selector-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => setSelectedTheme(theme)}
                                >
                                    <div className={`selector-bead-preview bead ${theme.id}`} />
                                    <span className="selector-bead-name">{theme.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Completion Card Modal */}
            {showCompletionCard && (
                <div className="premium-modal-overlay" onClick={() => setShowCompletionCard(false)}>
                    <div className="completion-card" onClick={e => e.stopPropagation()}>
                        <div className="completion-icon"><Icons.CrescentIcon /></div>
                        <h2>{t('dhikr_completed')}</h2>
                        <div className="completion-stats">
                            {selectedDhikr.name} × {goal}
                        </div>
                        <div className="completion-actions">
                            <button className="btn-resume-primary" onClick={() => {
                                setShowCompletionCard(false);
                                setHasAcknowledgedCompletion(true);
                            }}>{t('continue_counting')}</button>
                            <button className="btn-resume-secondary" onClick={() => {
                                setHasAcknowledgedCompletion(true);
                                navigate('/tasbih/history');
                            }}>{t('save_finish')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dhikr Selection Library */}
            <DhikrLibraryModal 
                isOpen={showDhikrModal} 
                onClose={() => setShowDhikrModal(false)} 
                selectedId={selectedDhikr.id}
                onSelect={(d) => {
                    setIsAutoRunning(false); // Disable auto tasbih on change
                    setSelectedDhikr(d);
                    setShowDhikrModal(false);
                    setSessionId(Date.now().toString());
                    setTotalCount(0);
                    setHasAcknowledgedCompletion(false);
                }} 
            />

            {/* Simple Settings & Goal Modal */}
            {showSettingsModal && (
                <div className="premium-modal-overlay" onClick={() => setShowSettingsModal(false)}>
                    <div className="premium-modal-content settings-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{t('set_goal_settings') === 'set_goal_settings' ? 'Set Goal & Settings' : t('set_goal_settings')}</h3>
                            <button className="close-btn" onClick={() => setShowSettingsModal(false)}>&times;</button>
                        </div>
                        <div className="settings-body">
                            

                            {/* Premium Continuous Auto Recitation Toggle */}
                            <div className="setting-group toggle-group premium-setting" style={{marginTop: '10px'}}>
                                <div className="premium-toggle-label">
                                    <label className="premium-label">{t('auto_dhikr_audio') === 'auto_dhikr_audio' ? 'Continuous Auto Recitation' : t('auto_dhikr_audio')}</label>
                                    <p className="premium-sublabel">Automatically continue to next dhikr</p>
                                </div>
                                <div className={`toggle-switch premium-switch ${autoDhikrAudio ? 'on' : 'off'}`} onClick={() => {
                                    setAutoDhikrAudio(prev => {
                                        const next = !prev;
                                        if (next && !soundEnabled) {
                                            setSoundEnabled(true);
                                            appStorage.setItem('tasbihMuted', 'false');
                                        }
                                        appStorage.setItem('tasbih_auto_audio', next ? 'true' : 'false');
                                        return next;
                                    });
                                }}>
                                    <div className="toggle-thumb"></div>
                                </div>
                            </div>

                            {/* Premium Playback Recitation Speed */}
                            <div className="setting-group premium-setting" style={{marginTop: '20px'}}>
                                <label className="premium-label">{t('recitation_speed') === 'recitation_speed' ? 'Auto Recitation Speed' : t('recitation_speed')}</label>
                                <div className="setting-options speed-options premium-speed-container">
                                    {[0.75, 1, 1.25, 1.5, 2].map(speed => (
                                        <button 
                                            key={speed} 
                                            className={`premium-pill-btn ${playbackSpeed === speed ? 'active-glow' : ''}`} 
                                            onClick={() => {
                                                setPlaybackSpeed(speed);
                                                appStorage.setItem("tasbih_playback_speed", speed.toString());
                                            }}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </div>
                            </div>


                            {/* Tasbeeh History */}
                            <div className="setting-group premium-setting" style={{marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', cursor: 'pointer'}} onClick={() => {
                                setShowSettingsModal(false);
                                navigate('/tasbih/history');
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="premium-toggle-label">
                                        <label className="premium-label" style={{ cursor: 'pointer', margin: 0 }}>{t('tasbih_history') === 'tasbih_history' ? 'Tasbeeh History' : t('tasbih_history')}</label>
                                        <p className="premium-sublabel" style={{ margin: 0, marginTop: '4px' }}>View your past completed goals</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Goal Setting Modal */}
            {showGoalModal && (
                <div className="premium-modal-overlay" onClick={() => setShowGoalModal(false)}>
                    <div className="premium-modal-content settings-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{t('set_goal') === 'set_goal' ? 'Set Goal' : t('set_goal')}</h3>
                            <button className="close-btn" onClick={() => setShowGoalModal(false)}>&times;</button>
                        </div>
                        <div className="settings-body">
                            <div className="setting-group">
                                <label>{t('today_want_recite') === 'today_want_recite' ? 'Today I want to recite:' : t('today_want_recite')}</label>
                                <div className="setting-options goal-options">
                                    {[33, 55, 99, 100, 'unlimited'].map(num => (
                                        <button key={num} className={`opt-btn ${goal === num ? 'active' : ''}`} onClick={() => {
                                            setGoal(num);
                                            setShowGoalModal(false);
                                        }}>
                                            {num === 'unlimited' ? t('unlimited') : num}
                                        </button>
                                    ))}
                                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                            <input type="number" className="opt-input custom-goal-input" 
                                                   placeholder={t('custom_dhikr') === 'custom_dhikr' ? 'Custom...' : t('custom_dhikr')} 
                                                   value={customGoalInput !== '' ? customGoalInput : (goal !== 'unlimited' && ![33, 55, 99, 100].includes(parseInt(goal)) ? goal : '')} 
                                                   onChange={e => {
                                                       setCustomGoalInput(e.target.value);
                                                       setCustomGoalError('');
                                                   }}
                                                   onKeyDown={e => { if (e.key === 'Enter') handleCustomGoalSubmit(); }}
                                                   style={{ flex: 1 }} />
                                            <button className="opt-btn go-btn" onClick={handleCustomGoalSubmit} style={{ padding: '8px 16px', flex: 'none', width: 'auto', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', borderRadius: '12px' }}>
                                                Go
                                            </button>
                                        </div>
                                        {customGoalError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px', textAlign: 'left', marginLeft: '4px' }}>{customGoalError}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tranquility Background Modal */}
            {showTranquilPopup && (
                <div className="premium-modal-overlay" onClick={() => setShowTranquilPopup(false)}>
                    <div className="premium-modal-content settings-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ 
                            paddingBottom: '16px', 
                            borderBottom: '1px solid rgba(255,255,255,0.06)', 
                            marginBottom: '20px' 
                        }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', letterSpacing: '0.5px' }}>
                                {t('environment') === 'environment' ? 'Environment' : (t('environment') || 'Environment')}
                            </h3>
                            <button className="close-btn" onClick={() => setShowTranquilPopup(false)}>&times;</button>
                        </div>
                        <div className="settings-body" style={{ padding: '0 4px' }}>
                            <div className="setting-group" style={{ marginBottom: '0' }}>
                                <h4 style={{ 
                                    fontSize: '0.95rem', 
                                    color: 'rgba(255, 255, 255, 0.85)', 
                                    marginBottom: '18px', 
                                    fontWeight: '500', 
                                    textAlign: 'center',
                                    letterSpacing: '0.3px'
                                }}>
                                    {lang === 'ml' ? 'പശ്ചാത്തലം തിരഞ്ഞെടുക്കുക' : 'Choose Background Ambience'}
                                </h4>
                                <div className="setting-options theme-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', width: '100%' }}>
                                    {TRANQUILITY_SCENES.map(scene => (
                                        <button 
                                            key={scene.id} 
                                            className={`opt-btn ${tranquilBg === scene.id ? 'active' : ''}`} 
                                            onClick={() => {
                                                setTranquilBg(scene.id);
                                            }}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '10px',
                                                height: 'auto',
                                                borderRadius: '16px',
                                                background: tranquilBg === scene.id ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255,255,255,0.02)',
                                                border: tranquilBg === scene.id ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(255,255,255,0.06)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <div style={{
                                                width: '100%',
                                                height: '80px',
                                                borderRadius: '10px',
                                                overflow: 'hidden',
                                                position: 'relative',
                                                backgroundColor: '#000'
                                            }}>
                                                {scene.id.includes('_video') ? (
                                                    <video 
                                                        src={scene.image} 
                                                        autoPlay loop muted playsInline preload="auto"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            opacity: tranquilBg === scene.id ? '1.0' : '0.6',
                                                            transition: 'opacity 0.2s ease'
                                                        }}
                                                    />
                                                ) : (
                                                    <img 
                                                        src={scene.image} 
                                                        alt={scene.name} 
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            opacity: tranquilBg === scene.id ? '1.0' : '0.6',
                                                            transition: 'opacity 0.2s ease'
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <span style={{
                                                fontSize: '0.82rem',
                                                fontWeight: '600',
                                                color: tranquilBg === scene.id ? '#34d399' : 'rgba(255,255,255,0.7)',
                                                textAlign: 'center'
                                            }}>
                                                {scene.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Premium Confirm Modal */}
            {showResetConfirm && (
                <div className="premium-modal-overlay confirm-overlay" onClick={() => setShowResetConfirm(false)}>
                    <div className="premium-confirm-card" onClick={e => e.stopPropagation()}>
                        <div className="confirm-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                            </svg>
                        </div>
                        <h3>Reset Tasbih?</h3>
                        <p>Your current progress will be cleared.</p>
                        <p className="confirm-sub">You can continue again anytime.</p>
                        <div className="confirm-actions">
                            <button className="btn-confirm-cancel" onClick={() => setShowResetConfirm(false)}>{t('cancel') === 'cancel' ? 'Cancel' : t('cancel')}</button>
                            <button className="btn-confirm-reset" onClick={() => {
                                setTotalCount(0);
                                setHasAcknowledgedCompletion(false);
                                setShowResetConfirm(false);
                            }}>{t('reset') === 'reset' ? 'Reset' : t('reset')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
