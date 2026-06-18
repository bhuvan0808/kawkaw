# Foreground Service — Validation Checklist

The rider app shares location through an Android **foreground service**
(`flutter_foreground_task`) so updates continue when the screen is locked.
Implementation: `lib/core/location/background_location_service.dart` (control) +
`lib/core/location/location_task_handler.dart` (isolate).

## Manifest / build prerequisites
- [ ] `AndroidManifest.xml` declares: `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`,
      `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `WAKE_LOCK`,
      `POST_NOTIFICATIONS`.
- [ ] The `<service ... foregroundServiceType="location">` entry is present.
- [ ] `compileSdk`/`targetSdk` 34+ and `minSdk 23`.
- [ ] On Android 14+, the typed foreground-service permission is granted at runtime via location permission.

## Lifecycle
- [ ] Going **Online** starts the service and shows a persistent notification.
- [ ] `onStart` fires once; `onRepeatEvent` fires on the configured interval (`AppConfig.locationIntervalMs` = 12s).
- [ ] Each tick reads GPS and `POST /riders/me/location` succeeds (watch backend logs / DB `rider_locations`).
- [ ] The UI receives `sendDataToMain` pings (Dashboard "Location shared at …").
- [ ] Going **Offline** calls `stopService`; the notification disappears and ticks stop.

## Resilience
- [ ] **Screen locked 5 min** → ticks continue (verify continuous `rider_locations` rows).
- [ ] **App swiped from recents** while online → service keeps running (foreground services survive task removal); notification remains.
- [ ] **Token refresh:** after the access token rotates, returning to the app updates the isolate token (`refreshServiceToken`); posts resume without re-login.
- [ ] **Reboot:** `autoRunOnBoot` is false by design — the rider re-opens the app and toggles online again.

## Battery optimization (requirement #2)
- [ ] `isIgnoringBatteryOptimizations()` reflects the device state.
- [ ] When optimization is ON, the Dashboard shows the warning + "Fix" → `requestIgnoreBatteryOptimization()` / settings.
- [ ] After allowing unrestricted activity, locked-screen updates remain steady on OEM devices.

## Notes
- The foreground-service module is the most plugin‑version‑sensitive code in the app. After
  `flutter pub get`, run `flutter analyze` and reconcile any `flutter_foreground_task` API
  differences for the resolved version before field testing.
