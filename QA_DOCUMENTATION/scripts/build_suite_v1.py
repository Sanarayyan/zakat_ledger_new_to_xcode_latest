"""Agent 1 output: builds inventory, test_cases.json, coverage map and UI_TEST_CASES.md for suite v1.0.0.
Black-box: everything here was derived from exploring the running web build, not from source code."""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
APP = {"name": "Muslim Plus", "build": "git 7a771a1 + uncommitted working tree (vite dev, web)", "platforms": ["web-mobile-375x812"]}
W = ["web-mobile-375x812"]
FRESH = "Fresh browser profile / app data cleared"
DONE = "Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female"

features = [
    ("FEAT-ONB-001", "Onboarding (location, madhab, gender)", ["Splash", "Location Setup", "Select Madhab", "Personalize Experience"], "high"),
    ("FEAT-DASH-001", "Home dashboard", ["Home"], "high"),
    ("FEAT-NAV-001", "Bottom navigation and routing", ["Bottom nav"], "high"),
    ("FEAT-PRAY-001", "Prayer times", ["Prayer Times"], "high"),
    ("FEAT-PRAY-002", "Prayer settings (location, madhab)", ["Prayer Settings sheet"], "high"),
    ("FEAT-QURAN-001", "Quran sura list", ["Quran"], "high"),
    ("FEAT-QURAN-002", "Quran reader", ["Surah reader", "Reader options menu"], "high"),
    ("FEAT-TASBIH-001", "Tasbih counter", ["Tasbih", "Continue Previous Dhikr dialog"], "medium"),
    ("FEAT-QIBLA-001", "Qibla finder", ["Qibla"], "medium"),
    ("FEAT-MORE-001", "More features hub", ["More Features"], "medium"),
    ("FEAT-SET-001", "Settings and privacy", ["Settings", "Choose Gender dialog"], "high"),
    ("FEAT-ASMA-001", "99 Names of Allah", ["99 Names of Allah"], "low"),
    ("FEAT-ZAKAT-001", "Zakath Ledger (coming soon)", ["More Features"], "low"),
    ("FEAT-WOMEN-001", "Women's Guidance", ["Women's Guidance"], "medium"),
    ("FEAT-HAJJ-001", "Hajj Guide", ["Hajj Guide"], "low"),
    ("FEAT-UMRAH-001", "Umrah Guide", ["Umrah Guide"], "low"),
    ("FEAT-RATHEEB-001", "Ratheeb al-Haddad", ["Ratheeb al-Haddad"], "low"),
    ("FEAT-DUAS-001", "Duas / Dhikr", ["Duas / Dhikr"], "medium"),
    ("FEAT-CAL-001", "Hijri calendar", ["Calendar"], "medium"),
    ("FEAT-I18N-001", "Language switching (English / Malayalam)", ["Home header"], "medium"),
    ("FEAT-THEME-001", "Dark / light mode", ["Home header"], "low"),
    ("FEAT-A11Y-001", "Accessibility semantics", ["All"], "medium"),
]

def c(id, title, feat, pri, typ, pre, steps, exp, data=(), tags=()):
    return {"id": id, "title": title, "feature_id": feat, "priority": pri, "type": typ, "platform": W,
            "preconditions": list(pre), "steps": list(steps), "expected_result": list(exp),
            "test_data": list(data), "tags": list(tags)}

