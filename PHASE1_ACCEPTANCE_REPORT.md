# Muslim Plus — final Phase 1 acceptance-readiness review

> Handover Stage 2 update, 9 November 2026: the three additional update/prayer defects identified after the storage correction are fixed. The current suite has 85 JavaScript tests and 21 backend tests passing, with the frontend test build passing. See `HANDOVER_STAGE2_REPORT.md` and `HANDOVER_PROGRESS.md`. Physical-device testing is now explicitly the final testing stage; no connection is requested during developer audits. Full handover/public-release acceptance remains pending.

## Final storage race fix — 9 November 2026 (current verdict)

**The reproduced storage-queue blocker is fixed and its regression tests pass. The candidate can proceed to staging configuration and controlled physical-device testing once the real configuration is supplied. Phase 1 is still not approved for public release. Phase 2 has not started.**

This section supersedes the storage-blocking verdict in the independent review below. Four files changed in this fix: `src/services/privateStorage.mjs`, new `tests/storageQueue.test.mjs`, new `tests/fixtures/storageQueueWorker.mjs`, and this acceptance report. No calculator, screen, unrelated feature, dependency or database change was made.

### What was fixed

The old queue finished checking pending writes before its separate promise-completion handler cleared the running flag. A write arriving between those steps could attach to the finished operation and never start. This could also let `flush()` resolve without saving the newly queued value or removal.

The runner now starts in a promise continuation, after its running flag has been assigned. Its own `try/catch/finally` clears that flag in the same uninterrupted step as its final queue check. There is no separate completion handler leaving the old flag set. This also handles an empty flush or a synchronous adapter exception without leaving a stale running flag.

Writes arriving during storage I/O remain in the queue. Newer values for the same key are retained until the current write finishes and the newest value is saved. Actual storage operations remain serialized. A late write arriving after that runner releases its flag starts its own runner automatically. Explicit flush waits for the corresponding queued operations and reports failures.

On failure, pending changes are kept, the existing error callback displays the app's storage warning, and the flush rejects. The existing Retry saving action can retry after storage becomes available. No endless automatic retry loop was added. The synchronous screen storage interface and existing conflict-migration/deletion behavior were preserved.

### Regression evidence — reproduced before, passed after

The eight new tests were first run against the unfixed implementation: **4 failed and 4 passed**. The failures reproduced automatic-save loss, a flush resolving before the newer value was saved, removal not reaching storage, and a failed late write not being reported. After the fix: **8 passed, 0 failed**. The regression tests use actual asynchronous filesystem operations, not fabricated successful writes.

| New check | Result after the fix |
|---|---|
| Write arrives at the exact previous-write completion boundary, with no explicit flush | New value automatically reaches disk. |
| Explicit flush after a newer value arrives at that boundary | Flush waits; persisted value is the newest value. |
| Removal and clear at the same boundary | Keys are absent from disk when flush completes. |
| 250 rapid update cycles: 750 set/remove calls, repeated keys, concurrent flush callers | Latest intended values survive reopening; maximum simultaneous adapter operations is 1. Superseded intermediate values are intentionally coalesced, not stored as history. |
| Real filesystem write failure, additional newer edits and recovery | Flush rejects and error callback runs; last completed data remains, pending newest values are saved after repair/retry; no busy retry loop. |
| Real removal failure and recovery | Removal remains queued and finishes after storage is repaired. |
| Child process killed after a completed flush | Both acknowledged values survive a new storage instance. |
| Child process killed while a write is deliberately paused before I/O acknowledgement | Last completed value survives; unfinished changes are not falsely reported as saved. |

The process tests actually terminate a separate Node process with SIGKILL and reopen its files. The paused-write test deliberately holds the operation before file I/O; it does not simulate a successful native write. These tests establish queue/restart boundaries and do not certify every native crash, power-loss or filesystem behavior.

### Complete validation rerun

| Check | Actual result |
|---|---|
| All JavaScript tests, including real local Django HTTP integration | **72 passed, 0 failed, 0 skipped**. Includes all previous 64 tests plus the 8 queue tests. |
| Backend `manage.py test api --verbosity 2` | **21 passed**, isolated test database. |
| Django system check | No issues. |
| Model/migration consistency | `makemigrations --check --dry-run`: no changes detected. |
| Migration rehearsal on temporary database copy | 0004 → 0001 → 0004 passed; original fields of all 3 existing rows preserved. |
| Python dependency consistency | `pip check` passed. |
| Fresh full npm dependency audit | **Zero vulnerabilities** at every severity; dependency files unchanged. |
| Frontend device-test build | Passed; existing large-bundle warning remains. ARM64 Node v24.22.1 used. |
| Capacitor iOS and Android sync after rebuilding the fixed bundle | Both passed. Native builds below contain the fix. |
| Android debug build and unit-test task with `--rerun-tasks` | **BUILD SUCCESSFUL**, all **248 tasks executed**. The existing one template unit test reran successfully; it is not native storage/lifecycle coverage. |
| Fresh unsigned iOS Simulator build | **BUILD SUCCEEDED**, new `/tmp/muslimplus-final-storage-ios` build directory. No signed iPhone archive/device build. |
| Ordinary frontend production build | Still correctly **blocked** by missing real HTTPS backend configuration; no dummy configuration supplied. |
| Diff whitespace check | Passed. |

### Scope and original-data protection

