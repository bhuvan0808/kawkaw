# Kaw Kaw — Privacy Policy

*Draft for review by qualified legal counsel before publication.*

**Last updated:** [DD MONTH YYYY]

---

## Plain-language summary

Kaw Kaw is a hyperlocal delivery service operated by **KawKawTech Pvt Ltd** ("Kaw Kaw", "we", "us", "our"). We deliver **Grocery, Pharmacy, Food, and Parcel** orders in **Bhadrachalam, Telangana, India**.

In short:

- You sign in with your **phone number** using a one-time password (OTP).
- We collect what we need to take your order, deliver it, and support you: your phone number, optional name/email, delivery addresses with location, and your order history.
- For **pharmacy orders**, we collect a **prescription image** so an authorized pharmacist can verify it.
- For **delivery partners ("riders")**, we collect **live GPS location**, including **in the background while a delivery is active or while the rider is online**, so we can route deliveries and show you live tracking.
- We currently accept **Cash on Delivery (COD) only**. We do **not** collect card or bank details and do not process online payments in this version.
- We share only what is necessary — for example, your delivery address and contact are shared with the assigned rider, and prescription images are reviewed by authorized pharmacy staff.
- **We do not sell your personal data.**
- You have rights over your data (access, correction, erasure, grievance redressal) under India's **Digital Personal Data Protection Act, 2023 (DPDP Act)**.

This summary is for convenience only. The full policy below governs.

---

## 1. Who we are and scope

This Privacy Policy explains how KawKawTech Pvt Ltd collects, uses, shares, stores, and protects personal data through the Kaw Kaw **Customer app**, the **Rider (delivery partner) app**, our **internal admin console**, and the website at **kawkaw.in** (together, the "Services").

- **Operator / Data Fiduciary:** KawKawTech Pvt Ltd
- **Registered office:** [REGISTERED ADDRESS]
- **Corporate Identification Number (CIN):** [CIN]
- **Website:** kawkaw.in
- **Privacy contact:** privacy@kawkaw.in
- **General support:** support@kawkaw.in

Under the DPDP Act, we act as a **Data Fiduciary** for the personal data we determine the purposes and means of processing. Where our service providers process data on our behalf, they act as **Data Processors**.

This policy applies to customers, delivery partners (riders), and authorized admin/pharmacy users of the Services.

---

## 2. What data we collect and why

We collect only the data we need for the purposes set out below. The table maps each category of data to its purpose.

### 2.1 Customer data

| Data we collect | Why we collect it (purpose) |
|---|---|
| **Phone number** (required) | Account creation and sign-in via OTP; order confirmation; delivery coordination; support |
| **Name** (optional) | Personalizing your experience; addressing you; helping riders identify the recipient |
| **Email** (optional) | Sending receipts, service notices, and support correspondence where you provide it |
| **Delivery addresses + precise geolocation** | Determining serviceability; routing the rider to the correct location; accurate delivery |
| **Order history** (items, store, amounts, timestamps, status) | Fulfilling and tracking orders; support and dispute resolution; reorder convenience; tax/accounting records |
| **Prescription images** (pharmacy orders only) | Pharmacist verification and lawful dispensing of pharmacy items (see Section 6) |
| **FCM push-notification device tokens** | Sending order status, delivery, and service notifications via Google Firebase Cloud Messaging |
| **Device / app diagnostics** (app version, device model, OS, crash logs, performance data) | Diagnosing crashes, improving reliability and security, fraud/abuse prevention |

### 2.2 Delivery partner (rider) data

| Data we collect | Why we collect it (purpose) |
|---|---|
| **Phone number, name** | Account creation and sign-in; identification; delivery coordination |
| **Live GPS location — including in the background** while the rider is **online or on an active delivery** | Assigning and routing deliveries; live order tracking for customers; estimated arrival times; delivery proof and safety. See Section 5. |
| **Order/assignment history** | Operations, earnings reconciliation, support, and dispute resolution |
| **FCM device tokens, device/app diagnostics** | Delivery notifications; reliability, security, and crash diagnostics |

### 2.3 Data collected automatically

When you use the Services we automatically collect technical data such as IP address, device identifiers, app version, log/event data, and crash diagnostics (via Google Firebase). This supports security, fraud prevention, and service reliability.

