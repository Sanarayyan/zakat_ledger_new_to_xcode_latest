# Muslim Plus Phase 1 implementation report

Date: 6 November 2026
Repository: /Users/sanarayyan/Desktop/zakat_ledger_new_to_xcode_latest
Branch: versionhub-rating-mobile-qa

Status: local implementation and automated verification completed. Phase 1 production acceptance remains pending real Google configuration and physical-device acceptance. Phase 2 has not started. Nothing was deployed, published, committed, or pushed.

The starting folder already contained extensive modified and untracked work. These changes build on that working state; the entire Git diff is not exclusively Phase 1. A pre-change source backup was saved at /tmp/muslimplus-before-phase1.tar.gz. The existing backend/db.sqlite3 was not migrated or rewritten.

## 1. Calculations and business logic

Before: React and Python had separate calculations, the backend accepted malformed/negative values, prices could be zero, purity prices were rounded to whole rupees before multiplication, and below-threshold amounts were saved as positive dues.

Implemented:
- Backend input validation for category/year/type, currency, finite nonnegative values, numerical limits, percentages, whole livestock counts, purity, and entry counts.
- Decimal arithmetic and half-up rounding to two currency decimals. The frontend uses decimal.js and the backend uses Python Decimal.
- Pure-gold-equivalent weight multiplied by the 24K price without first rounding each purity price to whole rupees.
- Below-threshold and incomplete-Hawl payable amounts become zero. Stock purification is independent of Hawl.
- Animal obligations and cattle-derived monetary assets are represented separately. Monetary eligibility is checked separately from animal count.
- Large camel/cow herds beyond the existing tables are rejected with an explanation; no new religious schedule was invented.
- Normal app submissions show the authoritative server result. Local device-test calculations run the same regression examples and are explicitly unsaved.
- A UUID request ID prevents an uncertain network retry from inserting the same calculation twice. Reusing an ID with changed input returns a conflict.
- Snapshots include only supported calculation fields, not arbitrary supplied personal data or tokens.
- Old-account request results are discarded after logout/account changes.

Files: backend/api/calculations.py, views.py, models.py, serializers.py; src/services/zakatCalculator.mjs, ledgerService.mjs, requestScope.mjs; src/App.jsx; shared regression fixtures and tests.

Preserved assumptions: 87.48g gold threshold; existing purity factors; 2.5% Islamic / 2.577% solar rates; existing livestock tables; 25% investment-stock zakatable-base assumption. These still require qualified religious review. The app remains INR-only. The cattle-trading field is clarified as market value, consistent with its existing explanatory text, with a warning not to double-count the same animals.

## 2. Calculation history

Before: history could display a positive due where the result dialog displayed NIL. Cattle obligations were reduced to money, and old category-total errors could remain visible.

Implemented:
- Versioned result snapshots for new calculations.
- History and detail serializers consistently report payable values.
- Existing rows are interpreted using their stored result components, without rewriting the historical input, price, or database row.
- Below-threshold historical amounts show zero; stock history uses its stock result; cattle profit eligibility is evaluated independently of livestock eligibility.
- Cattle history displays the animal obligation alongside money. Currency displays retain two decimals.

Historical rows cannot recover information that was never saved correctly. They are not silently recalculated using today's market price.

## 3. Gold-price reliability

Before: direct gold/exchange requests used a hardcoded 1.0767 retail premium; failures could leave a zero or old price usable.

Implemented:
- Bounded network requests and validation of provider prices, exchange rates and timestamps.
- Decimal spot conversion with no undocumented retail premium.
- Explicit market-estimate label and checked timestamp.
- Manual positive-price entry and an explicit "I checked this price today" action.
- Required price source and verification time; affected calculations reject missing, zero, future-dated or over-24-hour prices on both client and server.
- Late provider responses do not overwrite a user-entered manual price.

A successful read-only request to the actual public providers returned a valid quote during verification. Market services can still fail, including outside their freshness window; the verified-manual-price path handles that honestly. Client timestamps describe the submitted price; they are not a server-signed certification of its economic accuracy.

Files: src/services/goldPriceService.mjs, zakatCalculator.mjs, src/App.jsx, backend/api/calculations.py, tests.

## 4. Google authentication and server sessions

