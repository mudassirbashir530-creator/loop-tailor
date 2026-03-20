# Loop Tailor - Modern Tailoring Management

Loop Tailor is a premium, production-ready tailoring management platform built with React, Vite, Tailwind CSS, and Firebase.

## 🚀 Features

- **Smart Customer CRM:** Store measurements and history.
- **Live Order Tracking:** Real-time status from 'Pending' to 'Delivered'.
- **Digital Invoices:** Generate and share invoices via WhatsApp/Email.
- **Visual References:** Attach reference photos and sample designs.
- **Secure Cloud Storage:** Powered by Firebase Firestore and Storage.
- **Email/Password Auth:** Secure access for shop owners.

## 📦 Exporting to GitHub

This project is fully structured for direct export to GitHub.

1.  In the AI Studio interface, click the **Settings** (⚙️ gear icon).
2.  Select **Export to GitHub**.
3.  Follow the prompts to push the code to a new or existing repository.

**Note:** The exported codebase contains all necessary files, including the `package.json` with all dependencies, the `public/_redirects` file for routing, and the Firebase configuration files.

## 🛠️ Setup Instructions (Local & Live)

### 1. Firebase Configuration

This app uses Firebase for authentication, database, and storage. To set it up for your own production environment:

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/).
2.  **Enable Services:**
    -   **Authentication:** Enable the **Email/Password** provider.
    -   **Firestore Database:** Create a database in production mode.
    -   **Storage:** Enable Firebase Storage.
3.  **Get Credentials:** Go to Project Settings, create a Web App, and copy the configuration object.
4.  **Set Environment Variables:**
    Create a `.env` file in the root of your project (you can copy `.env.example`) and add your keys:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```
    *Note: The app will fallback to `firebase-applet-config.json` if these variables are not found, but using `.env` is recommended for production.*

### 2. Deploy Firestore Rules

The security rules are located in `firestore.rules`. You must deploy them to secure your database:

```bash
npm install -g firebase-tools
firebase login
firebase use --add your_project_id
firebase deploy --only firestore:rules
```

### 3. Auto-Delete Images (Cloud Functions)

To implement the auto-deletion of images 14 days after order completion:

1.  Initialize Firebase Functions in your local environment:
    ```bash
    firebase init functions
    ```
2.  Copy the logic from `firebase-functions-logic.ts` into your `functions/src/index.ts`.
3.  Deploy the function:
    ```bash
    firebase deploy --only functions
    ```

## 🌐 Cloud Deployment (Cloudflare Pages)

Loop Tailor is optimized for static hosting platforms like Cloudflare Pages, Vercel, or Netlify.

### Cloudflare Pages Setup:
1.  Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Pages**.
2.  Click **Connect to Git** and select your exported GitHub repository.
3.  Configure the build settings:
    -   **Framework preset:** None (or Vite if available)
    -   **Build command:** `npm run build`
    -   **Build output directory:** `dist`
4.  **Environment Variables:** Add all the `VITE_FIREBASE_*` variables from your `.env` file into the Cloudflare Pages environment variables settings.
5.  Click **Save and Deploy**.

**Routing Note:** The project includes a `public/_redirects` file with `/* /index.html 200`. This ensures that client-side routing (React Router) works perfectly on Cloudflare Pages without throwing 404 errors on page refresh.

---

Built with ❤️ for craftsmen who value precision.
