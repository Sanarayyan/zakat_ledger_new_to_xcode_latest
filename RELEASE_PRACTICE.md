# Practise an Android app update in PyCharm

The version numbers have deliberately been left for you to edit.

## 1. Install the old-version test APK

Install `build/release-practice/muslim-plus-1.0.1-update-baseline.apk` over the previous debug app, without uninstalling it.

This is a specially prepared test baseline: version 1.0.1, build 2. It includes update-popup test controls but leaves the new Android Stop Adhan feature disabled. It is not a published store release. Your earlier APK cannot receive a remote update message because it has no working VersionHub endpoint configured.

Open More → Settings → Update popup test. Try:

- **Test optional update:** shows 1.0.1 → 1.0.2 and a Later button.
- **Test mandatory update:** shows the update message without Later.
- **Update Now:** explains that this test requires installing the next APK manually. It does not pretend to download an app or link to an unpublished store listing.
- **End test simulation:** available only in device-test builds so the mandatory test cannot trap you.

After pressing a test button, the simulated response is remembered. Closing and reopening the app shows the popup again until you clear the test or install the target version. The production app uses the actual VersionHub service instead of these test controls.

Create a disposable local ledger record or change a setting before upgrading. This lets you check that your data survives the update.

## 2. Change the Android version yourself

In PyCharm open:

`android/app/build.gradle`

Find these existing lines:

```gradle
versionCode 2
versionName "1.0.1"
```

Change them to:

```gradle
versionCode 3
versionName "1.0.2"
```

`versionName` is the version people see. `versionCode` is Android's internal release number; increase it for every uploaded Android release. Editing package.json is not a substitute for changing these native values.

Save the file. No installed app changes yet; you have only changed the source project.

## 3. Build the new app

From the project root, with Node 22 or newer:

```sh
npm test
npm run mobile:sync:device-test
```

Then use Android Studio to build the debug APK, or on this Mac:

```sh
export JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home'
export ANDROID_HOME="$HOME/Library/Android/sdk"
cd android
./gradlew :app:assembleDebug :app:testDebugUnitTest
```

The new APK is `android/app/build/outputs/apk/debug/app-debug.apk`.

The normal build enables the new native Adhan service. Do not set `VITE_ADHAN_STOP_RELEASE=false`: that is only used to create the old-version learning baseline.

## 4. Install over the old app

Install the new APK without uninstalling the old app. Keep the same package ID and signing key.

Check that Settings' update-test status reports installed version 1.0.2/build 3. The simulated 1.0.2 update popup should stop appearing. Confirm your test record and settings remain.

There is no live store download in this exercise. After a real release, publish the signed new app to Google Play first, then update VersionHub's Android record to announce it and provide its real store URL.

## 5. Test Stop Adhan on the phone

In More → Settings:

1. Enable Prayer Notifications and Adhan Sound.
2. Tap **Allow Alarms & reminders** and grant that access on Android if requested. Return to the app.
3. Set an audible media volume. Tap **Test Adhan notification in 10 seconds**.
4. Lock the phone, or go to its home screen. Expand the prayer notification.
5. Tap **Stop Adhan**. Sound must stop without opening the app.
6. Run the test again: it must play again. Stopping the first sound must not disable future alerts.
7. Repeat with the app visible and in the background. Check that Adhan does not play twice and does not restart when you tap the notification body.
8. Disable Adhan Sound: the current sound stops and later prayer notifications remain silent. Disable Prayer Notifications: pending prayer reminders are cancelled.
9. Check a real prayer time, phone restart, permission denial/revocation, and audio interruption by a call or another player. Record phone model and Android version.

The Android feature uses a foreground media service with a native notification action. The recording is bundled from the URL previously streamed by this app, so playing it no longer needs an internet connection. The Stop action ends that service and releases the media player; it does not cancel future prayer alarms. The service respects audio focus and stops on focus loss or completion. System force-stop, battery restrictions, denied notifications, muted media volume, and denied exact-alarm access still affect delivery. Exact-alarm access is required for timed background Adhan playback; without it, the app explains that reminders are silent and may be delayed. Android documentation: https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start and https://developer.android.com/develop/background-work/services/alarms .

The existing scheduler covers up to seven days, ending at the loaded month's boundary. This change does not promise indefinite reminders without reopening the app.

## iPhone version numbers

For a later iPhone release, open `ios/App/App.xcodeproj/project.pbxproj` in PyCharm. Its current values are `MARKETING_VERSION = 1.0;` and `CURRENT_PROJECT_VERSION = 1;`, each present twice (Debug and Release). Set both version occurrences and both build occurrences consistently when preparing that release. They have not been edited in this task.

The notification Stop Adhan implementation in this exercise is Android-specific. It does not implement equivalent iPhone lock-screen audio controls. iPhone builds and tests must be completed separately in Xcode. This machine's current Xcode command-line tools require the owner to review/accept the Xcode licence before those tools can run; no licence was accepted by this work.

## Validation recorded

- 30 JavaScript tests pass, including schedule boundaries, muting without losing reminder times, old-version update responses, and no update at the target version.
- Android feature APK, Android instrumentation-test APK, and existing local unit tests compile/pass.
- Browser optional popup, Later dismissal, mandatory popup without Later, and test installation instructions were verified. Popups render outside clipped Settings panels and scroll on small screens.
- Native instrumentation tests verify the Stop receiver leaves future alarm settings intact and that only the playing notification exposes the Stop action. They are compiled but have not run: no Android device was attached during this work.
- Physical-device sound stopping, lock-screen behaviour, and an actual version upgrade remain for your phone test. Compilation alone does not establish those results.
