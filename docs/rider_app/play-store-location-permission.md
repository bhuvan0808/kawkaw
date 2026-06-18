# Play Store — Location Permission Checklist (Rider App)

Google Play heavily scrutinizes **background location** (`ACCESS_BACKGROUND_LOCATION`) and
**foreground services**. Plan for a permissions declaration + a demo video.

## Permissions declaration form (required because of background location)
- [ ] Justify `ACCESS_BACKGROUND_LOCATION`: *"Delivery partners share live location with the
      customer and operations while a delivery is in progress, including when the screen is off,
      so customers can track their order and we can route efficiently."*
- [ ] Confirm the feature is **core** to the app and visible to the user (persistent notification + online toggle).
- [ ] Provide a **demo video** showing: granting "Allow all the time", going online, the persistent
      notification, and location continuing with the screen locked.
- [ ] State that background location is used **only while the rider is online/on a delivery**.

## Foreground service (Android 14+ / API 34)
- [ ] Declared `foregroundServiceType="location"` and the `FOREGROUND_SERVICE_LOCATION` permission.
- [ ] In Play Console, complete the **Foreground service types** declaration (Location) with a
      short justification + the same demo video.
- [ ] The notification clearly states location is being shared.

## Runtime UX (required for approval)
- [ ] Request **foreground** location first; only request **background** ("Allow all the time")
      after explaining why (the online toggle / a rationale dialog).
- [ ] App is fully usable if the user keeps "While using the app" (degraded background updates) — no hard block beyond going online.
- [ ] Provide an obvious way to go **offline** and stop sharing.

## Data safety form
- [ ] **Location (precise + background)** → collected; purpose: App functionality (delivery
      operations & live tracking). Shared with the customer (their order's rider position) — declare this sharing.
- [ ] **Phone number** → account management (Firebase Auth).
- [ ] **FCM token / device id** → push notifications.
- [ ] Encrypted in transit (HTTPS); deletion available via support.

## Privacy policy
- [ ] Privacy policy explicitly covers background location collection, purpose, retention, and sharing
      with customers; link it in the listing and in-app (`AppConfig.privacyPolicyUrl`).

## Technical pre-submit
- [ ] `minSdk 23`, current `targetSdk`; release build (R8) runs without missing-rule crashes.
- [ ] Battery-optimization guidance present (Play reviewers may test locked-screen behaviour).
- [ ] Separate `applicationId` (`in.kawkaw.kawkaw_rider`) and its own Play listing / internal-testing track.
- [ ] Cleartext disabled for production (HTTPS only); `API_BASE_URL=https://api.kawkaw.in` in the release build.
