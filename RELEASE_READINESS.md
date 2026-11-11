# Android and iOS release readiness

Updated 4 November 2026, following the initial review of commit `7a771a1`.

**Verdict: ready to begin local device acceptance testing; not approved for production release.** Production backend and OAuth configuration are intentionally pending until the user's initial device tests are completed.

## Fixes completed

- Login, save, history, and delete use the configured API base through `src/services/ledgerService.mjs`; hardcoded localhost calls were removed from the app. Localhost is a development-only fallback.
- Login retains the backend access token. Protected requests send the bearer token; logout removes it and clears history. Unauthorized responses return the user to sign-in with a visible message. Legacy sessions without tokens require sign-in again without deleting ledger records.
- Save payloads include stock market price and all form inputs, with effective cash from the same detailed-money/cattle-profit result shown on screen.
- Frontend and backend totals use the selected category, including trading, investment, and purification stock amounts. Existing historical rows are not rewritten.
- Save status and retry are visible. History loading/deletion failures are visible, and opening history refreshes its data instead of depending on a stale event listener.
- Fixed a calculator crash found during browser smoke testing: a misplaced Quran recents list referenced an undefined variable on every category screen. Removed the misplaced block.
- Stock/cattle payloads now supply the Islamic year matching their existing 2.5% calculation mode; gold/money require the user to choose a year. Cattle notices use the existing species-specific minimum instead of always using the cow count.
- Added a visibly labelled `device-test` build for local testing without Google or backend services. It never submits calculations or presents cloud saves as successful. Its local tester identity is absent from the production bundle.
- Production compilation rejects absent/non-HTTPS/loopback API configuration and missing/example OAuth client IDs.

## Verification

| Check | Result |
| --- | --- |
| `npm test` | PASS: 22 JavaScript tests |
| `python3 manage.py test` in backend | PASS: 10 Django tests |
| New regression coverage | Login-token request flow, payload market price/effective cash, year defaults, failed saves, stock totals, cross-user isolation, missing/tampered/expired tokens, backend login-save-history-delete flow |
| Device-test frontend build | PASS |
| Production frontend compilation | PASS with explicitly synthetic compile-only HTTPS/client-ID settings; no real service connection verified |
| Production configuration gate | Missing configuration rejected as intended |
| Production test-identity isolation | Confirmed local tester identity is absent from the production JavaScript bundle |
| Capacitor iOS/Android sync | PASS; both projects contain the local device-test assets |
| Android debug compilation/unit check | PASS using Android Studio Java 21 and SDK 36; final APK at `android/app/build/outputs/apk/debug/app-debug.apk` |
| iOS compilation/device installation | BLOCKED: full Xcode is absent; only Command Line Tools are selected |
| Real-device acceptance tests | PENDING on both platforms |

The native Android unit test is the existing template check. It does not exercise the complete app. JavaScript request-flow tests inject a fake fetch implementation, and backend OAuth tests mock Google verification; neither certifies live Google login. Browser smoke tests passed in the local preview: onboarding skip, dashboard, all four calculator categories, missing-year validation, money result (10,000,000 at 2.5% gives 250,000), trading stocks (100,000 shares at 1,000 gives 2,500,000), and investment stocks on the same portfolio (625,000). Verified the explicit unsaved local-test message. Fixed the result dialog to render outside the animated page container and scroll within the viewport. Screenshot: `scratch/device-test-proof.png`.

The final APK's index and JavaScript assets were compared byte-for-byte with the final web build. The synced iOS index matches as well. No physical device was connected or installed by this work.

## Remaining production blockers and handover inputs

1. Supply the staging/production HTTPS backend, matching OAuth client registrations, and VersionHub settings. The user confirmed these have not been created yet.
2. Replace the current browser Google sign-in component with a supported native/system-browser flow for native releases. Google explicitly does not support Android/iOS WebViews for sign-in: https://developers.google.com/identity/siwg/supported-browsers . This is separate from the fixed backend bearer-token handling and is not exercised in local test mode.
3. Install full Xcode and configure the authorized Apple signing team to build/install the iPhone candidate. Verify the repository's existing team setting belongs to the intended owner.
4. Complete the physical-device matrix below, then repeat authenticated cloud tests on both platforms once staging is available.
5. Configure backend production secrets, HTTPS, database/backups, and monitoring; repeat `manage.py check --deploy` against those actual settings. The initial six warnings described local development defaults, not an inspected live service. Database settings still select SQLite, with no PostgreSQL configuration implemented.
6. Supply Android release signing, Apple distribution signing, consistent version/build numbers, privacy/support URLs, store descriptions/screenshots, and completed store declarations. Public privacy/account-deletion flows were not implemented by this change.

