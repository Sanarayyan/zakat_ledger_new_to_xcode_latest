import { readStoredJSON } from '../../services/storedJson.mjs';
import { appStorage } from '../../services/appStorage';
import * as Icons from '../../components/IconLibrary';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HajjGuide.css';
import { useLanguage } from '../../LanguageContext';
import { HAJJ_STEPS, HAJJ_TYPES, ESSENTIAL_DUAS, CHECKLIST, COMMON_MISTAKES, WOMENS_GUIDANCE } from './hajjData';

const BACK = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;

const ML = {
  title: 'ഹജ്ജ് മാർഗ്ഗദർശിക',
  heroTitle: 'നിങ്ങളുടെ പവിത്ര യാത്ര',
  heroSub: 'ഹജ്ജിനുള്ള ഘട്ടം ഘട്ടമായുള്ള സഹായി',
  ayahRef: 'ഖുർആൻ 22:27',
  stepsCompleted: (d, t) => `${d} / ${t} ഘട്ടങ്ങൾ പൂർത്തിയായി`,
  journeyIntro: 'ഓരോ ഘട്ടവും ക്രമത്തിൽ പൂർത്തിയാക്കുക. വിശദാംശങ്ങൾ, ദുആകൾ, നിയമങ്ങൾ എന്നിവ കാണാൻ കാർഡ് തൊടുക.',
  sunnah: 'സുന്നത്ത്',
  rules: 'നിയമങ്ങൾ',
  avoid: 'ഒഴിവാക്കുക',
  steps: 'ഘട്ടങ്ങൾ',
  for: 'ആർക്ക്',
  advantage: 'ഗുണം',
  sacrifice: 'ബലി',
  copied: 'പകർത്തി',
  itemsPacked: (c, t) => `${c} / ${t} വസ്തുക്കൾ ഒരുക്കി`,
  womenNote: 'ഇനിപ്പറയുന്ന മാർഗ്ഗനിർദ്ദേശങ്ങൾ മുഖ്യധാരാ പണ്ഡിത അഭിപ്രായത്തെ അടിസ്ഥാനമാക്കിയുള്ളതാണ്. നിങ്ങളുടെ പ്രത്യേക സ്ഥിതിക്ക് ഒരു വിശ്വസ്ത പണ്ഡിതനെ സമീപിക്കുക.',
  sections: {
    journey: 'യാത്ര', types: 'തരങ്ങൾ', duas: 'ദുആകൾ',
    checklist: 'പട്ടിക', women: 'സ്ത്രീകൾ', mistakes: 'തെറ്റുകൾ',
  },
  checklistCats: {
    'Documents': 'രേഖകൾ', 'Ihram Essentials': 'ഇഹ്റാം അവശ്യസാധനങ്ങൾ',
    'Clothing': 'വസ്ത്രങ്ങൾ', 'Medicines': 'മരുന്നുകൾ',
    'Spiritual Items': 'ആത്മീയ വസ്തുക്കൾ', 'Electronics': 'ഇലക്ട്രോണിക്സ്',
  },
};

const SECTIONS = [
  { id:'journey', icon:<Icons.KaabaIcon />, en:'Journey',   ml:ML.sections.journey  },
  { id:'types',   icon:<Icons.BookIcon />, en:'Types',     ml:ML.sections.types    },
  { id:'duas',    icon:<Icons.HandsPrayIcon />, en:'Duas',      ml:ML.sections.duas     },
  { id:'checklist',icon:<Icons.CheckIcon />,en:'Checklist', ml:ML.sections.checklist},
  { id:'women',   icon:<Icons.SparkleIcon />, en:"Women's",   ml:ML.sections.women    },
  { id:'mistakes',icon:<Icons.WarningIcon />,en:'Mistakes',  ml:ML.sections.mistakes },
];

