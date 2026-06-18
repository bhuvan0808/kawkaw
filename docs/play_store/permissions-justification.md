# Permissions Justification — Kaw Kaw apps

Operator: **KawKawTech Pvt Ltd** · Privacy policy: **https://kawkaw.in/privacy**

For each Android permission in each app's manifest, this gives:
1. **User-facing justification** — the rationale to show the user (in a rationale dialog and the listing), and
2. **Play Console declaration text** — what to put where Play asks you to justify the permission/API (sensitive-permission declarations, foreground-service declarations, the permissions declaration form).

> **The two highest-risk items are in the RIDER app:**
> background location (`ACCESS_BACKGROUND_LOCATION`) and the **location foreground
> service**. They require a **prominent in-app disclosure + consent**, the **Play Console
> permissions declaration form**, a **foreground-service "location" type declaration**, and a
> **demo video**. See the dedicated section below — getting any of these wrong is the most
> common cause of rejection/removal.

---

## CUSTOMER APP — `in.kawkaw.kawkaw_customer`

| Permission | User-facing justification | Play Console declaration text |
|---|---|---|
| `INTERNET` | Connect to Kaw Kaw to browse products, place orders and receive live tracking. | Normal permission — no declaration required. Required for all network/REST/WebSocket traffic. |
| `ACCESS_NETWORK_STATE` | Detect connectivity to retry/queue requests gracefully. | Normal permission — no declaration required. |
| `ACCESS_FINE_LOCATION` | "Allow location so you can drop an exact delivery pin and follow your order on the map." Requested at runtime when the user taps **Use current location** in the address picker; manual pin works if denied. | Location used **in foreground only**, for App functionality: to let the user set a precise delivery point and view live order tracking. Not used for ads; not collected in the background. |
| `ACCESS_COARSE_LOCATION` | Centre the map near the user when picking an address. | Same as above — foreground App functionality. |
| `POST_NOTIFICATIONS` | "Get order updates — confirmed, out for delivery, delivered." Requested at runtime after login (Android 13+). | Normal runtime permission. Used for transactional order-status push notifications via FCM. |
| `READ_MEDIA_IMAGES` (Android 13+) | "Attach a photo of your prescription for pharmacy orders." Requested by the image picker only when the user attaches an Rx. | Photo access used only when the user explicitly picks a prescription image for a pharmacy order — App functionality. *(Uses the system photo picker / scoped access; no broad gallery scraping. `READ_MEDIA_IMAGES` does not trigger the Photo & Video Permissions declaration only if you use the photo picker; if you request the runtime permission directly, complete the Photo and Video Permissions declaration — see note below.)* |
| `READ_EXTERNAL_STORAGE` (maxSdkVersion 32) | Legacy prescription image pick on Android ≤ 12. | Scoped to image selection for prescription upload; capped at SDK 32. App functionality. |
| `CAMERA` *(only if camera capture is enabled)* | "Take a photo of your prescription." Requested only if the user chooses the camera source. | Used solely to capture a prescription image the user chooses to upload for a pharmacy order — App functionality. If camera capture is **not** shipped, remove this permission from the manifest. |

### Photo and Video Permissions declaration (customer app)
Google's **Photo and Video Permissions policy** restricts broad `READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO` access. Two compliant paths:
- **Preferred:** use the Android **Photo Picker** (`image_picker` on modern Android uses it / `PickVisualMedia`). One-time, user-selected access — **no declaration form needed** and no broad permission.
- If you keep the broad `READ_MEDIA_IMAGES` runtime permission, you **must** complete the **Photo and Video Permissions declaration** in Play Console and justify that persistent/broad photo access is core (it is **not** here — prescription upload is a one-shot pick, so prefer the picker).
**Recommendation:** use the photo picker and avoid the broad permission entirely.

### Pharmacy / prescription content considerations (customer app)
- Orders of medicines are fulfilled by a **licensed pharmacy** partner; the app **facilitates** ordering and prescription upload, it does not dispense or give medical advice. State this in the listing and privacy policy.
- Prescription images are **sensitive health-adjacent data**: declare them as **Photos** in Data safety, store encrypted, restrict access to fulfilment, and include them in the deletion flow.
- Do **not** market the app as a pharmacy/medical provider; comply with Play's restrictions on facilitating sale of regulated goods (prescription required, licensed seller, region-restricted to where you're permitted to operate — Bhadrachalam/India).

---

## RIDER APP — `in.kawkaw.kawkaw_rider`

