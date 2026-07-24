const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Force DNS fallback to public Google & Cloudflare DNS for Windows SRV query support
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

// Load .env file manually if dotenv is not loaded
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mudassirbashir530_db_user:fnODAZFgqx0fHuc8@looptailor.2z63upu.mongodb.net/looptailor?retryWrites=true&w=majority";

async function setupMongoDB() {
  console.log("-----------------------------------------");
  console.log("🚀 Loop Tailor MongoDB Setup & Diagnostic");
  console.log("-----------------------------------------");
  console.log(`Connecting to URI: ${MONGODB_URI.replace(/:([^@]+)@/, ':****@')}`);

  const client = new MongoClient(MONGODB_URI, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();
    console.log("✅ Connected successfully to MongoDB!");

    const db = client.db();
    console.log(`Database Name: '${db.databaseName}'`);

    const collections = [
      'users',
      'shops',
      'admins',
      'clients',
      'orders',
      'workers',
      'invoices',
      'measurements',
      'measurementTemplates',
      'orderTemplates',
      'payments',
      'payroll',
      'notifications',
      'fcmTokens'
    ];

    console.log("\n📦 Ensuring canonical MongoDB collections...");

    for (const collName of collections) {
      const collExists = await db.listCollections({ name: collName }).hasNext();
      if (!collExists) {
        await db.createCollection(collName);
        console.log(`  + Created collection: '${collName}'`);
      } else {
        console.log(`  ✓ Collection '${collName}' ready`);
      }
    }

    console.log("\n⚡ Creating database indexes...");
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('clients').createIndex({ userId: 1, phone: 1 });
    await db.collection('orders').createIndex({ userId: 1, status: 1 });
    await db.collection('workers').createIndex({ userId: 1 });
    await db.collection('invoices').createIndex({ userId: 1, orderId: 1 });
    await db.collection('admins').createIndex({ email: 1 }, { unique: true });
    console.log("  ✓ Indexes verified.");

    console.log("\n👑 Setting single Super Admin account...");
    const soleAdmin = 'looptailor@gmail.com';
    
    // Remove any non-primary admins
    await db.collection('admins').deleteMany({ email: { $ne: soleAdmin } });

    const exists = await db.collection('admins').findOne({ email: soleAdmin });
    if (!exists) {
      await db.collection('admins').insertOne({
        _id: "admin_" + soleAdmin.replace(/[^a-zA-Z0-9]/g, '_'),
        email: soleAdmin,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      console.log(`  + Seeded sole admin: ${soleAdmin}`);
    } else {
      console.log(`  ✓ Sole admin '${soleAdmin}' present`);
    }

    console.log("\n🎉 MongoDB setup complete! Database is 100% operational.");
    console.log("-----------------------------------------");

  } catch (error) {
    console.log("\n-----------------------------------------");
    console.log("⚠️ MongoDB Connection Diagnostic:");
    console.log(`Error Message: ${error.message}`);
    console.log("\n💡 How to resolve:");
    console.log("1. Open or create '.env' in your project root.");
    console.log("2. Set MONGODB_URI to your active MongoDB Atlas string or local MongoDB:");
    console.log("   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/looptailor?retryWrites=true&w=majority");
    console.log("   (Or for local MongoDB: MONGODB_URI=mongodb://127.0.0.1:27017/looptailor)");
    console.log("3. If using MongoDB Atlas, ensure Network Access allows your current IP (0.0.0.0/0).");
    console.log("-----------------------------------------");
  } finally {
    await client.close().catch(() => {});
  }
}

setupMongoDB();
