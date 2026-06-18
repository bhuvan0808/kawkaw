# Play Store Assets Checklist — Kaw Kaw apps

Complete a separate set of assets per app (`in.kawkaw.kawkaw_customer`,
`in.kawkaw.kawkaw_rider`). Specs below match current (2024/2025) Play requirements.

---

## Graphic assets — exact specs (both apps)

| Asset | Required? | Format | Exact spec | Notes |
|---|---|---|---|---|
| **App icon** | **Required** | **PNG, 32-bit (with alpha)** | **512 × 512 px**, ≤ 1 MB | Used in the store listing. Google applies its own masking/rounding — keep key art inside a safe centre area; don't pre-round corners. Must match the in-app launcher icon. No purely white/transparent icons. |
| **Feature graphic** | **Required** | PNG or JPG, **no alpha/transparency** | **1024 × 500 px**, ≤ 1 MB | Shown at the top of the listing and used in promos. Keep text minimal and away from edges; don't rely on it for critical info (may be cropped). |
| **Phone screenshots** | **Required (min 2; max 8)** | PNG or JPG (24-bit, no alpha) | 16:9 or 9:16 aspect; **each side 320–3840 px**; max dimension ≤ 2× the min side | Recommend **4–8** portrait (9:16, e.g. 1080 × 1920 or 1080 × 2400). First 2–3 are most-seen — make them count. |
| **7-inch tablet screenshots** | Optional | PNG/JPG | up to 3840 px per side, ≤ 8 MB each | Only if you advertise tablet support. Up to 8. |
| **10-inch tablet screenshots** | Optional | PNG/JPG | up to 3840 px per side, ≤ 8 MB each | Only if tablet-optimized. Up to 8. |
| **Promo / TV / Wear assets** | Not applicable | — | — | Not a TV/Wear/Auto app. |
| **Promo video (YouTube URL)** | Optional | YouTube link | — | Optional listing video. **Separate** from the rider background-location *demo video* (that one goes in the permission declarations, not the listing). |

**General image rules:** no device frames that misrepresent the UI, no excessive promotional text overlay, no misleading content, screenshots must reflect the actual app, no other-platform references (no "Download on iOS").

---

## Text / listing fields — limits (both apps)

| Field | Limit | Source |
|---|---|---|
| App name | **30 chars** | `customer-app-listing.md` / `rider-app-listing.md` |
| Short description | **80 chars** | same |
| Full description | **4000 chars** | same |

---

## Store-config & "App content" tasks (both apps)

- [ ] **Default language** set (English – India, `en-IN`); add Telugu localization later if desired.
- [ ] **Category + tags** set (Customer: Shopping; Rider: Business).
- [ ] **Contact email** (Customer `support@kawkaw.in` / Rider `rider-support@kawkaw.in`) + website `https://kawkaw.in`.
- [ ] **Privacy policy URL**: `https://kawkaw.in/privacy`.
- [ ] **Data safety** form completed per `data-safety.md`.
- [ ] **Data deletion** URL set: `https://kawkaw.in/account/delete`.
- [ ] **Content rating** (IARC questionnaire) completed per the listing docs (expected Everyone/3+).
- [ ] **Target audience & content**: select **adult (18+)** audiences; **Designed for Families = No**; not directed at children.
- [ ] **App access**: provide working **test login credentials** (test phone + OTP), especially for the **rider** app (partner-only).
- [ ] **Ads**: declare **"No ads"** (neither app shows ads).
- [ ] **Government / financial / health declarations**: Customer app facilitates **pharmacy** orders — review Play's restricted-content (regulated goods) requirements; not a financial or government app.
- [ ] **Permissions declarations**: complete per `permissions-justification.md` — **rider** needs the background-location form + foreground-service-"location" declaration + **demo video**.

---

## Content rating questionnaire — expected answers (both apps)
- App is **not a game**; choose the non-game/utility flow.
- Violence / sexual content / profanity / gambling / controlled substances: **No**.
- User-generated/social content: **No**.
- Shares location: **Yes** (info only; declared in Data safety).
- Expected outcome: **Everyone / IARC 3+**.
(Customer pharmacy note: ordering medicines via a licensed pharmacy is commerce, not drug-reference content — answer honestly; see `customer-app-listing.md`.)

---

## Per-app shot list (which screens to capture)

Capture on a clean device/emulator with **realistic Bhadrachalam demo data** (real-looking products, a local address, a sample order). Portrait 9:16, 1080 × 2400 recommended. Add a short **caption banner** at the top of each (consistent font/colour).

### CUSTOMER app — recommended 6 screenshots
| # | Screen (route) | Caption idea |
|---|---|---|
| 1 | **Home** (`/home`) — service chips + featured | "Grocery, pharmacy & food — delivered in Bhadrachalam" |
| 2 | **Product list / Category** (`/products` or `/categories`) | "Browse local stores and add to cart" |
| 3 | **Cart / Checkout** (`/cart` → `/checkout`) showing **Cash on Delivery** | "Pay Cash on Delivery — no online payment needed" |
| 4 | **Live order tracking** (`/orders/:id/track`) — rider on the map | "Track your order live on the map" |
| 5 | **Prescription upload** (checkout Rx attach) | "Order medicines — just upload your prescription" |
| 6 | **Orders / history** (`/orders`) | "Reorder favourites in a tap" |
| (opt 7) | **Address picker** (`/addresses/pick`) | "Pin your exact delivery spot" |
| (opt 8) | **Notifications** (`/notifications`) | "Updates at every step" |

> Do **not** screenshot the parcel flow for the customer app — Parcel is out of scope for the customer V1 (it was removed from the customer service chips; it remains a rider capability). Don't advertise a feature the app doesn't expose.

### RIDER app — recommended 6 screenshots
| # | Screen | Caption idea |
|---|---|---|
| 1 | **Dashboard with Online/Offline toggle** (online) + persistent-notification visible | "Go online to start earning" |
| 2 | **Incoming delivery assignment** (push + in-app alert) | "Accept delivery jobs instantly" |
| 3 | **Active delivery** — map with route to pickup/drop | "Navigate to pickup and drop" |
| 4 | **Navigation handoff** (Google Maps / Waze launch) | "One tap to Google Maps or Waze" |
| 5 | **COD collection / Deliver step** showing amount to collect | "Collect Cash on Delivery, mark delivered" |
| 6 | **Earnings** (today / week / month) | "Track your earnings — daily, weekly, monthly" |
| (opt 7) | **Delivery flow status** (Assigned→Accepted→Picked up→Delivered) | "Simple step-by-step delivery flow" |

> For the rider listing, **showing the persistent location-sharing notification** in screenshot #1 reinforces the background-location transparency story reviewers look for.

---

## Final pre-submit asset gate (per app)
- [ ] Icon 512×512 PNG (32-bit) uploaded and matches launcher icon.
- [ ] Feature graphic 1024×500 (no alpha) uploaded.
- [ ] ≥ 2 (recommend 4–8) phone screenshots, correct aspect & size, with captions.
- [ ] App name ≤ 30, short ≤ 80, full ≤ 4000 — verified in Play Console's live counter.
- [ ] All "App content" declarations green (Data safety, content rating, target audience, ads, permissions, data deletion, privacy policy).
- [ ] Rider only: background-location declaration + foreground-service "location" + **demo video** attached, and test credentials provided.
