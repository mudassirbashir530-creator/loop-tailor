import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import twilio from "twilio";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Load firebase-applet-config.json
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}
const databaseId = firebaseConfig.firestoreDatabaseId;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'LoopTailor',
  api_key: process.env.CLOUDINARY_API_KEY || '822749848441664',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'gqIlc11KOB1o8pcAC6a-qAMUQZA'
});

const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;


// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.'));
    }
  }
});

// Initialize Firebase Admin (requires GOOGLE_APPLICATION_CREDENTIALS in production)
let db: admin.firestore.Firestore | null = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore(databaseId);
  } else {
    // If no credentials, try to initialize but don't crash if it fails
    if (admin.apps.length === 0) {
      admin.initializeApp();
    }
    db = admin.firestore(databaseId);
  }
} catch (error) {
  console.warn("Firebase Admin initialization warning:", error);
}

// Utility to get Firestore instance securely
const getDb = () => {
  if (!db) {
    // Attempt lazy init if not already done
    try {
      if (admin.apps.length > 0) {
        db = admin.firestore(databaseId);
      }
    } catch (e) {
      console.error("Failed to get Firestore instance:", e);
    }
  }
  return db;
};

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
   * Upload image to Cloudinary
   */
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Convert buffer to base64
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto",
        fetch_format: "auto",
        quality: "auto",
      });

      res.status(200).json({ url: uploadResult.secure_url });
    } catch (error: any) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload image" });
    }
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
      const firestore = getDb();

      if (!firestore) {
         return res.status(500).json({ error: "Database not available" });
      }

      // 2. Set expiration time (10 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // 3. Save OTP temporarily in Firestore
      // We use the email as the document ID or store it in a dedicated collection
      await firestore.collection('password_resets').doc(email.toLowerCase()).set({
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
            <h1 style="color: #22c55e; margin-bottom: 24px; font-size: 24px; font-weight: bold;">Loop Tailor</h1>
            <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 16px;">Password Reset Verification</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 32px;">
              You recently requested to reset your password. Use the verification code below to proceed.
            </p>
            <div style="background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
              <span style="font-size: 36px; font-weight: bold; color: #22c55e; letter-spacing: 8px;">${otp}</span>
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

      const firestore = getDb();
      if (!firestore) {
        return res.status(500).json({ error: "Database not available" });
      }

      const resetDoc = await firestore.collection('password_resets').doc(email.toLowerCase()).get();

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

  /**
   * Handles contact form submissions
   */
  app.post("/api/contact", async (req, res) => {
    try {
      const { firstName, lastName, email, phone, message } = req.body;

      if (!firstName || !lastName || !email || !message) {
        return res.status(400).json({ error: "Required fields are missing" });
      }

      // 1. Save the message to Firestore so it's never lost
      try {
        const firestore = getDb();
        if (firestore) {
          await firestore.collection('contact_messages').add({
            firstName,
            lastName,
            email,
            phone: phone || '',
            message,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'new'
          });
        }
      } catch (dbError) {
        console.error("Failed to save contact message to Firestore:", dbError);
        // Continue anyway to try sending the email
      }

      // 2. Try to send the email notification
      try {
        const mailTransporter = await getTransporter();
        
        const htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22c55e;">New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background: #f8fafc; border-left: 4px solid #22c55e; padding: 16px; margin: 0; white-space: pre-wrap;">${message}</blockquote>
          </div>
        `;

        await mailTransporter.sendMail({
          from: '"Loop Tailor Contact" <noreply@looptailor.com>',
          to: process.env.SMTP_USER || "looptailor@gmail.com",
          replyTo: email,
          subject: `New Contact Message from ${firstName} ${lastName}`,
          html: htmlContent,
        });
      } catch (emailError) {
        console.error("Failed to send contact email notification:", emailError);
        // We don't throw here because the message was saved to Firestore
      }

      res.status(200).json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/notify/whatsapp", async (req, res) => {
    try {
      const { to, customerName, token, shopName, status, orderId, shopId, dressType } = req.body;
      
      if (!twilioClient) {
        return res.status(503).json({ error: "WhatsApp notifications are not configured yet." });
      }

      if (!to || !customerName || !shopName || !status) {
        return res.status(400).json({ error: "Missing required fields for WhatsApp notification" });
      }

      // Format phone number to E.164. Twilio requires it.
      let formattedPhone = to.replace(/[^\d+]/g, '');
      if (!formattedPhone.startsWith('+')) {
         if(formattedPhone.startsWith('0')) {
           formattedPhone = '+92' + formattedPhone.substring(1);
         } else {
           formattedPhone = '+' + formattedPhone;
         }
      }

      const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
      const message = `Hello ${customerName},\n\nYour order for ${dressType || 'dress'} at ${shopName} is now: *${status.toUpperCase()}*.\n\nToken: ${token || 'N/A'}\n\nThank you!`;

      const twilioRes = await twilioClient.messages.create({
        body: message,
        from: fromWhatsApp,
        to: `whatsapp:${formattedPhone}`
      });

      res.status(200).json({ success: true, messageId: twilioRes.sid });

    } catch (error: any) {
      console.error("Twilio error:", error);
      res.status(500).json({ error: error.message || "Failed to send WhatsApp message" });
    }
  });

  app.post("/api/notify/push", async (req, res) => {
    try {
      const { shopId, title, body, orderId } = req.body;
      
      if (!shopId || !title || !body) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if we have Firebase credentials initialized
      if (!admin.apps.length) {
         return res.status(500).json({ error: "Firebase Admin is not configured" });
      }

      const firestore = getDb();
      if (!firestore) {
        return res.status(500).json({ error: "Database not available" });
      }

      const tokensRef = firestore.collection('shops').doc(shopId).collection('fcmTokens');
      const tokensSnap = await tokensRef.get();
      
      if (tokensSnap.empty) {
        return res.json({ success: true, message: "No tokens registered for this shop" });
      }

      const tokens: string[] = [];
      tokensSnap.forEach(doc => {
        if (doc.data().token) {
          tokens.push(doc.data().token);
        }
      });

      if (tokens.length === 0) {
        return res.json({ success: true, message: "No valid tokens found" });
      }

      const message = {
        notification: {
          title,
          body
        },
        data: {
          orderId: orderId || "",
          route: orderId ? `/dashboard/orders/${orderId}` : "/dashboard"
        },
        tokens
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      // Cleanup expired/invalid tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        
        // Remove failed tokens from Firestore
        const firestore = getDb();
        if (failedTokens.length > 0 && firestore) {
          const batch = firestore.batch();
          tokensSnap.forEach(doc => {
            if (failedTokens.includes(doc.data().token)) {
              batch.delete(doc.ref);
            }
          });
          await batch.commit().catch(console.error);
        }
      }

      return res.json({ 
        success: true, 
        successCount: response.successCount,
        failureCount: response.failureCount
      });
    } catch (error) {
      console.error("Error sending push notification:", error);
      return res.status(500).json({ error: "Failed to send notification" });
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

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