Rechecked hashes captured before this fix. `src/App.jsx`, `src/features/more/MorePage.jsx`, calculator/gold-price/history services and `backend/api/calculations.py` are unchanged. Zakath Ledger remains Coming Soon and its normal navigation entry remains disabled. No calculator UI, preview, calculation logic or unrelated screen was edited.

`backend/db.sqlite3` still matches SHA-256 `4aa2aa74377e869129c246cc5f29d090479d2024da1e98247dd865291687fee0`. The original database was not migrated or overwritten. `package.json` and `package-lock.json` also match their pre-fix hashes. No credentials or signing settings were added. No deployment, publication, commit or push occurred.

### Remaining acceptance limits

- **Forced termination before completion:** storage APIs are asynchronous. A process killed before a write completes cannot be promised that the pending new value was saved. This fix removes the silent queue-stalling bug; it does not add a crash-recovery journal for every pending preference write. The last completed-value boundary is tested. Actual Keychain/Keystore and Preferences durability, device lock, reboot, background suspension and power-loss behavior still require physical testing.
- **Physical tests remain pending:** Android instrumentation tests and real Android/iPhone account, deletion, conflict-recovery and lifecycle checks were not run here. Continue using disposable data and the existing device checklist. Failure-warning/Retry UI and first-frame theme appearance still need device verification.
- **Real configuration remains missing:** HTTPS backend/VersionHub settings, Google Web and iOS client IDs, Android signing registrations, iOS reversed callback scheme, authorized signing profiles/devices and real tester accounts are still required. The previous native Google configuration and accessible-authentication-entry limitations remain open; do not enable Ledger to bypass them.
- **Public-release acceptance remains pending:** configure a compatible staging backend through migration 0004, build a normally configured candidate and complete the physical-device checklist. Device-test mode and Simulator compilation cannot establish real Google-login acceptance. No production migration was applied.

Evidence logs: `/tmp/muslimplus-final-storage-before-tests.log` (red regression run), `-after-tests.log` (8 green tests), `-js.log`, `-backend.log`, `-migrations.log`, `-audit.json`, `-web.log`, `-sync-ios.log`, `-sync-android.log`, `-android.log`, `-ios.log` and `-production-gate.log`. These are temporary local logs; their results are recorded above. Pre-fix source and hashes were saved in `/tmp/muslimplus-privateStorage-before-race-fix.mjs` and `/tmp/muslimplus-final-storage-before.json`.

**Updated verdict:** the storage regression gate passes. Staging setup and controlled device verification may proceed with real inputs. Phase 1 is not marked complete or public-release-ready, and Phase 2 stays on hold.

---

## Independent verification — 9 November 2026 (historical; storage verdict superseded above)

**Do not accept this candidate yet. One additional storage bug was reproduced. Staging configuration can be prepared, but fix this bug and add its regression test before treating the candidate as ready for physical-device acceptance testing. Phase 2 remains on hold.**

What this change does: the shared corrections add resumable account-data deletion, preservation of conflicting storage copies, removal of an unused vulnerable asset generator and protected-theme startup. Those implementations are present. The existing test suites pass, but an extra independent check found a write that can remain unsaved without any warning.

This section supersedes the readiness wording in `PHASE1_SHARED_CORRECTIONS_REPORT.md` and the historical review below. It is a new verification run by the coding agent, not an external person's sign-off. No application/test code, dependency manifest, signing configuration or database was changed during this review. Only this acceptance document was edited; test builds produced ignored local artifacts.

### Must fix: a queued storage write can remain only in memory

**Location:** `src/services/privateStorage.mjs:35–50`, especially the early return at line 36 and promise cleanup at line 44.

**What this is:** Most screens save preferences using synchronous `appStorage.setItem`. The shared storage service is responsible for finishing the corresponding asynchronous protected-storage write.

**Problem:** After a write completes and the loop sees no pending entries, its promise still briefly occupies `running` while its completion handlers execute. A new write during that gap adds a pending entry, sees `running`, and attaches to the old promise. The completion handler then clears `running` without restarting the queue. No error is raised, and no warning appears. The screen reads the new value from memory while the durable store does not contain it. Closing the app before another write or explicit flush can lose the change.

**Evidence:** Used the actual `createPrivateStorage` implementation, temporary files and `fs.promises.writeFile` for asynchronous durable writes. Saved `reading_progress`, waited for that actual filesystem write, then immediately saved `prayer_settings`. After 100 ms, the in-memory value was `"2"` but the durable value was `null`. A subsequent explicit `storage.flush()` saved `"2"`. Reproduced with both the synchronous disk adapter and actual asynchronous filesystem writes. The queue implementation already existed before the latest correction pass; this review found an uncovered existing defect, not a new calculator change.

**Smallest fix required:** Ensure the drainer restarts if a write arrives during completion, and that awaiting a flush really waits for the queued work it is meant to cover. Preserve failure/retry behavior; do not create an endless automatic retry loop. Add an interleaving regression test, including removal/clear operations. This review did not implement that fix.

**If skipped:** A user can see a saved change disappear after restart. The shared write/flush guarantee is insufficient for acceptance of protected data handling. The tested deletion-recovery scenarios still pass; they do not cover every possible overlap with background preference writes.

### File-by-file review boundary

Reviewed the 20 implementation/configuration/test files listed below plus `PHASE1_SHARED_CORRECTIONS_REPORT.md` (21 files total). Also read the existing acceptance, security and device-checklist documents. Those three companion documents were updated in the earlier correction pass too, so “21 files” is not the count of every changed file in the whole working tree.

