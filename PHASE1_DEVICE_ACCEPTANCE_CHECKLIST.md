# Phase 1 physical-device acceptance checklist

Prepared 6 November 2026. All boxes below are PENDING, not passed.

Updated 9 November 2026: shared recovery/conflict/startup fixes and automated checks now pass; see `PHASE1_SHARED_CORRECTIONS_REPORT.md`. Physical checks remain pending. **Zakath Ledger is Coming Soon. Do not enable or enter calculator screens for this release.** Use accessible existing non-calculator flows for account tests; if no authentication entry is exposed in the candidate, record that as an acceptance blocker rather than enabling Ledger.

Use an authorized Android phone and an authorized physical iPhone. A Simulator build, helper test, debug APK or disk-storage adapter cannot certify these checks. Do not uninstall a copy containing important information. Migration tests require an upgrade over the old app with the same app ID and signing identity.

## Test prerequisites and evidence

- [ ] Verify the implemented deletion-recovery and migration-conflict corrections on this candidate; unit/HTTP tests alone do not certify native storage.
- [ ] Obtain the actual staging HTTPS backend, Google registrations and signing identities. Use two real, authorized tester accounts A and B. Never put passwords or raw tokens in test notes.
- [ ] Build a normally configured staging candidate. The existing device-test mode bypasses Google and cloud save, so it cannot pass the authentication/cloud rows below.
- [ ] Record APK/IPA provenance, version/build, package/bundle ID, signing certificate fingerprint/team, build mode, backend environment, commit/working-tree manifest, device model, OS version, WebView version on Android, tester, date and evidence link.
- [ ] Preserve a verified recovery copy of important local data using an authorized method. The source-code tar backup does not contain all user-device records.
- [ ] Agree what uninstall/reinstall, phone replacement, offline logout, expired login and device-shared reading/period data should do. Android backup is disabled; iOS Keychain values can survive uninstall.
- [ ] Confirm the independent update service does not trap this staging candidate behind an unavailable mandatory release. Do not change public update settings to facilitate tests.

For every row, record Expected / Actual / PASS or FAIL / screenshot or redacted log. A blank row is not a pass.

## Android-specific tests

- [ ] Confirm installed applicationId is com.muslimplus.app and signing SHA-1 matches its Google Android OAuth registration. Repeat for each signing identity actually used: local debug, installed release, and Play App Signing where applicable. The upload-key fingerprint alone does not certify Play-installed apps.
- [ ] Confirm the native Google account picker/Credential Manager appears; no embedded-web Google widget is used. Test cancellation, selection, consent, no-account device, more than one Google account, offline start and return from background.
- [ ] Confirm the Web OAuth ID is used as the ID-token audience and the backend allows it. Check Google project/package/fingerprint mismatches produce a clear error and no app session.
- [ ] Upgrade over the old signed app containing disposable recipient/group records, custom columns, Quran bookmarks, reading position, Tasbih sessions, prayer completion/settings, gender and period/cycle values. Compare each after migration and after a second restart.
- [ ] In a debuggable acceptance build, inspect migration without logging values: matching/new copies leave plain storage only after verification. Seed conflicting disposable values; both originals and a protected recovery copy must survive restart, with a visible notice. Conflicting plain copies are intentionally retained until resolved or explicitly deleted.
- [ ] Edit a record and rapidly background, lock, force-stop and reopen. Repeat for a large realistic ledger and Tasbih counting. No acknowledged edit may disappear. Explicitly test failed storage writes and retry.
- [ ] Reboot, unlock and relaunch. Confirm access to protected values and clear recovery errors where storage/keys are unavailable.
- [ ] Verify backup/device-transfer exclusions on the actual Android versions in scope. Do not infer restore guarantees from manifest inspection alone.
- [ ] Test denied/revoked location and notification permissions, approximate location, GPS off, manual city, Qibla, local/streaming audio, Adhan Stop and existing reminder behavior. Record known earlier-phase reminder limitations separately; do not mark them fixed by Phase 1.
- [ ] Test system Back, keyboard, status/navigation bars, small screen, English/Malayalam, light/dark theme, large font and TalkBack.
- [ ] A disposable uninstall/reinstall test must start without Android protected app data. Do not perform it on a phone with important local-only records.

## iPhone-specific tests

