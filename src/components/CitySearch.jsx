import React, { useEffect, useId, useRef, useState } from 'react';
import { createLatestRequest } from '../services/latestRequest.mjs';
import { searchCities } from '../services/citySearch.mjs';
import { useLanguage } from '../LanguageContext';
import './CitySearch.css';

export default function CitySearch({ onSelect, disabled = false }) {
    const { lang } = useLanguage();
    const inputId = useId();
    const request = useRef(null);
    if (!request.current) request.current = createLatestRequest(7000);
    const [query, setQuery] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [results, setResults] = useState([]);
    const [status, setStatus] = useState('idle');
    const ml = lang === 'ml';

    useEffect(() => {
        if (query.trim().length < 2) return;
        const timer = setTimeout(async () => {
            try {
                const result = await request.current.run(signal => searchCities(query, { signal, language: lang }));
                if (!result) return;
                setResults(result.value);
                setStatus(result.value.length ? 'ready' : 'empty');
            } catch {
                setStatus('error');
            }
        }, 250);
        return () => {
            clearTimeout(timer);
            request.current.cancel();
        };
    }, [query, attempt, lang]);

    return (
        <div className="city-search">
            <label htmlFor={inputId}>{ml ? 'നഗരം അല്ലെങ്കിൽ പട്ടണം' : 'City or town'}</label>
            <input id={inputId} type="search" autoComplete="off" value={query} disabled={disabled}
                aria-describedby={`${inputId}-hint`}
                placeholder={ml ? 'ഉദാ. കൊച്ചി' : 'e.g. Kochi or New Delhi'}
                onChange={event => {
                    request.current.cancel();
                    const value = event.target.value;
                    setQuery(value);
                    setResults([]);
                    setStatus(value.trim().length >= 2 ? 'loading' : 'idle');
                }} />
            <small id={`${inputId}-hint`}>{ml ? 'നഗരത്തിന്റെ പേര് നൽകി പട്ടികയിൽ നിന്ന് തിരഞ്ഞെടുക്കുക.' : 'Enter your city name, then pick the matching region from the results.'}</small>
            <div role="status">
                {status === 'loading' && (ml ? 'തിരയുന്നു…' : 'Searching…')}
                {status === 'empty' && (ml ? 'നഗരം കണ്ടെത്തിയില്ല. അടുത്തുള്ള പട്ടണം തിരയുക.' : 'No cities found. Check the spelling or try a nearby town.')}
                {status === 'error' && (ml ? 'തിരയൽ ലഭ്യമല്ല. ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക.' : 'City search is unavailable. Check your internet connection.')}
            </div>
            {status === 'error' && <button type="button" disabled={disabled} onClick={() => {
                setStatus('loading');
                setAttempt(value => value + 1);
            }}>{ml ? 'വീണ്ടും ശ്രമിക്കുക' : 'Retry search'}</button>}
            {status === 'ready' && <ul aria-label={ml ? 'നഗരങ്ങൾ' : 'Matching cities'}>
                {results.map(({ id, region, ...location }) => <li key={id ?? `${location.lat},${location.lng}`}>
                    <button type="button" disabled={disabled} onClick={() => onSelect(location)}>
                        <strong>{location.city}</strong>{region && <small>{region}</small>}
                    </button>
                </li>)}
            </ul>}
            <small>Open-Meteo / GeoNames</small>
        </div>
    );
}
