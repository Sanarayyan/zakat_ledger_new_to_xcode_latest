import * as Icons from '../../components/IconLibrary';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UmrahGuide.css';
import { useLanguage } from '../../LanguageContext';
import { 
  UMRAH_INTRO, 
  UMRAH_STEPS, 
  UMRAH_DUAS, 
  IHRAM_GUIDE, 
  WOMENS_GUIDANCE, 
  UMRAH_CHECKLIST, 
  HEALTH_SAFETY, 
  COMMON_MISTAKES, 
  SPIRITUAL_PREP,
  MIQAT_LOCATIONS,
  ZIYARAH_GUIDE
} from './umrahData';

const BACK = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const STAR_EMPTY = <Icons.BookmarkIcon style={{ color: "#1F5A3D" }} />;
const STAR_FILLED = <Icons.BookmarkIcon style={{ fill: '#C8A646', color: '#C8A646' }} />;

const ML = {
  title: 'ഉംറ മാർഗ്ഗദർശിക',
  heroTitle: 'നിങ്ങളുടെ പുണ്യ ഉംറ',
  heroSub: 'ഉംറക്കുള്ള പ്രായോഗിക ആത്മീയ സഹായി',
  ayahRef: 'ഖുർആൻ 2:196',
  stepsCompleted: (d, t) => `${d} / ${t} ഘട്ടങ്ങൾ പൂർത്തിയായി`,
  journeyIntro: 'നിങ്ങളുടെ ഉംറ ഘട്ടം ഘട്ടമായി ചെയ്യുക. കൂടുതൽ വിവരങ്ങൾക്ക് ഓരോ കാർഡും തുറക്കുക.',
  sunnah: 'സുന്നത്ത് കർമ്മങ്ങൾ',
  rules: 'നിയമങ്ങൾ',
  avoid: 'ഒഴിവാക്കേണ്ട തെറ്റുകൾ',
  steps: 'ക്രമം',
  copied: 'പകർത്തി',
  itemsPacked: (c, t) => `${c} / ${t} സാമഗ്രികൾ പാക്ക് ചെയ്തു`,
  searchPlaceholder: 'കർമ്മങ്ങൾ അല്ലെങ്കിൽ വിവരങ്ങൾ തിരയുക...',
  bookmarksOnly: 'ബുക്ക്‌മാർക്കുകൾ മാത്രം',
  noBookmarks: 'ബുക്ക്‌മാർക്കുകൾ ഒന്നും ലഭ്യമല്ല',
  noResults: 'ഫലങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല',
  playing: 'പ്ലേ ചെയ്യുന്നു...',
  audioError: 'ഓഡിയോ ഈ ഉപകരണത്തിൽ ലഭ്യമല്ല',
  checklistCats: {
    'Documents': 'രേഖകൾ', 
    'Ihram Essentials': 'ഇഹ്റാം അവശ്യസാധനങ്ങൾ',
    'Toiletries': 'ശുചിത്വ വസ്തുക്കൾ',
    'Medicines': 'മരുന്നുകൾ',
    'Electronics': 'ഇലക്ട്രോണിക്സ്',
    'Spiritual Essentials': 'ആത്മീയ അവശ്യവസ്തുക്കൾ',
  },
  sections: {
    intro: 'ആമുഖം',
    journey: 'യാത്ര',
    duas: 'ദുആകൾ',
    ihram: 'ഇഹ്റാം',
    women: 'സ്ത്രീകൾ',
    checklist: 'പട്ടിക',
    health: 'ആരോഗ്യം',
    mistakes: 'തെറ്റുകൾ',
    spiritual: 'ആത്മീയത',
    miqats: 'മീഖാത്തുകൾ',
    ziyarah: 'സിയാറത്ത്',
  },
};

