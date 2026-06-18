# Firebase setup — Customer App (project `kawkaw08`)

The app uses **Firebase Authentication (Phone)** for identity and **Firebase Cloud
Messaging (FCM)** for push. The backend only verifies Firebase ID tokens — it never sends OTPs.

## 1. Firebase console

1. Open the **kawkaw08** project → **Authentication → Sign-in method** → enable **Phone**.
2. For testing without burning SMS quota, add **test phone numbers** (Phone provider → "Phone
   numbers for testing"), e.g. `+91 9000000001` → code `123456`.
3. **Project settings → General →** add an **Android app**:
   - Package name: `in.kawkaw.customer` (must match `applicationId` in `android/app/build.gradle`).
   - Add the **SHA-1** and **SHA-256** of your debug & release keystores (required for Phone
     Auth on Android):
     ```bash
     # debug
     keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android -keypass android
     # release (your upload keystore)
     keytool -list -v -alias upload -keystore upload-keystore.jks
     ```
   - Download **google-services.json** → place at `android/app/google-services.json`.

## 2. Wire native config (FlutterFire)

```bash
dart pub global activate flutterfire_cli
flutterfire configure --project=kawkaw08
```

This regenerates `lib/firebase_options.dart` (replacing the committed placeholder) and ensures
the Gradle Google-services plugin is applied.

If configuring Gradle manually instead:
- `android/build.gradle` → `dependencies { classpath 'com.google.gms:google-services:4.4.2' }`
- `android/app/build.gradle` → `apply plugin: 'com.google.gms.google-services'`, and set
  `minSdkVersion 23` (Firebase Auth requirement).

## 3. FCM

- The app requests notification permission at login and registers its **FCM token** with the
  backend (sent in `fcmToken` on `POST /auth/firebase`; the backend stores it on the user).
- Background handler is registered in `bootstrap.dart`.
- Default channel id `kawkaw_default_channel` is declared in `AndroidManifest.xml`.
- Backend → see `services/api` `.env`: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
  `FIREBASE_PRIVATE_KEY` (service account) so the API can verify tokens and send pushes.

## 4. Verify

- Run the app, log in with a test number, confirm `POST /auth/firebase` succeeds and a session
  is created.
- From the admin/API, send a notification and confirm it arrives (foreground + background).
