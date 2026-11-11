# Agent 3 Triage — RUN-2026-11-11-01

Read-only analysis. No files changed. Each fix waits for explicit user approval.

## BUG-001: next prayer row is white on white
- Evidence: computed colour `rgb(255,255,255)` on `rgb(255,255,255)`, plus a screenshot.
- Cascade: `src/index.css:155` `#root :is(.dash-date-card, …, .prayer-row, …) { background: var(--bg-card); }` has specificity (1,1,0) in `:is()`. It beats `src/features/prayer/PrayerTimes.css:329` `.prayer-row.active { background: var(--p-accent); }` (0,2,0). `PrayerTimes.css:342-344` still sets the label and time to `#fff`.
- Fix (1 line, `src/index.css`, right after the block): `#root .prayer-row.active { background: var(--p-accent); }`
- Blast radius: Prayer Times only. Check light mode, dark mode and the theme variants (`PrayerTimes.css:13-49` defines per-theme `--p-accent`).

## BUG-002: Umrah search
- `src/features/umrah/UmrahGuide.jsx:218, 242, 266, 296, 319, 387, 410, 434, 457, 486`: each tab filters only `title`/`title_ml` and only renders the active `section`. No empty state.
- Fix: a helper `matches(item)` that checks the title plus the body/description fields. Render a "No results" message when a section has no matches. Product decision: should search span all tabs?

## BUG-003: missing translation keys (31)
`t()` in `src/LanguageContext.jsx:26-28` returns `key` on a miss. Used but undefined:
event_notifications, get_notified_events_desc (CalendarPage); back, tasbih_history, set_goal, environment (TasbihCounter); share_not_supported (DuasPage); tab_display, tab_text, tab_audio, select_theme, reading_view, reading_view_desc, font_size, show_translation, translation_desc, show_transliteration, transliteration_desc (ReadingSettingsModal); more (Dashboard); search_surah, bookmark_removed, session_marked_complete, removed_from_favorites, added_to_favorites, text_size, default, reciter, page, play_juz, previous, next (App.jsx).
- Fix A (recommended): add these keys to `en` and `ml` in `src/translations.jsx`. Malayalam needs review by a native speaker.
- Fix B (alternative): change `t` to fall back to `TRANSLATIONS.en[key]`. This alone doesn't fix keys missing from `en`, so A is still needed.

## BUG-004: Settings paragraph
- `src/features/more/SettingsPage.jsx:125` is a bare `<p>` with hard-coded English. `index.css:143-148` makes `.settings-root` transparent.
- Fix: wrap it in `<section className="settings-card" style={{ padding: 16 }}>…</section>`. Optionally move the text to a key such as `notification_schedule_note`.

## BUG-005: Ratheeb active card
- `src/features/ratheeb/RatheebHaddad.css:273-274` uses an 8 % gold tint as the whole background.
- Fix: `background: linear-gradient(rgba(212,175,55,.08), rgba(212,175,55,.08)), #ffffff;`. The dark-theme override at :282 is unchanged.

## BUG-006: Women's tracker header
- `.tracker-header` (`src/features/more/WomensGuidance.jsx:1211`) has no surface. Fix: add a card background to `.tracker-header` in the Women's Guidance CSS.

## BUG-007: onboarding dots overlap
- `src/components/onboarding/AppOnboarding.css:311-317` uses absolute positioning. Fix: add `padding-bottom: 96px` to the step container, or hide `.onboarding-progress` while the city results are open.

## BUG-008: READ MODE pill
- `src/features/quran/AutoScrollControl.jsx:156`. Fix: add reader bottom padding of at least the pill height plus margin.

## BUG-009 / BUG-010: accessibility
- Add `aria-label={t('back')}` etc. to icon buttons in Prayer Times, Qibla, More, Settings and the Quran reader (13 found).
- Convert bottom-nav items, dashboard tiles, More tiles and onboarding options to `<button type="button">` or router `<Link>`. Reset button styles to keep the visuals. This needs visual regression on Home and More.

## Security / migrations
None of the fixes touch the backend, schema, dependencies or storage format.
