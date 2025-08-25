
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

// --- Mock Data ---
const mockEvents: Event[] = [
    { id: "1", name: "Annual Tech Summit", date: "2024-10-15", location: "Convention Center", description: "The biggest tech conference of the year." },
    { id: "2", name: "AI in Healthcare", date: "2024-11-05", location: "University Auditorium", description: "Exploring the future of artificial intelligence in the medical field." },
    { id: "3", name: "Innovator's Workshop", date: "2024-12-01", location: "Online", description: "A hands-on workshop for aspiring entrepreneurs and innovators." },
];

let mockParticipants: Participant[] = [
    { id: "101", name: "Alice Johnson", organization: "TechCorp", contact: "alice@techcorp.com", interests: "AI and machine learning.", eventId: "1" },
    { id: "102", name: "Bob Williams", organization: "Health Solutions", contact: "bob@health.com", interests: "Medical technology.", eventId: "2" },
    { id: "103", name: "Charlie Brown", organization: "Innovate LLC", contact: "charlie@innovate.com", interests: "Startups and product design.", eventId: "3" },
    { id: "104", name: "Diana Prince", organization: "TechCorp", contact: "diana@techcorp.com", interests: "Frontend development.", eventId: "1" },
];
// --- End Mock Data ---


let client: MongoClient | null = null;
const MONGODB_URI = process.env.MONGODB_URI;

// We will keep the MongoDB connection logic, but it won't be used while MONGODB_URI is not set.
// This makes it easy to switch back later.
async function getDb() {
  if (!MONGODB_URI || MONGODB_URI === "") {
    return null;
  }

  if (!client) {
    try {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
    } catch (error) {
      console.error("Failed to connect to MongoDB", error);
      // If connection fails, we'll fall back to mock data.
      client = null; 
      return null;
    }
  }
  return client.db();
}

export async function getEvents(): Promise<Event[]> {
  const db = await getDb();
  if (!db) return Promise.resolve(mockEvents);

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
  if (!db) {
    return Promise.resolve(mockEvents.find(e => e.id === id) || null);
  }
  if (!ObjectId.isValid(id)) {
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
   if (!db) return Promise.resolve(mockParticipants);
   
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
  
  const db = await getDb();
  if (!db) {
      const newParticipant = {
          id: (mockParticipants.length + 101).toString(),
          ...participantData,
          eventId
      };
      mockParticipants.push(newParticipant);
      console.log("Added mock participant:", newParticipant);
      return Promise.resolve();
  }
  if (!ObjectId.isValid(eventId)) {
    throw new Error("Invalid event ID");
  }
  
  await db.collection("participants").insertOne({
    ...participantData,
    eventId: new ObjectId(eventId)
  });
}
