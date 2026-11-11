# Muslim Plus — Stage 2 correction report

Date: 9 November 2026. Branch: `versionhub-rating-mobile-qa`. **Stage 2 developer checks PASSED; overall handover PENDING.**

Physical Android/iPhone testing is deferred to the final testing stage by the owner's latest instruction. No device connection was requested or used in Stage 2. No deployment, publication, production migration, commit or push occurred.

## 1. Mandatory update without a usable store link — fixed

**Before:** a mandatory dialog hid Dismiss, but Update did nothing when the response omitted a store link. Unchecked links could also point outside the platform store.

**Now:** the production popup obtains one presentation policy. It validates HTTPS store destinations for the current platform: Google Play's app-details URL with `com.muslimplus.app`, or an Apple App Store app-ID URL. Unknown, insecure, credential-bearing and wrong-platform URLs are rejected. The deployment team still must supply/verify the actual iOS listing ID and each real listing; a valid URL format is not proof that it belongs to this app.

A missing/rejected destination shows an explanatory message plus **Retry** and **Continue using the app**. This is an explicit recovery policy for a bad update record. A valid mandatory update still has no dismiss button. No production store URL was invented. Existing device-test simulations remain available only in device-test mode; a production response cannot enable their bypass using `testOnly:true`.

Retry clears the old cached request and actually contacts the service again. While checking, its button is disabled. Failure is displayed and the recovery path remains available. The request timeout now covers JSON body reading too, and its timer is cleared on both success and failure. Optional updates remain dismissible. Invalid text/version objects no longer cause the dialog's render path to throw.

**Status:** PASSED by policy tests, actual shared-dialog rendering/button tests, production-service local HTTP tests and source wiring. Real OS store launching and live VersionHub configuration are PENDING.

## 2. Tested policy disconnected from actual popup — fixed

**Before:** tests imported `selectVersionHubAction`, but the popup duplicated rules and rejected some mandatory responses before reaching its mandatory check.

**Now:** `VersionHubUpdatePopup` calls `versionHubPresentation`, which uses that policy. Supported mandatory flags (`action`, `canContinue:false`, `update_required:true`, `update_type:'mandatory'`) work without an additional availability flag. Camel/snake availability fields are handled consistently. Malformed primitive/array responses do not create an update dialog.

The visible content is exported as `VersionHubDialog` and used by the real portal. Tests render this same React content, inspect the actual action buttons and invoke their callbacks. They also call the production HTTP service against a disposable local server to check launch-request deduplication, Retry, HTTP errors, invalid JSON and a stalled body. These tests do not prove that a live VersionHub server compares versions correctly; its contract/service access is still required.

**Status:** PASSED for the corrected production paths and tested response shapes; live service/version comparison and native screen behavior PENDING.

## 3. Older prayer response overwrites newer selection — fixed

**Before:** overlapping calendar fetches directly assigned state without cancellation or current-request protection. A slow response for A could replace B's newer location/calendar and feed reminder scheduling.

**Now:** `createPrayerTimesService` cancels the previous request and reuses the existing request-scope helper to suppress superseded results/errors. It times out, checks HTTP success, validates coordinates/school and checks the returned current-day date and required timing fields before handing data to the provider. The provider only applies current results and only lets the current operation end its loading state.

Settings changes invalidate in-flight work immediately; effect cleanup invalidates it on replacement/unmount too. Changing coordinates or school clears the superseded calendar/countdown and permits clearing reminders for that old context. An ordinary offline restart/refresh keeps existing scheduled alarms while calendar data is unavailable. Successful data for the new context can then schedule its reminders. A dedicated scheduling-policy regression protects this distinction.

The existing provider, month calendar, prayer method **1**, school meaning, API and notification ID policy were preserved. No religious formula was added or changed. Current-day validation is not a religious correctness certification or a complete external-provider reliability guarantee.

**Status:** PASSED by real local HTTP overlap/cancel/timeout/recovery/invalid-response tests and notification-policy tests. Full React/native reminder lifecycle and real provider behavior remain PENDING for later audit/testing.

