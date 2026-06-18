# Kaw Kaw — Data Retention Policy

*Draft for review by qualified legal counsel before publication.*

**Last updated:** [DD MONTH YYYY]

---

## Plain-language summary

This policy explains how long **KawKawTech Pvt Ltd** ("Kaw Kaw") keeps different types of personal data, and what happens when you close your account. It supports our [Privacy Policy](./privacy-policy.md).

- We keep data only as long as needed for the purpose it was collected, plus any period the law requires.
- **Order and invoice records** are kept longer for **tax and legal** reasons.
- **Prescription images** and **location history** are sensitive and kept for limited, defined periods.
- When you close your account, we delete or anonymize your data, except records we must retain by law.
- Backups are rotated and overwritten on a schedule.

This summary is for convenience only. The full policy below governs.

---

## 1. Principles

- **Purpose limitation & storage limitation:** We retain personal data only for as long as necessary for the purposes described in the [Privacy Policy](./privacy-policy.md), or as required by law, after which we delete or anonymize it.
- **Legal retention:** Some records (notably order/invoice/tax records) are retained for statutory periods even after account closure.
- **Sensitive data minimization:** Prescription images and precise location data are retained for the shortest period consistent with the purpose and legal requirements.

The periods below are **defaults/targets** and may be adjusted to meet legal, tax, security, or dispute-resolution needs. Final periods should be confirmed by qualified legal/tax counsel.

---

## 2. Retention periods by data category

| Data category | What it includes | Retention period (default) | Basis |
|---|---|---|---|
| **Account data** | Phone number, optional name/email, account settings | For the life of the account; deleted/anonymized within **[e.g. 30–90 days]** after account closure (subject to legal holds) | Account provision; DPDP storage limitation |
| **Order records** | Items, store, amounts, status, timestamps, delivery address linked to the order | Retained as needed for service/support, and as **invoice/tax records** for **[e.g. 8 years]** per applicable Indian tax/accounting law | Service, dispute resolution, legal/tax obligation |
| **Invoice / tax records** | Billing/COD transaction records required for tax/accounting | **[e.g. 8 years]** (or as required by applicable law) | Legal/tax obligation |
| **Location history** | Customer delivery coordinates; **rider GPS/location traces** captured during active deliveries/online time | Operational/live tracking data retained for a short period for delivery and support, then deleted or aggregated/anonymized within **[e.g. 30–90 days]** | Delivery, safety, support; minimization |
| **Prescription images** | Images uploaded for pharmacy orders | Retained only as long as needed for verification, dispensing, and applicable pharmacy/drug-law recordkeeping — **[e.g. up to the statutory pharmacy record period; otherwise deleted within a short, defined window]** | Pharmacist verification; legal/regulatory recordkeeping |
| **Audit logs** | Access to sensitive data and admin actions | **[e.g. 12–24 months]** | Security, fraud prevention, accountability |
| **Notifications / FCM tokens** | Device push tokens; notification/delivery logs | Tokens retained while valid and refreshed; stale tokens purged. Notification logs **[e.g. 90–180 days]** | Service delivery; reliability |
| **Refresh / session tokens** | Auth/session tokens (e.g. in Redis) | Short-lived; expire and are purged automatically (typically **minutes to days**); revoked on logout/account action | Authentication; security |
| **Device / app diagnostics** | Crash logs, performance/diagnostic data (via Firebase) | **[e.g. 90 days]** (per provider defaults where applicable) | Reliability, security |
| **Support correspondence** | Tickets, emails, chat with support | **[e.g. 12–24 months]** after resolution | Support, dispute resolution |

Where a category is also part of an order/invoice record needed for tax, the longer legal retention period applies to that record.

---

## 3. Legal and tax retention

Certain **order, invoice, and financial records** must be retained to comply with Indian tax, accounting, and other legal obligations (default **[e.g. 8 years]**, or as otherwise required by law). These records may be retained even after you close your account or request erasure, to the extent required by law. We limit access to such retained records to authorized personnel.

---

## 4. Deletion on account closure

- You may request **account closure** and **erasure** of your personal data via **privacy@kawkaw.in** or the Grievance Officer (see the [Privacy Policy](./privacy-policy.md)).
- On verified closure/erasure requests, we delete or **anonymize** your personal data within **[e.g. 30–90 days]**, **except**:
  - records we must retain for **legal/tax** reasons (Section 3);
  - data needed to resolve an open dispute, prevent fraud/abuse, or enforce our Terms;
  - data in **backups**, which is removed on the backup rotation schedule (Section 5).
- We may retain **anonymized or aggregated** data that can no longer identify you for analytics and service improvement.

---

## 5. Backups

- We maintain encrypted backups of operational data (e.g. via our database provider, Aiven) for disaster recovery.
- Backups are **rotated and overwritten** on a defined schedule (default retention **[e.g. 30 days]**). Data deleted from live systems persists in backups only until the backup containing it is rotated out, after which it is no longer restorable.

---

## 6. Anonymization

Where we no longer need personal data for an active purpose but wish to retain insights (for example, demand patterns or service performance), we may **anonymize or aggregate** the data so that it no longer identifies any individual. Anonymized data is not subject to the deletion timelines above.

---

## 7. Who to contact for deletion

- **Erasure / account-closure requests:** privacy@kawkaw.in
- **Grievance Officer:** [GRIEVANCE OFFICER NAME], privacy@kawkaw.in, [REGISTERED ADDRESS]
- **General support:** support@kawkaw.in
- **Website:** kawkaw.in

We may verify your identity (for example, via your registered phone number) before acting on a deletion request, and will respond within the timelines required by the DPDP Act and applicable law.

---

## 8. Changes

We may update this Data Retention Policy from time to time. The current version with its "Last updated" date applies. Material changes will be notified as described in the [Privacy Policy](./privacy-policy.md).
