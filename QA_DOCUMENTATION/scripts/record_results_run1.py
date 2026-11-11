"""Agent 2 output: execution results for suite v1.0.0, run RUN-2026-11-11-01 (black-box, web build)."""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
E = "execution/evidence/"
T = "2026-11-11"
R = []
def r(tid, status, actual, ev=(), notes=""):
    R.append({"test_id": tid, "status": status, "actual_result": actual, "evidence": [E + x for x in ev], "notes": notes, "executed_at": T})

r("UI-ONB-001", "PASS", "After splash, 'STEP 1 OF 3', 'Use phone location', 'Skip for now', 'Select city manually' visible.")
r("UI-ONB-002", "PASS", "'Searching…' shown (observed with query 'Thrissur'), 'Kochi' returned 12 results incl. Ernakulam District, Kerala, India; selection shows 'Kochi' card with Change + Continue. Empty state 'No cities found…' also observed.",
  notes="Selected-city card shows only 'Kochi' without region, so Kochi (Japan) vs Kochi (India) is indistinguishable after selection – INFO. Duplicate result rows (e.g. 'Watarai, Mie, Japan' twice) – INFO.")
r("UI-ONB-003", "FAIL", "Step-indicator dots render on top of the 2nd result card ('Ernakulam District…'); elementFromPoint at card bottom returns .onboarding-progress, not the card.", ["UI-ONB-003_20261111_dots_overlap_results.jpg"])
r("UI-ONB-004", "PASS", "Continue disabled (disabled=true, opacity .5) before selection; after tapping Hanafi a filled radio shows and Continue enabled.", ["UI-ONB-004_20261111_hanafi_selected.jpg"],
  notes="INFO: step 2 opens with scroll offset from step 1, hiding 'STEP 2 OF 3' and back button until re-layout.")
r("UI-ONB-005", "PASS", "Female + Complete Setup -> Home with 'TODAY'S DATE • KOCHI'.", ["UI-ONB-005_20261111_dashboard_kochi.jpg"])
r("UI-ONB-006", "PASS", "Reload shows Home, not onboarding.")
r("UI-DASH-001", "PASS", "'Wednesday 11 Nov', '1 Jumada II 1448 AH', 'Dhuhr · 12:09 PM'; countdown 00:04:52 -> 00:04:49 after 3 s.")
r("UI-DASH-002", "PASS", "Quran->/quran, Prayer Times->/prayer, Qibla Finder->/qibla, Tasbih->/tasbih, Duas->/duas, Calendar->/calendar.")
r("UI-NAV-001", "PASS", "Home '/', Quran '/quran', Tasbih '/tasbih', Qibla '/qibla', more '/more'; no console errors.",
  notes="Quran, Tasbih and Qibla hide the bottom bar; returning requires Back. Whether Quran (a bottom-nav tab) should hide the bar is NEEDS_REQUIREMENT_CLARIFICATION.")
r("UI-NAV-002", "PASS", "Unknown route renders the Home dashboard (URL unchanged); no crash.")
r("UI-PRAY-001", "FAIL", "Next-prayer row (Dhuhr) renders as an empty white card: label colour rgb(255,255,255) on background rgb(255,255,255). Other rows rgb(45,52,54) on white. Reproduced twice (exploration and execution). Dark mode is not affected.",
  ["UI-PRAY-001_20261111_dhuhr_row_blank.jpg", "UI-PRAY-001_20261111_dhuhr_row_zoom.png"])
r("UI-PRAY-002", "PASS", "Shafi -> Asr 3:30 PM, chip 'Shafi'; Hanafi -> Asr 4:23 PM, chip 'Hanafi'; Hanafi persisted after reload.")
r("UI-QURAN-001", "PASS", "114 suras listed: first 1 Al-Faatiha (7), last 114 An-Naas (6), each with meaning, ayah count, Arabic name.")
r("UI-QURAN-002", "PASS", "Reading view: 7 ayahs with translations; Page View: continuous Arabic with 'JUZ 1' 'PAGE 1'.")
r("UI-QURAN-003", "FAIL", "Options menu heading reads 'A TEXT_SIZE' (raw key). Panel is translucent, the surah title shows through behind 'Automatically play the next Surah'.", ["UI-QURAN-003_20261111_raw_TEXT_SIZE_label.jpg"])
r("UI-QURAN-004", "FAIL", "Floating 'READ MODE' pill (139x44 at 220,668) covers most of ayah 2 Arabic text in the first viewport; in Page View it covers the last line.", ["UI-QURAN-004_20261111_readmode_covers_ayah2.jpg"])
r("UI-TASBIH-001", "PASS", "3 taps -> 3; Reset shows 'Reset Tasbih?' confirmation; confirm -> 0.", ["UI-TASBIH-001_20261111_reset_confirm.jpg"])
r("UI-TASBIH-002", "PASS", "After reload: 'Continue Previous Dhikr? SubhanAllah 3'; Resume -> 3.")
r("UI-QIBLA-001", "PASS", "'Compass Denied – Please allow motion sensors in settings.' with 'Try Again'.",
  notes="No numeric Qibla bearing fallback for devices without a compass even though the city is known – NEEDS_REQUIREMENT_CLARIFICATION. Native compass not testable here.")
