"""Agent 2 regression run after accessibility fixes BUG-009 and BUG-010 (suite v1.0.0 unchanged)."""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
E = "execution/evidence/"
suite = json.loads((ROOT / "test_cases/test_cases.json").read_text())
R = {}
def r(tid, status, actual, ev=(), notes=""):
    R[tid] = {"test_id": tid, "status": status, "actual_result": actual, "evidence": [E + x for x in ev], "notes": notes, "executed_at": "2026-11-11"}
r("UI-A11Y-001", "PASS", "0 visible buttons/links/radios without an accessible name on /, /prayer (incl. Prayer Settings sheet), /qibla, /more, /settings, /quran, /quran/1 (was 13).")
r("UI-A11Y-002", "PASS", "Home keyboard order now includes Quran/Prayer Times/Qibla/Tasbih/Duas/Calendar tiles and Quran/Tasbih/Qibla/More nav (role=link, tabindex 0); Enter on Prayer Times -> /prayer, Enter on More -> /more; Tab shows a 2px focus outline; Space on Zakath Ledger shows the toast without scrolling. More tiles: 5 links + 1 button.",
  ["UI-A11Y-002_RUN4_20261111_focus_ring_zakath_toast.jpg"], notes="Home nav item is aria-current=page and not focusable (current page). Streak capsule left as-is to avoid nesting interactive roles.")
r("UI-DASH-002", "PASS", "Mouse clicks: Quran, Prayer, Qibla, Tasbih, Duas, Calendar tiles route correctly; Home visuals unchanged.", ["UI-DASH-002_RUN4_20261111_home_unchanged.jpg"])
r("UI-NAV-001", "PASS", "Bottom nav Quran/Tasbih/Qibla/More route correctly by click and keyboard; no console errors in a fresh tab.")
r("UI-ZAKAT-001", "PASS", "Click and Space both show 'Coming Soon, In Sha Allah'; stays on /more.")
r("UI-ONB-004", "PASS", "Madhab options are role=radio in a radiogroup; keyboard Space on Hanafi sets aria-checked=true, shows the filled indicator and enables Continue.", ["UI-ONB-004_RUN4_20261111_keyboard_radio.jpg"])
out = [R.get(c["id"], {"test_id": c["id"], "status": "NOT_RUN", "actual_result": "", "evidence": [],
                       "notes": "Outside the scope of this regression; see earlier runs.", "executed_at": "2026-11-11"}) for c in suite["cases"]]
run = {"suite_version": "1.0.0", "suite_sha256": "8e40ba1551913bcf7d99e6726b0d8a123499d04bdab85bf9853f90a638372c5d",
       "run_id": "RUN-2026-11-11-04-REGRESSION",
       "environment": {"app_build": "branch qa/ui-fixes-cycle1 (627c9c1) + fixes BUG-009/010", "platform": "web (hybrid Capacitor app, web layer only)",
                       "browser_device": "Claude desktop built-in Chromium pane, mobile emulation", "viewport": "375x812", "started_at": "2026-11-11 (IST)"},
       "results": out}
(ROOT / "execution/results_run4_regression.json").write_text(json.dumps(run, indent=2, ensure_ascii=False))
print(sum(1 for x in out if x["status"] != "NOT_RUN"), "executed")