Compared existing files with `/tmp/muslimplus-before-shared-corrections.tar.gz`, not just Git HEAD. The repository contains substantial earlier uncommitted Phase 1 work. A HEAD-only diff would mix that earlier work with the latest corrections.

| File | Verified scope/result |
|---|---|
| `package.json` | Latest pass removes only unused `@capacitor/assets`. |
| `package-lock.json` | 127 package nodes removed, no new nodes; only root metadata changed among retained nodes. Existing dependency versions/integrities preserved. Fresh full audit passes. |
| `index.html` | Obsolete plain-storage theme script removed; no calculator markup added/changed. |
| `src/main.jsx` | Startup waits for preparation; remembered write-failure notice, conflict notice and startup Retry are wired. Native UI behavior still untested. |
| `src/services/appStorage.js` | Native protected storage configured; write errors remembered and explicit flush clears error state after success. Uses the shared queue with the finding above. |
| `src/services/privateStorage.mjs` | Conflict comparison, verified backup and source retention implemented. Write-queue finding blocks full reliability sign-off. |
| `src/features/more/SettingsPage.jsx` | Actual deletion service called; session email/token passed; pending operation offers retry. No calculator-screen edits. |
| `src/translations.jsx` | Only two deletion/retry keys added in each existing language. No calculation text changed in this pass. |
| `backend/api/models.py` | Latest delta adds only the deletion-receipt model; no calculator-model changes in this pass. |
| `backend/api/views.py` | Latest delta restricted to account deletion/receipt lookup and transaction. Calculation code unchanged in this pass. |
| `backend/api/tests.py` | Three receipt/authorization/rollback tests added; actual isolated database used, with an injected failure for rollback. |
| `src/services/dataDeletion.mjs` | Progress journal, cloud/local stages, receipt retries, account-hash guard and single-operation sharing implemented. Core recovery tests pass. |
| `src/services/accountDataService.js` | Actual fetch, Preferences, protected storage, notifications and Adhan calls wired; native adapter interruption behavior not run on phones. |
| `src/services/startup.mjs` | Confirmed pending local cleanup precedes preference reads/render; saved theme validated. Tests cover selection and failure ordering, not the complete rendered success path. |
| `backend/api/migrations/0004_accountdeletionreceipt.py` | Adds receipt table only; new model and migration agree. Tested on temporary databases only. |
| `tests/dataDeletion.test.mjs` | Actual local HTTP/backend test covers discarded successful response and later local cleanup failure. Other tests cover progress failures and account-token filtering. |
| `tests/storageRecovery.test.mjs` | Real filesystem failures, conflict retention/restart and write/readback failures tested. Does not cover the new queue-completion finding. |
| `tests/startup.test.mjs` | Theme selection and failed-cleanup startup ordering tested. Does not certify first-frame appearance or Retry UI on devices. |
| `tests/helpers/diskStorage.mjs` | Real temporary-file adapter; no claim that it is Android Keystore or iOS Keychain. |
| `tests/migration_safety.py` | Read-only backup of original DB, migrate temporary copy, compare original fields and recheck source hash. |
| `PHASE1_SHARED_CORRECTIONS_REPORT.md` | Fix descriptions match the inspected implementation, subject to the newly found queue bug and untested native limits recorded here. |

### Passed checks — fresh evidence from this review

| Check | Actual result |
|---|---|
| Existing JavaScript suite with actual local Django HTTP server | **64 passed, 0 failed, 0 skipped.** |
| Backend `manage.py test api --verbosity 2` | **21 passed**, isolated in-memory test DB. |
| Additional write-completion interleaving experiment | **Acceptance check FAILED:** new value in memory but absent on disk; see must-fix finding. Not included in the existing 64 tests. |
| Django `check` | No issues. |
| Django `makemigrations --check --dry-run` | No missing migrations. |
| Database rehearsal | Temporary copy migrated to 0004 → 0001 → 0004. Original fields of all 3 existing calculation rows preserved. |
| Fresh `npm audit --json`, no severity/production filter | **Zero vulnerabilities** across reported production/development/optional dependencies. Audit metadata: 232 dependency entries. This addresses the ten reported npm findings; it is not a security certification of all native SDKs or server infrastructure. |
| Installed dependency tree, `npm ls --all --json` | No reported dependency-tree problems. No forced fix or advisory suppression used. |
| Frontend `npm run build:device-test` | Passed; existing large-bundle warning remains. ARM64 Node v24.22.1 used. |
| Android `assembleDebug` + `testDebugUnitTest --rerun-tasks` | **BUILD SUCCESSFUL**, all **248 tasks executed**. The one template unit test reran: 1 passed, 0 failures/errors. This arithmetic test does not cover native account/storage behavior. |
| iOS build in new `/tmp/muslimplus-independent-ios` derived-data directory | **BUILD SUCCEEDED**, unsigned Simulator build. No signed-device/archive build performed. |
| Ordinary frontend production build | **Blocked**, because actual HTTPS backend configuration is missing. The gate was left intact; no dummy credentials or URL supplied. |
| Whitespace/diff check | `git diff --check` passed. |

The real HTTP recovery test performs account deletion using an actual app-issued session, discards the successful response, then retries without a usable session using the same receipt ID. It next induces a local filesystem failure, recreates the service and completes cleanup without another cloud deletion. Backend tests also confirm unknown IDs cannot authorize deletion, replay cannot delete a newly issued session, and transaction failure rolls back. These are verified helper/backend cases, **not a native end-to-end deletion certification**.

