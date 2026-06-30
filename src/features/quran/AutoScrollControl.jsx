import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AutoScrollControl.css';

const AutoScrollControl = ({ isVisible }) => {
    const [status, setStatus] = useState('off'); // 'off', 'scrolling', 'paused'
    const [speed, setSpeed] = useState(0.3); // 1x default
    const scrollRef = useRef(null);
    const containerRef = useRef(null);
    const lastInteractionTime = useRef(0);
    const accumulatedScroll = useRef(0);

    const speeds = [
        { label: '0.5x', value: 0.15, name: 'Slow' },
        { label: '1x', value: 0.3, name: 'Normal' },
        { label: '1.5x', value: 0.5, name: 'Faster' }
    ];

    const stopScroll = useCallback(() => {
        if (scrollRef.current) {
            cancelAnimationFrame(scrollRef.current);
            scrollRef.current = null;
        }
    }, []);

    const startScroll = useCallback((currentSpeed = speed) => {
        stopScroll();
        accumulatedScroll.current = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
        
        const scrollLoop = () => {
            accumulatedScroll.current += currentSpeed;
            const targetY = Math.round(accumulatedScroll.current);
            
            // Brute force scroll across all potential containers
            window.scrollTo(0, targetY);
            if (document.documentElement) document.documentElement.scrollTop = targetY;
            if (document.body) document.body.scrollTop = targetY;
            
            scrollRef.current = requestAnimationFrame(scrollLoop);
        };
        
        scrollRef.current = requestAnimationFrame(scrollLoop);
        setStatus('scrolling');
        lastInteractionTime.current = Date.now();
    }, [speed, stopScroll]);

    const handleToggle = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (status === 'scrolling') {
            stopScroll();
            setStatus('paused');
        } else {
            startScroll();
        }
    };

    const handleTurnOff = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        stopScroll();
        setStatus('off');
    };

    const handleSpeedChange = (newSpeed, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setSpeed(newSpeed);
        if (status === 'scrolling') {
            startScroll(newSpeed);
        }
    };

    // Smart Pause: Pause on ANY user interaction except on the control itself
    useEffect(() => {
        const handleInteraction = (e) => {
            if (containerRef.current && containerRef.current.contains(e.target)) return;
            if (Date.now() - lastInteractionTime.current < 400) return;

            if (status === 'scrolling') {
                stopScroll();
                setStatus('paused');
            }
        };

        const options = { passive: true, capture: true };
        window.addEventListener('touchstart', handleInteraction, options);
        window.addEventListener('mousedown', handleInteraction, options);
        window.addEventListener('wheel', handleInteraction, options);
        window.addEventListener('keydown', handleInteraction, options);

        return () => {
            window.removeEventListener('touchstart', handleInteraction, options);
            window.removeEventListener('mousedown', handleInteraction, options);
            window.removeEventListener('wheel', handleInteraction, options);
            window.removeEventListener('keydown', handleInteraction, options);
        };
    }, [status, stopScroll]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeys = (e) => {
            if (e.key === ' ' || e.code === 'Space') {
                if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    handleToggle();
                }
            }
            if (e.key === '1') handleSpeedChange(0.4);
            if (e.key === '2') handleSpeedChange(0.8);
            if (e.key === '3') handleSpeedChange(1.4);
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [status, speed]);

    useEffect(() => {
        if (status === 'scrolling') {
            document.body.classList.add('as-active');
        } else {
            document.body.classList.remove('as-active');
        }
        return () => document.body.classList.remove('as-active');
    }, [status]);

    useEffect(() => {
        return () => stopScroll();
    }, [stopScroll]);

    if (!isVisible) return null;

    return (
        <div className="autoscroll-v3-root" ref={containerRef}>
            <AnimatePresence mode="wait">
                {status === 'off' ? (
                    <motion.button
                        key="trigger"
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 50 }}
                        className="as-v3-trigger glass-morphism"
                        onClick={handleToggle}
                        whileTap={{ scale: 0.9 }}
                    >
                        <div className="as-v3-icon">
                            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M7 13l5 5 5-5M7 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="as-v3-label">READ MODE</span>
                    </motion.button>
                ) : (
                    <motion.div
                        key="pill"
                        initial={{ opacity: 0, width: 60, x: 50 }}
                        animate={{ opacity: 1, width: 'auto', x: 0 }}
                        exit={{ opacity: 0, width: 60, x: 50 }}
                        className="as-v3-pill glass-morphism"
                    >
                        <div className="as-v3-speeds">
                            {speeds.map((s) => (
                                <button
                                    key={s.label}
                                    className={`as-v3-speed-dot ${speed === s.value ? 'active' : ''}`}
                                    onClick={(e) => handleSpeedChange(s.value, e)}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        <div className="as-v3-divider" />
                        <button 
                            className={`as-v3-main-action ${status === 'scrolling' ? 'playing' : ''}`}
                            onClick={handleToggle}
                        >
                            {status === 'scrolling' ? (
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            )}
                        </button>
                        <button className="as-v3-close" onClick={handleTurnOff}>×</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AutoScrollControl;
