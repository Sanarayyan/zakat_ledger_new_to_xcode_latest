# Muslim Plus — Stage 1: current developer handover status

> Subsequent update, 9 November 2026: the three confirmed defects below are corrected; see `HANDOVER_STAGE2_REPORT.md`. The owner's revised order defers all physical connections/testing until developer-side work is complete. `HANDOVER_PROGRESS.md` is the current staged plan. This document remains the historical initial inspection, not the current full readiness verdict.

Date: 9 November 2026. **Overall status: PENDING — not handover-ready.**

What this repo does: Muslim Plus is a React application packaged for Android and iOS with Capacitor. Its available screens include worship, reading, reminders and personal preferences. Django provides account/session and saved-calculation APIs; VersionHub is a separate external service. This review assumes a public mobile application with multiple users, intermittent connectivity and personal device data.

This is the requested first inspection and staged work plan. It is not a completed whole-app audit, a physical-device sign-off or the final set of 13 reports. Only this document was added in Stage 1. No application code, existing report, dependency configuration, signing configuration or database was changed.

## Status meanings

- **PASSED:** verified by source inspection or an actual check, with the evidence and its limits stated.
- **FAILED:** a concrete defect or unmet developer requirement was identified. Source findings are not represented as device reproductions.
- **PENDING:** needs further inspection, a device, a real service/configuration or external access.
- **NOT APPLICABLE:** deliberately outside the active release, with the reason stated.

## 1. Repository and protected scope

| Check | Status | Evidence / limit |
|---|---|---|
| Continue existing branch | PASSED | `/Users/sanarayyan/Desktop/zakat_ledger_new_to_xcode_latest`; `versionhub-rating-mobile-qa`; HEAD `7a771a15f08f7827a95e73a3d46583853a6dd298`. |
| Preserve previous work | PASSED | Existing modified and untracked Phase 1 work retained. A hash/size baseline of 490 Git-visible files was recorded in `/tmp/muslimplus-handover-stage1-baseline.json`. |
| Read previous implementation/acceptance evidence | PASSED | Latest acceptance/storage correction sections, implementation report, shared corrections report, security/device checklists and associated source/test/build logs reviewed. Historical failures are distinguished from the latest fixes. |
| Calculator freeze | PASSED | No calculator, preview, screen or calculation code edited. More still marks Ledger Coming Soon. The existing hidden `/zakat` route remains in source; normal-navigation exclusion is not complete route removal. |
| New Ledger work | NOT APPLICABLE | Explicitly deferred until after this release. Existing automated calculator regressions may run without enabling or editing the feature. |
| Original database | PASSED | `backend/db.sqlite3` unchanged; SHA-256 `4aa2aa74377e869129c246cc5f29d090479d2024da1e98247dd865291687fee0`. No original/production migration run. |
| Deploy, publish, commit or push | NOT APPLICABLE | Not performed or authorized by this work. |

There is no `.codegraph` directory, so CodeGraph was skipped. Broad file inventory is complete; detailed review of every feature is still pending. No external agent/person's sign-off is implied by this report.

## 2. Architecture mapped

| Area | Existing implementation | Current verification |
|---|---|---|
| Startup | `src/main.jsx` opens protected storage, resumes confirmed pending cleanup, applies saved theme, then mounts providers/router. | PASSED: source flow inspected; phone lock/crash/first-frame behavior PENDING. |
| Frontend/navigation | React 19, React Router 7, Vite 7. `src/App.jsx` contains routing, large Quran views and the frozen legacy Ledger component; smaller feature screens live under `src/features`. | PASSED: entry points/navigation mapped. Full screen-by-screen regression PENDING. |
| Shared state | Language, prayer settings/times and prayer streak contexts; feature preferences stored via `appStorage`. | PASSED: mapped. In-flight prayer-request defect below is FAILED. |
| Persistence | Native secure-storage plugin plus synchronous in-memory cache/serialized writes; web localStorage. Conflict preservation and resumable deletion already exist. | PASSED: current queue correction source and eight new regressions. Native Keychain/Keystore behavior PENDING. |
| Authentication | Native SocialLogin/Google SDK, web Google widget, Django verification/challenge and opaque revocable app sessions. | PASSED: code exists and prior backend rejection/ownership tests pass. Live Google login PENDING. |
| Backend | Django 5.2.19 / DRF 3.16.1; `/api/auth/*`, `/api/account/data/`, calculation/history APIs. | PASSED: routes/security design inspected. Whole backend security/production review PENDING. |
| Database | SQLite hardcoded in current settings; migrations 0001–0004 include sessions, challenges and deletion receipts. | PASSED: local configuration identified. Production-engine support/choice PENDING. |
| Updates | `VersionHubUpdatePopup` calls `versionHubService`; native requests use CapacitorHttp and App.getInfo. | PASSED: actual app wiring. Mandatory-update handling findings below are FAILED. |
| Rating | `RatingManager` listens for existing feature events and invokes InAppReviewService/native plugin; cooldown stored in Preferences. | PASSED: source wiring and native Android/iOS implementations inspected. Actual Play/Apple experience PENDING. |
| Notifications | Local notifications; Android custom Adhan plugin/service, alarms and Stop action; iOS uses its existing local-notification path. | PASSED: architecture mapped. Native behavior/equivalence PENDING; push messaging is not implemented in this repo. |

