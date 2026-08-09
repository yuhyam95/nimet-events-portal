import { MongoClient } from "mongodb";
import dns from "dns";

// Ensure Node.js resolves IPv4 addresses first for reliable MongoDB Atlas connections
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore if not supported in environment
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not set in environment variables");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const options = {
  maxPoolSize: 20,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
};

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise as Promise<MongoClient>;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

let indexesCreated = false;
async function ensureIndexes(db: any) {
  if (indexesCreated) return;
  indexesCreated = true;
  try {
    await Promise.all([
      db.collection("events").createIndex({ slug: 1 }, { unique: true, background: true }),
      db.collection("events").createIndex({ isActive: 1 }, { background: true }),
      db.collection("participants").createIndex({ eventId: 1 }, { background: true }),
      db.collection("participants").createIndex({ eventId: 1, contact: 1 }, { background: true }),
      db.collection("invitations").createIndex({ eventId: 1, code: 1 }, { background: true }),
      db.collection("users").createIndex({ email: 1 }, { background: true }),
    ]);
  } catch (e) {
    // Non-blocking index creation failure
  }
}

export async function getDb() {
  const client = await clientPromise;
  const db = client.db();
  ensureIndexes(db).catch(() => {});
  return db;
}


