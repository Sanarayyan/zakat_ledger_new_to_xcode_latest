# Test on Android and iPhone before deployment

The `device-test` build works without a production backend or Google OAuth client. It shows a **DEVICE TEST BUILD** note in Settings and opens the Zakat feature with a local tester profile. Local ledger records use a separate test email key; existing users' ledger records are not migrated or deleted.

It does not sign into Google or send calculations to the backend. Calculation results explicitly say that they were not saved to the server. Cloud login, calculation history, and authenticated save/delete must be tested later with real staging services. Reading and audio that use external APIs still need internet access; this mode is not a fully offline app.

## Prepare both projects

Use Node 22 or newer:

```sh
npm ci
npm test
npm run mobile:sync:device-test
```

This builds the frontend with Vite's `device-test` mode and copies that same build into both native projects. Use this command again after changing the web code. `npm run mobile:sync` instead prepares a production build and requires the production environment settings.

## Android phone

An Android debug APK can be built without a Play Console account:

```sh
export JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home'
export ANDROID_HOME="$HOME/Library/Android/sdk"
cd android
./gradlew :app:assembleDebug :app:testDebugUnitTest
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`.

Transfer that APK to the Android test phone and install it, or open the Android project in Android Studio and run it on a connected phone with USB debugging enabled. Installation must be approved on the phone. This is a debug-signed test package, not an App Bundle for store submission.

The package ID remains `com.muslimplus.app`. If a differently signed copy is already installed, installation can fail. Do not uninstall an existing copy containing important local data; ask the deployment team for a separate test package ID instead.

## iPhone

The iOS project has the same test assets synced into `ios/App/App/public`. Full Xcode is required to compile/install the app; Command Line Tools alone are insufficient.

1. Install/open full Xcode and finish its setup.
2. Run `npm run ios:open`, or open `ios/App/App.xcodeproj`.
3. Select the App scheme and the connected iPhone.
4. In Signing & Capabilities, select your own authorized Apple developer team. Verify the existing bundle ID and provisioning; the repository's team setting may not belong to your team.
5. Run the app. Complete any device trust/Developer Mode setup requested by Xcode and the phone.

A signed iPhone app or TestFlight upload cannot be produced without Xcode and the appropriate signing setup. This repository does not contain a ready-to-install IPA.

## First test run

1. Open Settings and confirm the DEVICE TEST BUILD note appears. Complete or skip onboarding.
2. Open Zakat → Calculate Zakat. Open all four categories; none should crash.
3. Open Stocks and test trading stocks with 100,000 shares at 1,000 each: stock Zakat should show 2,500,000. Investment mode on the same portfolio should show 625,000. This large fictional portfolio keeps the example above the live gold-based threshold under the rates seen during this review. Stocks use the displayed 2.5% rate without a year picker. These are software regression examples using the app's existing formulas, not a validation of religious rules.
4. Test quick money, detailed assets/debts, gold purities, each cattle type, and below-threshold notices. Check the local-only message under each result.
5. Create a disposable local ledger entry and group. Close and reopen the app and verify they remain. Do not use real personal records during this test.
6. Test English/Malayalam, dark/light appearance, small-screen layout, and navigation/back.
7. On each physical device, test location allowed/denied, prayer times, notifications while locked/in the background, Qibla calibration, audio interruptions, and offline recovery. A browser or build pass cannot certify these hardware behaviors.

Use the full acceptance matrix in `RELEASE_READINESS.md` to record results separately for Android and iPhone.

## Later: test real login and cloud history

Once the deployment team supplies staging services, create `.env.production` from `.env.example` with the real HTTPS backend, Google client ID, and VersionHub settings, then run `npm run mobile:sync`. Set the matching Google client ID on the backend as well.

Production compilation rejects a missing/non-HTTPS/loopback backend URL and a missing/example Google client ID. The local tester path is compiled out of ordinary production builds. Rebuild and sync both platforms after changing any build setting.

Native Google sign-in remains a separate production blocker: the existing integration uses Google's browser sign-in component, and Google explicitly does not support Android/iOS WebViews for sign-in ([supported platforms](https://developers.google.com/identity/siwg/supported-browsers)). Before cloud acceptance testing, implement an approved native/system-browser OAuth flow with the team's platform client registrations. A successful mocked backend test does not validate native Google login. This step is not needed for the isolated local device-test build.

Test login → save → history → delete, token expiry, and two-user isolation on both devices. Re-test failure messages with the backend unavailable. Existing history rows with previously incorrect totals are not rewritten by these fixes.

## Changes for the 4 November Android test

- The test note is in Settings instead of across the top of every screen.
- Main screens share the wallpaper and plain panel backgrounds.
- Browser location no longer calls the native-only permission method. Android approximate location is accepted. Failed GPS attempts no longer save a guessed Makkah location; previous fallback records are cleared on startup.
- Home's Use Current Location button performs a new device request. Manual city selection remains available if GPS is unavailable. A city-name service failure keeps the detected coordinates.
- Qibla uses the installed native geolocation plugin's compass headings on phones, with correct watch cleanup and clear messages when sensors or location are unavailable. A desktop browser may have no live compass.
- Quran reciter choice is saved across screens. Verse continuation and the next Surah use the current choice. Verified Minshawi across three verses, then Hudhaify across verses 5–7 and into Al-Baqara in the browser. Repeat in Surah and Juz modes on the phone.

Install the updated APK over the previous debug test app, without uninstalling. Retest location after allowing permission and enabling phone Location/GPS. Real Android GPS and compass results remain pending until this device run; automated tests cannot prove that the phone is supplying a position or magnetic heading.

## Location follow-up: Android 1.0.1, build 2

The user confirmed the previous APK still failed GPS during onboarding. The next build is not certified as a physical-device GPS fix. It changes the request path as follows:

- Native permission/settings handling is allowed to complete without the previous 13-second JavaScript race. The native location timeout is now 30 seconds.
- Android can call a registered DeviceLocation plugin using the framework network/GPS providers when the main location plugin fails. It accepts only recent cached fixes (under five minutes) and removes provider listeners after success, timeout, or Activity destruction. It respects existing permission grants.
- Errors retain the original/native fallback error codes so the actual failing provider can be identified from the screen.
- The first setup step now offers a city search immediately, instead of merely postponing manual selection to another screen. City search uses Open-Meteo / GeoNames (https://open-meteo.com/en/docs/geocoding-api). It needs internet access.
- Android versionName is 1.0.1 and versionCode is 2, to identify this candidate separately from the previous build.

Install over the previous debug app, tap Allow Location/Retry, and allow time for both provider attempts. Record the displayed code if it fails. Test with approximate and precise permissions, Location switched off/on, and GPS available/unavailable. Manual city selection must allow continuing through Madhab/personalization and load prayer times for that selected city. No real-device GPS pass has been recorded.

25 JavaScript tests pass, including injected provider fallback and error propagation checks. Native compilation/unit checks pass; the existing Android unit test is a template check, not a hardware location test. Browser UI recheck was blocked because local browser use is disabled in Work settings.
