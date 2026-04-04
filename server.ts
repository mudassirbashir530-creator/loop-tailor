import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import crypto from "crypto";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

// Initialize Firebase Admin (requires GOOGLE_APPLICATION_CREDENTIALS in production)
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Fallback for development without credentials
    admin.initializeApp();
  }
} catch (error) {
  console.warn("Firebase Admin initialization warning:", error);
}

const db = admin.firestore();

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;
  
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("Created Ethereal test email account:", testAccount.user);
  }
  return transporter;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  /**
   * Generates a secure 6-digit OTP for password reset
   */
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: "Valid email is required" });
      }

      // 1. Generate a secure random 6-digit OTP
      // Using crypto.randomInt for cryptographically secure random numbers
      const otp = crypto.randomInt(100000, 999999).toString();

      // 2. Set expiration time (10 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // 3. Save OTP temporarily in Firestore
      // We use the email as the document ID or store it in a dedicated collection
      await db.collection('password_resets').doc(email.toLowerCase()).set({
        otp,
        email: email.toLowerCase(),
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        used: false
      });

      // 4. Send the OTP via Email
      const mailTransporter = await getTransporter();
      
      const htmlContent = `
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 0; text-align: center;">
          <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #16a34a; margin-bottom: 24px; font-size: 24px; font-weight: bold;">Loop Tailor</h1>
            <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 16px;">Password Reset Verification</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
              You recently requested to reset your password. Use the verification code below to proceed.
            </p>
            <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
              <span style="font-size: 36px; font-weight: bold; color: #16a34a; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
              This code will expire in <strong>10 minutes</strong>.
            </p>
            <p style="color: #64748b; font-size: 14px;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      `;

      const info = await mailTransporter.sendMail({
        from: '"Loop Tailor" <noreply@looptailor.com>',
        to: email,
        subject: "Your Password Reset Code",
        html: htmlContent,
      });

      console.log("Message sent: %s", info.messageId);
      // Preview only available when sending through an Ethereal account
      if (!process.env.SMTP_HOST) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      }
      
      // Do not return the OTP in the response in production!
      res.status(200).json({ 
        message: "If an account exists with this email, an OTP has been sent.",
        // Only including for testing purposes in this environment
        _dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined
      });

    } catch (error) {
      console.error("Error generating OTP:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Verifies the 6-digit OTP and resets the password
   */
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: "Email, OTP, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const resetDoc = await db.collection('password_resets').doc(email.toLowerCase()).get();

      if (!resetDoc.exists) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      const data = resetDoc.data();

      if (data?.used) {
        return res.status(400).json({ error: "OTP has already been used" });
      }

      if (data?.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      const now = admin.firestore.Timestamp.now();
      if (data?.expiresAt.toMillis() < now.toMillis()) {
        return res.status(400).json({ error: "OTP has expired" });
      }

      // Find the user by email
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(email);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          return res.status(404).json({ error: "No user found with this email" });
        }
        throw error;
      }

      // Update the user's password
      await admin.auth().updateUser(userRecord.uid, {
        password: newPassword
      });

      // Delete OTP after successful reset to prevent any reuse
      await db.collection('password_resets').doc(email.toLowerCase()).delete();

      res.status(200).json({ message: "Password reset successfully", success: true });

    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
