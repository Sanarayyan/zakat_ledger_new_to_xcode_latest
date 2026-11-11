# Muslim Plus developer handover progress

Updated 10 November 2026. **The owner reports physical-device testing complete on Android and iOS. Final release acceptance: Not Ready for Deployment Handover as an accepted release.** Specific device observations, current source checks and deployment actions are separated in [Final release acceptance report](FINAL_RELEASE_ACCEPTANCE_REPORT.md). Missing per-feature results are not counted as passes.

| Stage | Status | Evidence |
| --- | --- | --- |
| 1 | Initial inspection complete; historical baseline | [Stage 1](HANDOVER_STAGE1_STATUS.md) |
| 2 | Three update/prayer corrections verified | [Stage 2](HANDOVER_STAGE2_REPORT.md) |
| 3–3.3 | Developer corrections and release decisions recorded | [Stage 3.3](HANDOVER_STAGE3_REPORT.md#stage-33-release-blocker-decision-review) |
| 4 Android | Owner testing completed; earlier Stop, Quran reciter/bookmarks and LAN update observations passed in their contexts. Later Qibla alignment vibration and quick Adhan playback confirmed. Exact latest-candidate full matrix and real scheduled prayer/OEM checks are not substantiated by the available feedback. | Final report device table; [Android fixes](ANDROID_TEST_FIXES_REPORT.md) |
| 4 iOS | Owner testing completed; onboarding persistence, earlier theme/location/Qibla issues and shared timing concern recorded. Per-feature post-fix iPhone results and signed production candidate identity remain unrecorded. | Final report device table; [iOS test handover](build/ios-phone-test/Muslim-Plus-iOS-Handover.md) |
| Final audit | Original audit baseline: 158 JavaScript and 27 isolated Django tests passed. The deletion/save scenario failed before the fix. Device-test web/sync, Android debug/unsigned release/AAB, and unsigned iOS device/Simulator Release builds pass. Android lint: 0 errors, 22 warnings; instrumentation only compiled. | Final report verification and blockers |
| Blocker fix follow-up | Both approved code fixes verified. Full JavaScript suite: 160 passed. SQLite: 28 passed, 1 PostgreSQL-only skip. Disposable PostgreSQL: 29 passed, including both concurrent request orderings. Device-test frontend and Chromium Retry passed. | Final report release blocker fixes section |
| Deployment/store | Preparation checklist ready for review; production settings, live identity/services, official distribution signing, privacy/content and store acceptance remain open. | Final report deployment checklist |

## Blocker fixes and release decision

- **Deletion/save race fixed.** When deletion commits first, the in-flight save returns 401. When a save commits first, deletion waits for it and then removes the saved row. Both orderings passed on disposable PostgreSQL. Verify on managed staging and agree the public account/API scope.
- **Quran index recovery fixed.** The built route showed an error and Retry after HTTP failure, invalid data and a stalled body, then rendered the Surah list. Verify on the final signed Android and iOS builds.
- **Configuration and release evidence:** synthetic compilation is not production service validation. Verify real HTTPS API/VersionHub, Google registrations and iOS callback, official signed AAB/archive, compatible upgrade and artifact hashes. The separately signed test IPA uses a different bundle ID.
- **Physical evidence:** retain owner-confirmed observations without expanding them into blanket passes. Attach existing per-platform sheets and identify any missing critical checks against the final signed candidates.
- **Scope limits:** iOS short 25-second sound with Open prayer times; Android full playback/Stop; up to seven days of reminder coverage with online reopening; six Umrah and three women's recordings intentionally unavailable. Privacy/retention/content owners must accept the scope and supply store declarations.

## Preservation and approval

Zakath Ledger remains **Coming Soon** and inaccessible through normal navigation. Its legacy route/API still exist; navigation is not backend access control. Original database SHA-256 remains `4aa2aa74377e869129c246cc5f29d090479d2024da1e98247dd865291687fee0`. An isolated migration rehearsal preserved all three existing rows.

The follow-up changed the two approved code paths, their tests and the two handover documents. The database checksum matches and no schema migration was needed. No deployment, store upload, publication, commit or push occurred. Further implementation or rollout work requires approval.
