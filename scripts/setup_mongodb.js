const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mudassirbashir530_db_user:fnODAZFgqx0fHuc8@looptailor.2z63upu.mongodb.net/looptailor?retryWrites=true&w=majority";

async function setupMongoDB() {
  console.log("-----------------------------------------");
  console.log("🚀 Loop Tailor MongoDB Setup & Database Init");
  console.log("-----------------------------------------");
  console.log("Connecting to MongoDB URI...");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected successfully to MongoDB Atlas!");

    const db = client.db();
    console.log(`Database Name: '${db.databaseName}'`);

    // List of canonical collections
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

    console.log("\n📦 Ensuring canonical MongoDB collections & indexes...");

    for (const collName of collections) {
      const collExists = await db.listCollections({ name: collName }).hasNext();
      if (!collExists) {
        await db.createCollection(collName);
        console.log(`  + Created collection: '${collName}'`);
      } else {
        console.log(`  ✓ Collection '${collName}' ready`);
      }
    }

    // Set up indexes for performance & integrity
    console.log("\n⚡ Creating database indexes...");
    
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('clients').createIndex({ userId: 1, phone: 1 });
    await db.collection('orders').createIndex({ userId: 1, status: 1 });
    await db.collection('workers').createIndex({ userId: 1 });
    await db.collection('invoices').createIndex({ userId: 1, orderId: 1 });
    await db.collection('admins').createIndex({ email: 1 }, { unique: true });

    console.log("  ✓ Indexes created successfully.");

    // Seed default admin accounts
    console.log("\n👑 Checking Super Admin accounts...");
    const defaultAdmins = ['looptailor@gmail.com', 'mudassirbashir530@gmail.com'];

    for (const adminEmail of defaultAdmins) {
      const exists = await db.collection('admins').findOne({ email: adminEmail });
      if (!exists) {
        await db.collection('admins').insertOne({
          _id: "admin_" + adminEmail.replace(/[^a-zA-Z0-9]/g, '_'),
          email: adminEmail,
          role: 'admin',
          createdAt: new Date().toISOString()
        });
        console.log(`  + Seeded admin document for: ${adminEmail}`);
      } else {
        console.log(`  ✓ Admin account '${adminEmail}' already configured.`);
      }
    }

    console.log("\n🎉 MongoDB setup complete! Loop Tailor database is 100% ready.");
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("❌ MongoDB Setup Error:", error.message);
  } finally {
    await client.close();
  }
}

setupMongoDB();