const SECTIONS = [
  { id: 'intro', icon: <Icons.BookOpenIcon />, en: 'Introduction', ml: ML.sections.intro },
  { id: 'journey', icon: <Icons.MapIcon />, en: 'Journey', ml: ML.sections.journey },
  { id: 'duas', icon: <Icons.HandsPrayIcon />, en: 'Duas', ml: ML.sections.duas },
  { id: 'ihram', icon: <Icons.ShirtIcon />, en: 'Ihram', ml: ML.sections.ihram },
  { id: 'women', icon: <Icons.UsersIcon />, en: "Women's", ml: ML.sections.women },
  { id: 'checklist', icon: <Icons.CheckCircle2Icon />, en: 'Checklist', ml: ML.sections.checklist },
  { id: 'health', icon: <Icons.HeartPulseIcon />, en: 'Health', ml: ML.sections.health },
  { id: 'mistakes', icon: <Icons.TriangleAlertIcon />, en: 'Mistakes', ml: ML.sections.mistakes },
  { id: 'spiritual', icon: <Icons.SparkleIcon />, en: 'Spiritual', ml: ML.sections.spiritual },
  { id: 'miqats', icon: <Icons.LocationIcon />, en: 'Miqats', ml: ML.sections.miqats },
  { id: 'ziyarah', icon: <Icons.SunriseIcon />, en: 'Ziyarah', ml: ML.sections.ziyarah },
];

