# QA Report — Muslim Plus — Cycle 1 (open: fixes awaiting approval)

**Date:** 2026-11-11 · **Build:** git `7a771a1` plus the uncommitted working tree · **Suite:** v1.0.0 (35 cases, SHA-256 `8e40ba15…372c5d`, frozen read-only)
**Environment:** Vite dev server `localhost:5173`, Chromium in the Claude desktop browser pane, mobile emulation 375×812, local time IST

## Results
| Layer | Result |
|---|---|
| Existing unit/integration tests (`npm test`, node:test) | 160 tests: **156 pass, 0 fail, 4 skipped**. The 4 skipped need a real Django backend (`PHASE1_TEST_PYTHON`). |
| Backend Django tests | **BLOCKED**: `backend/requirements.txt` needs Django 5.2, but the machine has Python 3.9 with Django 4.2. Needs Python ≥3.10 and a venv. |
| Black-box UI suite v1.0.0 | **24 PASS · 11 FAIL** · 0 blocked · 0 not run |

Failures map to 10 defects (`bug_tracking/BUG_REGISTER.md`): 1 HIGH, 5 MEDIUM, 4 LOW. Root causes are in `bug_tracking/AGENT_3_TRIAGE.md`.

**Themes**
1. **CSS cascade:** a global `#root :is(...)` "plain panels" rule in `src/index.css` overrides component styles. It causes BUG-001 and helps cause BUG-004 and BUG-006.
2. **Translations:** `t()` returns the key on a miss, which defeats every `|| 'Fallback'`. 31 keys are missing (BUG-003).
3. **Accessibility:** navigation and tiles are not semantic, and icon buttons have no names (BUG-009, BUG-010).
4. **Functional:** Umrah search is broken (BUG-002).

## Independence note
Agents 1 (design) and 2 (execution) were played by the same model session, in order, without reading source code. Agent 3 read source only after results were recorded. Agents 1 and 2 were not separate instances, so independence is procedural rather than structural.

## Not covered / remaining risk
- **Native iOS/Android were not tested.** That includes notifications, Adhan audio, real geolocation and compass, haptics, in-app review, the VersionHub update popup, and secure storage. A browser pass does not prove native behaviour.
- **Google sign-in and the backend API** were not black-box tested. No sign-in entry point was found in the web UI.
- **Audio playback** (Play Surah, Ratheeb player) was not asserted.
- **Prayer streak / "Did you pray?" prompt** has no test case. It was discovered late and should be added in suite v1.1.
- **Only one viewport (375×812)** was tested. There was no tablet, desktop or landscape pass and no automated contrast audit (axe).
- Timing of the splash/background crossfade looked long (8–15 s), but the pane may have been throttled in the background. **Not reported as a defect.**

## Next actions
1. User approves or rejects each proposed fix (BUG-001 … BUG-010).
2. Agent 3 implements only the approved fixes.
3. Agent 2 re-runs the affected cases plus a broader regression set (below), and `regression_comparator.py` compares the runs.

Regression set after fixes: UI-PRAY-001/002, UI-DASH-001, UI-THEME-001 (BUG-001); UI-UMRAH-001 (BUG-002); UI-QURAN-002/003, UI-I18N-001, UI-NAV-001 (BUG-003); UI-SET-001/002/003 (BUG-004); UI-RATHEEB-001 (BUG-005); UI-WOMEN-001/002 (BUG-006); UI-ONB-002/003/004 (BUG-007); UI-QURAN-002/004 (BUG-008); UI-A11Y-001/002, UI-NAV-001, UI-DASH-002 (BUG-009/010); plus `npm test`.

## Update: fixes and regression (2026-11-11)
The user approved BUG-001 to BUG-005. Files changed:
- `src/index.css`: `#root .prayer-row.active { background: var(--p-accent); }`
- `src/features/umrah/UmrahGuide.jsx`: a `matches()` helper searches title and body text in both languages; a "No results" state was added
- `src/translations.jsx`: added the 31 missing keys plus `notification_schedule_note` to `en` and `ml`
- `src/features/more/SettingsPage.jsx`: the scheduling note is now in a `settings-card` and uses the translation key
- `src/features/ratheeb/RatheebHaddad.css`: the active card tint now sits on an opaque white background

The regression run (RUN-2026-11-11-02) re-ran 13 cases: **12 PASS, 1 FAIL** (UI-QURAN-003; the raw labels are fixed, but the menu is still translucent → new BUG-011). Five earlier failures are resolved. `npm test` still shows 156 pass, 0 fail, 4 skipped, and `vite build --mode device-test` succeeds (production mode was not built; it needs real HTTPS and Google env values). See `reports/REGRESSION_REPORT.md`.
Caveats:
- The UI-RATHEEB-001 verdict comes from computed styles, because the pane was hidden and screenshots were stale.
- The Malayalam strings need review by a native speaker.
- Hot reload caused console errors in the long-lived tab. A fresh tab showed none.
- **Still open:** BUG-006 to BUG-010 (not approved) and BUG-011 (new).

## Update 2: step-2 fixes (2026-11-11)
Fixed:
- BUG-011: the reader menu is opaque (`src/App.css`)
- BUG-006: Women's Guidance section headers sit on cards (`WomensGuidance.css`)
- BUG-007: onboarding dots are in the page flow (`AppOnboarding.css`)
- BUG-008: on phones, Read Mode is a left-docked icon with an aria-label (`AutoScrollControl.css/.jsx`)

RUN-2026-11-11-03 re-ran 11 cases: all PASS. `npm test` shows 156 pass, 0 fail, and the device-test build succeeds.
**Latest status:** 33 of 35 PASS. Still failing: UI-A11Y-001 and UI-A11Y-002 (BUG-009/010).

## Update 3: accessibility fixes (2026-11-11)
- BUG-009: aria-labels were added to the 14 icon-only buttons (Back, Settings, Close, ayah Play).
- BUG-010: a new helper, `src/utils/pressable.js`, gives the bottom nav, Home tiles, More tiles and onboarding options a role, keyboard focus and Enter/Space activation, without changing their look. A focus-visible outline was added in `index.css`. The streak capsule was left alone so interactive roles aren't nested.

RUN-2026-11-11-04 re-ran 6 cases: all PASS. Latest status for suite v1.0.0 is **35 of 35 PASS**. The cycle is closed for the web layer. The remaining risks are listed in CURRENT_RUN_SUMMARY.md.