function StepCard({ step, completed, onToggle, lang }) {
  const [open, setOpen] = useState(false);
  const isMl = lang === 'ml';
  return (
    <div className={`hg-step-card ${open?'expanded':''} ${completed?'completed':''}`}>
      <div className="hg-step-header" onClick={() => setOpen(!open)}>
        <div className="hg-step-num" style={{background:step.color}}>{step.icon}</div>
        <div className="hg-step-info">
          <div className="hg-step-day">{isMl && step.day_ml ? step.day_ml : step.day}</div>
          <div className="hg-step-title">{isMl && step.title_ml ? step.title_ml : step.title}</div>
        </div>
        <div className="hg-step-right">
          <button className={`hg-check-btn ${completed?'done':''}`} onClick={e=>{e.stopPropagation();onToggle(step.id);}}>
            {completed ? <Icons.CheckIcon /> : <Icons.CircleIcon />}
          </button>
          <span className="hg-chevron">{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="hg-step-body">
          <p className="hg-step-desc">{isMl && step.description_ml ? step.description_ml : step.description}</p>
          {step.sunnah && <div className="hg-tag-block sunnah"><span className="hg-tag"><Icons.SparkleIcon /> {isMl ? ML.sunnah : 'Sunnah'}</span><p>{isMl && step.sunnah_ml ? step.sunnah_ml : step.sunnah}</p></div>}
          {step.rules  && <div className="hg-tag-block rules"><span className="hg-tag"><Icons.DocumentIcon /> {isMl ? ML.rules : 'Rules'}</span><p>{isMl && step.rules_ml ? step.rules_ml : step.rules}</p></div>}
          {step.mistakes && <div className="hg-tag-block mistakes"><span className="hg-tag"><Icons.WarningIcon /> {isMl ? ML.avoid : 'Avoid'}</span><p>{isMl && step.mistakes_ml ? step.mistakes_ml : step.mistakes}</p></div>}
          {step.duas?.map((d,i) => (
            <div key={i} className="hg-dua-mini">
              <div className="hg-dua-arabic">{d.arabic}</div>
              <div className="hg-dua-trans">{d.transliteration}</div>
              <div className="hg-dua-meaning">"{isMl && d.meaning_ml ? d.meaning_ml : d.meaning}"</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TypesSection({ lang }) {
  const [active, setActive] = useState('tamattu');
  const type = HAJJ_TYPES.find(t => t.id === active);
  const isMl = lang === 'ml';
  return (
    <div className="hg-section">
      <div className="hg-types-tabs">
        {HAJJ_TYPES.map(t => (
          <button key={t.id} className={`hg-type-tab ${active===t.id?'active':''}`}
            style={active===t.id?{borderColor:t.color,color:t.color}:{}}
            onClick={() => setActive(t.id)}>
            {isMl && t.name_ml ? t.name_ml : t.name.replace('Hajj al-','')}
            {t.popular && <span className="hg-popular-badge">★</span>}
          </button>
        ))}
      </div>
      {type && (
        <div className="hg-type-card" style={{borderColor:type.color+'44'}}>
          <div className="hg-type-name" style={{color:type.color}}>{type.arabic}</div>
          <h3>{isMl && type.name_ml ? type.name_ml : type.name}</h3>
          <p>{isMl && type.description_ml ? type.description_ml : type.description}</p>
          <div className="hg-type-grid">
            <div className="hg-type-item"><span><Icons.FaceIcon /> {isMl ? ML.for : 'For'}</span><p>{isMl && type.who_ml ? type.who_ml : type.who}</p></div>
            <div className="hg-type-item"><span><Icons.CheckIcon /> {isMl ? ML.advantage : 'Advantage'}</span><p>{isMl && type.advantage_ml ? type.advantage_ml : type.advantage}</p></div>
            <div className="hg-type-item"><span><Icons.SheepIcon /> {isMl ? ML.sacrifice : 'Sacrifice'}</span><p>{isMl && type.sacrifice_ml ? type.sacrifice_ml : type.sacrifice}</p></div>
          </div>
          <div className="hg-type-steps">
            <div className="hg-tag">{isMl ? ML.steps : 'Steps'}</div>
            {(isMl && type.steps_ml ? type.steps_ml : type.steps).map((s,i) => (
              <div key={i} className="hg-type-step"><span>{i+1}</span>{s}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DuasSection({ lang }) {
  const [copied, setCopied] = useState(null);
  const isMl = lang === 'ml';
  const copy = (d) => {
    navigator.clipboard?.writeText(`${d.arabic}\n${d.transliteration}\n${d.meaning}`);
    setCopied(d.id); setTimeout(() => setCopied(null), 2000);
  };
  const cats = [...new Set(ESSENTIAL_DUAS.map(d => d.category))];
  const [cat, setCat] = useState(cats[0]);
  const filtered = ESSENTIAL_DUAS.filter(d => d.category === cat);
  return (
    <div className="hg-section">
      <div className="hg-cat-tabs">
        {cats.map(c => (
          <button key={c} className={`hg-cat-tab ${cat===c?'active':''}`} onClick={() => setCat(c)}>
            {isMl && ESSENTIAL_DUAS.find(d=>d.category===c)?.category_ml || c}
          </button>
        ))}
      </div>
      {filtered.map(d => (
        <div key={d.id} className="hg-dua-card">
          <div className="hg-dua-top">
            <span className="hg-dua-title">{isMl && d.title_ml ? d.title_ml : d.title}</span>
            <button className="hg-copy-btn" onClick={() => copy(d)}>{copied===d.id ? <><Icons.CheckIcon /> {isMl ? ML.copied : 'Copied'}</> : <Icons.CopyIcon />}</button>
          </div>
          <div className="hg-dua-arabic-lg">{d.arabic}</div>
          <div className="hg-dua-trans-lg">{d.transliteration}</div>
          <div className="hg-dua-meaning-lg">"{isMl && d.meaning_ml ? d.meaning_ml : d.meaning}"</div>
        </div>
      ))}
    </div>
  );
}

function ChecklistSection({ lang }) {
  const isMl = lang === 'ml';
  const [checked, setChecked] = useState(() => {
    return readStoredJSON(appStorage, 'hajj_checklist', {});
  });
  const toggle = (key) => setChecked(prev => {
    const next = {...prev, [key]: !prev[key]};
    appStorage.setItem('hajj_checklist', JSON.stringify(next)); return next;
  });
  const total = CHECKLIST.reduce((s,c) => s+c.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;
  return (
    <div className="hg-section">
      <div className="hg-progress-bar-wrap">
        <div className="hg-progress-label">{isMl ? ML.itemsPacked(done,total) : `${done} / ${total} items packed`}</div>
        <div className="hg-progress-bar"><div className="hg-progress-fill" style={{width:`${(done/total)*100}%`}}/></div>
      </div>
      {CHECKLIST.map(cat => (
        <div key={cat.category} className="hg-checklist-cat">
          <div className="hg-checklist-cat-title">{cat.icon} {isMl && ML.checklistCats[cat.category] ? ML.checklistCats[cat.category] : cat.category}</div>
          {(isMl && cat.items_ml ? cat.items_ml : cat.items).map((item, idx) => {
            const key = `${cat.category}::${cat.items[idx] || item}`;
            return (
              <div key={key} className={`hg-check-item ${checked[key]?'done':''}`} onClick={() => toggle(key)}>
                <span className="hg-check-box">{checked[key]?<Icons.CheckIcon />:''}</span>
                <span>{item}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function WomensSection({ lang }) {
  const [open, setOpen] = useState(null);
  const isMl = lang === 'ml';
  return (
    <div className="hg-section">
      <div className="hg-info-banner">
        <span><Icons.FlowerIcon /></span>
        <p>{isMl ? ML.womenNote : 'The following guidance is based on mainstream scholarly opinion. Please consult a trusted scholar for your specific situation.'}</p>
      </div>
      {WOMENS_GUIDANCE.map((item, i) => (
        <div key={i} className="hg-women-card">
          <div className="hg-women-header" onClick={() => setOpen(open===i?null:i)}>
            <span>{isMl && item.title_ml ? item.title_ml : item.title}</span>
            <span>{open===i?'▲':'▼'}</span>
          </div>
          {open===i && <p className="hg-women-body">{isMl && item.content_ml ? item.content_ml : item.content}</p>}
        </div>
      ))}
    </div>
  );
}

function MistakesSection({ lang }) {
  const isMl = lang === 'ml';
  return (
    <div className="hg-section">
      {COMMON_MISTAKES.map((m, i) => (
        <div key={i} className="hg-mistake-card">
          <span className="hg-mistake-icon">{m.icon}</span>
          <div>
            <div className="hg-mistake-title">{isMl && m.title_ml ? m.title_ml : m.title}</div>
            <p className="hg-mistake-desc">{isMl && m.desc_ml ? m.desc_ml : m.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HajjGuide() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const isMl = lang === 'ml';
  const [section, setSection] = useState('journey');
  const [completed, setCompleted] = useState(() => {
    return readStoredJSON(appStorage, 'hajj_steps_done', []);
  });
  const toggleStep = (id) => setCompleted(prev => {
    const next = prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id];
    appStorage.setItem('hajj_steps_done', JSON.stringify(next)); return next;
  });

  const userGender = appStorage.getItem('userGender');
  const isMale = userGender?.toLowerCase() === 'male';
  const filteredSections = isMale ? SECTIONS.filter(s => s.id !== 'women') : SECTIONS;

  return (
    <div className="hg-root">
      <div className="hg-header">
        <button className="hg-back-btn" onClick={() => navigate(-1)}>{BACK}</button>
        <h1 className="hg-title">{isMl ? ML.title : 'Hajj Guide'}</h1>
        <div style={{width:24}}/>
      </div>

      <div className="hg-hero">
        <div className="hg-hero-kaaba"><Icons.KaabaIcon /></div>
        <h2 className="hg-hero-title">{isMl ? ML.heroTitle : 'Your Sacred Journey'}</h2>
        <p className="hg-hero-sub">{isMl ? ML.heroSub : 'Step-by-step companion for Hajj'}</p>
        <div className="hg-hero-ayah">
          <p className="hg-ayah-arabic">وَأَذِّن فِي النَّاسِ بِالْحَجِّ يَأْتُوكَ رِجَالًا</p>
          <p className="hg-ayah-ref">{isMl ? ML.ayahRef : 'Quran 22:27'}</p>
        </div>
        {section === 'journey' && (
          <div className="hg-hero-progress">
            <span>{isMl ? ML.stepsCompleted(completed.length, HAJJ_STEPS.length) : `${completed.length} / ${HAJJ_STEPS.length} steps completed`}</span>
            <div className="hg-progress-bar"><div className="hg-progress-fill" style={{width:`${(completed.length/HAJJ_STEPS.length)*100}%`}}/></div>
          </div>
        )}
      </div>

      <div className="hg-nav-tabs">
        {filteredSections.map(s => (
          <button key={s.id} className={`hg-nav-tab ${section===s.id?'active':''}`} onClick={() => setSection(s.id)}>
            <span className="hg-nav-icon">{s.icon}</span>
            <span className="hg-nav-label">{isMl ? s.ml : s.en}</span>
          </button>
        ))}
      </div>

      <div className="hg-content">
        {section==='journey' && (
          <div className="hg-section">
            <div className="hg-section-intro">
              <p>{isMl ? ML.journeyIntro : 'Complete each step in order. Tap a card to expand details, duas, and rules.'}</p>
            </div>
            {HAJJ_STEPS.map((step,idx) => (
              <StepCard key={step.id} step={step} idx={idx} lang={lang} completed={completed.includes(step.id)} onToggle={toggleStep}/>
            ))}
          </div>
        )}
        {section==='types' && <TypesSection lang={lang}/>}
        {section==='duas' && <DuasSection lang={lang}/>}
        {section==='checklist' && <ChecklistSection lang={lang}/>}
        {section==='women' && <WomensSection lang={lang}/>}
        {section==='mistakes' && <MistakesSection lang={lang}/>}
      </div>
      <div style={{height:32}}/>
    </div>
  );
}
