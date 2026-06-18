# Rider App — Testing Checklist (Phase 3)

## Static / automated
- [ ] `flutter pub get` resolves (rider + shared_ui).
- [ ] `flutter analyze` — **zero issues** (pay special attention to the foreground‑service module, which is the most plugin‑version‑sensitive).
- [ ] `flutter test` — rider logic + splash tests pass.

## Auth & onboarding
- [ ] Phone OTP login works (test number on emulator; real SMS on device).
- [ ] First-time account → "Become a rider" → register vehicle → token rotates to RIDER → dashboard.
- [ ] Unverified rider sees "Verification pending" and cannot go online (verify via admin/API, then retry).
- [ ] Session restored on relaunch; logout returns to login.

## Online / offline + background location
- [ ] Toggle **Online** → location permission prompt → grant **"Allow all the time"**.
- [ ] Persistent foreground notification appears ("You are online").
- [ ] Dashboard shows "Location shared at …" updating roughly every 10–15s.
- [ ] **Lock the screen** for 2–3 min → backend keeps receiving location (verify rider location via admin `GET /riders/:id/location` or DB).
- [ ] Toggle **Offline** → service stops, notification clears.
- [ ] Battery-optimization banner appears when restricted; "Fix" opens the system setting.

## Assignment flow (must not miss jobs)
- [ ] With the rider online, assign an order (admin `POST /orders/:id/assign`).
- [ ] **App foreground:** full-screen modal appears with sound + vibration; Accept / Reject work.
- [ ] **App background / screen locked:** FCM push arrives with sound; tapping opens the modal/app.
- [ ] Accept → navigates to the active-delivery screen; Reject → returns the order to the pool.

## Active delivery
- [ ] OSM map shows the route from your location to the drop (distance + ETA badge).
- [ ] **Navigate** opens the chooser → Google Maps launches; Waze appears only if installed.
- [ ] Call button dials the customer/receiver.
- [ ] Lifecycle: Confirm pickup → Start delivery → Mark delivered (COD) advances status; customer app reflects each change live.
- [ ] After delivery, the order leaves the queue and earnings update.

## Offline handling
- [ ] Enable airplane mode while online for ~1 min, then restore connectivity.
- [ ] Queued locations flush to the backend (no gap in the rider's recent track once back online).
- [ ] A lifecycle action attempted offline shows a clear error and can be retried.

## Earnings
- [ ] Earnings tab shows Today / This Week / This Month / Lifetime + rating, from the backend.
- [ ] Completing a delivery increments Today + Lifetime after refresh.

## Devices
- [ ] Emulator (with Google Play services) for flows; **a physical Android device for background location + battery behaviour** (emulators don't reproduce OEM battery restrictions).
- [ ] Test on at least one OEM with aggressive battery management (Xiaomi/Oppo/Vivo/Realme/Samsung).
