# Customer App — Play Store Readiness Checklist

The full release-build & signing steps land in **Phase 5**; this is the app-level checklist
to get the customer app submission-ready.

## App identity
- [ ] `applicationId` = `in.kawkaw.customer` (final — cannot change after first upload).
- [ ] App name "Kaw Kaw", launcher icon (`flutter_launcher_icons` or manual mipmaps).
- [ ] Version `1.0.0+1` in `pubspec.yaml` (versionName / versionCode).

## Signing
- [ ] Generate an **upload keystore**:
      `keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
- [ ] `android/key.properties` (git-ignored) + `signingConfigs` in `android/app/build.gradle`.
- [ ] Enable **Play App Signing** in the console.
- [ ] Build: `flutter build appbundle --release --dart-define=API_BASE_URL=https://api.kawkaw.in`.

## Data safety form (Google Play)
Declare what the app collects and why:
- [ ] **Phone number** — account management (Firebase Auth). Linked to user. Not sold.
- [ ] **Location (approx + precise)** — app functionality (delivery address, tracking).
      Collected at runtime; not shared with third parties beyond OSM tile/geocoding requests.
- [ ] **Photos** — only the prescription image the user attaches; used to fulfil pharmacy orders.
- [ ] **Device identifiers (FCM token)** — push notifications.
- [ ] Data encrypted in transit (HTTPS); users can request deletion (support).

## Privacy & legal
- [ ] Hosted **Privacy Policy** URL (set `AppConfig.privacyPolicyUrl`) and **Terms** URL.
- [ ] Both linked from Profile and the login screen.

## Permissions justification (for review)
- Location → delivery address selection + live order tracking.
- Notifications → order status updates.
- Photos/Camera → prescription upload for pharmacy orders.

## Store listing assets
- [ ] App icon 512×512 (PNG, no alpha for feature graphic).
- [ ] Feature graphic 1024×500.
- [ ] **Phone screenshots** (min 2; recommend 4–8): Home, Product details, Cart/Checkout,
      Live tracking, Orders.
- [ ] Short description (≤80 chars) + full description.
- [ ] Category: Food & Drink / Shopping; content rating questionnaire completed.

## Pre-launch technical
- [ ] Crash-free run on a physical device through the full order flow.
- [ ] `minSdkVersion 23`, `targetSdkVersion` current (Play requirement).
- [ ] R8/ProGuard release build works (no missing-rules crashes — test the release APK).
- [ ] Network security config: cleartext disabled for production hosts (HTTPS only).
- [ ] Backend `CORS_ORIGINS` / `API_URL` point at production; FCM verified end-to-end.

## Internal testing track
- [ ] Upload AAB to **Internal testing**, add testers, validate install + login + order on real devices
      before promoting to Closed/Production.
