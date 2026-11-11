# Bug Register — Muslim Plus (suite v1.0.0, run RUN-2026-11-11-01)

## Status after approval (2026-11-11)
| ID | Status | Verified by |
|---|---|---|
| BUG-001 | **FIXED, regression PASS** | UI-PRAY-001/002, UI-THEME-001, UI-DASH-001 (RUN-2026-11-11-02) |
| BUG-002 | **FIXED, regression PASS** | UI-UMRAH-001 |
| BUG-003 | **FIXED, regression PASS**; Malayalam strings need native review | UI-I18N-001 PASS; UI-QURAN-003 labels fixed, but that case still FAILs because of BUG-011 |
| BUG-004 | **FIXED, regression PASS**; text moved to key `notification_schedule_note` (en + ml) | UI-SET-001/002/003 |
| BUG-005 | **FIXED, regression PASS** (computed-style evidence; pane was hidden) | UI-RATHEEB-001 |
| BUG-006 | **FIXED, regression PASS** (`.tracker-header`/`.subview-header` get a card surface) | UI-WOMEN-001/002 (RUN-2026-11-11-03) |
| BUG-007 | **FIXED, regression PASS** (dots in flow inside the scrolling onboarding viewport) | UI-ONB-001..005 |
| BUG-008 | **FIXED, regression PASS** (phones: icon-only trigger docked left; `aria-label="Read mode"`) | UI-QURAN-002/004 |
| BUG-009 | **FIXED, regression PASS** (aria-labels on Back/Settings/Close/ayah Play buttons) | UI-A11Y-001 (RUN-2026-11-11-04) |
| BUG-010 | **FIXED, regression PASS** (`src/utils/pressable.js`: role, tabindex, Enter/Space on nav, tiles and onboarding radios; focus-visible outline in `index.css`) | UI-A11Y-002, UI-DASH-002, UI-NAV-001, UI-ZAKAT-001, UI-ONB-004 |
| BUG-011 | **FIXED, regression PASS** (`.premium-settings-menu` background `var(--bg-card)`, `App.css`) | UI-QURAN-003 |

The original proposals for each bug are kept below.

| ID | Sev | Tests | Summary | Root cause (Agent 3) | Proposed fix | Risk |
|---|---|---|---|---|---|---|
| BUG-001 | HIGH | UI-PRAY-001 | Next-prayer row on Prayer Times is a blank white card (light mode) | `src/index.css:155-161` `#root :is(... .prayer-row ...) { background: var(--bg-card) }` has ID specificity and beats `.prayer-row.active { background: var(--p-accent) }` (`PrayerTimes.css:329`). Text stays `#fff` → white on white. Dark mode hides it because `--bg-card` is dark. | Add `#root .prayer-row.active { background: var(--p-accent); }` after the rule in `index.css` | Very low; one selector |
| BUG-002 | MEDIUM | UI-UMRAH-001 | Umrah search blanks all content for any query; no "no results" message | `src/features/umrah/UmrahGuide.jsx:218-486` filters only item **titles** of the **active tab**; Introduction titles don't contain "Tawaf"/"Ihram". Nothing renders when all items are filtered out. | Match title **and body** text; show an empty-state message when nothing matches. Optional: search across all tabs | Low; one component |
| BUG-003 | MEDIUM | UI-QURAN-003, UI-I18N-001 | Raw keys shown: "TEXT_SIZE" in reader menu, "more" in bottom nav (both languages) | `LanguageContext.jsx:26` `t(key)` returns the **key** when missing, so every `t('x') \|\| 'Fallback'` never falls back. **31 keys** are used but not defined in `src/translations.jsx` (list in `AGENT_3_TRIAGE.md`). | Add the 31 keys to `en` and `ml` in `translations.jsx` (Malayalam strings need a native reviewer) | Low; data only |
| BUG-004 | MEDIUM | UI-SET-001 | Settings notification paragraph is unreadable over the wallpaper | `SettingsPage.jsx:125` is a bare `<p>` outside any card; `index.css:143-148` makes `.settings-root` transparent. The text is also hard-coded English. | Wrap it in `<section className="settings-card" style={{padding:16}}>` and move the text to a translation key | Low |
| BUG-005 | MEDIUM | UI-RATHEEB-001 | Ratheeb active section text unreadable over the wallpaper | `RatheebHaddad.css:273-274` `.rh-dhikr-card.active-reading { background: rgba(212,175,55,0.08) }` replaces the white card background with an 8 % tint | Use `background: linear-gradient(rgba(212,175,55,.08),rgba(212,175,55,.08)), #fff;` (and keep the dark-theme override) | Very low |
| BUG-006 | LOW | UI-WOMEN-002 | Women's Guidance tracker heading and description sit directly on the photo | `.tracker-header` (`WomensGuidance.jsx:1211`) has no background, and `index.css` makes `.womens-guidance-root` transparent | Give `.tracker-header` a card background (or a readable text-shadow) | Very low |
| BUG-007 | LOW | UI-ONB-003 | Onboarding step dots overlap the city search results | `AppOnboarding.css:311` `.onboarding-progress { position:absolute; bottom:40px; z-index:10 }` floats over scrollable content | Add bottom padding to the step content equal to the dots' area, or hide the dots while results are open | Low |
| BUG-008 | LOW | UI-QURAN-004 | Floating READ MODE pill covers ayah text | `features/quran/AutoScrollControl.jsx:156`: a fixed pill with no matching padding in the reader | Add bottom padding to the reader list, or shrink the pill to an icon until scrolled | Low |
| BUG-009 | MEDIUM | UI-A11Y-001 | 13 icon-only buttons have no accessible name (Back, Settings, Close, ayah Play) | Icon-only `<button>` elements with no `aria-label` | Add `aria-label`s (via `t()`) | Very low |
| BUG-010 | MEDIUM | UI-A11Y-002 | Bottom nav, feature tiles and onboarding options can't be used with a keyboard or screen reader | They're `div`s with `onClick`, with no role and no tabindex | Convert them to `<button>`/`<Link>` (or add `role` + `tabIndex` + key handlers) | Medium: touches the shared nav and tile styling, so it needs visual regression testing |

## Observations (not defects / need product decision)
- NEEDS_REQUIREMENT_CLARIFICATION: Quran, Tasbih and Qibla hide the bottom nav, even though Quran is a nav tab.
- NEEDS_REQUIREMENT_CLARIFICATION: Qibla shows only "Compass Denied" when there is no compass sensor. It could also show the numeric bearing for the known city.
- INFO: after selection, the city card shows only "Kochi", with no region, so the Japanese and Indian Kochi look the same. The result list also contains duplicate rows.
- INFO: Home calls the month "Jumada II", while Calendar calls it "Jumada al-akhira".
- INFO: the gender chooser doesn't mark the current selection.
- INFO: after "Delete my app data", the URL stays `/settings` while onboarding is shown.
- INFO: dashboard "Did you pray Fajr?" streak prompt was discovered during execution; it isn't covered by suite v1.0.0 and should be added in v1.1.
