# UI Test Cases – Muslim Plus – suite v1.0.0

Build: git 7a771a1 + uncommitted working tree (vite dev, web)  
Platform: web-mobile-375x812

## UI-ONB-001 – Location step offers three setup options
Feature `FEAT-ONB-001` · P1 · ui

**Preconditions:** Fresh browser profile / app data cleared

**Steps**
1. Open the app root URL
2. Wait for the splash screen to finish

**Expected**
- Step indicator 'STEP 1 OF 3' is shown
- Buttons 'Use phone location', 'Skip for now' and 'Select city manually' are visible

## UI-ONB-002 – Manual city search returns selectable results
Feature `FEAT-ONB-001` · P0 · e2e

**Preconditions:** Fresh browser profile / app data cleared; Network access to the city-search service

**Steps**
1. On Location Setup tap 'Select city manually'
2. Type 'Kochi' into the city field
3. Wait up to 6 s
4. Tap the result 'Kochi – Ernakulam District, Kerala, India'

**Expected**
- A 'Searching...' state is shown while loading
- A result list containing 'Ernakulam District, Kerala, India' appears
- After selection a card shows 'Kochi' with a 'Change' action and a 'Continue' button

**Data:** City: Kochi

## UI-ONB-003 – City result list is not overlapped by the step dots
Feature `FEAT-ONB-001` · P2 · visual

**Preconditions:** Fresh browser profile / app data cleared

**Steps**
1. Perform UI-ONB-002 steps 1-3
2. Inspect the result cards near the step-indicator dots

**Expected**
- No result card text is covered by the pagination/step dots

**Data:** City: Kochi

## UI-ONB-004 – Madhab step requires a selection and marks it
Feature `FEAT-ONB-001` · P1 · ui

**Preconditions:** Fresh browser profile / app data cleared; Location step completed

**Steps**
1. Observe the Continue button before selecting
2. Tap 'Hanafi'
3. Observe options and Continue button

**Expected**
- Continue appears disabled before a selection
- After tapping, Hanafi shows a filled radio indicator
- Continue becomes enabled

## UI-ONB-005 – Completing setup lands on the dashboard with chosen city
Feature `FEAT-ONB-001` · P0 · e2e

**Preconditions:** Fresh browser profile / app data cleared; Location and madhab steps completed

**Steps**
1. On 'Personalize Experience' tap 'Female'
2. Tap 'Complete Setup'

**Expected**
- The Home dashboard is displayed
- Header reads 'TODAY'S DATE • KOCHI'

## UI-ONB-006 – Onboarding is not repeated after reload
Feature `FEAT-ONB-001` · P1 · e2e

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Reload the root URL
2. Wait for splash to finish

**Expected**
- The Home dashboard is shown, not Location Setup

## UI-DASH-001 – Dashboard shows dates and next prayer countdown
Feature `FEAT-DASH-001` · P0 · ui

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Open Home
2. Read the date card
3. Wait 3 seconds and re-read the countdown

**Expected**
- Gregorian date matching the device date is shown
- A Hijri date with 'AH' is shown
- Next prayer name and time are shown
- Countdown value decreases over time

## UI-DASH-002 – Dashboard tiles open their features
Feature `FEAT-DASH-001` · P1 · e2e

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Tap each tile in turn (Quran, Prayer Times, Qibla Finder, Tasbih, Duas, Calendar), returning Home after each

**Expected**
- Each tile opens the matching screen (/quran, /prayer, /qibla, /tasbih, /duas, /calendar)

## UI-NAV-001 – Bottom navigation routes to each tab
Feature `FEAT-NAV-001` · P0 · e2e

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Tap Home, Quran, Tasbih, Qibla, more in the bottom bar (back to Home between full-screen tabs)

**Expected**
- Each tab opens its screen without errors in the console

## UI-NAV-002 – Unknown route does not crash the app
Feature `FEAT-NAV-001` · P3 · ui

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Open /this-route-does-not-exist

**Expected**
- A usable screen (Home or a not-found page) renders; no blank page or error boundary

## UI-PRAY-001 – All prayer rows are legible, including the next prayer
Feature `FEAT-PRAY-001` · P1 · visual

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female; Light mode; Time is before Isha so one row is 'next'