export default function UmrahGuide() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const isMl = lang === 'ml';

  // Section & Search & Bookmarks state
  const [section, setSection] = useState('intro');
  const [search, setSearch] = useState('');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Persistence States
  const [completedSteps, setCompletedSteps] = useState(() => {
    const s = localStorage.getItem('umrah_steps_done');
    return s ? JSON.parse(s) : [];
  });
  const [checklist, setChecklist] = useState(() => {
    const s = localStorage.getItem('umrah_checklist');
    return s ? JSON.parse(s) : {};
  });
  const [bookmarks, setBookmarks] = useState(() => {
    const s = localStorage.getItem('umrah_bookmarks');
    return s ? JSON.parse(s) : [];
  });
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    const s = localStorage.getItem('umrah_recent_views');
    return s ? JSON.parse(s) : [];
  });

  // Audio Playback State
  const [playingId, setPlayingId] = useState(null);
  const audioRef = React.useRef(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);
  useEffect(() => {
    // Add section to recently viewed
    setRecentlyViewed(prev => {
      const filtered = prev.filter(x => x !== section);
      const next = [section, ...filtered].slice(0, 5);
      localStorage.setItem('umrah_recent_views', JSON.stringify(next));
      return next;
    });
  }, [section]);

  const toggleStep = (id) => {
    setCompletedSteps(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('umrah_steps_done', JSON.stringify(next));
      return next;
    });
  };

  const toggleChecklist = (key) => {
    setChecklist(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('umrah_checklist', JSON.stringify(next));
      return next;
    });
  };

  const toggleBookmark = (id, type) => {
    setBookmarks(prev => {
      const key = `${type}::${id}`;
      const next = prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key];
      localStorage.setItem('umrah_bookmarks', JSON.stringify(next));
      return next;
    });
  };

  const isBookmarked = (id, type) => bookmarks.includes(`${type}::${id}`);

  // Play Dua Audio from local files
  const playAudio = (id, text, translation) => {
    if (playingId === id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
    }
    
    setPlayingId(id);
    
    try {
        const audioUrl = new URL(`../../assets/audio/umrah/${id}.mp3`, import.meta.url).href;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.oncanplaythrough = () => {
            audio.play().catch(e => {
                console.error("Audio playback error:", e);
                setPlayingId(null);
                alert(isMl ? ML.audioError : "Audio file not found or failed to play.");
            });
        };
        
        audio.onerror = () => {
            setPlayingId(null);
            alert(isMl ? ML.audioError : "Audio file not available.");
        };
        
        audio.onended = () => {
            setPlayingId(null);
        };
        
        audio.load();
    } catch(e) {
        setPlayingId(null);
    }
  };

  const copyToClipboard = (dua) => {
    const text = `${dua.arabic}\n${dua.transliteration}\n${isMl && dua.meaning_ml ? dua.meaning_ml : dua.meaning}`;
    navigator.clipboard?.writeText(text);
    alert(isMl ? ML.copied : '<Icons.CheckIcon /> Copied to clipboard');
  };

  return (
    <div className="ug-root">
      {/* Header */}
      <div className="ug-header">
        <button className="ug-back-btn" onClick={() => navigate(-1)}>{BACK}</button>
        <h1 className="ug-title">{isMl ? ML.title : 'Umrah Guide'}</h1>
        <div style={{ width: 24 }} />
      </div>

      {/* Hero Banner */}
      <div className="ug-hero">
        <div className="ug-hero-kaaba"><Icons.KaabaIcon /></div>
        <h2 className="ug-hero-title">{isMl ? ML.heroTitle : 'Your Peaceful Companion'}</h2>
        <p className="ug-hero-sub">{isMl ? ML.heroSub : 'Step-by-step spiritual guide for Umrah'}</p>
        <div className="ug-hero-ayah">
          <p className="ug-ayah-arabic">وَأَتِمُّوا الْحَجَّ وَالْعُمْرَةَ لِلَّهِ</p>
          <p className="ug-ayah-ref">{isMl ? ML.ayahRef : 'Quran 2:196'}</p>
        </div>
        {section === 'journey' && (
          <div className="ug-hero-progress">
            <span>{isMl ? ML.stepsCompleted(completedSteps.length, UMRAH_STEPS.length) : `${completedSteps.length} / ${UMRAH_STEPS.length} steps completed`}</span>
            <div className="ug-progress-bar">
              <div className="ug-progress-fill" style={{ width: `${(completedSteps.length / UMRAH_STEPS.length) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="ug-search-wrap">
        <div className="ug-search-input-wrapper" style={{ position: 'relative' }}>
          <Icons.SearchIcon className="ug-search-icon" />
          <input 
            type="text" 
            className="ug-search-input" 
            placeholder={isMl ? ML.searchPlaceholder : 'Search rituals or guidance...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button 
          className={`ug-bookmark-toggle-btn ${showBookmarksOnly ? 'active' : ''}`}
          onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
        >
          <Icons.BookmarkIcon style={{ color: "#1F5A3D" }} /> {isMl ? ML.bookmarksOnly : 'Bookmarks'}
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="ug-nav-tabs">
        {SECTIONS.map(s => (
          <button 
            key={s.id} 
            className={`ug-nav-tab ${section === s.id ? 'active' : ''}`} 
            onClick={() => { setSection(s.id); setSearch(''); }}
          >
            <span className="ug-nav-icon">{s.icon}</span>
            <span className="ug-nav-label">{isMl ? s.ml : s.en}</span>
          </button>
        ))}
      </div>

      {/* Main Content Render */}
      <div className="ug-content">
        
        {/* SECTION 1: Introduction */}
        {section === 'intro' && (
          <div className="ug-section animate-fade">
            {[UMRAH_INTRO.whatIsUmrah, UMRAH_INTRO.importance, UMRAH_INTRO.difference, UMRAH_INTRO.conditions].map((item, idx) => {
              if (showBookmarksOnly && !isBookmarked(`intro_${idx}`, 'intro')) return null;
              if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.title_ml.toLowerCase().includes(search.toLowerCase())) return null;
              
              return (
                <div key={idx} className="ug-card introduction-card">
                  <div className="ug-card-header">
                    <h3>{isMl ? item.title_ml : item.title}</h3>
                    <button className="ug-bookmark-btn" onClick={() => toggleBookmark(`intro_${idx}`, 'intro')}>
                      {isBookmarked(`intro_${idx}`, 'intro') ? STAR_FILLED : STAR_EMPTY}
                    </button>
                  </div>
                  <p className="ug-intro-desc">{isMl ? item.content_ml : item.content}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 2: Step-by-Step Journey */}
        {section === 'journey' && (
          <div className="ug-section animate-fade">
            <div className="ug-intro-tip">
              <p>{isMl ? ML.journeyIntro : 'Follow each step in exact sequence. Tap cards to see essential rules, sunnahs, and common errors.'}</p>
            </div>
            {UMRAH_STEPS.map((step) => {
              const matchedSearch = !search || step.title.toLowerCase().includes(search.toLowerCase()) || step.title_ml.toLowerCase().includes(search.toLowerCase());
              const matchedBookmark = !showBookmarksOnly || isBookmarked(step.id, 'step');
              if (!matchedSearch || !matchedBookmark) return null;

              return (
                <StepCard 
                  key={step.id} 
                  step={step} 
                  completed={completedSteps.includes(step.id)} 
                  onToggle={toggleStep}
                  isBookmarked={isBookmarked(step.id, 'step')}
                  onBookmark={() => toggleBookmark(step.id, 'step')}
                  lang={lang}
                  isMl={isMl}
                />
              );
            })}
          </div>
        )}

        {/* SECTION 3: Essential Duas */}
        {section === 'duas' && (
          <div className="ug-section animate-fade">
            {UMRAH_DUAS.map((dua) => {
              const matchedSearch = !search || dua.title.toLowerCase().includes(search.toLowerCase()) || dua.title_ml.toLowerCase().includes(search.toLowerCase());
              const matchedBookmark = !showBookmarksOnly || isBookmarked(dua.id, 'dua');
              if (!matchedSearch || !matchedBookmark) return null;

              return (
                <div key={dua.id} className="ug-card dua-card">
                  <div className="ug-dua-header">
                    <span className="ug-dua-cat">{isMl ? dua.category_ml : dua.category}</span>
                    <div className="ug-dua-actions">
                      <button className="ug-bookmark-btn" onClick={() => toggleBookmark(dua.id, 'dua')}>
                        {isBookmarked(dua.id, 'dua') ? STAR_FILLED : STAR_EMPTY}
                      </button>
                      <button className="ug-dua-action-icon" onClick={() => copyToClipboard(dua)}><Icons.CopyIcon /></button>
                      <button className={`ug-dua-action-icon ${playingId === dua.id ? 'pulse-green' : ''}`} onClick={() => playAudio(dua.id, dua.arabic, dua.meaning)}>
                        {playingId === dua.id ? <Icons.PauseIcon /> : <Icons.SpeakerIcon />}
                      </button>
                    </div>
                  </div>
                  <h4 className="ug-dua-title">{isMl ? dua.title_ml : dua.title}</h4>
                  <p className="ug-dua-arabic">{dua.arabic}</p>
                  <p className="ug-dua-trans">{dua.transliteration}</p>
                  <p className="ug-dua-meaning">"{isMl && dua.meaning_ml ? dua.meaning_ml : dua.meaning}"</p>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 4: Ihram Guide */}
        {section === 'ihram' && (
          <div className="ug-section animate-fade">
            {IHRAM_GUIDE.map((item, idx) => {
              const matchedSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.title_ml.toLowerCase().includes(search.toLowerCase());
              const matchedBookmark = !showBookmarksOnly || isBookmarked(`ihram_${idx}`, 'ihram');
              if (!matchedSearch || !matchedBookmark) return null;

              return (
                <div key={idx} className="ug-card ihram-guide-card">
                  <div className="ug-card-header">
                    <h3>{isMl ? item.title_ml : item.title}</h3>
                    <button className="ug-bookmark-btn" onClick={() => toggleBookmark(`ihram_${idx}`, 'ihram')}>
                      {isBookmarked(`ihram_${idx}`, 'ihram') ? STAR_FILLED : STAR_EMPTY}
                    </button>
                  </div>
                  <p className="ug-card-content-desc">{isMl ? item.content_ml : item.content}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 5: Women's Guidance */}
        {section === 'women' && (
          <div className="ug-section animate-fade">
            {WOMENS_GUIDANCE.map((item, idx) => {
              const matchedSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.title_ml.toLowerCase().includes(search.toLowerCase());
              const matchedBookmark = !showBookmarksOnly || isBookmarked(`women_${idx}`, 'women');
              if (!matchedSearch || !matchedBookmark) return null;

              return (
                <div key={idx} className="ug-card women-guidance-card">
                  <div className="ug-card-header">
                    <h3>{isMl ? item.title_ml : item.title}</h3>
                    <button className="ug-bookmark-btn" onClick={() => toggleBookmark(`women_${idx}`, 'women')}>
                      {isBookmarked(`women_${idx}`, 'women') ? STAR_FILLED : STAR_EMPTY}
                    </button>
                  </div>
                  <p className="ug-card-content-desc">{isMl ? item.content_ml : item.content}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 6: Interactive Checklist */}
        {section === 'checklist' && (
          <div className="ug-section animate-fade">
            {/* Checklist Progress Header */}
            {(() => {
              const totalItems = UMRAH_CHECKLIST.reduce((acc, cat) => acc + cat.items.length, 0);
              const checkedItems = Object.values(checklist).filter(Boolean).length;
              return (
                <div className="ug-card checklist-progress-card">
                  <span className="ug-checklist-progress-label">
                    {isMl ? ML.itemsPacked(checkedItems, totalItems) : `${checkedItems} / ${totalItems} items packed`}
                  </span>
                  <div className="ug-progress-bar">
                    <div className="ug-progress-fill" style={{ width: `${(checkedItems / totalItems) * 100}%` }} />
                  </div>
                </div>
              );
            })()}

            {UMRAH_CHECKLIST.map((cat) => {
              const translatedCatName = isMl && ML.checklistCats[cat.category] ? ML.checklistCats[cat.category] : cat.category;
              return (
                <div key={cat.category} className="ug-card checklist-category-card">
                  <h4 className="ug-checklist-cat-title">{cat.icon} {translatedCatName}</h4>
                  <div className="ug-checklist-items">
                    {(isMl && cat.items_ml ? cat.items_ml : cat.items).map((item, idx) => {
                      const storageKey = `${cat.category}::${cat.items[idx]}`;
                      return (
                        <div 
                          key={idx} 
                          className={`ug-checklist-item-row ${checklist[storageKey] ? 'checked' : ''}`}
                          onClick={() => toggleChecklist(storageKey)}
                        >
                          <span className="ug-checklist-box">{checklist[storageKey] ? <Icons.CheckIcon /> : ''}</span>
                          <span className="ug-checklist-item-text">{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 7: Health & Safety */}
        {section === 'health' && (
          <div className="ug-section animate-fade">
            {HEALTH_SAFETY.map((item, idx) => {
              const matchedSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.title_ml.toLowerCase().includes(search.toLowerCase());
              const matchedBookmark = !showBookmarksOnly || isBookmarked(`health_${idx}`, 'health');
              if (!matchedSearch || !matchedBookmark) return null;

              return (
                <div key={idx} className="ug-card health-safety-card">
                  <div className="ug-card-header">
                    <h3>{isMl ? item.title_ml : item.title}</h3>
                    <button className="ug-bookmark-btn" onClick={() => toggleBookmark(`health_${idx}`, 'health')}>
                      {isBookmarked(`health_${idx}`, 'health') ? STAR_FILLED : STAR_EMPTY}
                    </button>
                  </div>
                  <p className="ug-card-content-desc">{isMl ? item.desc_ml : item.desc}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 8: Common Mistakes */}
        {section === 'mistakes' && (
          <div className="ug-section animate-fade">
            {COMMON_MISTAKES.map((item, idx) => {
              const matchedSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.title_ml.toLowerCase().includes(search.toLowerCase());
              const matchedBookmark = !showBookmarksOnly || isBookmarked(`mistakes_${idx}`, 'mistakes');
              if (!matchedSearch || !matchedBookmark) return null;

              return (
                <div key={idx} className="ug-card mistakes-guidance-card">
                  <div className="ug-card-header">
                    <span className="ug-mistake-icon">{item.icon}</span>
                    <h3 className="ug-mistake-title">{isMl ? item.title_ml : item.title}</h3>
                    <button className="ug-bookmark-btn" onClick={() => toggleBookmark(`mistakes_${idx}`, 'mistakes')}>
                      {isBookmarked(`mistakes_${idx}`, 'mistakes') ? STAR_FILLED : STAR_EMPTY}
                    </button>
                  </div>
                  <p className="ug-card-content-desc">{isMl ? item.desc_ml : item.desc}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 9: Spiritual Preparation */}
        {section === 'spiritual' && (
          <div className="ug-section animate-fade">
            {SPIRITUAL_PREP.map((item, idx) => {
              const matchedSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.title_ml.toLowerCase().includes(search.toLowerCase());
              const matchedBookmark = !showBookmarksOnly || isBookmarked(`spiritual_${idx}`, 'spiritual');
              if (!matchedSearch || !matchedBookmark) return null;

              return (
                <div key={idx} className="ug-card spiritual-prep-card">
                  <div className="ug-card-header">
                    <h3>{isMl ? item.title_ml : item.title}</h3>
                    <button className="ug-bookmark-btn" onClick={() => toggleBookmark(`spiritual_${idx}`, 'spiritual')}>
                      {isBookmarked(`spiritual_${idx}`, 'spiritual') ? STAR_FILLED : STAR_EMPTY}
                    </button>
                  </div>
                  <p className="ug-card-content-desc">{isMl ? item.desc_ml : item.desc}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 10: Miqats */}
        {section === 'miqats' && (
          <div className="ug-section animate-fade">
            {MIQAT_LOCATIONS.map((item, idx) => {
              const matchedSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.name_ml.toLowerCase().includes(search.toLowerCase());
              const matchedBookmark = !showBookmarksOnly || isBookmarked(`miqats_${idx}`, 'miqats');
              if (!matchedSearch || !matchedBookmark) return null;

              return (
                <div key={idx} className="ug-card miqat-card">
                  <div className="ug-card-header">
                    <div className="ug-miqat-meta">
                      <h3>{isMl ? item.name_ml : item.name}</h3>
                      <span className="ug-miqat-distance">{isMl ? item.distance_ml : item.distance}</span>
                    </div>
                    <button className="ug-bookmark-btn" onClick={() => toggleBookmark(`miqats_${idx}`, 'miqats')}>
                      {isBookmarked(`miqats_${idx}`, 'miqats') ? STAR_FILLED : STAR_EMPTY}
                    </button>
                  </div>
                  <p className="ug-card-content-desc">{isMl ? item.desc_ml : item.desc}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 11: Ziyarah Guide */}
        {section === 'ziyarah' && (
          <div className="ug-section animate-fade">
            {ZIYARAH_GUIDE.map((cat, idx) => (
              <div key={idx} className="ug-ziyarah-group">
                <h3 className="ug-ziyarah-group-title">{isMl ? cat.category_ml : cat.category}</h3>
                {cat.sites.map((site, sIdx) => {
                  const matchedSearch = !search || site.title.toLowerCase().includes(search.toLowerCase()) || site.title_ml.toLowerCase().includes(search.toLowerCase());
                  const matchedBookmark = !showBookmarksOnly || isBookmarked(`ziyarah_${idx}_${sIdx}`, 'ziyarah');
                  if (!matchedSearch || !matchedBookmark) return null;

                  return (
                    <div key={sIdx} className="ug-card ziyarah-card">
                      <div className="ug-card-header">
                        <h4>{isMl ? site.title_ml : site.title}</h4>
                        <button className="ug-bookmark-btn" onClick={() => toggleBookmark(`ziyarah_${idx}_${sIdx}`, 'ziyarah')}>
                          {isBookmarked(`ziyarah_${idx}_${sIdx}`, 'ziyarah') ? STAR_FILLED : STAR_EMPTY}
                        </button>
                      </div>
                      <p className="ug-card-content-desc">{isMl ? site.desc_ml : site.desc}</p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

      </div>
      <div style={{ height: 48 }} />
    </div>
  );
}

// Subcomponent: StepCard
function StepCard({ step, completed, onToggle, isBookmarked, onBookmark, lang, isMl }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`ug-step-card ${expanded ? 'expanded' : ''} ${completed ? 'completed' : ''}`}>
      <div className="ug-step-header" onClick={() => setExpanded(!expanded)}>
        <div className="ug-step-icon-bg" style={{ background: step.color }}>{step.icon}</div>
        <div className="ug-step-info">
          <span className="ug-step-index">{isMl ? ML.steps : 'Step'} {step.id}</span>
          <h4 className="ug-step-title">{isMl ? step.title_ml : step.title}</h4>
        </div>
        <div className="ug-step-actions" onClick={e => e.stopPropagation()}>
          <button className="ug-bookmark-btn" onClick={onBookmark}>
            {isBookmarked ? STAR_FILLED : STAR_EMPTY}
          </button>
          <button className={`ug-check-btn ${completed ? 'done' : ''}`} onClick={() => onToggle(step.id)}>
            {completed ? <Icons.CheckIcon /> : <Icons.CircleIcon />}
          </button>
          <span className="ug-chevron-icon" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer', paddingLeft: 8 }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="ug-step-body animate-slide">
          <p className="ug-step-desc">{isMl ? step.description_ml : step.description}</p>
          
          {step.sunnah && (
            <div className="ug-tag-box sunnah">
              <span className="ug-tag-label"><Icons.SunIcon /> {isMl ? ML.sunnah : 'Sunnah'}</span>
              <p>{isMl ? step.sunnah_ml : step.sunnah}</p>
            </div>
          )}
          {step.rules && (
            <div className="ug-tag-box rules">
              <span className="ug-tag-label"><Icons.BookOpenIcon /> {isMl ? ML.rules : 'Rules'}</span>
              <p>{isMl ? step.rules_ml : step.rules}</p>
            </div>
          )}
          {step.mistakes && (
            <div className="ug-tag-box mistakes">
              <span className="ug-tag-label"><Icons.WarningIcon /> {isMl ? ML.avoid : 'Avoid'}</span>
              <p>{isMl ? step.mistakes_ml : step.mistakes}</p>
            </div>
          )}

          {step.duas && step.duas.map((dua, index) => (
            <div key={index} className="ug-step-dua-mini">
              <p className="ug-step-dua-arabic">{dua.arabic}</p>
              <p className="ug-step-dua-trans">{dua.transliteration}</p>
              <p className="ug-step-dua-meaning">"{isMl && dua.meaning_ml ? dua.meaning_ml : dua.meaning}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
