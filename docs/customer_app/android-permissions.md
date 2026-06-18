# Android permissions & config — Customer App

All declared in [`android/app/src/main/AndroidManifest.xml`](../../apps/customer_app/android/app/src/main/AndroidManifest.xml).

| Permission | Why | Notes |
|-----------|-----|-------|
| `INTERNET` | REST + WebSocket | Always required |
| `ACCESS_NETWORK_STATE` | connectivity awareness | — |
| `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | current location, address-picker pin, tracking context | Requested at runtime by geolocator |
| `POST_NOTIFICATIONS` | FCM push (Android 13+) | Requested at runtime at login |
| `READ_MEDIA_IMAGES` | pick prescription image (Android 13+) | image_picker |
| `READ_EXTERNAL_STORAGE` (maxSdk 32) | legacy image pick (≤ Android 12) | image_picker |
| `CAMERA` | optional: capture prescription | only if camera source enabled |

## Runtime permission UX
- **Location** is requested when the user taps "Use current location" in the address picker.
  Denial is handled gracefully (falls back to Bhadrachalam centre / manual pin).
- **Notifications** permission is requested right after login.
- **Photos** permission is requested by image_picker when attaching a prescription.

## Network security
- `android:networkSecurityConfig="@xml/network_security_config"` permits **cleartext only** for
  `10.0.2.2`, `localhost`, `127.0.0.1` (local dev). All other traffic must be HTTPS — production
  uses `https://api.kawkaw.in`.

## Gradle requirements
- `minSdkVersion 23` (Firebase Auth), `compileSdk`/`targetSdk` 34+.
- Apply `com.google.gms.google-services` and add `google-services.json` (see firebase-setup.md).
- `applicationId` = `in.kawkaw.customer`.

## OSM tile policy
- A descriptive `userAgentPackageName` (`in.kawkaw.customer`) is set on every `TileLayer` and a
  `User-Agent` header on Nominatim requests, per the OpenStreetMap usage policy. For production
  scale, host your own tiles/Nominatim/OSRM or use a commercial OSM provider.
