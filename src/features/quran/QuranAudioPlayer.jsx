import React, { useEffect, useState } from 'react';
import './QuranAudioPlayer.css';

function clock(seconds) {
    const whole = Math.max(0, Math.floor(seconds));
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

const progressEvents = ['timeupdate', 'loadedmetadata', 'durationchange', 'emptied', 'seeking'];

export default function QuranAudioPlayer({ audio, track, reciter, playing, rate, onRate, onToggle, onClose, lang }) {
    const [progress, setProgress] = useState({ time: 0, duration: 0 });
    const ml = lang === 'ml';
    const { time, duration } = progress;
    useEffect(() => {
        const update = () => setProgress({
            time: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
            duration: Number.isFinite(audio.duration) ? audio.duration : 0,
        });
        update();
        progressEvents.forEach(event => audio.addEventListener(event, update));
        return () => progressEvents.forEach(event => audio.removeEventListener(event, update));
    }, [audio]);

    return (
        <section className="sticky-audio-player quran-audio-player" aria-label={ml ? 'ഖുർആൻ ഓഡിയോ' : 'Quran audio'}>
            <div className="quran-audio-controls">
                <button type="button" className="sap-play-pause" onClick={onToggle}
                    aria-label={playing ? (ml ? 'താൽക്കാലികമായി നിർത്തുക' : 'Pause') : (ml ? 'പ്ലേ ചെയ്യുക' : 'Play')}>
                    <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
                </button>
                <div className="quran-audio-track">
                    <strong>{track}</strong>
                    <span>{reciter}</span>
                </div>
                <select aria-label={ml ? 'വായന വേഗം' : 'Playback speed'} value={rate} onChange={event => onRate(Number(event.target.value))}>
                    {[0.75, 1, 1.25, 1.5, 2].map(value => <option key={value} value={value}>{value}×</option>)}
                </select>
                <button type="button" className="sap-close" onClick={onClose}
                    aria-label={ml ? 'ഓഡിയോ അടയ്ക്കുക' : 'Close audio player'}>×</button>
            </div>
            <div className="quran-audio-progress">
                <span>{clock(time)}</span>
                <input type="range" min="0" max={duration || 1} step="0.1" value={Math.min(time, duration)}
                    disabled={!duration} aria-label={ml ? 'ആയത്തിലെ സ്ഥാനം' : 'Seek within current ayah'}
                    aria-valuetext={`${clock(time)} / ${clock(duration)}`}
                    onChange={event => {
                        const value = Number(event.target.value);
                        audio.currentTime = value;
                        setProgress({ time: value, duration });
                    }} />
                <span aria-label={ml ? 'ശേഷിക്കുന്ന സമയം' : 'Time remaining'}>{duration ? `−${clock(duration - time)}` : '–:––'}</span>
            </div>
        </section>
    );
}
