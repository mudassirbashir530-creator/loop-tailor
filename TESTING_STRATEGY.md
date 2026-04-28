# Loop Tailor Strategic Testing Plan

## 0) Codebase Analysis Snapshot (Architecture & Risk Context)

### Runtime surfaces
- **Client app (React + Vite + TypeScript)** drives all core workflows (auth UX, CRM, order lifecycle, invoicing, notifications, admin CMS) through direct Firestore reads/writes and selected server API calls.
- **Node/Express server (`server.ts`)** provides operational APIs for health, password-reset OTP lifecycle, contact intake, and FCM push delivery.
- **Firebase** is the primary system of record (Auth, Firestore, Storage, Messaging), with security policy enforced via Firestore rules.

### Primary data model domains
- **Identity & tenancy:** `users`, `shops/{shopId}`
- **Core tailoring operations:** `customers`, `measurements`, `orders`, `payments`, `staff`, `payroll`
- **Operational UX:** `notifications`, `fcmTokens`, `orderTemplates`, `measurementTemplates`
- **Public/admin content:** `articles`, `social_posts`, `media_library`
- **Operational server-only collections:** `password_resets`, `contact_messages`

### Entry points and contracts
- **Frontend entry:** `src/main.tsx` → `src/App.tsx` route graph.
- **Backend entry:** `server.ts`.
- **Auth boundary:** Firebase client auth in browser + Firebase Admin auth updates on server.
- **Security boundary:** Firestore rules define data ownership, role controls, and schema expectations.

### Existing test baseline and gap
- There is **no executable test suite** in repo scripts (`npm test` is a placeholder), so all critical business logic and contract behavior are currently unguarded by automated regression coverage.

---

## Phase 1 — Unit Level

### High-risk units with concentrated business logic
- **`generateTokenId` monthly counter and fallback generation.**  
  *Why it matters:* Token collisions or incorrect rollover immediately break order traceability and downstream references.
- **`withRetry` transient-failure classification and retry envelope.**  
  *Why it matters:* Incorrect retry behavior can duplicate writes or hide persistent failures as intermittent.
- **`handleFirestoreError` normalization + error rethrow payload shaping.**  
  *Why it matters:* This function controls user-facing failure semantics and diagnostic observability across almost every write path.
- **Order status policy (`ORDER_STATUS`, `ORDER_STATUS_TRANSITIONS`, `isValidStatusTransition`).**  
  *Why it matters:* Status progression is business-critical and used in payroll, notifications, and delivery workflows.
- **Date risk helper (`isOrderOverdue`).**  
  *Why it matters:* Overdue classification drives operational urgency and notification prioritization.
- **WhatsApp link and template functions (`formatPhone`, message interpolation).**  
  *Why it matters:* Broken normalization or template substitution silently degrades customer communication.
- **`safeFetchJSON` timeout, content-type, and error-body handling.**  
  *Why it matters:* Contact and server integration reliability depends on defensive parsing and consistent error contracts.
- **`useImageUpload` file validation + pseudo-upload state transitions.**  
  *Why it matters:* Invalid state transitions can trap onboarding flows and create stale object URL leaks.

### Medium-risk units with broad usage
- **Language key resolution (`t(path)` nested lookup).**  
  *Why it matters:* Missing translation behavior can surface as broken UI copy in core transaction flows.
- **Measurement category/field transforms used in order/customer forms.**  
  *Why it matters:* Incorrect measurement key mapping corrupts persisted sizing data.

---

## Phase 2 — Integration Level

### Client ↔ Firestore data boundaries
- **Auth bootstrap (`AuthContext`) creating `users/{uid}` and `shops/{uid}` documents.**  
  *Why it matters:* Partial write success can leave valid auth users without required tenant documents.
- **Quick order orchestration (`customers` + `measurements` + `orders` + `notifications`).**  
  *Why it matters:* This is a multi-step write sequence without cross-document transactionality; partial failure creates orphaned or inconsistent records.
