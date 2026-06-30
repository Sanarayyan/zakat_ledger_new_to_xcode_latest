import React from 'react';
import './TasbihBackground.css';

import thasbeeh3Video from '../../assets/thasbeeh3.mov';
import thasbeeh6Video from '../../assets/thasbeeh6.mov';
import thasbeeh4Video from '../../assets/thasbeeh4.mov';

// Additional background assets
import forestWaterfallImg from '../../assets/forest_waterfall.png';
import rainSerenityImg from '../../assets/rain_serenity.png';
import goldenSunriseImg from '../../assets/golden_sunrise.png';
import moonlightNightImg from '../../assets/moonlight_night.png';
import oceanSerenityImg from '../../assets/ocean_serenity.png';
import sereneBgImg from '../../assets/serene_bg.png';
import daytimeBgImg from '../../assets/daytime_bg.png';
import emeraldGlowImg from '../../assets/emerald_glow.png';
import financeBgImg from '../../assets/finance_bg.png';
import thasbeeh1Video from '../../assets/thasbeeh1.mov';
import thasbeeh2Video from '../../assets/thasbeeh2.mov';
import thasbeeh5Video from '../../assets/thasbeeh5.mov';

const EMERALD_PARTICLES = [
    { left: '8%',  delay: '0s',   dur: '9s'  },
    { left: '20%', delay: '1.5s', dur: '11s' },
    { left: '33%', delay: '3s',   dur: '8s'  },
    { left: '47%', delay: '5s',   dur: '12s' },
    { left: '60%', delay: '2s',   dur: '9s'  },
    { left: '72%', delay: '6s',   dur: '10s' },
    { left: '85%', delay: '4s',   dur: '8s'  },
    { left: '92%', delay: '7s',   dur: '11s' },
    { left: '15%', delay: '8s',   dur: '9s'  },
    { left: '55%', delay: '9s',   dur: '13s' },
    { left: '40%', delay: '10s',  dur: '10s' },
    { left: '78%', delay: '11s',  dur: '8s'  },
];

const STARS = [
    { left: '5%',  top: '6%',  delay: '0s',   size: 2   },
    { left: '14%', top: '18%', delay: '1.2s', size: 1.5 },
    { left: '24%', top: '4%',  delay: '2.4s', size: 2.5 },
    { left: '35%', top: '14%', delay: '0.8s', size: 1   },
    { left: '44%', top: '9%',  delay: '3.1s', size: 2   },
    { left: '54%', top: '22%', delay: '1.7s', size: 1.5 },
    { left: '63%', top: '7%',  delay: '4.2s', size: 2   },
    { left: '74%', top: '16%', delay: '5s',   size: 1   },
    { left: '84%', top: '11%', delay: '2s',   size: 2.5 },
    { left: '93%', top: '5%',  delay: '3.8s', size: 1.5 },
    { left: '9%',  top: '32%', delay: '6s',   size: 1   },
    { left: '28%', top: '38%', delay: '2.5s', size: 2   },
    { left: '48%', top: '42%', delay: '7s',   size: 1.5 },
    { left: '68%', top: '28%', delay: '4.5s', size: 1   },
    { left: '82%', top: '44%', delay: '8s',   size: 2   },
    { left: '19%', top: '52%', delay: '9s',   size: 1.5 },
    { left: '38%', top: '56%', delay: '5.5s', size: 1   },
    { left: '58%', top: '48%', delay: '10s',  size: 2   },
    { left: '88%', top: '55%', delay: '11s',  size: 1.5 },
    { left: '3%',  top: '62%', delay: '12s',  size: 1   },
];

const RAIN_DROPS = Array.from({ length: 35 }, (_, i) => ({
    left:   `${((i * 2.9) + 1) % 100}%`,
    delay:  `${((i * 0.13) % 1.8).toFixed(2)}s`,
    dur:    `${(0.5 + (i % 6) * 0.08).toFixed(2)}s`,
    height: `${55 + (i % 5) * 18}px`,
    opacity: (0.15 + (i % 5) * 0.05).toFixed(2),
}));

