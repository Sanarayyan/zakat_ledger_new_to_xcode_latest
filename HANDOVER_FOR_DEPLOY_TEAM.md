# Handover to the deploy team — Muslim Plus (11 Nov 2026)

Start here. It says what the code contains, how to build it, and what your team needs to set up.
For full details, see [DEPLOYMENT.md](DEPLOYMENT.md) and [FINAL_RELEASE_ACCEPTANCE_REPORT.md](FINAL_RELEASE_ACCEPTANCE_REPORT.md).

## 1. What is in this code

- iOS and Android app (Capacitor, React). App ID on both stores: `com.muslimplus.app`.
- Django backend in `backend/` (account and Zakat history API).
- Versions: Android 1.0.3 (build 4), iOS 1.0 (build 1). Raise these numbers before each store upload.
- Latest QA round (11 Nov 2026): 11 UI bugs found and fixed, all 35 browser checks pass. Details: `QA_DOCUMENTATION/CURRENT_RUN_SUMMARY.md`.
- Zakath Ledger is intentionally **Coming Soon** (hidden in the app).

## 2. Checks done by the developer (11 Nov 2026)

| Check | Result |
|---|---|
| App unit tests (`npm test`) | 156 pass, 0 fail, 4 skipped |
| Backend tests (`manage.py test`, Python 3.12) | 28 pass, 1 skipped (PostgreSQL-only test) |
| Android debug APK build | Pass |
| iOS build (Simulator, unsigned) | Pass |
| Phone testing of this build (test build, iPhone via Xcode + Android APK) | **Pass** — owner reported on 11 Nov 2026 that both phones work properly; no failures reported. Checklist: `PHONE_TEST_CHECKLIST.md` |
| Store-mode build on phones (placeholder settings, Android release APK, iPhone Release) + Adhan stop from notification | **Pass** — owner, 11 Nov 2026 (checks P1–P9) |

## 3. Tools needed

- **Node 22 or newer.** Older Node (20) makes the copy-to-phone step fail without stopping the build.
- Xcode (current), Android Studio with SDK 36 and its Java.
- Python 3.11 or newer for the backend (the server tests won't run on 3.9).

## 4. Build commands

```sh
npm ci
npm test
# Production: create .env.production first (see section 5)
npm run mobile:sync          # builds the web app and copies it into iOS and Android
npm run ios:open             # archive and upload from Xcode
npm run android:open         # build a signed .aab from Android Studio
```

`npm run mobile:sync:device-test` makes the **test build** used for phone testing. Never upload the test build to a store.

**Store build vs test build (important):**
- Git contains **no built app files**. Xcode and Android Studio get the app only when you run a sync command.
- Always run `npm run mobile:sync` (with `.env.production`) right before archiving or building the `.aab`.
- The store build removes all test items automatically: the "DEVICE TEST BUILD — local testing only" note, the test Adhan buttons, the VersionHub test note and the local tester account. This was checked on 11 Nov 2026 with a production build that used placeholder settings.
- **Quick check before upload:** open Settings in the store build. If you see "DEVICE TEST BUILD", it is the wrong build. Run `npm run mobile:sync` again.

## 5. What your team must supply (app can't go live without these)

**App settings (`.env.production`, see `.env.example`)**
- `VITE_API_BASE_URL` — public HTTPS backend address (the build refuses http or localhost)
- `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_IOS_CLIENT_ID` — Google sign-in client IDs
- `GOOGLE_REVERSED_CLIENT_ID` — set in Xcode build settings (iOS sign-in return link)
- `VITE_VERSIONHUB_URL`, `VITE_VERSIONHUB_APP_KEY`, `VITE_VERSIONHUB_APPLICATION_NAME` — update-popup service

**Backend settings (see `backend/.env.example`)**
- `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`, `GOOGLE_CLIENT_IDS`
- PostgreSQL (`DJANGO_DB_ENGINE=postgresql` + `POSTGRES_*`) and Redis (`DJANGO_CACHE_LOCATION`) for production
- Before starting the server, run `migrate`, `collectstatic`, `check --deploy`. Start it with `gunicorn zakatledger.wsgi:application`
- Don't use or migrate the local `backend/db.sqlite3` in production.

**Signing and stores**
- Android upload keystore (kept outside git) and Play Console app
- Apple team, certificates and App Store profile for `com.muslimplus.app`
- Privacy policy, store listings, screenshots, Data Safety / App Privacy forms

## 6. Open decisions for the owner (not code bugs)

- **Sign in with Apple:** if Google login is offered on iOS, Apple may require an Apple login option too (App Review guideline 4.8). Decide before iOS submission.
- **Malayalam text:** about 32 new Malayalam labels were added in this round. A native speaker should check them.
- Suggestions from QA (not bugs): bottom bar is hidden on Quran, Tasbih and Qibla; Qibla could show a number when there's no compass.

## 7. Known limits (by design)

- Reminders cover up to 7 days; the user must open the app (online) to refill them.
- iOS plays a short (about 25 seconds) Adhan alert. Android plays the full Adhan with a Stop button.
- Android needs the "Alarms & reminders" permission for an on-time Adhan.