- **Payment recording (`payments` collection + embedded `order.payments` + `paymentStatus`).**  
  *Why it matters:* Dual-write patterns can diverge and produce incorrect balances.
- **Status transitions creating side effects (`notifications`, `payroll`, push trigger).**  
  *Why it matters:* Repeated updates or retries can duplicate payroll or notifications.
- **Template lifecycles (`measurementTemplates`, `orderTemplates`) consumed by order creation.**  
  *Why it matters:* Stale or malformed template state can poison many future orders.

### Client ↔ Server boundaries
- **Contact form dual-delivery (Google Apps Script + `/api/contact`).**  
  *Why it matters:* Mixed-success outcomes must not falsely report total failure or success.
- **Push notification trigger (`/api/notify/push`).**  
  *Why it matters:* Trust boundary assumes tokens are valid and tenant-scoped; violations can leak notifications.
- **Password reset UX split (client uses Firebase direct reset; server has OTP reset APIs).**  
  *Why it matters:* Coexisting reset patterns can diverge in policy, UX, and auditability.

### Firestore rules ↔ app model boundary
- **Rules schema vs runtime payload compatibility (statuses, timestamps, required keys).**  
  *Why it matters:* Drift causes production writes to fail despite UI-level validation.
- **Role-based admin access (`users.role` + `isAdmin`).**  
  *Why it matters:* Any rule or client mismatch can expose admin surfaces or block legitimate admin operations.

---

## Phase 3 — API & Contract Testing

### Backend endpoints and explicit contracts
- **`GET /api/health`** — expects no input, returns service liveness payload.  
  *Why it matters:* This is the deployment-level readiness signal for orchestration and monitoring.
- **`POST /api/auth/forgot-password`** — expects `email`; returns generic success message plus development OTP echo in non-production.  
  *Why it matters:* Any contract change here impacts account recovery UX and security disclosure risk.
- **`POST /api/auth/reset-password`** — expects `email`, `otp`, `newPassword`; returns success/failure based on OTP validity and user existence.  
  *Why it matters:* Silent regressions lock users out or weaken reset assurance.
- **`POST /api/contact`** — expects contact payload and returns success even when email delivery fails after persistence.  
  *Why it matters:* Consumer logic depends on “stored vs emailed” semantics, not just HTTP status.
- **`POST /api/notify/push`** — expects `shopId`, `title`, `body`, optional `orderId`; returns per-batch success/failure counts.  
  *Why it matters:* Operational dashboards and support workflows rely on accurate delivery accounting.

### Contract gap / implicit API dependency
- **`POST /api/notify/whatsapp` is invoked client-side but not implemented server-side.**  
  *Why it matters:* Consumers may treat WhatsApp notifications as available when endpoint behavior is undefined or consistently failing.

### Error-state contract coverage
- **Validation failures (missing fields, invalid email, weak password).**  
  *Why it matters:* Error body shape stability is critical for predictable UX messaging.
- **Not-found and expired-state responses in OTP flow.**  
  *Why it matters:* Incorrect status codes can induce wrong retry behavior and support burden.
- **Infrastructure failure paths (Admin SDK misconfig, Firestore unavailable, SMTP unavailable).**  
  *Why it matters:* These failures should remain explicit and non-destructive to persisted state.

---

## Phase 4 — Async & Concurrency Risks

- **Concurrent order creation for same shop token counter.**  
  *Why it matters:* Even with transaction-based counters, fallback token path can produce non-sequential or colliding identifiers under contention.
- **Simultaneous status updates from list and detail screens.**  
  *Why it matters:* Out-of-order writes can regress statuses or duplicate side-effect creation.
- **Parallel payment recording from multiple sessions.**  
  *Why it matters:* Non-transactional recomputation of `paymentStatus` can drift from true balance.
- **Measurement set editing across tabs/devices (`onSnapshot` + local typing).**  
  *Why it matters:* Live snapshot replacement can overwrite in-progress edits and lose user input.