Conflicting values survive restart in the source and protected destination, with a readable protected JSON recovery copy. No automatic merge, restore screen or completed support recovery procedure exists. Therefore **preservation and readable recovery material pass; full user-facing recovery is not verified**. The retained legacy conflict remains unencrypted by design until resolved or explicitly deleted.

### Calculator scope and database integrity — passed

The SHA-256 values for `src/App.jsx`, `src/features/more/MorePage.jsx`, `src/services/zakatCalculator.mjs`, `src/services/goldPriceService.mjs`, `src/services/ledgerService.mjs` and `backend/api/calculations.py` match the saved pre-corrections hashes. The only changes to the shared backend views/model and translations are listed above; no calculator logic/previews/screens changed in this correction pass. Earlier Phase 1 calculator work remains in the working tree unchanged.

The More tile still shows Coming Soon and only displays its toast when tapped. The old `/zakat` route still exists in source, so this is **normal-navigation exclusion**, not complete removal or a server-side feature lock. No route was enabled or redesigned in this review. Actual tap behavior on devices remains a checklist item.

Original `backend/db.sqlite3` SHA-256: `4aa2aa74377e869129c246cc5f29d090479d2024da1e98247dd865291687fee0`, matching the saved pre-corrections hash. Read-only inspection still finds only `api.0001_initial` and 3 calculation rows. **The original database was not migrated or overwritten.**

### Credentials and signing review — passed within the change scope

Manual inspection of the correction deltas and credential-pattern checks found no added real production credentials, private keys, Google client secrets or raw runtime tokens. Test account strings and test token labels are fixtures, not working production credentials. Registry lockfile entries did not gain embedded URL credentials.

Android signing settings and iOS team/profile/signing-setting lines match Git HEAD. The existing iOS development-team identifier predates this correction pass; it was not introduced here. This source review does not prove who owns the existing signing identity. No signing secrets were requested, copied into source or printed in evidence.

### Untested or still blocked — do not mark as passed

- **Native crash/kill durability of the deletion journal:** the runtime uses Capacitor Preferences. Inspected Android implementation uses asynchronous `SharedPreferences.Editor.apply()`; iOS uses UserDefaults. The disk-adapter tests do not prove that an acknowledged progress write survives every process kill or power-loss boundary. Test this explicitly on disposable phone data; do not describe all interrupted native operations as certified.
- **Actual phone storage/cleanup:** locked Keychain/Keystore, mid-clear failure, legacy-removal failure, final-journal-removal failure, reboot and provider writes overlapping deletion have not been exercised end to end.
- **Actual UI/account behavior:** successful rendered startup/Retry, dark-theme first frame, A→B→A UI switching, foreground expiry, native logout and automatic cleanup after a real process restart remain physical-device checks. A corrupt progress journal deliberately blocks cleanup; a support recovery procedure remains necessary.
- **Google configuration:** no supplied real Web/iOS OAuth IDs, Android signing registrations or confirmed consent-screen/project setup. The newly built iOS Info.plist still has an empty callback URL scheme. Simulator compilation cannot certify Google login.
- **Reachable authentication flow:** the normal Ledger tile remains disabled, and Google sign-in is housed in the old Ledger component. Agree on an approved non-calculator authentication test entry; do not enable Ledger simply to get a test pass. The checklist already identifies a missing accessible entry as a blocker.
- **Hosting/release:** actual HTTPS backend/VersionHub configuration, server secrets/origins, compatible backend migrated through 0004, signed release builds and real authorized Google testers remain required. No cloud/store-console settings were verified remotely.
- **Database operations:** production engine, volume, lock time and rollback/receipt retention still need deployment-team rehearsal. Reversing migrations removes new metadata even though original calculation rows survive the SQLite rehearsal.
- **Conflict resolution:** records are retained, but a real native recovery/selection process has not been demonstrated. Do not delete the source or guess which copy is newest.

### Evidence locations and next gate

Fresh logs: `/tmp/muslimplus-independent-js.log`, `-backend.log`, `-audit.json`, `-installed-tree.json`, `-migrations.log`, `-web-build.log`, `-android.log`, `-ios.log`, `-production-build.log` and `-queue.log`. The file/hash review manifest is `/tmp/muslimplus-independent-manifest.json`. These are temporary local evidence and may be removed by the OS; the results above are recorded here permanently.

**Verdict: fix the queued-write issue first.** Staging credential collection and configuration planning can proceed in parallel. After the fix and regression check, build a genuinely configured staging candidate and complete the Android/iPhone checklist on disposable data. Do not sign off Phase 1, start Phase 2 or publish this candidate yet. No deployment, production migration, commit or push occurred.

---

## Earlier report — historical context

> Updated 9 November 2026: shared deletion recovery, migration-conflict, startup and npm advisory corrections are implemented. See `PHASE1_SHARED_CORRECTIONS_REPORT.md` for current evidence: 64 JavaScript tests and 21 backend tests pass, full npm audit reports zero vulnerabilities, Android debug and unsigned iOS Simulator builds pass. Findings below describe the earlier review. Calculator improvements are now explicitly deferred with Ledger Coming Soon. Real configuration and physical-device acceptance remain pending; Phase 1 is not release-approved.