The local Django router does not provide the VersionHub `/api/v1/version-check` endpoint. That service's actual URL, credentials, response contract and administration are external requirements; do not assume pointing it at the local Django API makes it work.

## 3. Verified evidence, with previous results preserved

The latest implementation evidence remains useful because this stage made no application changes. It was inspected rather than needlessly rebuilding everything again. New Stage 1 checks are labeled separately.

| Check | Status | Evidence |
|---|---|---|
| Exact storage-race correction | PASSED — fresh focused run | Current runner clears its flag inside its own completion step. Eight filesystem/process regression tests passed again. Native crash durability is not established. |
| Storage + VersionHub helper + review helper tests | PASSED — fresh focused run | `node --test tests/storageQueue.test.mjs tests/versionHubPolicy.test.mjs tests/inAppReviewService.test.mjs`: **16 passed, 0 failed, 0 skipped**. Helper-test limits noted below. |
| Full JavaScript suite | PASSED — previous run, evidence reviewed | **72 passed, 0 skipped**, including real local Django HTTP operations; final-storage log and acceptance report. Not rerun in Stage 1. |
| Backend suite | PASSED — previous run, evidence reviewed | **21 passed** on isolated test database. Not rerun in Stage 1. |
| Android debug build/unit task | PASSED — previous run, evidence reviewed | BUILD SUCCESSFUL; 248 tasks executed. Only the template arithmetic unit test is native unit coverage; real instrumentation/device checks remain PENDING. |
| iOS Simulator build | PASSED — previous run, evidence reviewed | BUILD SUCCEEDED in fresh final-storage derived-data directory. Unsigned Simulator compilation is not physical-iPhone testing. |
| Migration rehearsal | PASSED — previous run, evidence reviewed | Temporary SQLite copy migrated 0004 → 0001 → 0004, all original fields of 3 rows preserved. Production engine/volume/rollback metadata still PENDING. |
| Full npm dependency audit | PASSED — fresh Stage 1 run | `npm audit --json`, no severity/production filter: **0 vulnerabilities**. This does not audit every Python/native dependency or remote infrastructure. |
| Production frontend build | PENDING — configuration blocked | Latest real run stops at missing HTTPS backend configuration. No fake URL/client IDs supplied. |
| Clean reproducible candidate build | PENDING | Previous clean ARM64 install/build evidence exists. Repeat a final clean build after forthcoming fixes and real candidate configuration. |

Stage 1 evidence logs: `/tmp/muslimplus-handover-stage1-focused-tests.log`, `-npm-audit.json`, `-android-devices.log`, `-ios-devices.log`. Prior logs use `/tmp/muslimplus-final-storage-*`. Temporary logs can be removed by the OS; key outcomes are recorded here.

## 4. Confirmed developer issues to address next

These are source-verified findings, not claimed physical-device failures. No fixes were applied during the first inspection.

### Must fix

1. **Mandatory update can trap the user without an update destination — FAILED.**
   - **What this is:** `src/components/VersionHubUpdatePopup.jsx:62–85` hides Dismiss for a mandatory update and opens the supplied store URL when Update is tapped.
   - **Problem:** For a response marked mandatory with no `storeUrl`/`store_url`, the dialog has no dismissal and Update does nothing. Supplied URLs also have no store-link validation in this path.
   - **Fix:** Validate/normalize the real response and platform store link; show a recoverable error/retry path when no usable update destination exists. Agree how an invalid mandatory response should behave without inventing a production URL.
   - **If skipped:** A malformed or incomplete VersionHub record can prevent using or updating the app.