Before: native screens rendered the browser Google widget; the backend issued a 30-day signed email token with no server revocation.

Implemented:
- Native Google integration through @capgo/capacitor-social-login (Android Credential Manager / iOS Google Sign-In SDK).
- Browser Google widget retained for web, with native GoogleOAuthProvider loading disabled.
- Android activity integration and iOS URL callback handling; iOS reversed-client-ID uses an Xcode build setting rather than a dummy credential.
- Backend-generated, expiring one-time login challenge and nonce, checked against the verified Google token.
- Explicit allowed Google token audiences and verified-email/subject checks.
- Cryptographically random seven-day app tokens. Only SHA-256 token hashes are saved in the server database.
- Google subject binding, rejecting an unexpected subject/email reassignment instead of silently moving records.
- Logout revokes the server session; account-data deletion revokes all sessions for that user.
- Login throttling, bounded Google transport requests, generic public errors and no-store API responses.
- Native session persistence uses protected storage. Browser access tokens remain in memory and require login after a page reload.
- Legacy signed sessions intentionally require fresh login; personal ledger records remain.

No successful live Google login is claimed. Missing deployment-team registrations cannot be replaced with dummy IDs. Tests exercise the actual session/challenge implementation and failure cases; no successful Google verification was faked.

Files: backend/api/authentication.py, models.py, views.py, urls.py, middleware.py, migrations 0002/0003; src/services/authService.js; src/components/GoogleSignInButton.jsx; src/App.jsx, main.jsx; Android MainActivity; iOS AppDelegate.swift / Info.plist; package/config files.

## 5. Personal data protection

Before: financial, reading, location, gender and period information used plain WebView localStorage. A frontend developer panel included a hardcoded password and destructive local-data controls.

Implemented:
- Native protected storage through @aparajita/capacitor-secure-storage (iOS Keychain / Android Keystore-backed encryption).
- Same existing storage keys and values, with a synchronous in-memory view and serialized native writes.
- Legacy migration copies and reads back each value before deleting its plain-storage copy. Migration failures retain unmigrated source data; write failures show a visible retry notice.
- No plaintext fallback if native protected storage fails; iCloud synchronization disabled and device-only unlocked Keychain access selected.
- Existing local ledger/profile loading is gated before saving, avoiding initial-state overwrites.
- Android cloud backup and device-transfer exclusions for personal application data.
- Frontend hardcoded-password admin panel removed. Django's authenticated server admin was left intact.
- Settings explains local/cloud storage and offers explicit data deletion. Cloud deletion requires a current authenticated session; signed-out device-only deletion has an extra explanation/confirmation.
- Deletion cancels app reminders, stops Adhan, clears protected device data and rating preferences, and reloads the app. It never deletes the user's Google account.
- Error screen no longer displays implementation stack details; prayer-completion debug logging removed.

Existing screens using localStorage now use appStorage. This is the reason storage-call edits span contexts, settings, onboarding, guides, reading, dashboard and update components; Phase 2 feature behavior was not implemented.

Browser personal content retains browser-local storage; only tokens moved to memory. Native storage migration and phone lifecycle behavior require actual-device acceptance. Protected data is available to app code while the app is unlocked; storage encryption does not make script-injection protections unnecessary. Android backup exclusion also means users must not expect recipient records to restore on a new phone.

## 6. Dependencies and build changes

- Django upgraded to 5.2.19, REST Framework 3.16.1, django-cors-headers 4.9.0.
- google-auth[requests] explicitly installs the HTTP transport required by Google verification.
- Backend defaults to debug off and requires a non-development secret; local development must explicitly opt into debug. Production HTTPS redirection defaults on.
- Capacitor core/Android/iOS/CLI upgraded to 8.6.0 after finding a critical internal-HTTP-proxy origin advisory in the earlier runtimes.
- Compatible router, Vite and transitive security patches applied without forced major upgrades.
- Node >=22.12.0 recorded. Verification used the available Node 24 runtime for native sync.
- Capacitor generated Android/iOS dependency files updated and final device-test web assets copied to both platforms.
- Two additive Django migrations created and tested in isolated databases. They have NOT been applied to the existing database.

The full npm audit still reports 10 development-tool advisories (including one critical), principally in the existing asset-generation dependency tree. Production dependency audit reports zero advisories. No major asset-generator migration was forced into this task.