const LEAVES = [
    { left: '8%',  delay: '0s',  dur: '14s', rotate: 20  },
    { left: '22%', delay: '3s',  dur: '17s', rotate: -15 },
    { left: '38%', delay: '6s',  dur: '12s', rotate: 30  },
    { left: '52%', delay: '1s',  dur: '15s', rotate: -20 },
    { left: '67%', delay: '4s',  dur: '18s', rotate: 10  },
    { left: '80%', delay: '8s',  dur: '13s', rotate: -25 },
    { left: '12%', delay: '9s',  dur: '16s', rotate: 15  },
    { left: '58%', delay: '11s', dur: '14s', rotate: -10 },
];

function CinematicNature({ image, rays = true, mist = true, water = true, isVideo = false }) {
    const [videoError, setVideoError] = React.useState(false);

    return (
        <div className="tb-scene tb-cinematic-nature">
            {/* Base high-fidelity background image or video */}
            {isVideo && !videoError ? (
                <>
                    <video 
                        src={image} 
                        className="tb-bg-video" 
                        autoPlay loop muted playsInline preload="auto" 
                        onError={() => setVideoError(true)}
                    />
                    <div className="tb-video-overlay" />
                </>
            ) : (
                <img src={videoError ? sereneBgImg : image} className="tb-bg-image zoom-pan-slow" alt="" />
            )}
            
            {/* Layer 1: Volumetric Sunlight Rays */}
            {rays && (
                <>
                    <div className="tb-sun-ray r-1" />
                    <div className="tb-sun-ray r-2" />
                </>
            )}
            
            {/* Layer 2: Moving Mist/Atmosphere */}
            {mist && (
                <>
                    <div className="tb-mist-layer m-1" />
                    <div className="tb-mist-layer m-2" />
                </>
            )}
            
            {/* Layer 3: River Surface Shimmer & Flow Reflection */}
            {water && (
                <div className="tb-river-surface">
                    <div className="tb-water-reflection" />
                </div>
            )}
            
            {/* Layer 4: Ambient Floating Light Dust (Very Subtle) */}
            {EMERALD_PARTICLES.slice(0, 10).map((p, i) => (
                <div key={i} className="tb-cinematic-dust" style={{ left: p.left, animationDelay: p.delay, animationDuration: `${12 + i}s` }} />
            ))}
            
            {/* Layer 5: Soft Vignette for focus */}
            <div className="tb-cinematic-vignette" />
        </div>
    );
}

const BACKGROUND_MAP = {
    thasbeeh3_video: thasbeeh3Video,
    thasbeeh6_video: thasbeeh6Video,
    thasbeeh4_video: thasbeeh4Video,
    forest_waterfall: forestWaterfallImg,
    rain_serenity: rainSerenityImg,
    golden_sunrise: goldenSunriseImg,
    moonlight_night: moonlightNightImg,
    ocean_serenity: oceanSerenityImg,
    serene_bg: sereneBgImg,
    daytime_bg: daytimeBgImg,
    emerald_glow: emeraldGlowImg,
    finance_bg: financeBgImg,
    thasbeeh1_video: thasbeeh1Video,
    thasbeeh2_video: thasbeeh2Video,
    thasbeeh5_video: thasbeeh5Video,
};

export default function TasbihBackground({ scene }) {
    const img = BACKGROUND_MAP[scene] || thasbeeh3Video;
    const isVideo = scene.includes('_video');
    
    // Default to water effect for nature scenes, disable for GIFs/Videos
    const isGif = scene.endsWith('_gif');
    const water = !isGif && !isVideo && !['rain_serenity', 'emerald_glow', 'finance_bg'].includes(scene);
    const rays = !isGif && !isVideo && scene !== 'rain_serenity';
    
    return <CinematicNature image={img} water={water} rays={rays} isVideo={isVideo} />;
}
