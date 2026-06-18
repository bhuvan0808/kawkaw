# Customer App — Testing Checklist (Phase 2)

## Static / automated
- [ ] `flutter pub get` (root packages + app) resolves with no version conflicts.
- [ ] `flutter analyze` — zero issues.
- [ ] `flutter test` (app) — cart logic + splash widget tests pass.
- [ ] `flutter test` (packages/shared_ui) — design-system widget tests pass.

## Auth (Firebase phone → backend JWT)
- [ ] Enter mobile number → receive OTP (use a Firebase test number first).
- [ ] OTP auto-retrieval works on a real Android device.
- [ ] Wrong OTP shows an error; correct OTP logs in.
- [ ] `POST /auth/firebase` succeeds; tokens stored securely; lands on Home.
- [ ] Kill & relaunch app → session restored (no re-login).
- [ ] Access token expiry → silent refresh via `/auth/refresh` (force by waiting out the access TTL).
- [ ] Logout clears session and returns to login.

## Catalogue & cart
- [ ] Home shows categories + featured products; pull-to-refresh works.
- [ ] Service chips and category tiles open filtered product lists.
- [ ] Search returns debounced results; empty state shows for no matches.
- [ ] Add/increment/decrement updates the cart badge and persists across app restart.
- [ ] Adding a different-service product prompts "start a new cart".
- [ ] Out-of-stock products cannot be added.

## Checkout (COD)
- [ ] Bill (item total, delivery fee, free-delivery threshold, tax) matches the order created.
- [ ] No address → prompted to add one.
- [ ] Pharmacy order with Rx item → prescription attach works; image uploads.
- [ ] Place order → order created, cart cleared, navigates to live tracking.

## Addresses & maps
- [ ] Address picker map pans; centre pin reverse-geocodes to a readable address.
- [ ] "Use current location" centres on GPS (permission prompt handled).
- [ ] Save / edit / delete / set-default all reflect immediately.

## Orders & realtime tracking
- [ ] Orders list shows status badges; live orders deep-link to tracking.
- [ ] Order details shows the status timeline with timestamps and itemised bill.
- [ ] Cancel allowed only before pickup; restores correctly server-side.
- [ ] Live tracking: rider marker updates via WebSocket; OSRM route + ETA render.
- [ ] Call-rider button dials when a rider is assigned.

## Notifications
- [ ] Foreground push shows; background push appears in the tray.
- [ ] In-app notifications list; mark-one / mark-all read updates unread state.

## Resilience / UX
- [ ] Airplane mode → friendly network errors, retry works.
- [ ] Backend down / 500 → standardized error messages (no crashes).
- [ ] Dark theme renders correctly; large touch targets; text scales reasonably.
- [ ] Responsive: phone (2-col grid) and tablet (3-col grid).

## Devices
- [ ] Physical Android device (primary launch target).
- [ ] At least one small-screen and one large-screen device.