We do **not** collect or store payment card, UPI, or bank-account details, because Kaw Kaw operates on **Cash on Delivery only** in this version.

---

## 3. Legal basis and consent

Under the DPDP Act, we process personal data on the following bases:

- **Consent.** When you create an account, place an order, upload a prescription, or (as a rider) enable location sharing, you provide consent for the specific purpose for which the data is collected. Consent is sought through clear notice and may be **withdrawn** at any time (see Section 8). Withdrawing consent may prevent us from providing some or all of the Services.
- **Legitimate uses / performance of service.** We process certain data as necessary to perform the service you request (for example, sharing your address with the assigned rider to complete delivery) and for related operational purposes permitted under applicable law.
- **Legal obligation.** We retain certain order and invoice records to comply with tax and other legal requirements.

We provide notice at or before the point of collection describing the personal data and the purpose, in accordance with the DPDP Act.

---

## 4. How we share data

We share personal data only as described below. **We do not sell personal data.**

### 4.1 With the assigned delivery partner (rider)

To complete a delivery, we share the **customer's delivery address, location, recipient name (if provided), order details, and a contact number** with the rider assigned to that order. Riders are instructed to use this information solely to complete the delivery and to delete/forget it thereafter.

### 4.2 With authorized pharmacy staff

For pharmacy orders, **prescription images** and the related order details are made available to **authorized pharmacy staff/pharmacists** for verification and lawful dispensing. Access is restricted to staff who need it for this purpose.

### 4.3 With service providers (Data Processors)

We use the following infrastructure and service providers, who process data on our behalf under contractual obligations to protect it and use it only for our instructed purposes:

| Processor | Function | Data involved |
|---|---|---|
| **Aiven (PostgreSQL)** | Primary application database hosting | Account, order, address, prescription metadata and related records |
| **Upstash (Redis)** | Caching, sessions, queues, transient data | Session/token data, OTP/rate-limit state, transient operational data |
| **Render** | API / backend hosting | All data processed by the backend in transit |
| **Vercel** | Admin console hosting | Admin-facing application traffic |
| **Google Firebase** | Authentication (phone OTP), push notifications (FCM), crash/diagnostics | Phone number (auth), device tokens, diagnostics/crash data |
| **OpenStreetMap / OSRM / Nominatim** | Maps, routing, and geocoding | Address/coordinate lookups for routing and serviceability (sent as needed to compute routes and resolve addresses) |

### 4.4 Legal and safety disclosures

We may disclose personal data where required by law, court order, or governmental request, or where necessary to protect the rights, safety, and security of users, riders, the public, or Kaw Kaw, or to prevent fraud or abuse.

### 4.5 Business transfers

If we are involved in a merger, acquisition, financing, or sale of assets, personal data may be transferred as part of that transaction, subject to the continued protections of this policy or equivalent.

---

## 5. Rider background location — justification and controls

The Rider app collects **precise GPS location, including in the background**, but only:

- while the rider is **online / available** in the app, or
- while the rider has an **active delivery in progress**.

**Why this is necessary:** Background location is used solely to (a) assign nearby orders, (b) compute routes and estimated arrival times, (c) provide customers with **live order tracking**, and (d) confirm delivery and support rider safety. The core delivery-tracking feature cannot function if location is only available while the app is in the foreground, because riders travel with the phone in a pocket or mount.

**Controls and transparency:**

- Riders receive a clear in-app disclosure and must grant location permission before going online.
- Background location collection **stops when the rider goes offline** and is **not** collected when the rider is neither online nor on a delivery.
- Riders can stop sharing by going offline or revoking the permission in device settings; doing so will prevent them from receiving deliveries.
- This use is designed to align with the **Google Play User Data policy** and Google Play's **background-location** requirements (prominent disclosure, runtime permission, use limited to the delivery feature that requires it).

---

## 6. Prescription image handling (pharmacy orders)

For pharmacy orders that require a prescription:

- You may be asked to **upload an image of a valid prescription**.
- The image is made available only to **authorized pharmacy staff/pharmacists** for **verification and lawful dispensing**.
- A pharmacist may **reject** an order if the prescription is missing, invalid, illegible, expired, or otherwise non-compliant with applicable pharmacy/drug regulations.
- Prescription images are treated as **sensitive** and are subject to stricter access controls, encryption, and a defined retention period set out in the **Data Retention Policy**.
- Handling is designed to be consistent with applicable Indian pharmacy/drug laws and with **Google Play's prescription/pharmacy** requirements for apps that facilitate the sale of pharmaceuticals.