**Steps**
1. Open Prayer Times
2. Inspect each of the six rows

**Expected**
- Rows Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha each show a readable name and time
- The next-prayer row is visually highlighted but its text is readable

## UI-PRAY-002 – Changing madhab updates Asr and persists
Feature `FEAT-PRAY-002` · P1 · e2e

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Open Prayer Times > settings (gear)
2. Select 'Shafi', close the sheet, note Asr
3. Re-open, select 'Hanafi', close, note Asr
4. Reload the page

**Expected**
- Asr time for Hanafi is later than for Shafi
- Summary chip shows the selected madhab
- Selection survives reload

## UI-QURAN-001 – Sura list shows all 114 suras
Feature `FEAT-QURAN-001` · P1 · ui

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Open Quran tab
2. Scroll to the end of the list

**Expected**
- First item is 1 Al-Faatiha (7 Ayah)
- Last item is 114 An-Naas
- Each item shows English meaning, ayah count and Arabic name

## UI-QURAN-002 – Opening a surah shows ayahs and both view modes work
Feature `FEAT-QURAN-002` · P1 · e2e

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Tap Al-Faatiha
2. Observe Reading view
3. Tap 'Page View'

**Expected**
- Reading view shows 7 ayahs with translations
- Page View shows continuous Arabic text with Juz/Page markers

## UI-QURAN-003 – Reader options menu uses readable labels
Feature `FEAT-QURAN-002` · P2 · ui

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female; A surah is open

**Steps**
1. Tap the ⋮ menu in the reader header

**Expected**
- Section headings are human-readable text (no raw translation keys such as TEXT_SIZE)
- Menu content is legible over the page behind it

## UI-QURAN-004 – Floating Read Mode button does not hide verse text
Feature `FEAT-QURAN-002` · P3 · visual

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female; Al-Faatiha open in Reading view at top

**Steps**
1. Observe the floating 'READ MODE' button position relative to ayah text

**Expected**
- The floating button does not cover Arabic verse text in the initial viewport

## UI-TASBIH-001 – Tapping increments and Reset clears the counter
Feature `FEAT-TASBIH-001` · P1 · e2e

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Open Tasbih (choose 'Start New Dhikr' if prompted)
2. Tap the bead ring 3 times
3. Tap Reset (confirm if asked)

**Expected**
- Counter shows 3 after three taps
- Counter returns to 0 after Reset

## UI-TASBIH-002 – Counter persists and resume prompt appears
Feature `FEAT-TASBIH-001` · P1 · e2e

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Open Tasbih, start new, tap 3 times
2. Reload and open Tasbih again
3. Tap 'Resume'

**Expected**
- Dialog 'Continue Previous Dhikr?' shows SubhanAllah with count 3
- After Resume the counter shows 3

## UI-QIBLA-001 – Missing compass shows a clear recoverable message
Feature `FEAT-QIBLA-001` · P2 · ui

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female; Desktop browser without orientation sensor

**Steps**
1. Open Qibla
2. Tap 'Enable Compass'

**Expected**
- A message explains compass access is unavailable/denied
- A 'Try Again' action is offered

## UI-SET-001 – Settings text is legible
Feature `FEAT-SET-001` · P2 · visual

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female; Light mode

**Steps**
1. Open more > Settings (gear)
2. Read the notification-scheduling paragraph below the privacy card

**Expected**
- All paragraph text sits on a surface with readable contrast (not directly over the photo background)

## UI-SET-002 – Gender preference can be changed and persists
Feature `FEAT-SET-001` · P2 · e2e

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Open Settings, tap Gender
2. Choose 'Male'
3. Reload Settings
4. Change back to 'Female'

**Expected**
- Gender row shows 'Male' after selection and after reload

## UI-SET-003 – Delete my app data resets the app after confirmation
Feature `FEAT-SET-001` · P1 · e2e

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female; Run last – destroys local test data

**Steps**
1. Open Settings
2. Tap 'Delete my app data'
3. Confirm

**Expected**
- A confirmation is requested before deletion
- After confirming, local data is cleared and onboarding (Location Setup) is shown