Reviewed 6 November 2026.

**Recommendation: do not sign off Phase 1 for production acceptance yet. Do not start Phase 2.**

What this change does: Phase 1 adds validated Zakat calculations, corrected history, verified-price handling, native Google sign-in integration, revocable server sessions and protected phone storage. The implementation is substantial and its existing automated tests pass, but the acceptance review found recovery gaps and unresolved configuration/testing requirements. “Implementation finished” must not be read as “accepted for public release.”

## Repository and review boundary

- Repository: /Users/sanarayyan/Desktop/zakat_ledger_new_to_xcode_latest
- GitHub origin: Sanarayyan/zakat_ledger_new_to_xcode_latest
- Branch: versionhub-rating-mobile-qa
- HEAD: 7a771a15f08f7827a95e73a3d46583853a6dd298; Phase 1 remains uncommitted local work.
- Compared current files with /tmp/muslimplus-before-phase1.tar.gz, which captures the pre-Phase-1 working state. Comparing only HEAD would wrongly include earlier work.
- Assumed use: a public app with multiple users and protected financial/personal information.
- Application code, dependencies, configuration and original database were not changed during this review. Only acceptance documentation was added. Tests and evidence used temporary directories and disposable databases.
- No Google Cloud, hosting console or store-console access was available. Missing registrations below mean missing evidence/configuration here; I cannot prove that nobody created them elsewhere.

Companion documents:
- [Physical-device checklist](PHASE1_DEVICE_ACCEPTANCE_CHECKLIST.md)
- [All ten development-tool security findings](PHASE1_SECURITY_ADVISORIES.md)
- [Earlier implementation report](PHASE1_IMPLEMENTATION_REPORT.md)

This review supersedes any earlier impression that Phase 1 was fully accepted. The earlier report’s test/build results remain useful evidence, but they did not test every recovery path.

## Completed and verified

| Area | Evidence and result | Remaining limit |
|---|---|---|
| Zakat validation | Existing backend tests reject malformed, negative, non-finite/out-of-range values, bad categories/years/purity, invalid percentages and unsupported herd sizes. Passed again. | Not an expert certification of religious rules; more UI edge cases remain. |
| Decimal arithmetic and saved amounts | Shared cases run through JavaScript and actual Django HTTP calculation. Thresholds, Hawl, stock modes, cattle profit and half-up rounding agree in tested cases. | Inline screen previews still contain old arithmetic; see finding 3. |
| Saved history | New results and legacy display corrections tested using actual ORM rows. Existing local history serialized on a copied database. | Missing/wrong information never stored historically cannot be recovered automatically. |
| Retry safety | Same request ID returns same saved record; changed payload with same ID conflicts; tests pass. | No real phone/network-interruption test yet. |
| API ownership | Actual sessions and separate users tested for history/list/detail/delete isolation. | Does not certify the complete A→B→A React UI flow. |
| Session security | Hash-only server storage, expiry rejection, tampered/legacy token rejection, online logout and owner-scoped cloud deletion passed. | Live Google exchange, offline logout and local-storage failures remain acceptance tests. |
| Login challenge | Actual challenge/nonce service tested for wrong nonce, expired challenge and replay rejection. | Google’s live signed token/nonce on each platform not exercised. |
| Native storage migration | Existing disk-backed tests verify copy/read-back/remove order and source retention on a failure. Native plugin code/config reviewed. | Tests use disk adapters, not phone Keychain/Keystore. Conflicting copies are unsafe; finding 2. |
| Old-account HTTP responses | Request-scope helper tested with real HTTP operations; source invalidates scope at logout/account changes. | Actual account picker, local custom-column/group restoration and all active UI races not exercised. |
| Database upgrade safety | Forward, reverse to 0001 and reapply on a disposable SQLite copy all preserved every original field of all 3 existing calculation rows. | No production/PostgreSQL/large-database lock test. Reversal drops new authentication/idempotency metadata. |
| Dependency exposure | Fresh audit: 10 development package findings; fresh omit-dev audit: 0 findings. Main Capacitor runtime is patched 8.6.0. | Not a full native SDK/Python vulnerability certification. Development findings remain open. |
| Source regression comparison | 21 existing source files changed only by storage import/call replacement; CSS in the source backup is unchanged. Other touched/new logic reviewed separately. | A storage replacement can affect every screen at runtime; source equivalence is not UI acceptance. |
| Frontend compilation | Fresh device-test build to /tmp/muslimplus-acceptance-web passed. | No invented production settings; normally configured production build remains blocked. |
| Native compilation | Prior final Android debug build and unsigned iOS Simulator build logs inspected: successful. Android unit report contains one template test. | These builds were not recompiled in this read-only review; they do not establish Google login, native storage or phone behavior. |

Fresh test totals: **51 JavaScript tests passed, 0 failures, 0 skips; 18 Django test methods passed.** Django migration consistency and Python dependency consistency checks also passed.

The first new build attempt used arm64 Node 24 with an x64-installed node_modules tree and failed to find Rollup’s arm64 optional package. Building with the installed x64 Node 20.20.0, which satisfies this Vite version’s engine constraint, passed. No lockfile/dependency repair was made. The project-wide build requirement remains Node >=22.12; the team needs a clean installation matching its chosen CPU architecture and supported Node version.

## Must fix / acceptance blockers

### 1. Partial data deletion can become stuck after cloud success

