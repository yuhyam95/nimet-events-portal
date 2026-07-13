"use server";

import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

async function getDb() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in the environment variables.");
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db();
}

export async function fixEmailCase(): Promise<{ success: boolean; updated: number; errors: string[] }> {
  try {
    const db = await getDb();
    const errors: string[] = [];
    let updated = 0;

    // Get all participants
    const participants = await db.collection("participants").find({}).toArray();
    
    console.log(`Found ${participants.length} participants to check`);

    for (const participant of participants) {
      const originalEmail = participant.contact;
      const normalizedEmail = originalEmail.toLowerCase().trim();
      
      // Only update if the email needs normalization
      if (originalEmail !== normalizedEmail) {
        try {
          await db.collection("participants").updateOne(
            { _id: participant._id },
            { $set: { contact: normalizedEmail } }
          );
          updated++;
          console.log(`Updated: ${originalEmail} -> ${normalizedEmail}`);
        } catch (error) {
          const errorMsg = `Failed to update ${originalEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    }

    console.log(`Email case fix completed: ${updated} emails updated, ${errors.length} errors`);
    
    return { success: true, updated, errors };
  } catch (error) {
    console.error("Error fixing email case:", error);
    return { 
      success: false, 
      updated: 0, 
      errors: [`Failed to fix email case: ${error instanceof Error ? error.message : 'Unknown error'}`] 
    };
  }
}