See `DEVICE_TESTING.md` for the build/install commands and the boundaries of the local test build. Do not submit that build to either app store.

## Device acceptance checklist

Run this against the exact candidate intended for TestFlight and Google Play internal testing. Record device, OS, version/build, tester, date, result, and evidence for each item. No item below has been signed off by this review.

| Area | Required checks |
| --- | --- |
| Install and startup | Clean install, launch, onboarding, upgrade over an existing install, force-close/reopen, background/resume, no data loss |
| Login and history | Native Google login, cancel/error, logout/relogin, expired token, save/list/delete, account A cannot access account B's history |
| Calculations | Gold purities, values at the configured Nisab boundary, quick/detailed money, debts, each cattle type, cattle profits, trading/investment/purification stocks; displayed and saved values agree |
| Persistence | Ledger/groups/settings survive restart and upgrade; deleted data stays deleted; network failure is visible |
| Location/prayer | Allow/deny/revoke permission, timeout, manual location, local prayer times, calculation settings, date/timezone changes |
| Notifications | Allow/deny, locked screen, background, changed settings, duplicates, Android restart, month rollover, and more than 7 days without opening the app; current scheduling covers at most 7 days and stops at month end |
| Qibla | Real sensor accuracy, calibration, denied permissions, unavailable sensors, navigation away/back |
| Quran/audio/content | Main reading routes, scrolling/settings, local and remote audio, pause/resume, interruptions, offline and failed downloads |
| Update/rating | VersionHub no-action/optional/mandatory/offline behavior on both platforms; correct store destinations; native review integration in distribution testing |
| UI/accessibility | English/Malayalam, theme, small/large phones, supported rotations/tablets, large text, screen reader, keyboard/safe areas, Android back navigation |
| Connectivity | Airplane mode, weak network, backend unavailable, recovery without duplicate saves or lost data |

## Release decision

Run the local device tests now, with results recorded separately for Android and iPhone. Add staging services and the supported native OAuth integration, build ordinary signed candidates, repeat cloud flows, and complete store checks before production handover sign-off.

## Follow-up fixes on 4 November

Replaced browser/native location permission handling across onboarding, Home, Prayer Times, and Qibla. Added real retry, bounded GPS fallback, retained coordinates when city lookup fails, Android approximate-location support, and removal of the persisted guessed Makkah fallback. Qibla now reads native compass headings and avoids changing React state during render; relative orientation/course values are not treated as a reliable compass.

Fixed stale Quran reciter callbacks and persisted selection across Surah/Juz pages. Browser audio-source logs confirmed Minshawi on verses 1–3 and Hudhaify on verses 5–7, continuing into Al-Baqara without reverting. Main panels now use plain shared surfaces over the wallpaper; the test-build note is in Settings.

22 JavaScript checks pass, including new location and compass tests. Actual GPS/compass operation on the user's Android phone still needs a repeat test with the new APK. iPhone build/install remains unverified because full Xcode/signing setup is absent.

## Location remains under device investigation

The prior Android candidate failed on the user’s phone after permissions were allowed. Android 1.0.1/build 2 adds a direct framework-provider fallback, longer native acquisition time without the early JavaScript timeout, visible provider error codes, and actual city selection in onboarding. 25 JavaScript tests pass. No physical-device GPS success is claimed; this remains an acceptance gate. See DEVICE_TESTING.md for the exact candidate test.

## Stop Adhan and release-practice work

Added an Android native media-playback service, exact-alarm scheduling, and a notification Stop Adhan action. Stopping playback does not cancel future reminders. Sound-off and notifications-off update native settings and cancel/stop appropriately; legacy local-notification prayer schedules are cancelled when switching to the new scheduler. Playback is bundled, respects audio focus, and is not started if notifications are blocked. Android exact-alarm permission is required for background Adhan; missing access is explained in Settings.

Added device-test-only optional/mandatory update simulations, including an escape control for mandatory tests and no simulated notice after installing target 1.0.2. Production compilation was checked to exclude these controls. Browser popup behaviour was verified.

30 JavaScript tests pass. Android code and Android instrumentation-test packages compile, but no phone was connected to run the native tests. Lock-screen stop, reboot, real prayer delivery, and upgrade/data-retention remain pending on the phone. The owner requested manual version edits, so Android remains 1.0.1/build 2 and iOS remains 1.0/build 1. A special old-version learning baseline is saved separately. Follow RELEASE_PRACTICE.md before creating the new release candidate.
