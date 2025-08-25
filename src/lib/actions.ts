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

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env"
  );
}

async function getDb() {
  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    // @ts-ignore
    if (!global._mongoClient) {
      client = new MongoClient(MONGODB_URI!);
      // @ts-ignore
      global._mongoClient = client.connect();
    }
    // @ts-ignore
    const dbClient = await global._mongoClient;
    return dbClient.db();
  } else {
    // In production mode, it's best to not use a global variable.
    if (!client) {
        client = new MongoClient(MONGODB_URI!);
        await client.connect();
    }
    return client.db();
  }
}

export async function getEvents(): Promise<Event[]> {
  const db = await getDb();
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
  const db = await getDb();
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
  const participants = await db.collection("participants").find({}).toArray();
  return participants.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    organization: p.organization,
    contact: p.contact,
    interests: p.interests,
    eventId: p.eventId,
  }));
}

export async function addParticipant(data: unknown) {
  const validation = ParticipantSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Invalid participant data");
  }

  const { eventId, ...participantData } = validation.data;
  
  const db = await getDb();
  await db.collection("participants").insertOne({
    ...participantData,
    eventId: new ObjectId(eventId)
  });
}