## Actual validation results

| Check | Status | Result / limit |
|---|---|---|
| Full JavaScript suite after final corrections | PASSED | **85 passed, 0 failed, 0 skipped**; previous 72 plus 13 new tests. |
| Django backend suite | PASSED | **21 passed** against isolated test DB; backend source unchanged. |
| Frontend `npm run build:device-test` | PASSED | Built with ARM64 Node; existing large-bundle warning remains. |
| Diff check | PASSED | `git diff --check`. |
| Source/database/dependency preservation | PASSED | Restricted hashes match `/tmp/muslimplus-handover-stage2-before.json`. |
| Full npm audit | PASSED, prior Stage 1 evidence | Zero vulnerabilities in the fresh Stage 1 run. No dependency changes in Stage 2; final-stage audit still planned. |
| Native compilation of latest Stage 2 bundle | PENDING | Final clean Android/iOS checks are scheduled after developer-side corrections. Earlier APKs are not final candidates. |
| Production build with genuine inputs | PENDING | HTTPS backend/OAuth inputs still missing; no dummy configuration supplied. |
| Physical testing | PENDING / deliberately deferred | Owner will test final Android APK and iOS Xcode candidate after developer stages. |

New tests cover all mandatory flag aliases, platform URL rejection, invalid-link recovery, valid mandatory/optional dialog buttons, malformed render fields, launch request deduplication, Retry, HTTP/JSON failure, stalled response body timeout, prayer response order, cancellation, timeout recovery, invalid data/coordinates and offline alarm preservation.

HTTP payloads and listing IDs used in tests are explicitly disposable fixtures, not claimed live production data or configured production credentials. Tests never fake successful Google authentication, native review display or native storage/device behavior.

## Files modified in Stage 2

Existing implementation files:

- `src/services/versionHubPolicy.mjs`
- `src/services/versionHubService.js`
- `src/components/VersionHubUpdatePopup.jsx`
- `src/PrayerContext.jsx`
- `src/services/prayerNotificationPolicy.mjs`
- `src/translations.jsx` — update-error/retry text in English and Malayalam only.

Existing tests updated:

- `tests/versionHubPolicy.test.mjs`
- `tests/prayerNotifications.test.mjs`

New implementation/tests:

- `src/services/prayerTimesService.mjs`
- `tests/versionHubIntegration.test.mjs`
- `tests/prayerTimesService.test.mjs`

Documentation: this report and `HANDOVER_PROGRESS.md` added; Stage 1 report and Phase 1 acceptance report annotated to point to the new results/order.

## Preserved scope

`src/App.jsx`, `src/features/more/MorePage.jsx`, calculator/gold-price/history services and `backend/api/calculations.py` are unchanged from the Stage 2 starting hashes. Zakath Ledger remains Coming Soon and inaccessible through normal navigation. No screen or preview in that feature was edited.

Original `backend/db.sqlite3` still has SHA-256 `4aa2aa74377e869129c246cc5f29d090479d2024da1e98247dd865291687fee0`. No original database migration or data rewrite occurred. `package.json`/lockfile are unchanged; no new dependencies, credentials or signing settings were introduced.

## Remaining work

Continue the developer stages in `HANDOVER_PROGRESS.md`: full authentication/storage, rating/update/native/backend/security audit, each available feature's regression and performance checks, final clean native builds and both detailed device checklists. Store-link launches, notification behavior and real Google/update/review integrations cannot be marked passed from this stage's helper/render/HTTP tests.

Evidence: `/tmp/muslimplus-handover-stage2-js.log`, `-backend.log`, `-web.log`, `-focused.log`. The final complete suite includes tests added after the earlier focused run. These are temporary logs; the final outcomes are recorded here.

**Verdict:** all three Stage 1 defects are corrected and pass the Stage 2 developer checks. The entire app is not yet handover-ready. No physical connection is needed for the next developer audit stage.
