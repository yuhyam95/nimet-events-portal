
"use server";

import { z } from "zod";
import { MongoClient, ObjectId } from "mongodb";
import type { Event, Participant } from "./types";

const ParticipantSchema = z.object({
  name: z.string().min(2),
  organization: z.string().min(2),
  contact: z.string().email(),
  interests: z.string().min(10),
  eventId: z.string(),
});


let client: MongoClient | null = null;
const MONGODB_URI = process.env.MONGODB_URI;

async function getDb() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set in the environment variables. Please add it to your .env file.");
    return null;
  }

  if (!client) {
    try {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
    } catch (error: any) {
      console.error("Failed to connect to MongoDB", error);
      client = null; // Reset client on connection error
      return null;
    }
  }
  return client.db();
}

export async function getEvents(): Promise<Event[]> {
  const db = await getDb();
  if (!db) {
    console.log("Database not available, returning empty events array.");
    return [];
  }
  const events = await db.collection("events").find({}).toArray();
  return events.map((event) => ({
    id: event._id.toString(),
    name: event.name,
    date: event.date,
    location: event.location,
    description: event.description,
  }));
}

export async function getEventById(id: string): Promise<Event | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const db = await getDb();
  if (!db) {
    console.log(`Database not available, cannot get event by id ${id}.`);
    return null;
  }
  const event = await db.collection("events").findOne({ _id: new ObjectId(id) });
  if (!event) return null;
  return {
    id: event._id.toString(),
    name: event.name,
    date: event.date,
    location: event.location,
    description: event.description,
  };
}

export async function getParticipants(): Promise<Participant[]> {
   const db = await getDb();
   if (!db) {
    console.log("Database not available, returning empty participants array.");
    return [];
   }
   const participants = await db.collection("participants").find({}).toArray();
  return participants.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    organization: p.organization,
    contact: p.contact,
    interests: p.interests,
    eventId: p.eventId.toString(),
  }));
}

export async function addParticipant(data: unknown) {
  const validation = ParticipantSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Invalid participant data");
  }

  const { eventId, ...participantData } = validation.data;
  
  if (!ObjectId.isValid(eventId)) {
    throw new Error("Invalid event ID");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database connection not available. Could not add participant.");
  }

  await db.collection("participants").insertOne({
    ...participantData,
    eventId: new ObjectId(eventId)
  });
}
