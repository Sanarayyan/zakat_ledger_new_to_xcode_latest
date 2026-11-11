"""Agent 2 regression run after fixes BUG-006, 007, 008, 011 (suite v1.0.0 unchanged)."""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
E = "execution/evidence/"
suite = json.loads((ROOT / "test_cases/test_cases.json").read_text())
R = {}
def r(tid, status, actual, ev=(), notes=""):
    R[tid] = {"test_id": tid, "status": status, "actual_result": actual, "evidence": [E + x for x in ev], "notes": notes, "executed_at": "2026-11-11"}

r("UI-ONB-001", "PASS", "Fresh data: 'STEP 1 OF 3' and the three location options shown.")
r("UI-ONB-002", "PASS", "'Kochi' returned 12 results incl. Ernakulam District, Kerala, India; selected.")
r("UI-ONB-003", "PASS", "Step dots are position:static at top 1436px, below the last result card (bottom 1373px); 0 overlaps with the 12 result cards.", ["UI-ONB-003_RUN3_20261111_dots_below_results.jpg"])
r("UI-ONB-004", "PASS", "Hanafi selected and Continue advanced; dots also static on step 2.")
r("UI-ONB-005", "PASS", "Female + Complete Setup -> Home with KOCHI.")
r("UI-QURAN-002", "PASS", "Reading view shows ayahs and translations; Page View shows JUZ 1 / PAGE 1.")
r("UI-QURAN-003", "PASS", "Menu background rgb(255,255,255) (opaque); labels 'Text Size', 'Default', 'Reciter'; nothing shows through.", ["UI-QURAN-003_RUN3_20261111_menu_opaque.jpg"])
r("UI-QURAN-004", "PASS", "On phones the trigger is icon-only (54x44) at left 16px; ayah 2 Arabic fully visible in Reading view and Page View text unobstructed in the first viewport. aria-label 'Read mode'.",
  ["UI-QURAN-004_RUN3_20261111_readmode_left_icon.jpg", "UI-QURAN-004_RUN3_20261111_pageview.jpg"],
  notes="A fixed button can still overlap text while scrolling; the case only asserts the initial viewport.")
r("UI-WOMEN-001", "PASS", "Cycle length min 20, max 45, restored to 28.")
r("UI-WOMEN-002", "PASS", "Tracker header and Gentle Q&A header now on rgb(255,255,255) cards; text readable.", ["UI-WOMEN-002_RUN3_20261111_header_cards.jpg"])
r("UI-NAV-001", "PASS", "Onboarding completion routed to Home; reader and Women's Guidance reachable; no console errors in a fresh tab.")

out = [R.get(c["id"], {"test_id": c["id"], "status": "NOT_RUN", "actual_result": "", "evidence": [],
                       "notes": "Outside the scope of this regression; see RUN-2026-11-11-01/02.", "executed_at": "2026-11-11"})
       for c in suite["cases"]]
run = {"suite_version": "1.0.0", "suite_sha256": "8e40ba1551913bcf7d99e6726b0d8a123499d04bdab85bf9853f90a638372c5d",
       "run_id": "RUN-2026-11-11-03-REGRESSION",
       "environment": {"app_build": "branch qa/ui-fixes-cycle1 (7c82fc8) + fixes BUG-006/007/008/011", "platform": "web (hybrid Capacitor app, web layer only)",
                       "browser_device": "Claude desktop built-in Chromium pane, mobile emulation", "viewport": "375x812", "started_at": "2026-11-11 (IST)"},
       "results": out}
(ROOT / "execution/results_run3_regression.json").write_text(json.dumps(run, indent=2, ensure_ascii=False))
print(sum(1 for x in out if x["status"] != "NOT_RUN"), "executed")
