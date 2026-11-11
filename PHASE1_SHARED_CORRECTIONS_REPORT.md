# Phase 1 shared corrections — 9 November 2026

**Local corrections and automated checks pass. Phase 1 is NOT accepted for public release. Phase 2 has not started.**

Continued the existing local work in `/Users/sanarayyan/Desktop/zakat_ledger_new_to_xcode_latest`, branch `versionhub-rating-mobile-qa`, HEAD `7a771a15f08f7827a95e73a3d46583853a6dd298`. Earlier uncommitted changes were preserved. This report updates the shared findings in the earlier acceptance report.

## Issues fixed

### Deletion can resume after partial failure

Previously, cloud deletion revoked the login token before device cleanup. If notification cancellation or storage cleanup failed, retrying cloud deletion failed with the revoked token.

Deletion now saves progress before starting. After cloud confirmation, retries perform the remaining device cleanup. Startup completes confirmed pending device cleanup before mounting components that might resave old preferences. Settings offers an action to finish an interrupted deletion.

If a successful cloud response is lost, the server confirms the earlier operation using a random UUID receipt. Receipt creation and account deletion share one database transaction. Repeating that operation confirms the old deletion; it does not delete newly created account data. Receipts contain no email, token or account mapping and have no expiry, so delayed retries remain possible. They add a small permanent server record per deletion; include this table in monitoring and backups.

The device progress journal contains the operation ID, stage and a hash of the original account email. It contains no raw email or token. The hash is account-related metadata and is removed when cleanup finishes. After an account switch, the new account's token cannot authorize the old deletion. A receipt-only retry remains possible. If cloud deletion never succeeded, sign back into the original account to retry.

Cleanup cancels notifications/native Adhan, signs out locally, clears protected data and preserved legacy conflicts, and removes the progress journal last. Failures remain visible and retryable. Corrupt progress blocks automatic cleanup rather than guessing what was authorized. The Google account itself is never deleted.

### Conflicting storage copies are preserved

Previously, an existing protected value caused migration to remove the legacy plain-storage copy even when the values differed.

Migration now compares values. Matching or newly copied values are removed from legacy storage only after verification. Conflicts leave both originals intact and create a verified protected recovery record. The protected current value is used without guessing which is newer. A visible notice explains the conflict. Reopening does not duplicate recovery records. Explicit confirmed data deletion clears both stores.

**Limit:** a conflicting legacy copy remains in plain storage until resolved or explicitly deleted. This prevents data loss; it does not encrypt that retained source. Do not uninstall or clear storage to resolve a conflict. Real conflicting personal records will need a supported manual recovery decision.

### All ten npm development findings resolved

All ten flagged package nodes were descendants of unused `@capacitor/assets`: assets, its nested CLI, trapezedev/project, glob, minimatch, rimraf, sharp, tar, uuid and xcode. No repository script or app source invokes the generator.

Removed that development dependency and its transitive chain. Existing icons/splash assets and features remain. The critical `tar` instance is no longer installed. No forced audit fix, forced major override, severity filter or advisory suppression was used. Full npm audit after a clean installation reports **zero vulnerabilities**. Future asset regeneration requires a separately reviewed tool; no assets were regenerated here.

### Shared startup uses protected preferences

Removed the HTML script reading the native theme from obsolete plain storage. Startup waits for protected storage and confirmed pending cleanup, then applies the validated saved theme before React renders. Startup failure offers Retry. Storage-write failures before the warning mounts are remembered, so the warning is not silently missed.

Startup ordering and theme selection have automated coverage. Actual cold-start appearance, device lock behavior and native plugin durability still need physical testing.

## Files changed in this correction pass

Existing files edited:

- `package.json`, `package-lock.json`: unused vulnerable generator chain removed.
- `index.html`, `src/main.jsx`: protected startup, cleanup ordering and retry/error notices.
- `src/services/appStorage.js`, `src/services/privateStorage.mjs`: remembered write failures, conflict preservation and explicit legacy cleanup.
- `src/features/more/SettingsPage.jsx`, `src/translations.jsx`: resumable deletion action and English/Malayalam messages.
- `backend/api/models.py`, `backend/api/views.py`, `backend/api/tests.py`: transactional deletion receipts and backend regressions.

New files:

- `src/services/dataDeletion.mjs`: resumable operation and original-account guard.
- `src/services/accountDataService.js`: actual API/native reminders/storage adapters.
- `src/services/startup.mjs`: startup ordering/theme selection.
- `backend/api/migrations/0004_accountdeletionreceipt.py`: receipt table only.
- `tests/dataDeletion.test.mjs`, `tests/storageRecovery.test.mjs`, `tests/startup.test.mjs`, `tests/helpers/diskStorage.mjs`, `tests/migration_safety.py`.
- This report; acceptance report, security appendix and physical-device checklist updated.

Native sync generated local test bundles using existing native configuration. Calculator implementation, gold-price/history services, `src/App.jsx` and `src/features/more/MorePage.jsx` have identical hashes to the start of this pass. **Zakath Ledger remains Coming Soon with its normal navigation entry disabled.** No calculator screens, previews or logic were edited. Existing calculator regression tests were run unchanged.

## Tests executed and actual results