r("UI-SET-001", "FAIL", "Notification-scheduling paragraph is rendered directly over the photo background (no opaque ancestor; text rgb(45,52,54)); several lines unreadable over the Quran-stand image. 'Personal Preferences' heading similarly affected.", ["UI-SET-001_20261111_text_over_photo.jpg"])
r("UI-SET-002", "PASS", "Gender -> Male shown immediately and after reload; restored to Female.", notes="INFO: chooser does not mark the current selection.")
r("UI-SET-003", "PASS", "Tap shows native confirm with full warning; Cancel keeps data (36 keys); OK clears data and shows Location Setup. Only default 'prayer_settings' and an empty tracker re-created.", ["UI-SET-003_20261111_onboarding_after_delete.jpg"],
  notes="Confirm is a native window.confirm (the browser pane auto-dismisses it); accepted/declined via script stub. URL stays /settings while onboarding shows – INFO.")
r("UI-ASMA-001", "PASS", "99 names; 'Rahman' -> Ar-Rahman only; 'zzqx' -> 'No results found'.")
r("UI-ZAKAT-001", "PASS", "Toast 'Coming Soon, In Sha Allah'; stays on /more.", ["UI-ZAKAT-001_20261111_coming_soon_toast.jpg"])
r("UI-WOMEN-001", "PASS", "Min 20, max 45 days; restored to 28.")
r("UI-WOMEN-002", "FAIL", "Tracker heading and grey description rgb(99,110,114) sit directly on the photo with no backing surface; description partly unreadable.", ["UI-WOMEN-002_20261111_tracker_text_contrast.png"])
r("UI-HAJJ-001", "PASS", "'0 / 13 steps completed'; 'Spiritual Preparation' expands with niyyah/Sunnah details.")
r("UI-UMRAH-001", "FAIL", "Typing 'Tawaf', 'tawaf' or 'Ihram' removes all content below the tabs; no results and no 'no results' message, although the Introduction text contains 'Tawaf' and there is an 'Ihram' tab. No console errors.", ["UI-UMRAH-001_20261111_search_tawaf_blank.jpg", "UI-UMRAH-001_20261111_search_ihram_blank.jpg"])
r("UI-RATHEEB-001", "FAIL", "Section card background is rgba(191,161,95,0.05) – effectively transparent; Arabic text drawn over the busy photo is hard to read; transliteration rgb(99,110,114) partly hidden behind the audio bar.", ["UI-RATHEEB-001_20261111_arabic_over_photo.jpg"])
r("UI-DUAS-001", "PASS", "Sleeping expands to 'Before Sleeping'/'When Waking Up'; Arabic shown, Show More reveals transliteration, translation and reference; search 'sleep' filters to matching dua.")
r("UI-CAL-001", "PASS", "11 Nov / 1 highlighted; next -> 'Rajab 1448 AH'; previous -> 'Jumada al-akhira 1448 AH'.", ["UI-CAL-001_20261111_today_highlight.jpg"],
  notes="INFO: month named 'Jumada II' on Home and 'Jumada al-akhira' on Calendar.")
r("UI-I18N-001", "FAIL", "Malayalam applied to dashboard and four nav labels, but the fifth nav label stays 'more' (English). Header city 'KOCHI' also stays Latin (acceptable as a proper noun). Switching back restores English.", ["UI-I18N-001_20261111_more_untranslated.png"])
r("UI-THEME-001", "PASS", "body.dark-mode after toggle and after reload; Light Mode button restores light-mode.")
r("UI-A11Y-001", "FAIL", "Unnamed visible buttons: /prayer 2 of 4, /qibla 1 of 2, /more 2 of 2, /settings 1 of 6, /quran/1 7 of 22 (Back, Settings, Close, ayah play buttons). Home has none.")
r("UI-A11Y-002", "FAIL", "Bottom-nav items and feature tiles have no link/button role and no tabindex; keyboard Tab stops after the streak buttons (F D A M I) and never reaches tiles or navigation. Madhab/gender options in onboarding are also non-semantic.", ["UI-A11Y-002_20261111_home_after_dhuhr.jpg"])

run = {"suite_version": "1.0.0", "suite_sha256": "8e40ba1551913bcf7d99e6726b0d8a123499d04bdab85bf9853f90a638372c5d",
       "run_id": "RUN-2026-11-11-01",
       "environment": {"app_build": "git 7a771a1 + uncommitted working tree, vite dev server http://localhost:5173",
                       "platform": "web (hybrid Capacitor app, web layer only)",
                       "browser_device": "Claude desktop built-in Chromium pane, mobile emulation (Android Chrome UA)",
                       "viewport": "375x812", "started_at": "2026-11-11T11:54+05:30 (IST)"},
       "results": R}
(ROOT / "execution/results.json").write_text(json.dumps(run, indent=2, ensure_ascii=False))
print(len(R), "results")