2. **Mandatory-update rules differ between tested policy and actual popup — FAILED.**
   - **What this is:** `src/services/versionHubPolicy.mjs` is tested, but only the test imports `selectVersionHubAction`; the popup duplicates the rules instead.
   - **Problem:** A response containing `canContinue:false` or `update_required:true` without the popup's separate availability flags can be ignored before its mandatory logic is reached. Existing helper tests can pass while the real popup follows different behavior.
   - **Fix:** Make the real production flow consume one validated policy and test that actual path for each supported response shape, malformed data, unavailable API and store-link failure.
   - **If skipped:** Some forced updates are ignored while other incomplete ones block the app. The current four policy tests do not certify the popup.

3. **Old prayer-time requests can replace newer location results — FAILED.**
   - **What this is:** `src/PrayerContext.jsx:44–72` fetches a monthly calendar and directly assigns calendar/today state. Settings changes start another request.
   - **Problem:** If location A is slow, location B completes first, and A completes later, A overwrites B's data. There is no abort/current-request guard in this fetch path. Notification scheduling consumes that calendar, so the consequence can extend to reminders.
   - **Fix:** Scope responses to the latest requested location/settings, add timeout/error/body validation, and exercise response-order changes with regression tests. Preserve the existing prayer method and religious calculations.
   - **If skipped:** Displayed prayer times and reminders can refer to a location the user has already changed.

### Should fix / verify in subsequent stages

4. **Release documentation and current database configuration do not match — PENDING decision/configuration work.**
   - **What this is:** `DEPLOYMENT.md` requires managed PostgreSQL, while Django settings always select SQLite and requirements contain no PostgreSQL driver.
   - **Problem:** Supplying a production database URL alone cannot currently select that engine. This is a developer/configuration gap if PostgreSQL is the chosen handover target.
   - **Fix:** Confirm the deployment engine and then add a documented, tested configuration path with disposable database tests. Preserve the local original database.
   - **If skipped:** The deployment team cannot follow the current database instructions as written.

No boot-permission bug is claimed: the app's main manifest alone omits RECEIVE_BOOT_COMPLETED, but the inspected merged debug manifest includes it through dependencies. Final release manifest and actual reboot restoration still need verification.

## 5. Android and iPhone availability

The owner confirmed that **both an Android phone and an iPhone are available**. OS versions, disposable-data status and an authorized old-build upgrade baseline are not yet supplied.

| Check | Status | Actual evidence |
|---|---|---|
| Android connection | PENDING | Authorized `adb devices -l` completed and listed no connected devices. |
| iPhone connection | PENDING | CoreDevice lists a paired physical iPhone as **unavailable**. A separate simulated device is not a physical test result. No personal device identifier is copied here. |
| Installation/upgrade/deletion | PENDING | No phone was installed onto, uninstalled, reset or cleared. Existing personal data must be protected first. |
| Physical Android acceptance | PENDING | No screen, login, reminder, performance or lifecycle checks performed on a phone during Stage 1. |
| Physical iPhone acceptance | PENDING | No corresponding iPhone checks performed. Simulator evidence is kept separate. |

For later device access: connect Android over USB, enable USB debugging and authorize this Mac; connect/unlock iPhone, trust this Mac and enable Developer Mode. Confirm model/OS and whether the existing app contains important data. Do not uninstall either app. Keep serials, account credentials and raw tokens out of public evidence.

Use the existing `PHASE1_DEVICE_ACCEPTANCE_CHECKLIST.md`, `DEVICE_TESTING.md` and `VERSIONHUB_DEVICE_TEST.md` as starting material, then expand the per-feature sheets during the device stage. Each test must record expected result, actual result, PASS/FAIL, candidate build, device/OS and redacted evidence.

## 6. Current status of the 13 final deliverables

| Required deliverable | Current status / work remaining |
|---|---|
| 1. Complete developer readiness report | PENDING. This is the initial report, not final acceptance. |
| 2. Frontend/backend audit | PENDING. Architecture/critical flows mapped; issues above identified. Each available feature and remaining API/security paths still need deep review. |
| 3. Android testing report | PENDING. Debug compilation evidence verified; physical test sheet, performance, upgrade and release readiness outstanding. |
| 4. iOS testing report | PENDING. Simulator compilation verified; physical test sheet, Keychain, callbacks and signed-device readiness outstanding. |
| 5. Authentication/storage report | PENDING overall. Queue fix/automated recovery evidence PASSED; live Google, account switching, device lock/termination/backup and deletion still pending. |
| 6. VersionHub/update report | FAILED findings above; PENDING real endpoint/contract, platform/store-link and native UI verification. |
| 7. Rating/review report | PENDING overall. Actual JS/native wiring inspected and helper tests PASSED. Trigger timing, persisted cooldown races, store-installed behavior and lifecycle checks outstanding. A successful API call never proves that a popup appeared or a review was submitted. |
| 8. Notifications/native report | PENDING overall. Local notification/Android Adhan architecture mapped; permission, reboot, update, battery, stopped-app and iOS behavior need native tests. Remote push is NOT APPLICABLE to current implementation unless separately requested. |
| 9. Security/performance report | PENDING overall. Fresh npm audit PASSED; Python/native dependency review, API/privacy/logging, asset/licensing, CPU/memory and real-device measurements remain. |
| 10. Build verification report | PENDING overall. Recent debug/Simulator builds PASSED. Final clean build and production/release/device candidates depend on corrections and real inputs. |
| 11. Complete modified-file list | PASSED for Stage 1: only this document added. Final report must separately list inherited working-tree changes and new handover changes using the saved baseline. |
| 12. Remaining bugs/blockers | PASSED as initial inventory above; PENDING updates after deeper feature audits/tests. |
| 13. Deployment-team checklist | PENDING finalization; exact initial inputs below. No deployment actions performed. |

