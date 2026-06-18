# Admin Dashboard — Testing Checklist

Run the backend (`npm --workspace @kawkaw/api run start:prod`) and the dashboard
(`npm run dev --workspace @kawkaw/admin-dashboard`, served on **http://localhost:3001**).
Sign in with a staff phone number (super admin `+917670841357`, or a configured
test number with `NEXT_PUBLIC_FIREBASE_TEST_MODE=true`).

## Authentication & RBAC
- [ ] `/login` loads; entering a 10-digit number sends an OTP (test mode bypasses reCAPTCHA).
- [ ] Correct OTP signs in and lands on the dashboard; wrong OTP shows an error.
- [ ] A **CUSTOMER/RIDER** phone is rejected with "does not have admin access".
- [ ] Session **persists** across reload (localStorage) and **silently refreshes** when the access token expires (watch the network tab for `/auth/refresh`).
- [ ] **Sign out** clears the session and returns to `/login`.
- [ ] Visiting any `/…` route while logged out redirects to `/login`.
- [ ] **Role visibility:** SUPPORT sees Dashboard/Orders/Users/Pharmacy only; ADMIN also sees Catalog/Notifications/Analytics/Audit/Settings; **only SUPER_ADMIN** sees Admins. The `/admins` page shows "Restricted" for non-super roles.

## Dashboard
- [ ] Six metric cards populate (orders today, revenue today, active riders, customers, pending Rx, inventory alerts).
- [ ] "Orders — last 7 days" bar chart and "Orders by status" panel render real data.
- [ ] Metric cards link to their sections.

## Orders
- [ ] List paginates; **search** by order #/customer works; **status** and **service** filters work (and combine).
- [ ] Row click opens the detail; lifecycle timeline reflects timestamps.
- [ ] **Assign rider** (PENDING order, ADMIN+) opens the picker (verified riders only), assigns, and the status becomes ASSIGNED.
- [ ] **Cancel order** (non-terminal, ADMIN+) with a reason sets status CANCELLED.
- [ ] Both actions appear in the **Audit Log**.

## Catalog (ADMIN+)
- [ ] **Products:** create (with category, price/mrp, image URL + extra image URLs, flags, initial stock), edit, delete (confirm). Low-stock badge shows when `quantity ≤ threshold`. Service/category filters + search work.
- [ ] **Categories:** create/edit/delete; service filter; parent category optional.
- [ ] **Inventory:** low-stock list; "Set stock" and "+10 / -1" adjust update quantity and clear the alert.

## Users & Riders
- [ ] **Customers** tab lists customers; **Suspend/Reactivate** toggles active state (confirm dialog).
- [ ] **Riders** tab lists riders; status filter works; **Verify/Unverify** flips verification; **Suspend/Reactivate** deactivates the rider's account.
- [ ] A suspended rider can no longer log into the rider app (verify cross-app).

## Pharmacy
- [ ] Pending prescriptions render as cards with the **image loaded** (authenticated blob fetch).
- [ ] **Approve** removes the card; **Reject** requires a reason and removes the card.
- [ ] Decisions appear in the Audit Log (`PRESCRIPTION_REVIEWED`); the customer's pharmacy order can proceed only after approval.

## Notifications (ADMIN+)
- [ ] Broadcast to **All customers / Customers / Riders** succeeds (toast).
- [ ] The broadcast appears in **History** (title, audience, type, sent-by, time).
- [ ] (Cross-app) a customer/rider device receives the push/notification.

## Analytics (ADMIN+)
- [ ] Day range (7/14/30/90) re-queries.
- [ ] Orders + revenue bar charts, **service breakdown**, **top riders**, and **top products** all render.

## Audit (ADMIN+)
- [ ] List paginates; **search** (action) and **entity type** filter work.
- [ ] "Details" shows before/after JSON.

## Admins (SUPER_ADMIN)
- [ ] Add admin (phone, name, role, department) creates/elevates the account; it appears in the list and can log in.

## Settings (ADMIN+)
- [ ] Settings list; **store-open toggle** flips and persists; edit a value (JSON or plain) and isPublic; add a new setting.

## Quality / responsive
- [ ] **Desktop (≥1280px):** fixed sidebar, multi-column grids.
- [ ] **Tablet (768–1024px):** drawer sidebar (hamburger), tables scroll horizontally, forms reflow.
- [ ] Every list has loading, empty, and **error** states (stop the API and confirm error + Retry).
- [ ] A thrown render error is caught by the **error boundary** (section-level), not a blank page.
- [ ] No console errors on navigation; no unhandled promise rejections on failed mutations (toasts shown).