- **Push token registration races (same token/doc, multi-device churn).**  
  *Why it matters:* Token set may flap, causing missed pushes or stale token bloat.
- **Transporter initialization races in server startup traffic spikes.**  
  *Why it matters:* Shared mutable transporter setup can cause intermittent email send failures.

---

## Phase 5 — Data Consistency & Integrity

- **Customer create/update + measurement upsert + order create chain.**  
  *Why it matters:* Breakage mid-chain leaves orders pointing to incomplete customer context.
- **Order delete without dependent cleanup (`payments`, `payroll`, `notifications`, storage).**  
  *Why it matters:* Historical and financial records can become orphaned.
- **Dual-source payment ledger (embedded list + collection docs).**  
  *Why it matters:* Reconciliation drift directly impacts cash tracking and customer trust.
- **Delivered-status payroll generation in multiple flows.**  
  *Why it matters:* Duplicate payroll entries create financial overstatement.
- **Legacy + new measurement document conventions (`customerId` and `customerId__setName`).**  
  *Why it matters:* Incomplete migration handling can show stale values or delete wrong set.
- **Rules-enforced immutability fields (`shopId`, `createdAt`) vs app writes.**  
  *Why it matters:* Any client payload drift causes writes to fail at runtime under security policy.

---

## Phase 6 — Edge Cases & Boundary Conditions

### Identity and session
- **User signed out mid-operation; stale `auth.currentUser` in async flows.**  
  *Why it matters:* Writes may target wrong path or fail after optimistic UI progression.
- **Admin fallback logic based on hardcoded email + verification state.**  
  *Why it matters:* Misclassification can overgrant or block admin access.

### Input and payload boundaries
- **Empty or malformed phone numbers in WhatsApp and contact flows.**  
  *Why it matters:* Notification promises fail silently when link generation receives invalid targets.
- **Extreme numeric values (price, quantity, measurement decimals, negative payments).**  
  *Why it matters:* Financial and fitting calculations become nonsensical without strict bounds.
- **Oversized text fields vs Firestore rule size caps.**  
  *Why it matters:* Writes fail late unless UI constrains lengths consistently with rules.
- **Date edge cases (timezone boundaries, invalid deliveryDate parsing).**  
  *Why it matters:* Overdue and scheduling logic can flip unexpectedly around midnight/UTC shifts.

### Data-shape resilience
- **Missing optional fields in historical documents (`statusHistory`, `paymentStatus`, `createdAt`).**  
  *Why it matters:* Legacy data must not crash rendering or status logic.
- **Non-JSON or empty API responses consumed by `safeFetchJSON`.**  
  *Why it matters:* Transport anomalies should degrade gracefully, not break UX state machines.

---

## Phase 7 — Failure & Resilience Scenarios

- **Firebase Admin uninitialized/partially configured on server.**  
  *Why it matters:* Password reset and push APIs should fail safely with explicit error semantics.
- **SMTP unavailable or invalid credentials during password/contact workflows.**  
  *Why it matters:* Critical communications need clear persistence-first behavior and observable failures.
- **Firestore write/read outages in core workflows.**  
  *Why it matters:* Order creation and payment capture are mission-critical and must not silently degrade.
- **Google Apps Script endpoint timeout/failure on contact page.**  
  *Why it matters:* Dual-path delivery requires deterministic user messaging about actual outcome.
- **Messaging send partial failures and token cleanup logic.**  
  *Why it matters:* Incorrect cleanup can remove valid tokens or retain dead tokens indefinitely.
- **Malformed external response bodies in server APIs.**  
  *Why it matters:* Error propagation should preserve debuggability without exposing sensitive internals.

---

## Phase 8 — Load & Scalability

- **Unpaginated real-time listeners on large collections (`orders`, `customers`, `notifications`, `payroll`).**  
  *Why it matters:* Memory, bandwidth, and render costs scale non-linearly with tenant growth.
