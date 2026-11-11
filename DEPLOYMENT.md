# Deployment readiness

## Shared frontend and mobile build

1. Copy `.env.example` to `.env.production`.
2. Set `VITE_API_BASE_URL` to the public HTTPS backend URL.
3. Set `VITE_GOOGLE_CLIENT_ID` to the production Google OAuth client ID.
4. Configure VersionHub:
   - `VITE_VERSIONHUB_URL` is the public HTTPS `/api/v1/version-check` endpoint.
   - `VITE_VERSIONHUB_APP_KEY` matches one configured `MOBILE_VERSION_API_KEYS` value.
   - `VITE_VERSIONHUB_APPLICATION_NAME` matches the VersionHub release records (default `muslim-plus`).
5. Run `npm ci`, `npm run test:rating`, and `npm run mobile:sync` to test, build once, and copy the same web application into iOS and Android.

## iOS handoff

1. Install the latest supported Xcode and select it with `xcode-select`.
2. Run `npm run ios:open`.
3. Configure the Apple developer team, bundle signing, capabilities, and App Store distribution profile.
4. Confirm location and notification permission prompts on a real iPhone.
5. Archive in Xcode, validate the archive, and upload it to App Store Connect/TestFlight.

The iOS bundle ID is `com.muslimplus.app`.

## Android handoff

1. Install Android Studio, its bundled JDK, Android SDK 36, and the platform build tools.
2. Run `npm run android:open` and allow Android Studio to complete Gradle sync.
3. Confirm the package ID `com.muslimplus.app` is available in Google Play Console.
4. Create or securely obtain the upload keystore. Do not commit keystore files or passwords.
5. Configure release signing outside source control, then create a signed Android App Bundle (`.aab`).
6. Test location, notification permissions, Qibla sensors, audio, Google login, Zakat history, and process restoration on real Android devices.
7. Upload the `.aab` to an internal testing track before production rollout.

Android supports API 24 and newer and targets API 36. Release builds reject cleartext HTTP traffic, so `VITE_API_BASE_URL` must use HTTPS.

The frontend must be rebuilt after changing any `VITE_*` value. A physical phone cannot use `localhost` to reach the backend.

## Django backend

Use Python 3.11 or newer and install `backend/requirements.txt`. Configure these environment variables on the hosting platform:

- `DJANGO_DEBUG=false`
- `DJANGO_SECRET_KEY` with a long random value
- `DJANGO_ALLOWED_HOSTS` with the backend host name
- `DJANGO_CORS_ALLOWED_ORIGINS` with the deployed web origin, if a web build is hosted
- `DJANGO_CSRF_TRUSTED_ORIGINS` with trusted HTTPS origins
- `DJANGO_SECURE_SSL_REDIRECT=true` when the platform forwards HTTPS correctly
- `DJANGO_SECURE_HSTS_SECONDS=31536000` only after HTTPS is confirmed across the deployment
- `GOOGLE_CLIENT_ID` matching the frontend OAuth client

Before starting the service, run:

```sh
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check --deploy
```

Start the WSGI service with:

```sh
gunicorn zakatledger.wsgi:application
```

SQLite is suitable for local testing only. Use a managed PostgreSQL database before a multi-instance or production backend deployment.

## Release gate

- Confirm all backend tests pass.
- Confirm the production frontend build succeeds.
- Test Google login, Zakat save/history/delete, location permission, notifications, audio, and offline/error states on a real iPhone.
- Repeat the same acceptance test on at least one Android phone and one current emulator image.
- Supply App Store privacy details for location, notifications, identifiers, and network services.
- Complete Google Play Data Safety and content declarations.
- Confirm expired or missing access tokens cannot read, save, or delete calculation history.
- Confirm VersionHub returns `no_action`, `optional`, and `mandatory` correctly for both platforms.
- Confirm optional updates can be dismissed and mandatory updates cannot be dismissed.
- Test native rating prompts from TestFlight/App Store development and Google Play internal testing; sideloaded Android APKs are not reliable for this API.

Rating and application-version behavior use the translated reusable review service and VersionHub API.

## Stage 3.1 production service configuration

Install `backend/requirements-production.txt` to add the reviewed PostgreSQL and Redis drivers. Set `DJANGO_DB_ENGINE=postgresql` and `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, optionally `POSTGRES_PORT` (5432) and `POSTGRES_SSLMODE` (verify-full). Provide the managed provider's CA/trust setup for hostname verification; do not disable TLS to pass a check. SQLite stays the local default. `DJANGO_SQLITE_PATH` can point to a disposable test database. Never run production migrations against the original local database.

Set `DJANGO_CACHE_LOCATION` to the managed Redis URL (`rediss://` for TLS) for shared DRF throttle state across workers. Unset means Django's local development cache remains in use. DRF throttles are approximate application controls, not a denial-of-service boundary: configure proxy per-IP rate/connection limits, total header limits and a request body limit of 64 KiB. Application middleware rejects API bodies above 64 KiB and Accept headers above 4 KiB before DRF parsing/negotiation.

Real PostgreSQL migration/rollback/concurrency and shared Redis tests still need disposable service access. These configuration paths do not imply deployment acceptance. Do not expire deletion receipts until an approved recovery/retention policy defines how delayed deletion retries remain safe.

By default, DRF throttling uses the socket peer address and ignores client-supplied forwarding headers. Behind a trusted proxy chain, set `DJANGO_NUM_PROXIES` to its exact hop count, configure the ingress to strip or overwrite inbound `X-Forwarded-For`, and prevent direct public access to Gunicorn. Otherwise clients behind the same proxy can share a limit.
