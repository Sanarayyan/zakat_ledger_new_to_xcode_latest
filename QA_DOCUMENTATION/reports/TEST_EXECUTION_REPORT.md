# Test Execution Report

- Suite version: 1.0.0
- Run ID: RUN-2026-11-11-01
- App build: git 7a771a1 + uncommitted working tree, vite dev server http://localhost:5173
- Platform: web (hybrid Capacitor app, web layer only)

## Summary

| Status | Count |
|---|---:|
| PASS | 24 |
| FAIL | 11 |
| BLOCKED | 0 |
| INCONCLUSIVE | 0 |
| NOT_RUN | 0 |
| SKIPPED | 0 |
| NEEDS_REQUIREMENT_CLARIFICATION | 0 |

## Test results

| Test ID | Status | Actual result | Evidence |
|---|---|---|---|
| UI-ONB-001 | PASS | After splash, 'STEP 1 OF 3', 'Use phone location', 'Skip for now', 'Select city manually' visible. |  |
| UI-ONB-002 | PASS | 'Searching…' shown (observed with query 'Thrissur'), 'Kochi' returned 12 results incl. Ernakulam District, Kerala, India; selection shows 'Kochi' card with Change + Continue. Empty state 'No cities found…' also observed. |  |
| UI-ONB-003 | FAIL | Step-indicator dots render on top of the 2nd result card ('Ernakulam District…'); elementFromPoint at card bottom returns .onboarding-progress, not the card. | execution/evidence/UI-ONB-003_20261111_dots_overlap_results.jpg |
| UI-ONB-004 | PASS | Continue disabled (disabled=true, opacity .5) before selection; after tapping Hanafi a filled radio shows and Continue enabled. | execution/evidence/UI-ONB-004_20261111_hanafi_selected.jpg |
| UI-ONB-005 | PASS | Female + Complete Setup -> Home with 'TODAY'S DATE • KOCHI'. | execution/evidence/UI-ONB-005_20261111_dashboard_kochi.jpg |
| UI-ONB-006 | PASS | Reload shows Home, not onboarding. |  |
| UI-DASH-001 | PASS | 'Wednesday 11 Nov', '1 Jumada II 1448 AH', 'Dhuhr · 12:09 PM'; countdown 00:04:52 -> 00:04:49 after 3 s. |  |
| UI-DASH-002 | PASS | Quran->/quran, Prayer Times->/prayer, Qibla Finder->/qibla, Tasbih->/tasbih, Duas->/duas, Calendar->/calendar. |  |
| UI-NAV-001 | PASS | Home '/', Quran '/quran', Tasbih '/tasbih', Qibla '/qibla', more '/more'; no console errors. |  |
| UI-NAV-002 | PASS | Unknown route renders the Home dashboard (URL unchanged); no crash. |  |
| UI-PRAY-001 | FAIL | Next-prayer row (Dhuhr) renders as an empty white card: label colour rgb(255,255,255) on background rgb(255,255,255). Other rows rgb(45,52,54) on white. Reproduced twice (exploration and execution). Dark mode is not affected. | execution/evidence/UI-PRAY-001_20261111_dhuhr_row_blank.jpg, execution/evidence/UI-PRAY-001_20261111_dhuhr_row_zoom.png |
| UI-PRAY-002 | PASS | Shafi -> Asr 3:30 PM, chip 'Shafi'; Hanafi -> Asr 4:23 PM, chip 'Hanafi'; Hanafi persisted after reload. |  |
| UI-QURAN-001 | PASS | 114 suras listed: first 1 Al-Faatiha (7), last 114 An-Naas (6), each with meaning, ayah count, Arabic name. |  |
| UI-QURAN-002 | PASS | Reading view: 7 ayahs with translations; Page View: continuous Arabic with 'JUZ 1' 'PAGE 1'. |  |
| UI-QURAN-003 | FAIL | Options menu heading reads 'A TEXT_SIZE' (raw key). Panel is translucent, the surah title shows through behind 'Automatically play the next Surah'. | execution/evidence/UI-QURAN-003_20261111_raw_TEXT_SIZE_label.jpg |
| UI-QURAN-004 | FAIL | Floating 'READ MODE' pill (139x44 at 220,668) covers most of ayah 2 Arabic text in the first viewport; in Page View it covers the last line. | execution/evidence/UI-QURAN-004_20261111_readmode_covers_ayah2.jpg |
| UI-TASBIH-001 | PASS | 3 taps -> 3; Reset shows 'Reset Tasbih?' confirmation; confirm -> 0. | execution/evidence/UI-TASBIH-001_20261111_reset_confirm.jpg |
| UI-TASBIH-002 | PASS | After reload: 'Continue Previous Dhikr? SubhanAllah 3'; Resume -> 3. |  |
| UI-QIBLA-001 | PASS | 'Compass Denied – Please allow motion sensors in settings.' with 'Try Again'. |  |
| UI-SET-001 | FAIL | Notification-scheduling paragraph is rendered directly over the photo background (no opaque ancestor; text rgb(45,52,54)); several lines unreadable over the Quran-stand image. 'Personal Preferences' heading similarly affected. | execution/evidence/UI-SET-001_20261111_text_over_photo.jpg |
| UI-SET-002 | PASS | Gender -> Male shown immediately and after reload; restored to Female. |  |
| UI-SET-003 | PASS | Tap shows native confirm with full warning; Cancel keeps data (36 keys); OK clears data and shows Location Setup. Only default 'prayer_settings' and an empty tracker re-created. | execution/evidence/UI-SET-003_20261111_onboarding_after_delete.jpg |
| UI-ASMA-001 | PASS | 99 names; 'Rahman' -> Ar-Rahman only; 'zzqx' -> 'No results found'. |  |
| UI-ZAKAT-001 | PASS | Toast 'Coming Soon, In Sha Allah'; stays on /more. | execution/evidence/UI-ZAKAT-001_20261111_coming_soon_toast.jpg |
| UI-WOMEN-001 | PASS | Min 20, max 45 days; restored to 28. |  |
| UI-WOMEN-002 | FAIL | Tracker heading and grey description rgb(99,110,114) sit directly on the photo with no backing surface; description partly unreadable. | execution/evidence/UI-WOMEN-002_20261111_tracker_text_contrast.png |
| UI-HAJJ-001 | PASS | '0 / 13 steps completed'; 'Spiritual Preparation' expands with niyyah/Sunnah details. |  |
| UI-UMRAH-001 | FAIL | Typing 'Tawaf', 'tawaf' or 'Ihram' removes all content below the tabs; no results and no 'no results' message, although the Introduction text contains 'Tawaf' and there is an 'Ihram' tab. No console errors. | execution/evidence/UI-UMRAH-001_20261111_search_tawaf_blank.jpg, execution/evidence/UI-UMRAH-001_20261111_search_ihram_blank.jpg |
| UI-RATHEEB-001 | FAIL | Section card background is rgba(191,161,95,0.05) – effectively transparent; Arabic text drawn over the busy photo is hard to read; transliteration rgb(99,110,114) partly hidden behind the audio bar. | execution/evidence/UI-RATHEEB-001_20261111_arabic_over_photo.jpg |
| UI-DUAS-001 | PASS | Sleeping expands to 'Before Sleeping'/'When Waking Up'; Arabic shown, Show More reveals transliteration, translation and reference; search 'sleep' filters to matching dua. |  |
| UI-CAL-001 | PASS | 11 Nov / 1 highlighted; next -> 'Rajab 1448 AH'; previous -> 'Jumada al-akhira 1448 AH'. | execution/evidence/UI-CAL-001_20261111_today_highlight.jpg |
| UI-I18N-001 | FAIL | Malayalam applied to dashboard and four nav labels, but the fifth nav label stays 'more' (English). Header city 'KOCHI' also stays Latin (acceptable as a proper noun). Switching back restores English. | execution/evidence/UI-I18N-001_20261111_more_untranslated.png |
| UI-THEME-001 | PASS | body.dark-mode after toggle and after reload; Light Mode button restores light-mode. |  |
| UI-A11Y-001 | FAIL | Unnamed visible buttons: /prayer 2 of 4, /qibla 1 of 2, /more 2 of 2, /settings 1 of 6, /quran/1 7 of 22 (Back, Settings, Close, ayah play buttons). Home has none. |  |
| UI-A11Y-002 | FAIL | Bottom-nav items and feature tiles have no link/button role and no tabindex; keyboard Tab stops after the streak buttons (F D A M I) and never reaches tiles or navigation. Madhab/gender options in onboarding are also non-semantic. | execution/evidence/UI-A11Y-002_20261111_home_after_dhuhr.jpg |


Generated from structured results. Confirm evidence and environment before release decisions.