**What this is:** Settings deletes cloud data first, then cancels notifications/stops audio and clears protected device storage. Cloud deletion revokes the app session.

**Problem:** If any later operation fails, the retained local session can be retried against the server even though it has already been revoked. I verified against the actual backend on a disposable database that first deletion returns 200 and repeating with that token returns 401. The UI performs this request before local cleanup, so the retry path cannot reliably finish.

**Smallest correction:** Track completed cloud deletion and let local cleanup resume independently, including after lost responses/restarts; make authentication failure lead to an explicit safe local-cleanup/relogin choice. Add an interrupted-deletion regression test. The entire physical failure sequence still needs phone testing.

**If skipped:** Sensitive local information can remain after a partially completed Delete action, with no clear retry path from the current session.

Evidence: src/features/more/SettingsPage.jsx:28–50; backend/api/views.py AccountDataView. No fix applied in this review.

### 2. Storage migration silently discards a conflicting legacy copy

**What this is:** On startup, the migration loads protected values, then migrates plain-storage keys.

**Problem:** When a protected key already exists, the code skips copying/comparing it and deletes the plain copy. In a disk-backed probe, protected records with amount 10 and a different legacy copy with amount 20 resulted in keeping 10 and deleting 20. A practical route to this state is downgrade/use of an older app followed by re-upgrade, or conflicting recovery copies; this is not a claim that an ordinary first upgrade loses data.

**Smallest correction:** Compare existing destination/source values and preserve conflicts for recovery instead of deleting blindly. Specify and test a supported rollback/re-upgrade procedure; do not infer which financial record is newer from storage location alone.

**If skipped:** A conflicting but valuable legacy copy can be permanently discarded, so the migration/rollback story is not safe enough for sign-off.

Evidence: src/services/privateStorage.mjs:4–17. Happy-path and unavailable-store tests pass; this conflict case is not covered by the committed test suite. No fix applied.

### 3. Calculation previews still disagree with the corrected saved result

**What this is:** The final modal uses the corrected decimal/server result, but stock previews still use parseFloat/Math.round and gold row price badges still round to whole rupees.

**Problem:** The existing purification regression example, dividend 10.10 at 5%, correctly saves 0.51; the inline “Amount to Donate” displays 1. Estimates may also show a positive amount before eligibility/Hawl is applied. This conflicts with the Phase 1 goal of consistent financial results.

**Smallest correction:** Render previews from the shared validated calculation result and the same currency formatter, and label pre-eligibility estimates clearly if retained. Test preview/final/history together.

**If skipped:** A beginner sees different monetary answers on the same calculation flow.

Evidence: src/App.jsx:2218,2255–2256,2294–2295; the gold row-price badge. No fix applied.

### 4. Native Google login cannot be accepted with the supplied configuration

**What this is:** Native SDK code is present and compiles. Production/staging OAuth inputs have not been supplied.

**Problem:** No actual Google Web/iOS client IDs or app-backend URL are configured in the inspected local environment files. GOOGLE_REVERSED_CLIENT_ID is referenced but not defined in the checked-in Xcode build settings; the inspected compiled Simulator Info.plist contains an empty callback URL scheme. A successful Simulator compile therefore does not prove callback correctness. Android signing registrations cannot be verified without console evidence.

**Smallest correction:** Have the deployment team supply and verify the exact inputs in the table below, build a normally configured candidate and complete real login/cancel/expiry/logout testing on both phones. Add a platform configuration check so missing iOS callback setup cannot silently pass a release build.

**If skipped:** Login-dependent features remain unavailable or cannot return from Google on iPhone. No credentials were fabricated.

### 5. The critical/high development-tool findings remain unresolved

**What this is:** All ten vulnerable package nodes are under @capacitor/assets 3.0.5. They are not part of the phone runtime dependency path.

**Problem:** A nested tar 6.2.1 instance has a critical decompression/parser denial-of-service finding plus other extraction findings; sharp 0.32.6 has image-decoder security findings. A signing/developer machine must not blindly process untrusted assets/archives with this chain.

**Smallest correction:** Remove the currently unreferenced asset generator if no manual workflow needs it, or upgrade/replace and validate its full tree. Version 4.0.0 drops its direct older CLI dependency and requests sharp ^0.35.5, but still references the project-editing chain, so an upgrade alone must not be claimed to clear everything. Do not force incompatible overrides or suppress the audit.

**If skipped:** The developer/CI environment retains avoidable critical/high exposure even though omit-dev audit is clean. See the complete package-by-package appendix, including actual call-path qualifications and upstream links.

### 6. Physical-device and rollout acceptance is still missing

**What this is:** Native storage, OAuth identity, app lifecycle, signing and old-client/new-server behavior depend on real environment state.

**Problem:** No real Android/iPhone authentication/storage acceptance results are available. The current packaged web assets are device-test mode, which bypasses cloud authentication/save. The server API and device storage are intentionally not backward compatible with old clients; no approved coordinated rollout/recovery plan exists in this evidence.

**Smallest correction:** Complete the attached physical checklist on properly configured candidates, define versioned/coordinated rollout and native rollback limitations, and record results before signing off Phase 1.

**If skipped:** Passing helper tests and compilation can hide login failures, lost local changes or old clients that can no longer log in/save.

## Should fix or explicitly resolve before sign-off