Available-feature regression is **PENDING** for dashboard, Quran/reading/audio, prayer, Qibla, calendar, Tasbih, Duas, Asma, Hajj, Umrah, women's guidance, Ratheeb, settings, language/theme and all shared navigation. Finding their source or passing a helper test does not mark their complete user journey as passed.

## 7. External inputs and handover checklist

- Actual staging/production HTTPS backend URL; hosting owner; allowed hosts/CORS/CSRF origins and trusted-proxy/HTTPS policy. Provide secrets through the deployment secret manager, not source/reports.
- Selected production database engine/connection policy, migration/backup/restore/rollback procedure and deployment ownership. Do not apply migrations to the original local database.
- Google Cloud project/consent status, actual Web/server OAuth client ID and backend audience allowlist; Android package `com.muslimplus.app` registrations with each installed signing certificate's SHA-1/SHA-256; iOS OAuth client ID and exact reversed callback scheme.
- Authorized Android debug/staging/release/Play signing identities and compatible old builds. Private keystores/passwords remain outside the repo. iOS Apple team/profile/device authorization; the checked-in team identifier does not establish ownership.
- VersionHub actual HTTPS endpoint, application identifier/key, response contract, Android/iOS version/build policy, optional/mandatory releases and separate test environment. Do not alter live mandatory-update settings for a test.
- Real Android and iOS store links and access to suitable internal/testing distributions for review API verification. Do not infer popup display or user rating from SDK completion.
- Two authorized real Google tester accounts; connected devices with confirmed OS versions and a disposable-data/upgrade plan. Testers enter credentials themselves.
- Privacy policy URL, support contact, data-deletion/support recovery process, relevant service/data/audio licensing and store privacy/disclosure assets. Store metadata/asset completeness is still PENDING.

Current versions differ by platform: Android **1.0.3 / build 4**, iOS **1.0 / build 1**, npm package **1.0.0**. These are inspected values, not automatically a bug; agree a release/versioning policy and confirm native App.getInfo reports the intended candidate on each platform.

No production credentials were fabricated. Full OAuth/VersionHub/store behavior cannot be accepted until real configuration and testing are available. The local Django configuration does not itself constitute the external VersionHub server.

## 8. Staged work plan

1. **Stage 1 — completed:** current-state inspection, evidence/device inventory, source baseline, fresh npm audit and initial issues/report. No application edits.
2. **Stage 2 — next:** fix confirmed update-system and prayer request-order issues, explain exact file changes before editing, add regressions that reach the actual production paths, then verify the stage. This is continued release-readiness work, not product Phase 2.
3. **Stage 3:** complete authentication/storage, rating/native, backend production-configuration and security audits. Address confirmed bugs with focused tests; retain external/live checks as pending.
4. **Stage 4:** test each available feature and complete frontend/offline/lifecycle/performance regression. Make only necessary, explained corrections. Keep Ledger frozen.
5. **Stage 5:** clean configured candidate builds; real Android/iPhone test sessions, upgrade compatibility, native reminders, actual Google/VersionHub and store-dependent review checks. Record missing inputs as pending, never as passes.
6. **Stage 6:** save the final 13 reports and modified-file manifest; rerun checks justified by final changes; evaluate every acceptance criterion. Handover remains blocked until critical/high defects are resolved and required physical evidence exists.

**Verdict:** retain the verified storage correction, address findings 1–3 next, and obtain real device/configuration access. Do not mark the application handover-ready from builds or automated tests alone.

**Not checked yet:** complete feature journeys, real Google/VersionHub/store services, physical devices, signed release/device builds, whole-backend/native dependency security and on-device performance. Nothing was deployed, published, committed or pushed.
