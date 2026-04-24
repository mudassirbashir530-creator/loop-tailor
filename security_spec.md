# Security Specification for Firestore

## 1. Data Invariants
1. **Shop Identity**: A shop document ID must match the owner's `request.auth.uid`. No user can create or modify a shop profile with a UID different from their own.
2. **Subcollection Relational Guard**: All `orders`, `customers`, `measurements`, `payments`, `staff`, and `notifications` belong strictly to a shop id. Access is universally blocked unless `request.auth.uid == shopId` or the user is verified as an internal shop worker in some contexts (though for now, only `isOwner` applies).
3. **Admin Exclusivity**: Global resources like `users` (list), `articles`, `social_posts`, and `media_library` may be publicly readable (for published content) but can only be modified if the user `isAdmin()`.
4. **Temporal Constraints**: All `createdAt` fields must match `request.time` exactly.
5. **Types constraint validation**: All data strings must enforce reasonable `.size()` caps to prevent "Denial of Wallet" resource poisoning.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing**: Attempt to create an order in `/shops/TARGET_ID/orders/1` where `TARGET_ID` != `auth.uid`.
2. **Shadow Field Injection**: Attempt to create a customer with an unseen field `isVerified: true`.
3. **Type Poisoning**: Attempt to update an order's `status` to a boolean or integer instead of the enum string.
4. **Denial of Wallet**: Create an article title with a 1MB junk string.
5. **PII Blanket Leak**: Attempt to list all customers of a shop that is not owned by the active user.
6. **State Shortcutting**: Update an order from `Pending` directly to `Delivered` skipping the `paymentStatus` increment update.
7. **Temporal Forgery**: Create an order but set `createdAt` to a date 5 years ago instead of `request.time`.
8. **Immutability Breach**: Update an existing order to change its `shopId` or `createdAt` timestamp.
9. **Unverified Email By-pass**: Attempt a write using an auth context where `email_verified: false` is supplied.
10. **Array Explosion**: If appending to a list (like `payments` on an order), supply an array of 5,000 blank entries.
11. **Admin Privilege Escalation**: Update `/users/{uid}` to elevate `role` to `'admin'`.
12. **Orphaned Write**: Insert a measurement document for a customer ID that does not exist in the `/customers/` collection.

## 3. The Test Runner
A `firestore.rules.test.ts` file must be generated to execute these conditions and verify that `PERMISSION_DENIED` is triggered for all invalid conditions.
