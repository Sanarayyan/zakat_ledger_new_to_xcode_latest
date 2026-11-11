# Test Execution Report

- Suite version: 1.0.0
- Run ID: RUN-2026-11-11-02-REGRESSION
- App build: git 7a771a1 + working tree + fixes BUG-001..005
- Platform: web (hybrid Capacitor app, web layer only)

## Summary

| Status | Count |
|---|---:|
| PASS | 12 |
| FAIL | 1 |
| BLOCKED | 0 |
| INCONCLUSIVE | 0 |
| NOT_RUN | 22 |
| SKIPPED | 0 |
| NEEDS_REQUIREMENT_CLARIFICATION | 0 |

## Test results

| Test ID | Status | Actual result | Evidence |
|---|---|---|---|
| UI-ONB-001 | NOT_RUN |  |  |
| UI-ONB-002 | NOT_RUN |  |  |
| UI-ONB-003 | NOT_RUN |  |  |
| UI-ONB-004 | NOT_RUN |  |  |
| UI-ONB-005 | NOT_RUN |  |  |
| UI-ONB-006 | NOT_RUN |  |  |
| UI-DASH-001 | PASS | Date/Hijri shown; next prayer 'Asr · 4:23 PM'; countdown 03:54:17 -> 03:54:14. |  |
| UI-DASH-002 | NOT_RUN |  |  |
| UI-NAV-001 | PASS | Quran /quran, Tasbih /tasbih, Qibla /qibla, More /more; fresh tab has no console errors. |  |
| UI-NAV-002 | NOT_RUN |  |  |
| UI-PRAY-001 | PASS | Next prayer (Asr) row: background rgb(180,83,9), text rgb(255,255,255); all six rows readable. Dark mode also checked: same accent row, readable. | execution/evidence/UI-PRAY-001_RUN2_20261111_asr_row_fixed.jpg |
| UI-PRAY-002 | PASS | Shafi -> Asr 3:30 PM; Hanafi -> Asr 4:23 PM; Hanafi chip persisted after reload. |  |
| UI-QURAN-001 | NOT_RUN |  |  |
| UI-QURAN-002 | PASS | Reader opens Al-Faatiha in Reading view with ayahs and translations (Page View not re-toggled; component untouched). |  |
| UI-QURAN-003 | FAIL | Labels now readable: 'Text Size', 'Default', 'Reciter' (no raw keys). Second assertion still fails: the menu panel is translucent and the surah title shows through behind 'Automatically play the next Surah'. | execution/evidence/UI-QURAN-003_RUN2_20261111_menu_labels_translucent.jpg |
| UI-QURAN-004 | NOT_RUN |  |  |
| UI-TASBIH-001 | NOT_RUN |  |  |
| UI-TASBIH-002 | NOT_RUN |  |  |
| UI-QIBLA-001 | NOT_RUN |  |  |
| UI-SET-001 | PASS | Paragraph now inside SECTION.settings-card, background rgb(255,255,255), text rgb(45,52,54). | execution/evidence/UI-SET-001_RUN2_20261111_paragraph_in_card.jpg |
| UI-SET-002 | PASS | Gender row renders with current value ('Prefer not to say') after the Settings edit. |  |
| UI-SET-003 | PASS | Confirm shown; Cancel kept data (25 keys); OK cleared data and showed Location Setup; only defaults re-created; no console errors. |  |
| UI-ASMA-001 | NOT_RUN |  |  |
| UI-ZAKAT-001 | NOT_RUN |  |  |
| UI-WOMEN-001 | NOT_RUN |  |  |
| UI-WOMEN-002 | NOT_RUN |  |  |
| UI-HAJJ-001 | NOT_RUN |  |  |
| UI-UMRAH-001 | PASS | 'Tawaf' in Introduction shows 'What is Umrah?' (body text match); 'zzqx' shows 'No results found in this section'. |  |
| UI-RATHEEB-001 | PASS | Active section card computes background-color rgb(255,255,255) with the 8% gold tint layered on top; text no longer sits on the wallpaper. |  |
| UI-DUAS-001 | NOT_RUN |  |  |
| UI-CAL-001 | NOT_RUN |  |  |
| UI-I18N-001 | PASS | Malayalam bottom nav: ഹോം, ഖുർആൻ, തസ്ബീഹ്, ഖിബ്‌ല, കൂടുതൽ; English nav 'More'. Switching back restores English. | execution/evidence/UI-I18N-001_RUN2_20261111_malayalam_nav.jpg |
| UI-THEME-001 | PASS | dark-mode applied and persisted across reload; Light Mode restored light-mode. |  |
| UI-A11Y-001 | NOT_RUN |  |  |
| UI-A11Y-002 | NOT_RUN |  |  |


Generated from structured results. Confirm evidence and environment before release decisions.