- [ ] Confirm bundle ID com.muslimplus.app and the intended Apple team/profile. Use an authorized device build; unsigned Simulator success is insufficient.
- [ ] Confirm VITE_GOOGLE_IOS_CLIENT_ID belongs to that bundle ID and Google project. Confirm GOOGLE_REVERSED_CLIENT_ID expands to the exact reversed iOS ID in the compiled Info.plist for the candidate’s configuration. An empty URL scheme is a failure.
- [ ] Confirm the Google Sign-In SDK returns control through AppDelegate and the registered URL scheme. Test account selection, cancellation, app switching, locked return, offline failure and multi-account use.
- [ ] Verify token audience is the Web/server client ID supplied as iOSServerClientId, then verify successful backend challenge/nonce exchange using real Google sign-in.
- [ ] Upgrade over the old app without uninstalling. Verify every migrated category listed in the Android section and compare after restart.
- [ ] Test Keychain access after reboot and before/after first unlock, locked background writes, app interruption and force-close. A protected-storage failure must not lead to empty records overwriting existing ones.
- [ ] Confirm iCloud synchronization is off and device-only access is effective. Check local data behavior with encrypted backups/device replacement according to the approved policy.
- [ ] Test disposable uninstall/reinstall separately: Keychain data may remain. Confirm stale sessions and financial/period data do not reappear contrary to the approved reinstall policy. Do not assume uninstall is data deletion.
- [ ] Test local/streaming audio interruptions, Quran reading/reciter settings, Qibla sensors, location and notifications denied/revoked, screen rotation, safe areas, English/Malayalam, Dynamic Type and VoiceOver.
- [ ] Confirm the advertised reminder experience matches the existing iOS implementation. Android’s custom full Adhan service/Stop action is not provided by this Phase 1 iOS integration.

## Shared account, expiry and deletion tests — run on both phones

- [ ] Sign in as A using actual Google through an approved accessible entry point. Restart and verify the profile. Use authorized staging API/test fixtures for disposable cloud records if needed; do not enable Ledger/calculator screens for this release.
- [ ] Log out online. Confirm login UI appears immediately; captured acceptance-session credentials are unusable at the backend afterward, without writing the token into evidence files.
- [ ] Sign in as B. A’s financial ledger, groups and cloud calculation history must not appear under B. Record explicitly that reading/prayer/period preferences are currently device-wide, not account-specific.
- [ ] Return to A and confirm expected retained data. Repeat rapid account switching through exposed functionality; old account responses must not populate the new account. Calculator/column/group UI checks are deferred while Ledger remains Coming Soon.
- [ ] Log out offline. Local sign-out must work; the app must accurately state that server revocation could not complete. Confirm the old server session’s eventual expiry. Agree whether that residual validity is acceptable.
- [ ] Expire/revoke a session only in an approved disposable staging environment; do not alter production sessions for testing. Verify restore, foreground/resume, local ledger policy, save/list/delete rejection and reauthentication. Current code does not actively recheck expiry on every foreground event.
- [ ] Leave the login screen open beyond the 10-minute challenge window and retry. Confirm no success is faked and a new challenge allows a subsequent real sign-in.
- [ ] Delete while signed in as A. A’s cloud calculations, Google identity mapping and all app sessions must be gone; B’s cloud data must remain. The confirmation currently says all profiles on this device are cleared: verify that outcome deliberately on disposable data.
- [ ] Verify protected device keys, period data, saved profile, reading/Tasbih state and rating preference are removed; app reminders are cancelled; audio stops. Relaunch and verify deletion remains effective.
- [ ] Interrupt deletion after cloud success: revoke notification access, interrupt connectivity, background the app or induce an approved storage failure. Retry/reopen must complete local cleanup without getting stuck on the revoked token. Providers must not resave old data before pending cleanup finishes.
- [ ] Retry deletion after a lost successful HTTP response. It must not become impossible to clear the remaining local data.
- [ ] Interrupt before cloud confirmation, switch to B and retry. B's cloud data must remain intact. Sign back into A to authorize unfinished A deletion; receipt-only confirmation must also work after a genuinely successful A deletion.
- [ ] Interrupt journal writes, notification cancellation, protected-key removal, legacy-conflict cleanup and final journal removal separately on disposable data. Retry/reopen must preserve progress and finish safely. Repeat explicit deletion when both storage copies conflict.
- [ ] Signed-out/locally expired deletion must clearly offer device-only cleanup and explain that cloud data remains. Test cancellation at both confirmations.
- [ ] Reauthenticate after deletion and confirm no deleted cloud/local records return. The Google account itself must remain intact.

## Existing-feature regression checks

- [ ] More shows Zakath Ledger as Coming Soon; tapping it does not open the calculator. Do not enable it for testing. Calculator previews, financial UI and future religious-rule review are deferred until after this release.
- [ ] Existing feature walk-through: onboarding, gender prompt/visibility, theme/language, dashboard/daily Ayah, prayer tracking, Qibla, calendar, Quran Surah/Juz audio/bookmarks/resume/settings/autoscroll, Tasbih history/goals, Duas favorites/share, Asma, Hajj/Umrah checklists, women’s guidance, Ratheeb, update/rating.
- [ ] Check saved dark and light themes after migration and cold relaunch; protected preference must be applied before the main UI. Lock storage during startup, then unlock and use Retry; no blank preference set may overwrite existing data.

## Sign-off gate

- [ ] All acceptance blockers corrected and regression tests added.
- [ ] Full development and runtime audits rerun after approved dependency work; no unexplained critical/high build-tool exposure.
- [ ] Real Google Cloud and server configuration evidence supplied.
- [ ] Both signed physical-device test sheets completed, with no blanks treated as passes.
- [ ] Owner approves calculation assumptions, local/cloud data behavior, offline/expiry policy and rollback limitations.
- [ ] Phase 1 acceptance report updated with the actual results before any Phase 2 decision.

No device checks above were carried out by this document, and this checklist does not authorize deployment, publishing, production migrations or destructive tests against real user information.
