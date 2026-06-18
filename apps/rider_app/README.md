# Kaw Kaw — Rider App (Flutter)

Delivery‑partner app: go online, receive assignments, navigate, and complete COD deliveries.
Reuses the `kawkaw_ui` design system and the same core patterns as the customer app, plus:

- **Background location** via an Android **foreground service** (updates every ~12s, continues when the screen is locked).
- **Battery‑optimization** detection + in‑app guidance.
- **Assignment alerts**: FCM push **+** full‑screen in‑app modal **+** sound/vibration.
- **Navigation**: in‑app OpenStreetMap route preview **+** handoff to **Google Maps / Waze**.
- **Earnings**: Today / This Week / This Month / Lifetime (backend API only).
- **Offline handling**: location updates are queued and synced when connectivity returns.

> Requires Flutter 3.27+ / Dart 3.6+.

## First-time setup

```bash
flutter create --org in.kawkaw --project-name kawkaw_rider --platforms=android .
flutter pub get
# Firebase (rider Android app). Either flutterfire, or our service-account script:
#   ANDROID_PACKAGE=in.kawkaw.kawkaw_rider node ../../services/api/scripts/firebase-autoconfig.js
#   (then add SHA-1 + enable Phone auth as for the customer app)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

Set `minSdkVersion 23` in `android/app/build.gradle.kts` (Firebase Auth). The committed
`AndroidManifest.xml` already declares the foreground service + location permissions.

## Architecture

```
lib/
├── core/
│   ├── config/        AppConfig (incl. locationIntervalMs)
│   ├── network/       Dio + auth/refresh, endpoints, errors, pagination
│   ├── storage/       secure token storage
│   ├── location/      background_location_service + location_task_handler (foreground service isolate)
│   ├── navigation/    external nav handoff (Google Maps / Waze)
│   ├── realtime/      Socket.IO (order:assigned, notifications)
│   ├── maps/          OSRM routing + device location
│   ├── router/        GoRouter (auth-guarded) + 3-tab shell
│   └── widgets/       RiderShell (assignment listener)
└── features/
    ├── auth/          Firebase phone OTP → backend JWT
    ├── rider/         profile, register, online/offline dashboard, battery guidance
    ├── orders/        queue, assignment modal, active delivery (map + nav + lifecycle)
    ├── earnings/      today/week/month/lifetime
    ├── notifications/ in-app notifications
    ├── profile/       rider profile + stats
    └── support/       help & FAQ
```

## Identity & lifecycle
Firebase Phone OTP → `POST /auth/firebase` → Kaw Kaw JWT (role `RIDER`, `riderId`).
First-time users register a vehicle (`POST /riders/register`); the app then rotates the token so
it carries the RIDER role. Going online sets status + starts the foreground location service.

## Docs
- [Rider testing checklist](../../docs/rider_app/testing-checklist.md)
- [Foreground-service validation](../../docs/rider_app/foreground-service-validation.md)
- [GPS validation](../../docs/rider_app/gps-validation.md)
- [Play Store location-permission checklist](../../docs/rider_app/play-store-location-permission.md)
