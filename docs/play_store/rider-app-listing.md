# Google Play Store Listing — Kaw Kaw Rider App

**Package:** `in.kawkaw.kawkaw_rider`
**Operator:** KawKawTech Pvt Ltd
**Built with:** Flutter · Firebase phone OTP · OpenStreetMap (in-app) + Google Maps/Waze handoff
**Service area (V1):** Bhadrachalam, Telangana, India
**Payment (V1):** Cash on Delivery collection

> Char counts below are measured against Google Play's published limits:
> App name ≤ 30 · Short description ≤ 80 · Full description ≤ 4000.
> This app uses **background location** + a **location foreground service** — see
> `permissions-justification.md` for the prominent-disclosure, declaration-form and
> demo-video requirements you MUST satisfy before this app can be approved.

---

## App name (≤ 30 chars)

```
Kaw Kaw Rider: Earn & Deliver
```
**Char count: 29 / 30** ✅

Alternatives (all within limit):
- `Kaw Kaw Rider — Delivery` (24)
- `Kaw Kaw Delivery Partner` (24)

---

## Short description (≤ 80 chars)

```
Accept deliveries, navigate & earn in Bhadrachalam. Delivery partner app.
```
**Char count: 72 / 80** ✅

Alternatives:
- `Deliver orders, navigate, track earnings. Kaw Kaw delivery partner app.` (70)
- `Go online, accept orders, navigate & earn daily. For Kaw Kaw riders.` (67)

---

## Full description (≤ 4000 chars)

```
Kaw Kaw Rider is the official delivery partner app for Kaw Kaw, the hyperlocal delivery service for Bhadrachalam, Telangana. Sign in, go online, accept delivery jobs, navigate to pickup and drop, collect cash, and track your earnings — all in one app.

This app is for registered Kaw Kaw delivery partners (riders). It is operated by KawKawTech Pvt Ltd.

EARN ON YOUR SCHEDULE
• Go online when you want to work; go offline when you're done.
• Accept delivery assignments for grocery, pharmacy, food and parcel orders.
• Track your earnings by day, week and month, right inside the app.

SIMPLE DELIVERY FLOW
• Get notified the moment a delivery is assigned — push notification plus an in-app alert.
• Accept the job, head to the pickup, mark it picked up, then deliver to the customer.
• A clear step-by-step flow: Assigned, Accepted, Picked up, Delivered.

BUILT-IN NAVIGATION
• See the route to your pickup and drop on an in-app map.
• Hand off to Google Maps or Waze for turn-by-turn voice navigation with one tap.
• Customer address and contact are right there when you need them.

LIVE LOCATION SHARING (WHILE ONLINE)
While you are online, Kaw Kaw Rider shares your live GPS location with Kaw Kaw operations and the customer whose order you are delivering, so they can track the order on a map. Location sharing runs as a foreground service and continues in the background — including when the screen is off — so updates don't stop mid-delivery. A persistent notification is shown the whole time location is being shared. Location sharing stops the moment you go offline. You are always in control: go offline any time to stop sharing.

COLLECT CASH ON DELIVERY
• Orders are Cash on Delivery. The app shows the exact amount to collect from the customer.
• Mark the order delivered once cash is collected and the handover is complete.

QUICK PHONE LOGIN
• Sign in with your registered mobile number and an OTP. No passwords to remember.

HOW IT WORKS
1. Sign in with your phone number (OTP).
2. Tap Online to start receiving delivery assignments.
3. Accept a job, navigate to the pickup, mark it picked up.
4. Navigate to the customer, deliver, and collect cash.
5. Mark delivered. Watch your earnings update.
6. Tap Offline when you're finished — location sharing stops.

REQUIREMENTS
• You must be an approved Kaw Kaw delivery partner to use this app.
• Allow location access (including "Allow all the time" for background sharing while online) so customers can track their orders and you can be routed efficiently. We recommend disabling battery optimization for Kaw Kaw Rider so updates stay reliable when the screen is locked.

YOUR PRIVACY
We collect your phone number, your live location while you are online, and delivery details to operate the service. Background location is used only while you are online and on duty. Data is encrypted in transit, and you can request deletion of your account and data. Read our privacy policy: https://kawkaw.in/privacy

Support for riders: rider-support@kawkaw.in

Become a Kaw Kaw delivery partner — go online, deliver locally, and earn.
```
**Char count: ~3,180 / 4,000** ✅ (under limit. The background-location paragraph is intentionally explicit — it doubles as part of the in-store prominent disclosure. Re-verify in Play Console's live counter before publishing.)

---

## Keywords / ASO targeting

Google Play has **no keyword field**; ranking comes from **title + short description + full description** (plus installs/ratings). This is a B2B/gig-partner app with low public search volume, so optimize for partner-intent terms, not consumer terms.

### Primary target terms
| Term | Weave into |
|------|-----------|
| delivery partner / delivery boy app | Title, Short desc, Full desc intro |
| rider app | Title, Full desc |
| earn / earnings | Title, Short desc, Full desc (Earn section) |
| delivery jobs / accept orders | Full desc (Delivery flow) |
| Bhadrachalam delivery | Short desc, Full desc intro |
| Kaw Kaw (brand) | Title, throughout |

### Secondary / long-tail terms
- "delivery partner Bhadrachalam"
- "earn money delivering"
- "courier rider app"
- "food grocery delivery rider"
- "navigation for delivery"

### Placement guidance
- Keep **"Rider"** + **"Earn & Deliver"** in the title — the strongest signals for gig-worker search.
- Make the **first two lines of the full description** count (Play truncates the preview): lead with "official delivery partner app for Kaw Kaw … go online, accept delivery jobs … track your earnings".
- Do **not** over-promise earnings (no specific income claims) — Play and consumer-protection rules disallow misleading financial claims. Keep it to "track your earnings", not "earn ₹X/day".

---

## Categorization & store settings

| Field | Value |
|-------|-------|
| App category | **Business** (primary). Acceptable alternative: **Maps & Navigation**. Business fits a work/partner tool best; do not pick a consumer shopping category. |
| Tags (choose up to 5) | Business, Maps & Navigation, Productivity, Local services |
| Default language | English (India) — `en-IN` |
| Contact email | **rider-support@kawkaw.in** (required, public) |
| Contact website | https://kawkaw.in |
| Privacy policy URL | **https://kawkaw.in/privacy** (required) |

---

## Content rating guidance

Complete the **IARC content rating questionnaire** (App content → Content rating):

- App type: **Other / utility-business tool** (not a game).
- Violence, sexual content, profanity, gambling, controlled substances: **No** to all. (The rider does not browse or reference pharmacy products; they only transport sealed/packed orders, so no drug-reference questions apply.)
- User-generated content / social: **No**.
- Shares user location: **Yes** (declared in Data safety, not the rating).
- Expected rating: **Everyone / IARC 3+**.

**Target audience & content:** select an **adult audience (18+)** — riders are working adults handling cash and operating vehicles. **Families / Designed for Families = No.** The app is explicitly **not** directed at children.

**Restricted / sensitive declarations:**
- This is a **work-only app for approved partners** — note this in the Play Console "App access" section and provide **demo login credentials** (a test rider account + OTP bypass or test number) so reviewers can sign in, otherwise the review will be rejected for being un-testable.

---

## Required cross-references
- Data safety answers (incl. background-location sharing): see `data-safety.md`.
- Permission declarations + **background location prominent disclosure, permissions declaration form, demo video, foreground-service type "location"**: see `permissions-justification.md`.
- Screenshot / graphic specs and shot list: see `assets-checklist.md`.
