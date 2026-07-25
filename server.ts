import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import crypto from "crypto";
import nodemailer from "nodemailer";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import twilio from "twilio";
import { MongoClient } from "mongodb";

import dns from "dns";

dotenv.config();

// DNS fallback for Windows SRV queries
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

// Configure MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mudassirbashir530_db_user:RP03VcEb2b8p3Q6e@looptailor.2z63upu.mongodb.net/looptailor?retryWrites=true&w=majority";
let mongoClient: MongoClient | null = null;
let mongoDb: any = null;

async function getMongoDb() {
  if (mongoDb) return mongoDb;
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log("Connected successfully to MongoDB");
  }
  mongoDb = mongoClient.db();
  return mongoDb;
}

// Configure Cloudinary
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

const hasCloudinary = !!(cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: cloudinaryCloudName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret
  });
}

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
   * MongoDB Database & Auth REST API
   */

  // Sign up
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const db = await getMongoDb();
      const { email, password, name, phone, language, shopName, shopLogoUrl, shopAddress } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if user already exists
      const existingUser = await db.collection("users").findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ error: "An account with this email address already exists. Please login instead." });
      }
      
      const userId = "user_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20);
      const defaultPlan = 'free';
      
      const newUser = {
        _id: userId,
        uid: userId,
        ownerName: name || 'New User',
        email: normalizedEmail,
        password: password,
        phone: phone || '',
        shopName: shopName || 'My Tailor Shop',
        countryCode: '+92',
        photoURL: '',
        provider: 'password',
        preferred_language: language || 'en',
        role: 'user',
        isAdmin: false,
        createdAt: new Date().toISOString(),
        plan: defaultPlan,
        planPrice: 0,
        planLimits: {
          customers: 10,
          ordersPerMonth: 15,
          workers: 1
        },
        features: {
          canDownloadInvoice: true,
          canUploadImages: true,
          canUseWhatsApp: false,
          canUsePayroll: false,
          canViewAnalytics: false,
          canCustomBranding: false,
          canManageWorkers: true
        },
        currentUsage: {
          customers: 0,
          ordersThisMonth: 0,
          workers: 0,
          lastResetDate: new Date().toISOString()
        }
      };
      
      await db.collection("users").replaceOne({ _id: userId }, newUser, { upsert: true });
      
      // Initialize settings for the shop too
      await db.collection("settings").replaceOne(
        { _id: userId },
        {
          _id: userId,
          name: shopName || name || 'My Tailor Shop',
          phone: phone || '',
          logoUrl: shopLogoUrl || '',
          address: shopAddress || '',
          createdAt: new Date().toISOString(),
        },
        { upsert: true }
      );
      
      res.status(201).json(newUser);
    } catch (err: any) {
      console.error("Signup error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const db = await getMongoDb();
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      const normalizedEmail = email.toLowerCase().trim();
      const user = await db.collection("users").findOne({ email: normalizedEmail });
      
      if (!user) {
        return res.status(401).json({ error: "No user found with this email" });
      }
      
      if (user.password !== password) {
        return res.status(401).json({ error: "Incorrect password" });
      }
      
      res.json({
        id: user._id || user.uid,
        uid: user.uid || user._id,
        email: user.email,
        ownerName: user.ownerName || user.name,
        ...user
      });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Add document
  app.post("/api/db/:collection", async (req, res) => {
    try {
      const db = await getMongoDb();
      const collectionName = req.params.collection;
      const data = req.body;
      
      if (data.id) {
        data._id = data.id;
      } else if (data._id) {
        data.id = data._id;
      } else {
        data._id = crypto.randomUUID();
        data.id = data._id;
      }
      
      await db.collection(collectionName).replaceOne(
        { _id: data._id },
        data,
        { upsert: true }
      );
      res.json(data);
    } catch (err: any) {
      console.error(`Error inserting into ${req.params.collection}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get single document
  app.get("/api/db/:collection/:id", async (req, res) => {
    try {
      const db = await getMongoDb();
      const collectionName = req.params.collection;
      const id = req.params.id;
      
      const doc = await db.collection(collectionName).findOne({ _id: id });
      if (!doc) {
        return res.status(404).json({ error: "Not found" });
      }
      
      res.json(doc);
    } catch (err: any) {
      console.error(`Error getting from ${req.params.collection}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // Put / update single document
  app.put("/api/db/:collection/:id", async (req, res) => {
    try {
      const db = await getMongoDb();
      const collectionName = req.params.collection;
      const id = req.params.id;
      const data = req.body;
      
      delete data._id;
      delete data.id;
      
      let updateQuery: any = {};
      let incQuery: any = {};
      
      for (const [key, val] of Object.entries(data)) {
        if (val !== null && typeof val === "object" && (val as any).__type === "increment") {
          incQuery[key] = (val as any).value;
        } else {
          updateQuery[key] = val;
        }
      }
      
      const mongoPayload: any = {};
      if (Object.keys(updateQuery).length > 0) mongoPayload.$set = updateQuery;
      if (Object.keys(incQuery).length > 0) mongoPayload.$inc = incQuery;
      
      const merge = req.query.merge === "true";
      
      if (merge) {
        await db.collection(collectionName).updateOne(
          { _id: id },
          mongoPayload,
          { upsert: true }
        );
      } else {
        await db.collection(collectionName).replaceOne(
          { _id: id },
          { _id: id, id, ...data },
          { upsert: true }
        );
      }
      
      res.json({ id, ...data });
    } catch (err: any) {
      console.error(`Error updating in ${req.params.collection}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete single document
  app.delete("/api/db/:collection/:id", async (req, res) => {
    try {
      const db = await getMongoDb();
      const collectionName = req.params.collection;
      const id = req.params.id;
      
      await db.collection(collectionName).deleteOne({ _id: id });
      res.json({ success: true });
    } catch (err: any) {
      console.error(`Error deleting in ${req.params.collection}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // Query collection
  app.get("/api/db/:collection", async (req, res) => {
    try {
      const db = await getMongoDb();
      const collectionName = req.params.collection;
      const queryParams: any = {};
      
      for (const [key, val] of Object.entries(req.query)) {
        if (key === 'limit' || key === 'orderBy' || key === 'orderDir' || key === 'merge') continue;
        queryParams[key] = val;
      }
      
      let cursor = db.collection(collectionName).find(queryParams);
      
      if (req.query.orderBy) {
        const sortField = req.query.orderBy as string;
        const sortDir = req.query.orderDir === 'desc' ? -1 : 1;
        cursor = cursor.sort({ [sortField]: sortDir });
      }
      
      if (req.query.limit) {
        cursor = cursor.limit(parseInt(req.query.limit as string));
      }
      
      const docs = await cursor.toArray();
      // Map _id to id if not present
      const mappedDocs = docs.map(doc => ({
        id: doc._id || doc.id,
        ...doc
      }));
      
      res.json(mappedDocs);
    } catch (err: any) {
      console.error(`Error querying in ${req.params.collection}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Admin: Generate Social Posts using Gemini API
   */
  app.post("/api/admin/generate-posts", async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Content parameter is required." });
      }

      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return res.status(503).json({ error: "Gemini API key is not configured on this server." });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ 
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `
        You are an expert social media manager. I will provide you with a base content or idea.
        Generate 3 distinct, highly engaging social media posts optimized for:
        1. Facebook (Engaging, conversational, uses emojis, encourages comments)
        2. Instagram (Visual description, catchy caption, highly aesthetic tone)
        3. LinkedIn (Professional, insightful, industry-focused, clean formatting)
        
        Also provide a list of 10-15 relevant hashtags.
        
        Return the response strictly in this JSON format:
        {
          "facebook": "post content here",
          "instagram": "post content here",
          "linkedin": "post content here",
          "hashtags": "#tag1 #tag2 ..."
        }
        
        Base Content:
        ${content}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      if (!response.text) {
        throw new Error("No response received from Gemini.");
      }

      const result = JSON.parse(response.text);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Gemini generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate social posts." });
    }
  });

  /**
   * Upload image to Cloudinary
   */
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
        throw new Error("Missing Cloudinary credentials. Check your .env file");
      }

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
      const otp = crypto.randomInt(100000, 999999).toString();
      const mongoDbInstance = await getMongoDb();

      // 2. Set expiration time (10 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // 3. Save OTP temporarily in MongoDB
      await mongoDbInstance.collection('password_resets').updateOne(
        { email: email.toLowerCase() },
        {
          $set: {
            otp,
            email: email.toLowerCase(),
            expiresAt: expiresAt.toISOString(),
            createdAt: new Date().toISOString(),
            used: false
          }
        },
        { upsert: true }
      );

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
      if (!process.env.SMTP_HOST) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      }
      
      res.status(200).json({ 
        message: "If an account exists with this email, an OTP has been sent.",
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

      const mongoDbInstance = await getMongoDb();
      const resetDoc = await mongoDbInstance.collection('password_resets').findOne({ email: email.toLowerCase() });

      if (!resetDoc) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      if (resetDoc.used) {
        return res.status(400).json({ error: "OTP has already been used" });
      }

      if (resetDoc.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      const now = new Date();
      if (new Date(resetDoc.expiresAt).getTime() < now.getTime()) {
        return res.status(400).json({ error: "OTP has expired" });
      }

      // Find user by email in MongoDB and update password
      const user = await mongoDbInstance.collection('users').findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ error: "No user found with this email" });
      }

      await mongoDbInstance.collection('users').updateOne(
        { email: email.toLowerCase() },
        { $set: { password: newPassword } }
      );

      // Delete OTP after successful reset to prevent any reuse
      await mongoDbInstance.collection('password_resets').deleteOne({ email: email.toLowerCase() });

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

      // 1. Save the message to MongoDB so it's never lost
      try {
        const mongoDbInstance = await getMongoDb();
        await mongoDbInstance.collection('contact_messages').insertOne({
          _id: crypto.randomUUID(),
          firstName,
          lastName,
          email,
          phone: phone || '',
          message,
          createdAt: new Date().toISOString(),
          status: 'new'
        });
      } catch (dbError) {
        console.error("Failed to save contact message to MongoDB:", dbError);
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

      const db = await getMongoDb();
      const tokensSnap = await db.collection('fcm_tokens').find({ shopId }).toArray();
      
      if (tokensSnap.length === 0) {
        return res.json({ success: true, message: "No tokens registered for this shop" });
      }

      const tokens: string[] = tokensSnap.map((doc: any) => doc.token).filter(Boolean);

      if (tokens.length === 0) {
        return res.json({ success: true, message: "No valid tokens found" });
      }
      console.log("[Push Notification] Simulated payload:", { tokens, title, body });
      return res.json({ success: true, message: "Push notification processed successfully" });
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
