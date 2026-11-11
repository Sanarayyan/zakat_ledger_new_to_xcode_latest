"""Agent 2 regression run after approved fixes BUG-001..005 (suite v1.0.0 unchanged)."""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
E = "execution/evidence/"
suite = json.loads((ROOT / "test_cases/test_cases.json").read_text())
R = {}
def r(tid, status, actual, ev=(), notes=""):
    R[tid] = {"test_id": tid, "status": status, "actual_result": actual, "evidence": [E + x for x in ev], "notes": notes, "executed_at": "2026-11-11"}

r("UI-PRAY-001", "PASS", "Next prayer (Asr) row: background rgb(180,83,9), text rgb(255,255,255); all six rows readable. Dark mode also checked: same accent row, readable.", ["UI-PRAY-001_RUN2_20261111_asr_row_fixed.jpg"])
r("UI-PRAY-002", "PASS", "Shafi -> Asr 3:30 PM; Hanafi -> Asr 4:23 PM; Hanafi chip persisted after reload.")
r("UI-DASH-001", "PASS", "Date/Hijri shown; next prayer 'Asr · 4:23 PM'; countdown 03:54:17 -> 03:54:14.")
r("UI-NAV-001", "PASS", "Quran /quran, Tasbih /tasbih, Qibla /qibla, More /more; fresh tab has no console errors.",
  notes="Console errors (createRoot twice / removeChild in Dashboard) appeared only in the original tab after Vite hot-reload of edited files; not reproduced on a clean load.")
r("UI-THEME-001", "PASS", "dark-mode applied and persisted across reload; Light Mode restored light-mode.")
r("UI-UMRAH-001", "PASS", "'Tawaf' in Introduction shows 'What is Umrah?' (body text match); 'zzqx' shows 'No results found in this section'.")
r("UI-QURAN-002", "PASS", "Reader opens Al-Faatiha in Reading view with ayahs and translations (Page View not re-toggled; component untouched).")
r("UI-QURAN-003", "FAIL", "Labels now readable: 'Text Size', 'Default', 'Reciter' (no raw keys). Second assertion still fails: the menu panel is translucent and the surah title shows through behind 'Automatically play the next Surah'.",
  ["UI-QURAN-003_RUN2_20261111_menu_labels_translucent.jpg"], notes="Raw-key part fixed by BUG-003; translucency logged as new BUG-011 (not in approved scope).")
r("UI-I18N-001", "PASS", "Malayalam bottom nav: ഹോം, ഖുർആൻ, തസ്ബീഹ്, ഖിബ്‌ല, കൂടുതൽ; English nav 'More'. Switching back restores English.", ["UI-I18N-001_RUN2_20261111_malayalam_nav.jpg"],
  notes="New Malayalam strings need native-speaker review.")
r("UI-SET-001", "PASS", "Paragraph now inside SECTION.settings-card, background rgb(255,255,255), text rgb(45,52,54).", ["UI-SET-001_RUN2_20261111_paragraph_in_card.jpg"])
r("UI-SET-002", "PASS", "Gender row renders with current value ('Prefer not to say') after the Settings edit.", notes="Value set by the user's earlier skip of onboarding; change/persist flow not repeated.")
r("UI-SET-003", "PASS", "Confirm shown; Cancel kept data (25 keys); OK cleared data and showed Location Setup; only defaults re-created; no console errors.")
r("UI-RATHEEB-001", "PASS", "Active section card computes background-color rgb(255,255,255) with the 8% gold tint layered on top; text no longer sits on the wallpaper.",
  notes="Browser pane was hidden, so the screenshot is stale; verdict is from computed styles and elementFromPoint (card is the top element).")

out = []
for c in suite["cases"]:
    out.append(R.get(c["id"], {"test_id": c["id"], "status": "NOT_RUN", "actual_result": "", "evidence": [],
                               "notes": "Outside the regression scope for BUG-001..005; see RUN-2026-11-11-01.", "executed_at": "2026-11-11"}))
run = {"suite_version": "1.0.0", "suite_sha256": "8e40ba1551913bcf7d99e6726b0d8a123499d04bdab85bf9853f90a638372c5d",
       "run_id": "RUN-2026-11-11-02-REGRESSION",
       "environment": {"app_build": "git 7a771a1 + working tree + fixes BUG-001..005", "platform": "web (hybrid Capacitor app, web layer only)",
                       "browser_device": "Claude desktop built-in Chromium pane, mobile emulation", "viewport": "375x812", "started_at": "2026-11-11 (IST)"},
       "results": out}
(ROOT / "execution/results_run2_regression.json").write_text(json.dumps(run, indent=2, ensure_ascii=False))
print(sum(1 for x in out if x["status"] != "NOT_RUN"), "executed")