7. **Expiry UI policy is incomplete.** Server expiry is enforced, but the local session is restored only when the Zakat screen mounts; there is no active expiry/foreground timer clearing an already-open local financial screen. Existing profile data remains until clearSession. Decide whether expiry gates cloud access only or also the local ledger, implement that policy explicitly, and test foreground/resume and offline use. This is not evidence that expired tokens can access server records.

8. **Offline calculation behavior changed.** Before Phase 1, the result modal opened before server save, allowing a local answer even when save failed. Ordinary mode now opens the modal only after save succeeds. Device-test mode still calculates locally. Confirm whether this loss of offline calculation is intended; otherwise restore a clearly labelled unsaved calculation path while preserving server-authoritative saves.

9. **Cold-start theme reads the wrong storage on phones.** index.html still reads plain localStorage before protected storage initialization. Once theme has migrated, it defaults to light until the React screen applies its protected preference. Check and correct the light flash/conflicting root-class behavior for users with a dark theme. CSS itself was unchanged.

10. **Failure coverage is narrower than the implementation claims.** The storage failure test fails while opening a missing directory; it does not cover mid-migration copy failure, failure after read-back, native writes during lock/background, cleanup failing after cloud deletion, or initial-load/account-switch UI events. Add targeted regression tests for the confirmed defects and record real-device lifecycle results. No successful Google signature verification was mocked in this review.

## Native authentication configuration review

| Requirement | Android | iPhone |
|---|---|---|
| App identity | com.muslimplus.app in Gradle/Capacitor | com.muslimplus.app in Xcode/Capacitor |
| Native provider | SocialLogin Google enabled; Credential Manager implementation and nonce forwarding present | SocialLogin Google SDK dependency, nonce forwarding and AppDelegate URL handling present |
| Identity-token audience | JS uses Web client ID; backend must allow the same actual ID | JS supplies Web ID as iOSServerClientId; backend must allow it |
| Platform registration | Android OAuth client per installed signing certificate; package and SHA-1 must match | iOS OAuth client must match bundle ID; actual reversed ID must be in compiled URL schemes |
| Local actual configuration | Auth/API values absent; console evidence unavailable | Auth/API values absent; compiled URL scheme empty |
| Signing | Debug compilation evidence only; release/upload/Play certificate ownership not verified | Team 62K82J93AK is configured but ownership/profile/device authorization not verified |
| Acceptance | Not verified live | Not verified live |