- **Client-side sorting/filtering across full snapshots.**  
  *Why it matters:* CPU-heavy recalculation degrades responsiveness as dataset cardinality increases.
- **Order creation bursts around peak business windows.**  
  *Why it matters:* Counter contention and write amplification increase latency and collision risk.
- **High-volume push multicast operations and token iteration.**  
  *Why it matters:* Delivery throughput and cleanup loops may become a bottleneck.
- **Admin dashboards reading full global collections.**  
  *Why it matters:* Centralized aggregation queries can become expensive and slow without bounded reads.

---

## Phase 9 — Security-Sensitive Areas

- **Firestore authorization invariants for tenant isolation (`shops/{shopId}` ownership).**  
  *Why it matters:* Any bypass exposes one shop’s PII and financial data to another.
- **Role integrity for admin resources (`users.role`, admin-only collections).**  
  *Why it matters:* Privilege escalation risk is existential for content and user governance.
- **Server endpoints lacking explicit auth verification (`Authorization` header is sent by client but not validated in handlers).**  
  *Why it matters:* Unauthenticated invocation may be possible depending on deployment perimeter.
- **Password reset OTP lifecycle security (reuse, expiration, enumeration, brute force).**  
  *Why it matters:* Weak reset controls enable account takeover.
- **HTML email generation with user-provided fields in contact flow.**  
  *Why it matters:* Insufficient sanitization can introduce content injection into operational inboxes.
- **Public config exposure and operational secret handling.**  
  *Why it matters:* Client config is expected public, but service-account and SMTP secrets must remain server-confined.
- **Rules correctness regression risk (e.g., undefined helper names / syntax drift).**  
  *Why it matters:* Invalid or bypassed rules undermine the entire trust model.

---

## Phase 10 — Coverage Gaps & Priority Order

### Highest-risk untested areas (ranked)
1. **Tenant isolation and Firestore rule correctness.**  
   *Why it matters:* A single policy defect can expose all customer/order data.
2. **Order lifecycle side effects (status → notifications/payroll/push).**  
   *Why it matters:* Core operational correctness and financial integrity depend on this path.
3. **Payment consistency across dual-write model.**  
   *Why it matters:* Incorrect balances directly impact revenue and disputes.
4. **Password reset server flow security + contract behavior.**  
   *Why it matters:* Recovery vulnerabilities can lead to account compromise.
5. **Quick order multi-entity write orchestration under partial failure.**  
   *Why it matters:* This is the highest-frequency revenue entry workflow.
6. **Admin authorization boundary and role handling.**  
   *Why it matters:* Privilege bugs create high-impact governance/security failures.
7. **Contact/push integration resilience under external dependency failure.**  
   *Why it matters:* Operational communication reliability affects customer trust.
8. **Scalability under large realtime datasets and heavy filtering.**  
   *Why it matters:* Performance degradation can block day-to-day shop operations.

### Recommended test execution priority
- **Priority A (immediate):** security boundary + payment/order integrity + reset flow.
- **Priority B (near-term):** integration resilience + high-frequency workflow consistency.
- **Priority C (ongoing hardening):** performance/scalability and low-frequency edge paths.

---

## Prioritized Risk Matrix

### High
- Firestore rule correctness and tenant isolation.
- Admin privilege boundaries and role escalation controls.
- Payment ledger consistency (`payments` docs vs `order.payments` snapshot).
- Order status side effects (duplicate payroll/notifications/push).
- Password reset OTP lifecycle and endpoint abuse resistance.
- Multi-step order creation partial-failure consistency.

### Medium
- Contact dual-channel delivery outcome consistency.
- Push token lifecycle and invalid-token cleanup correctness.
- Template/default selection correctness for measurements/orders.
- Real-time UI race conditions across multiple active sessions.
- Date/timezone correctness for delivery and overdue calculations.

### Low
- Localization fallback quality and missing-key behavior.
- Non-critical UI state regressions in optional workflows.
- Cosmetic ordering/sorting preferences in list visualizations.
