"use server";

import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;

async function getDb() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in the environment variables.");
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db();
}

export async function initializeDatabase() {
  try {
    const db = await getDb();
    
    // Check if admin user already exists
    const existingAdmin = await db.collection("users").findOne({ email: "admin@nimet.com" });
    
    if (!existingAdmin) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash("admin123", 12);
      const now = new Date().toISOString();
      
      await db.collection("users").insertOne({
        fullName: "System Administrator",
        email: "admin@nimet.com",
        password: hashedPassword,
        role: "admin",
        createdAt: now,
        updatedAt: now,
      });
      
      console.log("Default admin user created successfully");
      console.log("Email: admin@nimet.com");
      console.log("Password: admin123");
    } else {
      console.log("Admin user already exists");
    }
    
    // Create indexes for better performance
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("events").createIndex({ slug: 1 }, { unique: true });
    await db.collection("participants").createIndex({ eventId: 1 });
    
    console.log("Database initialization completed");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}