If you do not wish to provide a prescription, do not place pharmacy orders that require one.

---

## 7. Children

The Services are intended for users **18 years of age or older** and are **not directed at children**. We do not knowingly collect personal data from children. If we become aware that we have collected personal data from a child without verifiable consent of a parent or lawful guardian as required under the DPDP Act, we will delete it. Contact privacy@kawkaw.in if you believe a child has provided us data.

---

## 8. Your rights under the DPDP Act

Subject to applicable law, you have the right to:

- **Access** a summary of the personal data we process about you and the processing activities.
- **Correction and updating** of inaccurate or incomplete personal data, and **completion** of incomplete data.
- **Erasure** of your personal data where it is no longer necessary for the purpose for which it was collected, subject to legal retention obligations (see the Data Retention Policy).
- **Withdraw consent** at any time, as easily as it was given. Withdrawal does not affect processing done before withdrawal.
- **Nominate** another individual to exercise your rights in the event of death or incapacity, as provided under the DPDP Act.
- **Grievance redressal** — raise a complaint with our Grievance Officer (Section 12) and, if unsatisfied, with the **Data Protection Board of India**.

To exercise these rights, contact **privacy@kawkaw.in** or the Grievance Officer. We may need to verify your identity (for example, via your registered phone number) before acting on a request. We will respond within the timelines required by applicable law.

---

## 9. Data security

We implement reasonable technical and organizational measures appropriate to the sensitivity of the data, including:

- **Encryption in transit** (TLS/HTTPS) for data exchanged between apps, our backend, and processors.
- **Encryption at rest** for stored data, including the application database and stored prescription images, using provider-managed encryption.
- **Access controls** — role-based access so that staff, riders, and pharmacy users can access only the data needed for their role; prescription images and other sensitive data are restricted to authorized personnel.
- **Authentication** via phone-number OTP (Firebase Authentication); short-lived sessions and revocable tokens.
- **Audit logging** of access to sensitive data and administrative actions.
- **Operational safeguards** — secured infrastructure hosting (Aiven, Upstash, Render, Vercel, Firebase), monitoring, and least-privilege practices.

No method of transmission or storage is completely secure. In the event of a personal data breach, we will notify the **Data Protection Board of India** and affected users as required under the DPDP Act and applicable rules.

---

## 10. Data retention

We retain personal data only for as long as necessary for the purposes described in this policy and as required by law. Specific retention periods for each data category (account data, order records, location history, prescription images, audit logs, notifications, refresh tokens, etc.) are set out in our **[Data Retention Policy](./data-retention-policy.md)**.

---

## 11. International transfers

Our processors may store or process data on infrastructure located **outside India**. Where data is transferred outside India, we rely on contractual protections with our processors and process such transfers in accordance with the DPDP Act and any restrictions notified by the Government of India. We will update this policy if transfer requirements change.

---

## 12. Cookies, analytics, and diagnostics

- The Kaw Kaw apps use **Google Firebase** for crash reporting and diagnostics to keep the apps stable and secure.
- The **kawkaw.in** website and the **admin console** (hosted on Vercel) may use strictly necessary cookies/local storage for session management and basic, privacy-respecting analytics.
- We do **not** use third-party advertising trackers and we do **not** sell data to advertisers.

You can control cookies through your browser settings; disabling necessary cookies may affect website/admin functionality.

---

## 13. Grievance Officer and contact

In accordance with the DPDP Act and the Information Technology Act, 2000 and rules thereunder, you may contact our Grievance Officer:

- **Grievance Officer:** [GRIEVANCE OFFICER NAME]
- **Email:** privacy@kawkaw.in
- **Address:** [REGISTERED ADDRESS]

For general support: **support@kawkaw.in**. For privacy matters: **privacy@kawkaw.in**.

If you are not satisfied with our response, you may approach the **Data Protection Board of India** as provided under the DPDP Act.

---

## 14. Changes to this policy

We may update this Privacy Policy from time to time. We will post the updated version with a new "Last updated" date and, where the changes are material, provide additional notice through the apps or website. Your continued use of the Services after changes take effect constitutes acceptance of the updated policy.
