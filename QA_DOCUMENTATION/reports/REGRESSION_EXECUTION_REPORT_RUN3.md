# Test Execution Report

- Suite version: 1.0.0
- Run ID: RUN-2026-11-11-03-REGRESSION
- App build: branch qa/ui-fixes-cycle1 (7c82fc8) + fixes BUG-006/007/008/011
- Platform: web (hybrid Capacitor app, web layer only)

## Summary

| Status | Count |
|---|---:|
| PASS | 11 |
| FAIL | 0 |
| BLOCKED | 0 |
| INCONCLUSIVE | 0 |
| NOT_RUN | 24 |
| SKIPPED | 0 |
| NEEDS_REQUIREMENT_CLARIFICATION | 0 |

## Test results

| Test ID | Status | Actual result | Evidence |
|---|---|---|---|
| UI-ONB-001 | PASS | Fresh data: 'STEP 1 OF 3' and the three location options shown. |  |
| UI-ONB-002 | PASS | 'Kochi' returned 12 results incl. Ernakulam District, Kerala, India; selected. |  |
| UI-ONB-003 | PASS | Step dots are position:static at top 1436px, below the last result card (bottom 1373px); 0 overlaps with the 12 result cards. | execution/evidence/UI-ONB-003_RUN3_20261111_dots_below_results.jpg |
| UI-ONB-004 | PASS | Hanafi selected and Continue advanced; dots also static on step 2. |  |
| UI-ONB-005 | PASS | Female + Complete Setup -> Home with KOCHI. |  |
| UI-ONB-006 | NOT_RUN |  |  |
| UI-DASH-001 | NOT_RUN |  |  |
| UI-DASH-002 | NOT_RUN |  |  |
| UI-NAV-001 | PASS | Onboarding completion routed to Home; reader and Women's Guidance reachable; no console errors in a fresh tab. |  |
| UI-NAV-002 | NOT_RUN |  |  |
| UI-PRAY-001 | NOT_RUN |  |  |
| UI-PRAY-002 | NOT_RUN |  |  |
| UI-QURAN-001 | NOT_RUN |  |  |
| UI-QURAN-002 | PASS | Reading view shows ayahs and translations; Page View shows JUZ 1 / PAGE 1. |  |
| UI-QURAN-003 | PASS | Menu background rgb(255,255,255) (opaque); labels 'Text Size', 'Default', 'Reciter'; nothing shows through. | execution/evidence/UI-QURAN-003_RUN3_20261111_menu_opaque.jpg |
| UI-QURAN-004 | PASS | On phones the trigger is icon-only (54x44) at left 16px; ayah 2 Arabic fully visible in Reading view and Page View text unobstructed in the first viewport. aria-label 'Read mode'. | execution/evidence/UI-QURAN-004_RUN3_20261111_readmode_left_icon.jpg, execution/evidence/UI-QURAN-004_RUN3_20261111_pageview.jpg |
| UI-TASBIH-001 | NOT_RUN |  |  |
| UI-TASBIH-002 | NOT_RUN |  |  |
| UI-QIBLA-001 | NOT_RUN |  |  |
| UI-SET-001 | NOT_RUN |  |  |
| UI-SET-002 | NOT_RUN |  |  |
| UI-SET-003 | NOT_RUN |  |  |
| UI-ASMA-001 | NOT_RUN |  |  |
| UI-ZAKAT-001 | NOT_RUN |  |  |
| UI-WOMEN-001 | PASS | Cycle length min 20, max 45, restored to 28. |  |
| UI-WOMEN-002 | PASS | Tracker header and Gentle Q&A header now on rgb(255,255,255) cards; text readable. | execution/evidence/UI-WOMEN-002_RUN3_20261111_header_cards.jpg |
| UI-HAJJ-001 | NOT_RUN |  |  |
| UI-UMRAH-001 | NOT_RUN |  |  |
| UI-RATHEEB-001 | NOT_RUN |  |  |
| UI-DUAS-001 | NOT_RUN |  |  |
| UI-CAL-001 | NOT_RUN |  |  |
| UI-I18N-001 | NOT_RUN |  |  |
| UI-THEME-001 | NOT_RUN |  |  |
| UI-A11Y-001 | NOT_RUN |  |  |
| UI-A11Y-002 | NOT_RUN |  |  |


Generated from structured results. Confirm evidence and environment before release decisions.