cases = [
    c("UI-ONB-001", "Location step offers three setup options", "FEAT-ONB-001", "P1", "ui", [FRESH],
      ["Open the app root URL", "Wait for the splash screen to finish"],
      ["Step indicator 'STEP 1 OF 3' is shown", "Buttons 'Use phone location', 'Skip for now' and 'Select city manually' are visible"]),
    c("UI-ONB-002", "Manual city search returns selectable results", "FEAT-ONB-001", "P0", "e2e", [FRESH, "Network access to the city-search service"],
      ["On Location Setup tap 'Select city manually'", "Type 'Kochi' into the city field", "Wait up to 6 s", "Tap the result 'Kochi – Ernakulam District, Kerala, India'"],
      ["A 'Searching...' state is shown while loading", "A result list containing 'Ernakulam District, Kerala, India' appears", "After selection a card shows 'Kochi' with a 'Change' action and a 'Continue' button"],
      ["City: Kochi"], ["network"]),
    c("UI-ONB-003", "City result list is not overlapped by the step dots", "FEAT-ONB-001", "P2", "visual", [FRESH],
      ["Perform UI-ONB-002 steps 1-3", "Inspect the result cards near the step-indicator dots"],
      ["No result card text is covered by the pagination/step dots"], ["City: Kochi"], ["layout"]),
    c("UI-ONB-004", "Madhab step requires a selection and marks it", "FEAT-ONB-001", "P1", "ui", [FRESH, "Location step completed"],
      ["Observe the Continue button before selecting", "Tap 'Hanafi'", "Observe options and Continue button"],
      ["Continue appears disabled before a selection", "After tapping, Hanafi shows a filled radio indicator", "Continue becomes enabled"]),
    c("UI-ONB-005", "Completing setup lands on the dashboard with chosen city", "FEAT-ONB-001", "P0", "e2e", [FRESH, "Location and madhab steps completed"],
      ["On 'Personalize Experience' tap 'Female'", "Tap 'Complete Setup'"],
      ["The Home dashboard is displayed", "Header reads 'TODAY'S DATE • KOCHI'"]),
    c("UI-ONB-006", "Onboarding is not repeated after reload", "FEAT-ONB-001", "P1", "e2e", [DONE],
      ["Reload the root URL", "Wait for splash to finish"],
      ["The Home dashboard is shown, not Location Setup"]),
    c("UI-DASH-001", "Dashboard shows dates and next prayer countdown", "FEAT-DASH-001", "P0", "ui", [DONE],
      ["Open Home", "Read the date card", "Wait 3 seconds and re-read the countdown"],
      ["Gregorian date matching the device date is shown", "A Hijri date with 'AH' is shown", "Next prayer name and time are shown", "Countdown value decreases over time"]),
    c("UI-DASH-002", "Dashboard tiles open their features", "FEAT-DASH-001", "P1", "e2e", [DONE],
      ["Tap each tile in turn (Quran, Prayer Times, Qibla Finder, Tasbih, Duas, Calendar), returning Home after each"],
      ["Each tile opens the matching screen (/quran, /prayer, /qibla, /tasbih, /duas, /calendar)"]),
    c("UI-NAV-001", "Bottom navigation routes to each tab", "FEAT-NAV-001", "P0", "e2e", [DONE],
      ["Tap Home, Quran, Tasbih, Qibla, more in the bottom bar (back to Home between full-screen tabs)"],
      ["Each tab opens its screen without errors in the console"]),
    c("UI-NAV-002", "Unknown route does not crash the app", "FEAT-NAV-001", "P3", "ui", [DONE],
      ["Open /this-route-does-not-exist"],
      ["A usable screen (Home or a not-found page) renders; no blank page or error boundary"]),
    c("UI-PRAY-001", "All prayer rows are legible, including the next prayer", "FEAT-PRAY-001", "P1", "visual", [DONE, "Light mode", "Time is before Isha so one row is 'next'"],
      ["Open Prayer Times", "Inspect each of the six rows"],
      ["Rows Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha each show a readable name and time", "The next-prayer row is visually highlighted but its text is readable"],
      tags=["contrast"]),
    c("UI-PRAY-002", "Changing madhab updates Asr and persists", "FEAT-PRAY-002", "P1", "e2e", [DONE],
      ["Open Prayer Times > settings (gear)", "Select 'Shafi', close the sheet, note Asr", "Re-open, select 'Hanafi', close, note Asr", "Reload the page"],
      ["Asr time for Hanafi is later than for Shafi", "Summary chip shows the selected madhab", "Selection survives reload"]),
    c("UI-QURAN-001", "Sura list shows all 114 suras", "FEAT-QURAN-001", "P1", "ui", [DONE],
      ["Open Quran tab", "Scroll to the end of the list"],
      ["First item is 1 Al-Faatiha (7 Ayah)", "Last item is 114 An-Naas", "Each item shows English meaning, ayah count and Arabic name"]),
    c("UI-QURAN-002", "Opening a surah shows ayahs and both view modes work", "FEAT-QURAN-002", "P1", "e2e", [DONE],
      ["Tap Al-Faatiha", "Observe Reading view", "Tap 'Page View'"],
      ["Reading view shows 7 ayahs with translations", "Page View shows continuous Arabic text with Juz/Page markers"]),
    c("UI-QURAN-003", "Reader options menu uses readable labels", "FEAT-QURAN-002", "P2", "ui", [DONE, "A surah is open"],
      ["Tap the ⋮ menu in the reader header"],
      ["Section headings are human-readable text (no raw translation keys such as TEXT_SIZE)", "Menu content is legible over the page behind it"], tags=["i18n"]),
    c("UI-QURAN-004", "Floating Read Mode button does not hide verse text", "FEAT-QURAN-002", "P3", "visual", [DONE, "Al-Faatiha open in Reading view at top"],
      ["Observe the floating 'READ MODE' button position relative to ayah text"],
      ["The floating button does not cover Arabic verse text in the initial viewport"]),
    c("UI-TASBIH-001", "Tapping increments and Reset clears the counter", "FEAT-TASBIH-001", "P1", "e2e", [DONE],
      ["Open Tasbih (choose 'Start New Dhikr' if prompted)", "Tap the bead ring 3 times", "Tap Reset (confirm if asked)"],
      ["Counter shows 3 after three taps", "Counter returns to 0 after Reset"]),
    c("UI-TASBIH-002", "Counter persists and resume prompt appears", "FEAT-TASBIH-001", "P1", "e2e", [DONE],
      ["Open Tasbih, start new, tap 3 times", "Reload and open Tasbih again", "Tap 'Resume'"],
      ["Dialog 'Continue Previous Dhikr?' shows SubhanAllah with count 3", "After Resume the counter shows 3"]),
    c("UI-QIBLA-001", "Missing compass shows a clear recoverable message", "FEAT-QIBLA-001", "P2", "ui", [DONE, "Desktop browser without orientation sensor"],
      ["Open Qibla", "Tap 'Enable Compass'"],
      ["A message explains compass access is unavailable/denied", "A 'Try Again' action is offered"],
      tags=["web-only"]),
    c("UI-SET-001", "Settings text is legible", "FEAT-SET-001", "P2", "visual", [DONE, "Light mode"],
      ["Open more > Settings (gear)", "Read the notification-scheduling paragraph below the privacy card"],
      ["All paragraph text sits on a surface with readable contrast (not directly over the photo background)"], tags=["contrast"]),
    c("UI-SET-002", "Gender preference can be changed and persists", "FEAT-SET-001", "P2", "e2e", [DONE],
      ["Open Settings, tap Gender", "Choose 'Male'", "Reload Settings", "Change back to 'Female'"],
      ["Gender row shows 'Male' after selection and after reload"]),
    c("UI-SET-003", "Delete my app data resets the app after confirmation", "FEAT-SET-001", "P1", "e2e", [DONE, "Run last – destroys local test data"],
      ["Open Settings", "Tap 'Delete my app data'", "Confirm"],
      ["A confirmation is requested before deletion", "After confirming, local data is cleared and onboarding (Location Setup) is shown"],
      tags=["destructive-local"]),
    c("UI-ASMA-001", "99 Names lists 99 entries and search filters", "FEAT-ASMA-001", "P2", "ui", [DONE],
      ["Open more > 99 Names of Allah", "Count cards", "Search 'Rahman'", "Search 'zzqx'"],
      ["99 names are listed", "'Rahman' shows Ar-Rahman", "'zzqx' shows 'No results found'"]),
    c("UI-ZAKAT-001", "Zakath Ledger tile shows coming-soon feedback", "FEAT-ZAKAT-001", "P3", "ui", [DONE],
      ["Open more", "Tap 'Zakath Ledger'"], ["A 'Coming Soon' message is shown and no broken screen opens"]),
    c("UI-WOMEN-001", "Cycle length is clamped to a sane range", "FEAT-WOMEN-001", "P2", "ui", [DONE],
      ["Open Women's Guidance > Tracker", "Press '-' repeatedly", "Press '+' repeatedly", "Restore to 28"],
      ["Value stops at a minimum (observed 20)", "Value stops at a maximum (observed 45)"], tags=["boundary"]),
    c("UI-WOMEN-002", "Women's Guidance tracker text is legible", "FEAT-WOMEN-001", "P3", "visual", [DONE, "Light mode"],
      ["Open Women's Guidance", "Read 'Spiritually Supported Period Tracker' heading and description"],
      ["Heading and description have readable contrast against their background"], tags=["contrast"]),
    c("UI-HAJJ-001", "Hajj guide shows steps and expands a card", "FEAT-HAJJ-001", "P2", "ui", [DONE],
      ["Open more > Hajj Guide", "Tap 'Spiritual Preparation'"], ["'0 / 13 steps completed' shown", "Card expands to show details"]),
    c("UI-UMRAH-001", "Umrah guide search filters content", "FEAT-UMRAH-001", "P3", "ui", [DONE],
      ["Open more > Umrah Guide", "Type 'Tawaf' in search"], ["Results related to Tawaf are shown"]),
    c("UI-RATHEEB-001", "Ratheeb sections are legible", "FEAT-RATHEEB-001", "P2", "visual", [DONE, "Light mode"],
      ["Open more > Ratheeb al-Haddad", "Read section #1 Arabic and transliteration"],
      ["Arabic and transliteration text is readable against its background"], tags=["contrast"]),
    c("UI-DUAS-001", "Dua category expands to show duas", "FEAT-DUAS-001", "P2", "ui", [DONE],
      ["Open Duas", "Tap 'Sleeping'", "Search 'sleep'"], ["Two sleeping duas with Arabic and translation appear", "Search returns matching duas"]),
    c("UI-CAL-001", "Calendar highlights today and navigates months", "FEAT-CAL-001", "P2", "ui", [DONE],
      ["Open Calendar", "Tap next month arrow", "Tap previous month arrow"],
      ["Today (11 Nov / 1 Jumada al-akhira) is highlighted", "Header changes to the next Hijri month and back"]),
    c("UI-I18N-001", "Malayalam translates the dashboard including navigation", "FEAT-I18N-001", "P2", "ui", [DONE],
      ["On Home choose 'മലയാളം' in the language selector", "Read header, cards and bottom navigation", "Switch back to English"],
      ["Dashboard texts and all bottom-nav labels are in Malayalam", "Switching back restores English"], tags=["i18n"]),
    c("UI-THEME-001", "Dark mode toggles and persists", "FEAT-THEME-001", "P2", "ui", [DONE],
      ["Tap the moon icon on Home", "Reload", "Tap the sun icon"],
      ["Dark theme applied", "Dark theme persists after reload", "Light theme restored"]),
    c("UI-A11Y-001", "Icon-only buttons have accessible names", "FEAT-A11Y-001", "P2", "accessibility", [DONE],
      ["Inspect the accessibility tree on Prayer Times, Qibla, More and Settings headers"],
      ["Every button exposes a non-empty accessible name (e.g. Back, Settings)"], tags=["a11y"]),
    c("UI-A11Y-002", "Primary navigation is reachable by assistive tech", "FEAT-A11Y-001", "P2", "accessibility", [DONE],
      ["Inspect the accessibility tree on Home and More", "Tab through the page with the keyboard"],
      ["Bottom-nav items and feature tiles are exposed as links/buttons", "They are reachable by keyboard focus"], tags=["a11y"]),
]

