# Loop Tailor - Complete Security Implementation Guide

This document outlines the complete security setup for "Loop Tailor". Following these guidelines ensures that your API keys, database, and user data remain completely secure.

## 1. Environment Variables Setup

**Why:** Environment variables keep secrets out of your code. Your frontend only needs certain public keys (like Firebase config), while other keys (like Cloudinary API Secret or Twilio SID) must stay on a secure backend. Currently, this is a frontend-only app, so any key that includes a "Secret" must NEVER intersect with the frontend code.

### `.env` File (DO NOT COMMIT)
Create this file in the root of your project:

```env
# ======== PUBLIC VARIABLES (SAFE FOR FRONTEND) ========
# These variables will be embedded in the app at build time.

# Firebase Config
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123DEF

# Push Notifications (Public Key)
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here

# Cloudinary Setup (Public)
VITE_CLOUDINARY_CLOUD_NAME=drnafef2r
VITE_CLOUDINARY_UPLOAD_PRESET=looptailor

# ======== PRIVATE SECRETS (NEVER ADD `VITE_` PREFIX) ========
# DO NOT ADD CLOUDINARY API SECRET HERE
# DO NOT ADD TWILIO SECRETS IF YOU ARE ONLY RUNNING FRONTEND CODE
```

### `.env.example` (COMMIT THIS FILE)
This file is a template for other developers. It shows what variables are required without containing real secrets. **(Already updated in your project).**

---

## 2. `.gitignore` Setup

**Why:** `.gitignore` prevents git from tracking your `.env` files. If you accidentally push secrets to GitHub, bots can scrape them within seconds. **(This has already been updated in your project).**

```gitignore
# Dependencies
node_modules/

# Production Build
build/
dist/
coverage/

# Misc
.DS_Store
*.log
.npm/

# Local Environment Variables & Secrets
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*
!.env.example
firebase-applet-config.json
credentials.json
*.pem
*.key
```

### What to do if keys were already pushed?
1. Iterate over to GitHub, find the commit where the secret was added.
2. You **MUST** invalidate/revoke those keys immediately. Go to the service provider (Cloudinary, Firebase, Twilio) and generate new keys.
3. Once a key is pushed to a public repo, changing the git history is not enough; the key is permanently compromised.

---

## 3. Firebase Security Rules

**Why:** Firebase configuration variables (`VITE_FIREBASE_API_KEY`, etc.) are *public by design*. They identify your app to Firebase. The real security comes from **Firestore Security Rules**. We must ensure `User A` cannot read or modify `User B`'s orders or shop details.

### Apply `firestore.rules`:
**(These rules are already applied in your `firestore.rules` file).** They verify two conditions:
1. Is the user logged in? (`request.auth != null`)
2. Does the document's `userId` match the requested user's UID? (`resource.data.userId == request.auth.uid` or `request.resource.data.userId == request.auth.uid`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Default Deny All
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() { return request.auth != null; }

    // Admin authorization logic
    function isAdmin() { 
      return isSignedIn() && 
             exists(/databases/$(database)/documents/admins/$(request.auth.token.email)) && 
             get(/databases/$(database)/documents/admins/$(request.auth.token.email)).data.isAdmin == true; 
    }

    // Role-based Access & Admins
    match /admins/{email} {
      allow read: if isSignedIn() && request.auth.token.email == email;
      allow write: if isAdmin();
    }
    match /adminLogs/{logId} {
      allow read, write: if isAdmin();
    }
    
    // The core rule: Every collection requires the user to own it via document field `userId`
    match /{collection}/{docId} {
        // Only allow if the collection is one of our known root collections
        allow read, update, delete: if isSignedIn() 
                                   && (collection in ['customers', 'orders', 'users', 'invoices', 'workers', 'staff', 'measurementTemplates', 'orderTemplates', 'notifications', 'measurements', 'payments', 'payroll', 'fcmTokens'])
                                   && resource.data.userId == request.auth.uid;
                                   
        allow create: if isSignedIn() 
                      && (collection in ['customers', 'orders', 'users', 'invoices', 'workers', 'staff', 'measurementTemplates', 'orderTemplates', 'notifications', 'measurements', 'payments', 'payroll', 'fcmTokens'])
                      && request.resource.data.userId == request.auth.uid;
    }

    // Shops Settings specific logic (document ID is the user ID)
    match /settings/{settingsId} {
      allow read, write: if isSignedIn() && request.auth.uid == settingsId;
    }
    match /shops/{shopId} {
      allow read, write: if isSignedIn() && request.auth.uid == shopId;
    }

  }
}
```

---

## 4. Cloudinary Security (Unsigned Uploads)

**Why:** To upload images to Cloudinary from the frontend, you shouldn't use your API Secret. Instead, use an "Unsigned Upload Preset" which allows uploads directly from the browser without needing a secret to sign the request.

### Setup Instructions:
1. Go to your **Cloudinary Dashboard**.
2. Navigate to **Settings (Gear Icon) -> Upload**.
3. Scroll down to **Upload presets** and click **Add upload preset**.
4. Set **Upload preset name** to `looptailor`.
5. Set **Signing Mode** to `Unsigned`.
6. Go to **Upload Manipulations** tab:
   - Set **Incoming Transformations** (e.g., limit width to 1080px to save storage/bandwidth).
   - Set **Format** to `auto` or `webp`.
7. Click **Save**.
8. In your React code, you make a POST request to `https://api.cloudinary.com/v1_1/drnafef2r/image/upload` specifying `upload_preset=looptailor`. You DO NOT need the API secret.
9. **Deletion:** Deletion *requires* a signed request. To delete Cloudinary images securely, you either:
   - Delete them via the Cloudinary Admin dashboard manually.
   - Ignore deletions (storage is cheap).
   - *Advanced:* Set up a Firebase Cloud Function to act as a secure backend to process deletions (the Cloud Function securely holds the `API_SECRET`).

---

## 5. Cloudflare Deployment Security

When deploying to Cloudflare Pages:
1. **Environment Variables Check:** Go to the Cloudflare Pages Dashboard -> Settings -> Environment Variables. Add all the `VITE_...` variables there. **Ensure no secrets are entered there.**
2. **Setup Custom Headers (Content Security Policy (CSP)):**
   Create a `_headers` file in the `public` directory.

Add this content to `public/_headers`:
```text
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

*Note on CSP:* A strict CSP is very hard to configure if you use a lot of inline styles (like Tailwind creates during development) or third-party iframes. For starters, blocking `X-Frame-Options` prevents Clickjacking.

---

## 6. How to Audit Your App for Exposed Keys
1. **GitHub Search:** Use the search bar in your repo. Search for `api_secret`, `TWILIO`, or `API_KEY`.
2. **Browser DevTools:** Open your app. Open Chrome DevTools (`F12`). Go to the **Network** tab. Execute an action (like viewing an order). Look at the Request Details. Verify you are not sending `API_SECRET` strings anywhere.
3. **Source Code Inspection:** Open DevTools -> **Sources** tab. Search (`Ctrl+Shift+F`) for `api_secret`. If the bundler bundled your secret into the JS files, it will appear here. If you didn't use `VITE_` prefix on the secret, Vite automatically removes it, which is the correct behavior.

## Summary Checklist
- [x] `.env.example` cleaned of secrets.
- [x] `.gitignore` updated.
- [x] Firestore security rules strictly scope data to `userId`.
- [x] Cloudinary `upload_preset` implemented instead of signed secrets.
- [x] Security `_headers` set up to block Clickjacking.