| Check | Result |
|---|---|
| Clean frontend `npm ci` | Passed; ARM64 Node v24.22.1 and ARM64 esbuild |
| Fresh temporary Python environment, pinned requirements | Installed on ARM64; `pip check` passed |
| `PHASE1_TEST_PYTHON=… npm test` | **64 passed, 0 failed, 0 skipped** |
| Django `manage.py test api` | **21 passed**; isolated test database |
| Django `check` | No issues |
| Django `makemigrations --check --dry-run` | No missing migrations |
| `tests/migration_safety.py` | Temporary copy upgraded to 0004, reversed to 0001 and upgraded again; all original fields of all **3 existing rows preserved** |
| Full `npm audit --json` | **0 vulnerabilities** at every severity |
| `npm run build:device-test` | Passed; existing large-bundle warning remains |
| Capacitor sync, Android and iOS | Passed |
| Android `assembleDebug` and `testDebugUnitTest` | BUILD SUCCESSFUL; 248 tasks, 212 executed, 36 up-to-date. The existing template arithmetic test is up-to-date; it provides no native lifecycle coverage. |
| iOS unsigned Simulator build | BUILD SUCCEEDED; not a signed physical-iPhone build |
| Ordinary production frontend build | **Blocked:** actual HTTPS backend configuration missing; no dummy values supplied |

New cases cover conflicting copies across restarts, backup/write/readback failures, queued-write retry, interrupted reminders, journal failure/corruption, account switching during deletion, cloud response loss, local cleanup failure after cloud success, concurrent retry calls and database rollback. Disk tests use real temporary files and filesystem errors. The response-loss test calls the actual Django HTTP endpoint using a real app-issued session in an isolated database, then deliberately discards its successful response. Google login success is not simulated or certified.

Logs are in `/tmp/muslimplus-corrections-*`; they are temporary evidence, not release artifacts. The original database SHA-256 remains `4aa2aa74377e869129c246cc5f29d090479d2024da1e98247dd865291687fee0`. Its schema was not migrated.

## Remaining blockers and exact inputs required

The deployment team has not supplied these inputs. Please obtain them before staging authentication acceptance:

1. Actual **HTTPS backend URL**, hosting owner and approved API origins. Server needs a securely generated private `DJANGO_SECRET_KEY`, allowed hosts, CORS/CSRF origins, HTTPS/proxy policy and Google audiences. Do not paste private keys or secrets into reports.
2. Google Cloud project ID/owner and OAuth consent-screen status; the actual **Web/server OAuth client ID** shared by frontend and backend.
3. Android OAuth registration for `com.muslimplus.app`, SHA-1/SHA-256 fingerprints for debug/staging, release and Play App Signing identities actually used. An upload certificate alone does not certify Play-installed builds.
4. iOS OAuth client ID for `com.muslimplus.app`, its reversed client ID, and confirmation of the authorized Apple team/profile/device access. Set `VITE_GOOGLE_IOS_CLIENT_ID` and Xcode `GOOGLE_REVERSED_CLIENT_ID`. The compiled Simulator Info.plist currently has an **empty callback scheme**; live iPhone login cannot be accepted.
5. Actual VersionHub HTTPS endpoint, app identifier/key and approved staging update policy. Confirm the candidate cannot be trapped behind an unavailable mandatory release.
6. Two authorized real Google tester accounts, Android phone and physical iPhone. Testers enter credentials themselves; do not put credentials in evidence.
7. Owner decisions on offline logout/session expiry, device-shared preferences and iOS Keychain survival after uninstall. Uninstall is not an account-deletion guarantee. Calculator improvements remain deferred until after this release.

No Google client secret belongs in the mobile frontend. Direct Google SDK login does not automatically require Firebase or `google-services.json`. Console registrations cannot be proven absent remotely; their configuration/evidence is unavailable here.

## Deployment-team actions — not performed here

- Back up and rehearse migrations against the selected environment. This rehearsal was SQLite-only; production engine, lock duration and real volume are untested.
- Use a compatible backend migrated through **0004 before testing the new frontend deletion flow**. Old clients can still delete without an operation ID, but old calls gain no receipt recovery. Old servers cannot provide the receipt guarantee.
- Preserve receipts across restarts/rollback. Reversing to 0001 drops new authentication/idempotency/receipt metadata; it is not a lossless rollback. Use a tested recovery/backup plan.
- Configure HTTPS, secrets, real Google registrations/audiences, callback and signing inputs. Build/inspect a normally configured staging candidate. Device-test mode cannot certify authentication/cloud behavior.
- Complete physical-device checks and attach redacted evidence before public-release approval.

## Physical-device requirements

Use `PHASE1_DEVICE_ACCEPTANCE_CHECKLIST.md` on both platforms. Upgrade over the old signed app; compare migrated records; test conflicts and locked/interrupted writes on disposable data; kill/reopen during deletion; lose a successful server response; retry signed out and after switching accounts. Verify reminders/audio and both storage copies are cleared. Test real Google login/cancel/expiry/logout and A→B→A through approved accessible authentication entry points, without enabling Ledger. Check saved dark theme on cold start and existing non-calculator features.

## Updated Phase 1 acceptance status

**Locally tested corrections pass; Phase 1 is not release-ready.** Production configuration, live Google authentication, signed release builds, physical-device lifecycle testing and policy decisions remain pending. No production migrations, deployment, publication, commit or push occurred. Phase 2 remains on hold.
