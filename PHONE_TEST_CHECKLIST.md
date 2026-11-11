# Phone test checklist — Muslim Plus (11 Nov 2026)

> **Result (11 Nov 2026):** the owner tested this build on an iPhone (Xcode) and an Android phone (APK) and reported that it works properly, with no failures. Real store builds (signed, with production settings) must be checked again by the deploy team.

Use this to test the latest code on a real iPhone and a real Android phone.
Mark each line **Pass**, **Fail** or **Skip**. If something fails, take a screenshot and write one line about what you saw.

- Code branch: `qa/ui-fixes-cycle1`
- Android version: 1.0.3 (build 4). iOS version: 1.0 (build 1).
- This is a **test build**. Settings shows "DEVICE TEST BUILD". Google login and cloud save are switched off in this build.

---

## Part A — Install the app

### iPhone (Xcode)
1. Connect the iPhone with a cable and unlock it.
2. Open `ios/App/App.xcodeproj` in Xcode (or run `npm run ios:open`).
3. At the top, pick the **App** scheme and your iPhone.
4. Press **Run** (▶). Wait for the app to open on the phone.
5. If Xcode asks about signing, pick your team in *Signing & Capabilities*.

The iOS project already has the latest code copied in, so you don't need to build anything else first.
If you change the web code later, run `npm run mobile:sync:device-test` with Node 22 first, then press Run again.

### Android (APK file)
1. Copy this file to the phone: `android/app/build/outputs/apk/debug/app-debug.apk`
   (SHA-256 `d22d85c3e766798a912a083c05d4b6a88ef2133174c02e93b701209d310bdd69`)
2. On the phone, open the file and tap **Install**. Allow "install unknown apps" if asked.
3. Install it **over** the old test app. Don't uninstall first, so you can check that your data is kept.

---

## Part B — Basic checks (both phones)

| # | What to do | What should happen | iPhone | Android |
|---|---|---|---|---|
| B1 | Open the app | Splash screen, then Home or onboarding. No crash, no white screen | | |
| B2 | Close the app fully and open it again | Your settings and city are still there | | |
| B3 | Settings | "DEVICE TEST BUILD" note is shown | | |
| B4 | Go through onboarding (fresh install, or Settings → "Delete my app data" on a test phone only) | Steps work. The dots at the bottom don't cover the city list | | |
| B5 | Onboarding: choose Madhab and gender | The chosen option is highlighted | | |
| B6 | Bottom bar: tap Home, Quran, Prayer, More | Each opens the right screen | | |
| B7 | Phone **back** button / swipe back | Goes to the previous screen and doesn't close the app by mistake | | |

## Part C — Fixes from this test round (please check each one)

| # | What to do | What should happen | iPhone | Android |
|---|---|---|---|---|
| C1 | Prayer Times, light theme | The next-prayer row is coloured and easy to read (not a blank white card) | | |
| C2 | Umrah Guide → search "Tawaf" | Matching content shows. Search for "zzzz" → "No results found in this section" | | |
| C3 | Bottom bar and Quran reader menu | The words "more" or "TEXT_SIZE" never appear; you see proper labels | | |
| C4 | Settings → notification text | Text is inside a card and easy to read | | |
| C5 | Ratheeb → start reading | The highlighted section is easy to read | | |
| C6 | Women's Guidance → tracker | Heading and text are on a card, easy to read | | |
| C7 | Quran → open a Surah | The small "Read mode" button sits on the left and doesn't cover the verses | | |
| C8 | Quran reader → menu (settings) | The menu has a solid background and is easy to read | | |
| C9 | Switch to Malayalam, look at Home, Quran, Settings | Malayalam labels show; no English key words like "tab_audio" | | |
| C10 | Dark theme and light theme | All the screens above are readable in both themes | | |
| C11 | (Optional) Turn on VoiceOver (iPhone) / TalkBack (Android) | Back, Settings and Play buttons are read out by name. Home tiles are read out as buttons/links | | |

## Part D — Phone-only features (can't be tested in a browser)

| # | What to do | What should happen | iPhone | Android |
|---|---|---|---|---|
| D1 | Allow location when asked | City and prayer times load (may take up to ~30 seconds) | | |
| D2 | Deny location, then pick a city by hand | The app explains why and lets you choose a city; prayer times load | | |
| D3 | Prayer times vs. a trusted source | Times match within a few minutes for your city and Madhab | | |
| D4 | Settings → "Test Adhan notification in 10 seconds", then lock the phone | A notification comes with Adhan sound. Android: **Stop Adhan** stops it | | |
| D5 | Turn on prayer notifications, lock the phone before the next prayer | Notification comes once, on time (write down how many minutes late, if any) | | |
| D6 | Android only: deny "Alarms & reminders" permission | The app shows a clear message about it | — | |
| D7 | Qibla, away from metal | Compass moves when you turn; the direction looks right | | |
| D8 | Quran: play a verse, then lock the phone or take a call | Audio pauses or keeps going in a sensible way; no crash | | |
| D9 | Ratheeb audio play / pause | Works; position is kept after leaving and coming back | | |
| D10 | Airplane mode, open Quran | An error with **Retry** appears. Turn the network back on and tap Retry → the list loads | | |
| D11 | More → Zakath tile | Shows "Coming Soon"; doesn't open the ledger | | |
| D12 | Small screen and large text size (phone settings) | Nothing is cut off or overlapping on the main screens | | |
| D13 | iPhone only: top notch and bottom bar area | Nothing hidden under the notch or home bar | | — |

---

## How to report back

Send me only the lines that are **Fail**, with:
- the line number (e.g. "D5 Android"),
- phone model and OS version,
- one sentence about what happened, plus a screenshot.

I'll fix those, rebuild, and give you a short list of lines to test again.