Official configuration guidance: [Android Google setup](https://capgo.app/docs/plugins/social-login/google/android/), [iOS Google setup](https://capgo.app/docs/plugins/social-login/google/ios/).

No Google client secret is required in the mobile frontend. Android’s platform OAuth client ID is registered in Google Cloud; it is not the value used for webClientId. A google-services.json file is not automatically required for this direct Google SDK integration; do not invent a Firebase dependency to fill the gap.

## Database migration safety and backward compatibility

The original SQLite database still has only api.0001_initial applied and contains 3 calculation records. Its SHA-256 was unchanged by this review. New app code cannot use its new authentication/session tables until approved migrations are applied to a selected environment.

I used SQLite’s backup API from a read-only connection to create a disposable copy, then applied 0002 and 0003, reversed to 0001 and applied them again. Every original calculation field, including input/output snapshots, owner, amount and timestamp, matched at each step. All three original rows serialized with the new history code.

Important limits:
- The nullable request_id lets legacy rows coexist under the new unique owner/request constraint. Existing rows are not assigned fabricated request IDs.
- New identity/session/challenge tables contain metadata not present in old code. Rolling migrations back drops those tables and request IDs; it preserves legacy financial fields but does not preserve new sessions/idempotency metadata.
- SQLite can rebuild/lock a table when constraints are added. This tiny copied-database result does not prove acceptable downtime for a large production database.
- Old signed email tokens are rejected by the new server. Old login clients do not supply the new challengeId; old save clients lack requestId and verified-price metadata. They will fail, not transparently upgrade.
- The new client cannot rely on an old backend for challenge/logout/data-deletion endpoints. The new history response also includes corrected result components and summary type changes.
- After phone data migrates, an old binary reads plain localStorage and cannot see the protected records. Do not promise that installing an old APK/IPA restores the ledger. Re-upgrade conflicts are finding 2.
- Legacy records were keyed by email, not Google subject. The new identity mapping binds that email on first new login; there is no historical Google-subject backfill. For managed/reassigned emails, the owner/team must decide how historical ownership is established rather than silently asserting proven continuity.
- A production migration, live backup restore and rollout/rollback rehearsal remain deployment-team tasks in an approved non-production environment first. None was performed here.

## Exact inputs required from the owner

| Input | Why needed |
|---|---|
| Name/contact of the deployment and Google Cloud owner | Assign configuration and acceptance responsibility. |
| Authorized Google tester account emails A and B; consent to use disposable records | Test genuine login/account separation and owner-scoped deletion. No account passwords are needed in this chat. |
| Android model/OS and iPhone model/iOS available for testing; authorized tester | Run the device checklists and record real results. |
| Confirmation of intended Google/Apple project ownership | Verify the configured app ID, signing identity and Apple team belong to the intended app. |
| Offline/expiry/reinstall/account-sharing expectations | Decide whether the local ledger requires active login, what offline calculation/logout should do, and whether device-wide reading/period preferences are intentional. |
| Backup/recovery and destructive-test approval for disposable copies | Never uninstall or erase an existing phone containing important local-only records. |
| Qualified reviewer for calculation rules | Approve threshold, purity factors, Hawl, livestock tables and the investment-stock 25% assumption. |
| Whether the asset generator is used manually outside repository scripts | Choose removal versus a validated upgrade of the vulnerable tool. |
| Public app/privacy/support identity and URLs, and deletion/retention policy owner | Supply actual consent/support/privacy details; no placeholder publishing details. |

## Exact deployment-team deliverables

1. **Environment:** actual staging HTTPS API base URL, production API domain, DNS/TLS ownership and certificate status, and the named staging environment permitted for tests. Install certificates/keys on the service through approved secret handling; do not send private keys in chat.
2. **Google project:** project ID/name and owner; Web OAuth client ID; iOS OAuth client ID; exact reversed iOS client ID; confirmation that Web, Android and iOS registrations belong to the intended project.
3. **Android registrations:** package com.muslimplus.app and SHA-1 for every signing identity that will be installed: debug, release and Play App Signing as applicable. Supply SHA-256 for signing records and confirm which fingerprint corresponds to which build. Upload-key and Play-signing fingerprints may differ. Keep keystores/passwords private.
4. **Consent/browser setup:** actual app name, support/developer contact, approved domains, privacy/terms URLs where required, consent publishing/test status, permitted test users and actual browser authorized origins. Minimum identity scopes only. These settings must be verified in Google Cloud; none is proven by a local filename.
5. **Frontend:** VITE_API_BASE_URL, VITE_GOOGLE_CLIENT_ID (Web/server ID), VITE_GOOGLE_IOS_CLIENT_ID. Build with actual environment values; VITE values are public app configuration, not a place for secrets.
6. **iOS build:** GOOGLE_REVERSED_CLIENT_ID for each build configuration, confirmed Apple team and bundle registration, authorized device/provisioning and signing workflow, and compiled Info.plist evidence. The current empty URL scheme is unacceptable.
7. **Backend:** real DJANGO_SECRET_KEY of sufficient random strength stored by the team, DJANGO_DEBUG=false, DJANGO_ALLOWED_HOSTS, GOOGLE_CLIENT_IDS audience allowlist, actual native/web CORS origins and CSRF trusted origins as applicable, and trusted HTTPS proxy/redirect/HSTS configuration. Native origins depend on Capacitor/transport; test them instead of using wildcard origins.
8. **Data operations:** database engine/host/version/topology, expected row count, storage-at-rest/backups/access controls, retention/deletion policy, tested restore procedure, migration maintenance window and owner, and coordinated old/new-client rollout with rollback limitations. Current settings select SQLite and do not implement PostgreSQL environment configuration.
9. **Build environment:** clean lockfile-based dependency installation on the actual CPU architecture, Node >=22.12, Java 21/SDK 36 and supported Xcode/Python; resolve the vulnerable asset-tool chain and rerun full/runtime audits. Do not use signing credentials in untrusted build jobs.
10. **Evidence:** real Android/iPhone Google login results, staging save/history/delete/account switching, interruption/expiry/offline results, physical storage migration and data-deletion results, and acceptance owner sign-off.

Existing VersionHub test configuration is separate from the application backend/OAuth configuration. It cannot substitute for the missing app API URL. Public update links and store readiness remain earlier release blockers; no Phase 2 fixes were made here.

## Physical-device acceptance and scope of regression assurance

Use [the separate Android/iPhone checklist](PHASE1_DEVICE_ACCEPTANCE_CHECKLIST.md). All rows remain pending until someone executes them. It covers upgrade without uninstall, cold restart, lock/reboot, failed writes, reinstall, account A→B→A, request races, online/offline logout, expiry, challenge expiry, interrupted deletion, backup exclusions and complete existing-screen smoke testing.

The review found no unexpected removal of Quran/prayer/Tasbih/guide routes or changes to existing CSS. Twenty-one feature files have only mechanical storage-call changes compared with the pre-Phase-1 source. That is useful evidence of limited intent; it is not proof that every existing feature is unbroken. Protected storage affects shared initialization and all those screens.

The prior Android unit task is a single example test, not a native OAuth/Keystore acceptance suite. The iOS build is unsigned Simulator output, not an installed iPhone result. Current device-test builds bypass real authentication; neither build is approved for public submission.

The storage plugin documents that iOS Keychain data can survive app uninstall. Reinstall behavior must therefore be explicitly tested and disclosed; uninstall is not equivalent to Delete my app data. [Storage documentation](https://github.com/aparajita/capacitor-secure-storage).

For eventual iOS public release, resolve Apple guideline 4.8’s equivalent privacy-preserving login requirement or document an applicable exception; Google-only login is not automatically accepted. Apple also requires applicable account deletion/privacy handling. This review does not implement a new login provider. [Apple guidelines](https://developer.apple.com/app-store/review/guidelines/#login-services).

## Final recommendation

**Accept the passing test results and compilation evidence as engineering progress. Do not accept Phase 1 as production-ready.**

Close findings 1–3, resolve the asset-tool risk, provide real configuration, agree rollout/data policies, and complete the physical-device matrix before Phase 1 sign-off. Missing credentials alone are not the only blockers. Leave Phase 2 unopened until that report records actual acceptance results.

Not checked: live Google Cloud/hosting/store state, successful real Google token exchange, physical Keychain/Keystore and UI lifecycle behavior, large/production database operations, complete native/Python vulnerability assessment, or expert religious correctness. No deployments, publishing, production migrations, commits or pushes were performed.
