# Test Execution Report

- Suite version: 1.0.0
- Run ID: RUN-2026-11-11-04-REGRESSION
- App build: branch qa/ui-fixes-cycle1 (627c9c1) + fixes BUG-009/010
- Platform: web (hybrid Capacitor app, web layer only)

## Summary

| Status | Count |
|---|---:|
| PASS | 6 |
| FAIL | 0 |
| BLOCKED | 0 |
| INCONCLUSIVE | 0 |
| NOT_RUN | 29 |
| SKIPPED | 0 |
| NEEDS_REQUIREMENT_CLARIFICATION | 0 |

## Test results

| Test ID | Status | Actual result | Evidence |
|---|---|---|---|
| UI-ONB-001 | NOT_RUN |  |  |
| UI-ONB-002 | NOT_RUN |  |  |
| UI-ONB-003 | NOT_RUN |  |  |
| UI-ONB-004 | PASS | Madhab options are role=radio in a radiogroup; keyboard Space on Hanafi sets aria-checked=true, shows the filled indicator and enables Continue. | execution/evidence/UI-ONB-004_RUN4_20261111_keyboard_radio.jpg |
| UI-ONB-005 | NOT_RUN |  |  |
| UI-ONB-006 | NOT_RUN |  |  |
| UI-DASH-001 | NOT_RUN |  |  |
| UI-DASH-002 | PASS | Mouse clicks: Quran, Prayer, Qibla, Tasbih, Duas, Calendar tiles route correctly; Home visuals unchanged. | execution/evidence/UI-DASH-002_RUN4_20261111_home_unchanged.jpg |
| UI-NAV-001 | PASS | Bottom nav Quran/Tasbih/Qibla/More route correctly by click and keyboard; no console errors in a fresh tab. |  |
| UI-NAV-002 | NOT_RUN |  |  |
| UI-PRAY-001 | NOT_RUN |  |  |
| UI-PRAY-002 | NOT_RUN |  |  |
| UI-QURAN-001 | NOT_RUN |  |  |
| UI-QURAN-002 | NOT_RUN |  |  |
| UI-QURAN-003 | NOT_RUN |  |  |
| UI-QURAN-004 | NOT_RUN |  |  |
| UI-TASBIH-001 | NOT_RUN |  |  |
| UI-TASBIH-002 | NOT_RUN |  |  |
| UI-QIBLA-001 | NOT_RUN |  |  |
| UI-SET-001 | NOT_RUN |  |  |
| UI-SET-002 | NOT_RUN |  |  |
| UI-SET-003 | NOT_RUN |  |  |
| UI-ASMA-001 | NOT_RUN |  |  |
| UI-ZAKAT-001 | PASS | Click and Space both show 'Coming Soon, In Sha Allah'; stays on /more. |  |
| UI-WOMEN-001 | NOT_RUN |  |  |
| UI-WOMEN-002 | NOT_RUN |  |  |
| UI-HAJJ-001 | NOT_RUN |  |  |
| UI-UMRAH-001 | NOT_RUN |  |  |
| UI-RATHEEB-001 | NOT_RUN |  |  |
| UI-DUAS-001 | NOT_RUN |  |  |
| UI-CAL-001 | NOT_RUN |  |  |
| UI-I18N-001 | NOT_RUN |  |  |
| UI-THEME-001 | NOT_RUN |  |  |
| UI-A11Y-001 | PASS | 0 visible buttons/links/radios without an accessible name on /, /prayer (incl. Prayer Settings sheet), /qibla, /more, /settings, /quran, /quran/1 (was 13). |  |
| UI-A11Y-002 | PASS | Home keyboard order now includes Quran/Prayer Times/Qibla/Tasbih/Duas/Calendar tiles and Quran/Tasbih/Qibla/More nav (role=link, tabindex 0); Enter on Prayer Times -> /prayer, Enter on More -> /more; Tab shows a 2px focus outline; Space on Zakath Ledger shows the toast without scrolling. More tiles: 5 links + 1 button. | execution/evidence/UI-A11Y-002_RUN4_20261111_focus_ring_zakath_toast.jpg |


Generated from structured results. Confirm evidence and environment before release decisions.