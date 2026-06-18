# Google Play Data Safety — Kaw Kaw apps

Operator: **KawKawTech Pvt Ltd** · Privacy policy: **https://kawkaw.in/privacy**

This document is the answer key for the **Data safety form** in Play Console
(App content → Data safety) for both apps. Complete one form **per app**.

Key definitions (as Play uses them):
- **Collected** = transmitted off the device (to your servers or a third party).
- **Shared** = transferred to a *third party* (a separate company). Transfer to a
  service provider acting on your behalf is *not* "sharing"; transfer to the customer
  who is a *separate user* of your service **is** disclosed as sharing in the rider app.
- **Processed ephemerally** = used only in memory, not stored/logged.
- **Encryption in transit** = HTTPS/TLS for all network calls (true for both apps;
  cleartext is disabled for production hosts).
- **Deletion** = you must offer an in-app and/or web route to request account+data deletion.

Both apps: **all data is encrypted in transit (TLS/HTTPS)**, and **no data is sold**.
Neither app collects data from or is **directed at children**.

---

## Overall (both apps)

| Form question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all user data encrypted in transit? | **Yes** |
| Do you provide a way for users to request data deletion? | **Yes** (see "Data deletion" below) |
| Do you collect data from children under the relevant age? | **No** |
| Is any data sold? | **No** |
| Does your app use a third-party SDK that collects data? | **Yes** — Firebase (Auth + Cloud Messaging) for OTP login and push. Google Play services / Firebase collect identifiers for these functions. Map tiles/geocoding/routing use OpenStreetMap (Nominatim/OSRM) — IP-level requests; no account data sent. |

---

## CUSTOMER APP — `in.kawkaw.kawkaw_customer`

| Data type (Play taxonomy) | Collected? | Shared? | Ephemeral? | Required / Optional | Purpose(s) | Encrypted in transit | User can request deletion |
|---|---|---|---|---|---|---|---|
| **Phone number** (Personal info → Phone number) | Yes | No | No | **Required** | Account management (Firebase phone OTP), order communication | Yes | Yes |
| **Name** (Personal info → Name) | Yes | No | No | **Optional** | Account management, order/delivery handover | Yes | Yes |
| **Email address** (Personal info → Email) | Yes | No | No | **Optional** | Account management, support, receipts | Yes | Yes |
| **Address** (Personal info → Address) | Yes | No | No | **Required** (to deliver) | Delivery — App functionality | Yes | Yes |
| **Precise location** (Location → Precise) | Yes | No* | No | **Optional** (manual pin fallback exists) | App functionality — pin delivery point, show tracking context. *OSM tile/geocoding requests send coordinates to the OpenStreetMap service to render the map / look up the address.* | Yes | Yes |
| **Approximate location** (Location → Approximate) | Yes | No* | No | **Optional** | App functionality — centre the map near the user | Yes | Yes |
| **Photos** — prescription images (Photos and videos → Photos) | Yes | No | No | **Optional** (only pharmacy Rx orders) | App functionality — fulfil & verify pharmacy/prescription orders | Yes | Yes |
| **Purchase / order history** (App activity → Purchase history) | Yes | No | No | **Required** | App functionality — order processing, history, re-order, support | Yes | Yes |
| **Other user-generated content** — order notes (App activity) | Yes (if entered) | No | No | **Optional** | App functionality — delivery instructions | Yes | Yes |
| **Device or other IDs** — FCM registration token (Device or other IDs) | Yes | No | No | **Required** for push | App functionality + (transactional) communications — order status push notifications | Yes | Yes |
| **Crash logs / Diagnostics** (App info and performance → Crash logs / Diagnostics) | Yes | No | No | **Optional** | Analytics / app stability & performance | Yes | Yes |

\* Background location: **Customer app does NOT collect background location.** Location is collected **foreground only** (while the app is in use). Make sure the form's location entry is marked *not* collected in the background.

---

## RIDER APP — `in.kawkaw.kawkaw_rider`

| Data type (Play taxonomy) | Collected? | Shared? | Ephemeral? | Required / Optional | Purpose(s) | Encrypted in transit | User can request deletion |
|---|---|---|---|---|---|---|---|
| **Phone number** (Personal info → Phone number) | Yes | No | No | **Required** | Account management (Firebase phone OTP), rider communication | Yes | Yes |
| **Name** (Personal info → Name) | Yes | No | No | **Optional** | Rider identity for delivery handover | Yes | Yes |
| **Email address** (Personal info → Email) | Yes | No | No | **Optional** | Account/support | Yes | Yes |
| **Precise location — incl. BACKGROUND** (Location → Precise) | Yes | **Yes** | No | **Required** (core to the role) | App functionality — live delivery tracking & routing. **Shared with the customer** whose order is being delivered (they see the rider's position on a map) and with Kaw Kaw operations. Collected **in the background while the rider is online**. | Yes | Yes |
| **Approximate location** (Location → Approximate) | Yes | Yes | No | **Required** | App functionality — routing/tracking fallback | Yes | Yes |
| **Purchase / order history** — assigned-delivery records & COD amounts (App activity → Purchase history) | Yes | No | No | **Required** | App functionality — delivery flow, COD collection, earnings | Yes | Yes |
| **App interactions** — online/offline, accept/pickup/deliver events (App activity → App interactions) | Yes | No | No | **Required** | App functionality + analytics — operations & earnings calculation | Yes | Yes |
| **Device or other IDs** — FCM registration token (Device or other IDs) | Yes | No | No | **Required** for assignment alerts | App functionality — delivery-assignment push notifications | Yes | Yes |
| **Crash logs / Diagnostics** (App info and performance) | Yes | No | No | **Optional** | Analytics / app stability | Yes | Yes |

**Critical rider-app notes:**
- The **Location** entry MUST have **"Collected in the background"** = **Yes** and the **"Shared"** = **Yes** (shared with the customer and operations). Underdeclaring background location is a top rejection/suspension cause.
- Because location is **Shared**, list the sharing purpose as **App functionality** (live order tracking). It is **not** sold and **not** used for ads.
- The rider app does **not** collect prescription images, payment instruments, or precise consumer profile data.

---

## Data deletion mechanism (required for both apps)

Google Play requires a stated way to **delete the account and associated data**, reachable from the listing and surfaced to users.

**Account deletion URL (set in Play Console "Data deletion" field):**
`https://kawkaw.in/account/delete`

**In-app routes:**
- **Customer app:** Profile → Account → *Delete my account* (and/or contact `support@kawkaw.in`).
- **Rider app:** Profile/Settings → *Delete my account* (and/or contact `rider-support@kawkaw.in`).

**What happens on a deletion request:**
- Account and personal data (phone, name, email, addresses), uploaded prescription images, and stored location history are deleted or anonymized.
- **Retention exception (disclose in the privacy policy):** records required for legal, tax, accounting or fraud-prevention purposes — e.g. order/COD transaction records and pharmacy-dispensing records — may be retained for the legally mandated period in anonymized/limited form, then purged. State the retention window in `https://kawkaw.in/privacy`.
- FCM tokens are deleted on logout/uninstall; diagnostics are retained only for the analytics window.

**Both the privacy policy and the Data safety form must be consistent** with these tables. If the form and the policy disagree, Play flags the app.