## UI-ASMA-001 – 99 Names lists 99 entries and search filters
Feature `FEAT-ASMA-001` · P2 · ui

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Open more > 99 Names of Allah
2. Count cards
3. Search 'Rahman'
4. Search 'zzqx'

**Expected**
- 99 names are listed
- 'Rahman' shows Ar-Rahman
- 'zzqx' shows 'No results found'

## UI-ZAKAT-001 – Zakath Ledger tile shows coming-soon feedback
Feature `FEAT-ZAKAT-001` · P3 · ui

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Open more
2. Tap 'Zakath Ledger'

**Expected**
- A 'Coming Soon' message is shown and no broken screen opens

## UI-WOMEN-001 – Cycle length is clamped to a sane range
Feature `FEAT-WOMEN-001` · P2 · ui

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Open Women's Guidance > Tracker
2. Press '-' repeatedly
3. Press '+' repeatedly
4. Restore to 28

**Expected**
- Value stops at a minimum (observed 20)
- Value stops at a maximum (observed 45)

## UI-WOMEN-002 – Women's Guidance tracker text is legible
Feature `FEAT-WOMEN-001` · P3 · visual

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female; Light mode

**Steps**
1. Open Women's Guidance
2. Read 'Spiritually Supported Period Tracker' heading and description

**Expected**
- Heading and description have readable contrast against their background

## UI-HAJJ-001 – Hajj guide shows steps and expands a card
Feature `FEAT-HAJJ-001` · P2 · ui

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Open more > Hajj Guide
2. Tap 'Spiritual Preparation'

**Expected**
- '0 / 13 steps completed' shown
- Card expands to show details

## UI-UMRAH-001 – Umrah guide search filters content
Feature `FEAT-UMRAH-001` · P3 · ui

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Open more > Umrah Guide
2. Type 'Tawaf' in search

**Expected**
- Results related to Tawaf are shown

## UI-RATHEEB-001 – Ratheeb sections are legible
Feature `FEAT-RATHEEB-001` · P2 · visual

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female; Light mode

**Steps**
1. Open more > Ratheeb al-Haddad
2. Read section #1 Arabic and transliteration

**Expected**
- Arabic and transliteration text is readable against its background

## UI-DUAS-001 – Dua category expands to show duas
Feature `FEAT-DUAS-001` · P2 · ui

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Open Duas
2. Tap 'Sleeping'
3. Search 'sleep'

**Expected**
- Two sleeping duas with Arabic and translation appear
- Search returns matching duas

## UI-CAL-001 – Calendar highlights today and navigates months
Feature `FEAT-CAL-001` · P2 · ui

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Open Calendar
2. Tap next month arrow
3. Tap previous month arrow

**Expected**
- Today (11 Nov / 1 Jumada al-akhira) is highlighted
- Header changes to the next Hijri month and back

## UI-I18N-001 – Malayalam translates the dashboard including navigation
Feature `FEAT-I18N-001` · P2 · ui

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. On Home choose 'മലയാളം' in the language selector
2. Read header, cards and bottom navigation
3. Switch back to English

**Expected**
- Dashboard texts and all bottom-nav labels are in Malayalam
- Switching back restores English

## UI-THEME-001 – Dark mode toggles and persists
Feature `FEAT-THEME-001` · P2 · ui

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Tap the moon icon on Home
2. Reload
3. Tap the sun icon

**Expected**
- Dark theme applied
- Dark theme persists after reload
- Light theme restored

## UI-A11Y-001 – Icon-only buttons have accessible names
Feature `FEAT-A11Y-001` · P2 · accessibility

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Inspect the accessibility tree on Prayer Times, Qibla, More and Settings headers

**Expected**
- Every button exposes a non-empty accessible name (e.g. Back, Settings)

## UI-A11Y-002 – Primary navigation is reachable by assistive tech
Feature `FEAT-A11Y-001` · P2 · accessibility

**Preconditions:** Onboarding completed with city Kochi (Kerala, India), any madhab, gender Female

**Steps**
1. Inspect the accessibility tree on Home and More
2. Tab through the page with the keyboard

**Expected**
- Bottom-nav items and feature tiles are exposed as links/buttons
- They are reachable by keyboard focus
