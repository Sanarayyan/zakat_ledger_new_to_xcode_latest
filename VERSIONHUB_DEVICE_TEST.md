# Real VersionHub test on Android

This test uses the existing VersionHub project at `/Users/sanarayyan/Desktop/version_hub`, not the simulated update buttons.

The API is `http://192.168.109.147:8001/api/v1/version-check`. Its response comes directly from `/Users/sanarayyan/Desktop/version_hub/backend/versions.json`. That file has not been changed by this setup. The current Android entry announces version `5.0.0`, mandatory, with a placeholder store link. This will block an installed `1.0.2` app with the real update message; the placeholder cannot install an update.

1. Keep the Mac and Android phone on the same Wi-Fi, with the Mac awake and the server running.
2. Install `build/versionhub-live/muslim-plus-1.0.2-build-3-versionhub.apk` over the existing test app without uninstalling.
3. Close and reopen the app. Expect the real JSON's title, description, mandatory policy, and target version `5.0.0`.
4. In PyCharm, change only `muslim_plus.android` in VersionHub's `backend/versions.json` when practising. Save the file, then fully close and reopen the Android app; a server restart is unnecessary.
5. Setting `latestVersion` to `1.0.2` must remove the update popup for installed version `1.0.2`. Setting a higher version with `updateType: "optional"` must show a dismissible message. Using `"mandatory"` must remove Later.

For an actual upgrade exercise, announce the next version in this JSON, manually increase Android's `versionName` and `versionCode`, build the next APK, and install it over the old app. The message should disappear once the installed version matches the announced version; saved data should remain. Do not announce a version to real users until its app is available to download.

## Local configuration

The app's ignored `.env.device-test.local` enables `VITE_VERSIONHUB_LIVE_TEST=true`, configures the endpoint, and supplies the existing VersionHub mobile API key. The real-test flag bypasses saved simulated responses and hides simulation buttons. Native version numbers were not changed by this setup. Android allows local HTTP only through its debug manifest; release builds do not inherit this manifest.

The temporary server launcher is `scratch/versionhub-live/serve.py`. Start it from this app's project root with:

```sh
PYTHONDONTWRITEBYTECODE=1 /Users/sanarayyan/Desktop/version_hub/backend/.venv312/bin/python scratch/versionhub-live/serve.py
```

It runs the existing backend with temporary LAN host settings. It does not change the VersionHub source, JSON, or database. If the Mac's Wi-Fi address changes, update the endpoint in `.env.device-test.local` and the allowed address in the launcher, then restart the server and rebuild the APK.

Verified: the actual HTTP endpoint returns mandatory for `1.0.2` against the current JSON target `5.0.0`, and no action for `5.0.0`. All 30 JavaScript tests passed. Android phone connectivity and the actual on-device popup still need the user's test.