| Permission | User-facing justification | Play Console declaration text |
|---|---|---|
| `INTERNET` | Connect to Kaw Kaw to receive assignments, navigate, and report status/location. | Normal permission — no declaration required. |
| `ACCESS_FINE_LOCATION` | "Share your precise location while online so customers can track their order and you get accurate routing." Requested at runtime (foreground first). | App functionality — precise location for live delivery tracking & routing. See permissions declaration form (background) below. |
| `ACCESS_COARSE_LOCATION` | Fallback/approximate location for routing context. | App functionality — routing/tracking fallback. |
| `ACCESS_BACKGROUND_LOCATION` | "Allow all the time so your location keeps updating during a delivery even when the screen is off." Requested **only after** the foreground grant and an explicit rationale, tied to going Online. | **Requires the permissions declaration form + demo video — see dedicated section below.** Core feature: continuous live tracking during an active delivery while the rider is online. |
| `FOREGROUND_SERVICE` | Keep location sharing running reliably during a delivery. | Required to run the location foreground service. Declared together with the typed permission below. |
| `FOREGROUND_SERVICE_LOCATION` | (Android 14+/API 34) Run the location-type foreground service for live tracking. | **Complete the Foreground Service Types declaration with type = "location" — see dedicated section below.** |
| `POST_NOTIFICATIONS` | "Get notified the instant a delivery is assigned." Requested at runtime (Android 13+). | Runtime permission — delivery-assignment alerts via FCM **and** the mandatory persistent foreground-service notification. |
| `WAKE_LOCK` | Keep location updates flowing while the device is idle during a delivery. | Used by the foreground location service to keep the CPU awake for periodic GPS reporting while online. |
| `VIBRATE` | Vibrate on a new delivery alert so you don't miss a job. | Used for assignment-alert haptics. Normal permission. |
| `<queries>`: `geo:` , `google.navigation:` , `waze://` , `tel:` | Open turn-by-turn navigation in Google Maps or Waze, and call the customer. | Package-visibility `<queries>` declarations (Android 11+) so the app can hand off navigation to installed map apps and place delivery calls. Not a runtime permission; no declaration form. Must match an actual in-app navigation/call feature. |

---

## ⚠ Background location — prominent disclosure + permissions declaration form + demo video (RIDER)

Background location is one of the **most scrutinized** Play features. **All four** of the following are mandatory for the rider app:

### 1. Prominent in-app disclosure + consent (before requesting the permission)
Show a clear, standalone disclosure **before** the system "Allow all the time" prompt, with affirmative consent. Suggested copy:

> **Kaw Kaw Rider collects location data to share your live position with customers and operations during deliveries, even when the app is closed or not in use.**
> This lets customers track their order on a map and lets us route you efficiently. Location is shared **only while you are Online**. Tap **Go Online** to allow this; tap **Offline** any time to stop.

Requirements:
- Disclosure appears **in the app UI**, not only in the policy or listing.
- It states **what** is collected (location), **that it runs in the background / when the app is closed**, and **why** (tracking + routing).
- The user must take an **affirmative action** (e.g. tap "Go Online / Allow") — no pre-checked boxes.
- Request **foreground** location first; request **background ("Allow all the time")** only after this disclosure, gated on going Online.

### 2. Background location permissions declaration form (Play Console)
In **App content → Sensitive app permissions → Location permissions**, declare `ACCESS_BACKGROUND_LOCATION`:
- **Feature using background location:** "Live delivery tracking — sharing the delivery partner's location with the customer and operations during an active delivery."
- **Is it core to the app?** **Yes.** "Hyperlocal delivery requires continuous, real-time rider location so customers can track their order and the dispatch system can route deliveries. Without background location, tracking stops when the screen locks mid-delivery."
- **Why foreground access is insufficient:** "Riders ride with the screen off / phone pocketed; foreground-only updates would stop and break live tracking."
- **User benefit:** customers see accurate ETAs and rider position; riders get correct routing and proof of delivery.

### 3. Foreground service type "location" declaration (Play Console)
In **App content → Foreground service types**, declare type **Location**:
- **Manifest:** `<service ... android:foregroundServiceType="location">` + `FOREGROUND_SERVICE_LOCATION` permission (present).
- **Justification:** "While the rider is Online, a location foreground service shares live GPS with the customer and operations so the order can be tracked in real time. A persistent notification ('Sharing your location with Kaw Kaw') is shown the entire time."
- **Why a foreground service is required:** continuous location while the app isn't in the foreground; the user is informed via the persistent notification and can go Offline to stop.
- Attach the **same demo video** as evidence.

### 4. Demo video (link in the declarations)
Provide a short (≈30–90s) public/unlisted video URL showing the **end-to-end real behaviour**:
1. App requests **foreground** location, then shows the **prominent disclosure**, then the **"Allow all the time"** prompt.
2. Rider taps **Go Online** → the **persistent foreground-service notification** appears ("Sharing your location with Kaw Kaw").
3. **Lock the screen / send app to background** → show (e.g. on a backend/ops view or the customer tracking map) that **location keeps updating**.
4. Rider taps **Offline** → notification disappears, sharing **stops**.
Narrate or caption each step. Reviewers must see that background location is **only** used while online and is tied to the visible notification.

### Common rejection causes to avoid
- Background location requested **without** the prominent disclosure / before foreground grant.
- Data safety form not marking location **background = Yes** and **Shared = Yes**.
- Foreground service running when the rider is **offline**, or no persistent notification.
- Demo video missing, or not actually showing locked-screen continuation.

---

## App access (both apps, esp. RIDER)
Both apps require login; the rider app is **partner-only**. In **App content → App access**, provide **working test credentials** (a test phone number + OTP, or a reviewer bypass account) so Google can sign in and exercise the order/delivery and location flows. Apps that reviewers cannot log into are rejected.

## Manifest hygiene (both apps)
- Ship **only** the permissions actually used. If camera capture or broad media access isn't implemented, **remove** those permissions from the customer manifest.
- The customer app must **not** declare `ACCESS_BACKGROUND_LOCATION` or any foreground-service location permission — it has no background-location use, and declaring it would force unnecessary (and unjustifiable) declarations.