## 7. Actual verification results

| Check | Result |
| --- | --- |
| Django tests | 18 methods passed; real ORM/database operations, ownership, legacy history, idempotency, challenge replay/expiry/nonce, token expiry/tampering/logout/deletion |
| JavaScript suite | 51 tests passed, zero failures/skips with PHASE1_TEST_PYTHON configured |
| JS-to-Django integration | Actual HTTP service and isolated in-memory Django database; save/retry/history/delete/logout/validation and every shared financial regression compared between JS and Python |
| Storage migration tests | Actual temporary-disk persistence, migration verification, legacy token removal, subsequent writes, deletion and failure retention; not a substitute for native storage testing |
| Real price providers | Read-only request succeeded and passed validation |
| Django system check | Passed, no issues |
| Migration consistency | No missing migrations |
| Python dependency consistency | pip check passed |
| Frontend device-test build | Passed |
| Capacitor Android/iOS sync | Passed |
| Android debug compilation and unit task | Passed |
| Unsigned iOS Simulator compilation | Passed |
| Production configuration gate | Correctly rejects missing production HTTPS backend settings |
| Production npm dependency audit | 0 vulnerabilities |
| Whitespace/diff check | Passed |

Existing unrelated helper tests may use injected services. New financial/API verification uses actual calculation code and the actual local backend; no fake production service, dummy Google credential or artificial success implementation was introduced. Shared financial examples are explicit test inputs, never production identities or production configuration.

Logs: /tmp/muslimplus-phase1-tests.log, /tmp/muslimplus-phase1-android.log, /tmp/muslimplus-phase1-ios.log, /tmp/muslimplus-phase1-build.log, /tmp/muslimplus-phase1-sync.log.

Backend tests:
DJANGO_DEBUG=true /tmp/muslimplus-phase1-arm64-venv/bin/python -B backend/manage.py test api

Full JS tests including real Django HTTP integration:
PHASE1_TEST_PYTHON=/tmp/muslimplus-phase1-arm64-venv/bin/python npm test

The temporary Python environment contains the actual backend requirements. The resumed session changed CPU architecture; the earlier compiled environment was replaced by this compatible environment and the checks were rerun. On another machine, replace that path with its environment's Python. Without PHASE1_TEST_PYTHON, the HTTP integration tests explicitly skip and do not claim success.

## 8. Required deployment-team inputs and remaining Phase 1 acceptance

The owner confirmed these have not yet been supplied:
1. Staging/production HTTPS backend URL.
2. Google Web OAuth client ID for VITE_GOOGLE_CLIENT_ID and the backend GOOGLE_CLIENT_IDS allowlist.
3. Google Android OAuth registrations for com.muslimplus.app with signing SHA-1 fingerprints (debug, installed release and Google Play signing as applicable; provide SHA-256 for the team records too). The Android client ID is registered in Google Cloud, not substituted for the Web/server client ID.
4. Google iOS client ID for VITE_GOOGLE_IOS_CLIENT_ID and its reversed ID for GOOGLE_REVERSED_CLIENT_ID in Xcode build settings.
5. OAuth consent/test-user configuration and browser authorized origins.
6. An actual production Django secret, allowed hosts, native/web CORS origins, and HTTPS proxy configuration. Secrets must be configured on the server, not pasted into frontend files.

Once supplied, apply the new migrations to an approved backed-up environment, build an ordinary configured candidate, and verify Google login/cancel/logout/relogin/expiry and cloud ownership/deletion on both platforms. Existing production clients using the old signed token protocol will require a coordinated client/backend rollout and fresh login.

Before approving Phase 1 for public use, also verify migration over an installed app with real disposable local records, force-close/reopen, save failures, account switching, storage failure/retry, device-only vs cloud deletion, and iPhone/Android lifecycle behavior. Run an interactive visual acceptance pass for the necessary price/Hawl/privacy controls and Malayalam wording. No real phone installation or live signed-in UI test was performed in this session.

A qualified reviewer still needs to approve the preserved religious calculation assumptions. Native authentication integration compiling does not prove Google Cloud registration correctness. No credentials, certificates, signing keys or production URLs were invented. No store signing, release publishing or Phase 2 work was performed.