suite = {"suite_version": "1.0.0", "app": APP, "cases": cases}
(ROOT / "test_cases/test_cases.json").write_text(json.dumps(suite, indent=2, ensure_ascii=False))
inv = {"app": APP["name"], "build": APP["build"], "features": [{"id": i, "name": n, "screens": s, "criticality": k} for i, n, s, k in features],
       "not_discovered_or_out_of_scope": [
           "Google sign-in (mentioned in Settings privacy text; no sign-in entry found in the web UI)",
           "Native-only: push notifications, Adhan playback, haptics, real compass/geolocation, in-app review, VersionHub update popup",
           "Backend API (Django) – covered only by existing automated tests, not black-box"]}
(ROOT / "inventory/screen_inventory.json").write_text(json.dumps(inv, indent=2, ensure_ascii=False))
cov = {}
for x in cases: cov.setdefault(x["feature_id"], []).append(x["id"])
(ROOT / "test_cases/coverage_map.json").write_text(json.dumps(cov, indent=2))

md = [f"# UI Test Cases – {APP['name']} – suite v{suite['suite_version']}", "", f"Build: {APP['build']}  ", f"Platform: {', '.join(W)}", ""]
for x in cases:
    md += [f"## {x['id']} – {x['title']}", f"Feature `{x['feature_id']}` · {x['priority']} · {x['type']}", "",
           "**Preconditions:** " + "; ".join(x["preconditions"]), "", "**Steps**"]
    md += [f"{n}. {s}" for n, s in enumerate(x["steps"], 1)]
    md += ["", "**Expected**"] + [f"- {e}" for e in x["expected_result"]]
    if x["test_data"]: md += ["", "**Data:** " + ", ".join(x["test_data"])]
    md.append("")
(ROOT / "test_cases/UI_TEST_CASES.md").write_text("\n".join(md))
print(len(cases), "cases")
