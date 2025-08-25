
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

const EventSchema = z.object({
    name: z.string().min(5, { message: "Event name must be at least 5 characters." }),
    date: z.string().min(1, { message: "Date is required." }),
    location: z.string().min(3, { message: "Location must be at least 3 characters." }),
    description: z.string().optional(),
});


let client: MongoClient | null = null;
const MONGODB_URI = process.env.MONGODB_URI;

async function getDb() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in the environment variables. Please add it to your .env file.");
  }

  if (!client) {
    try {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
    } catch (error: any) {
      if (error.name === 'MongoServerError' && error.codeName === 'AtlasError') {
         throw new Error("MongoDB authentication failed. Please check your username and password in the MONGODB_URI.");
      }
      console.error("Failed to connect to MongoDB", error);
      throw new Error("Failed to connect to the database.");
    }
  }
  return client.db();
}

export async function getEvents(): Promise<Event[]> {
  try {
    const db = await getDb();
    const events = await db.collection("events").find({}).sort({ date: 1 }).toArray();
    return events.map((event) => ({
      id: event._id.toString(),
      name: event.name,
      date: event.date,
      location: event.location,
      description: event.description,
    }));
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function getEventById(id: string): Promise<Event | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  try {
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
  } catch (error) {
    console.error(`Error fetching event by id ${id}:`, error);
    return null;
  }
}

export async function addEvent(data: unknown) {
    const validation = EventSchema.safeParse(data);
    if (!validation.success) {
        throw new Error("Invalid event data");
    }

    try {
        const db = await getDb();
        await db.collection("events").insertOne(validation.data);
    } catch (error) {
        console.error("Failed to add event:", error);
        throw new Error("Database operation failed. Could not add event.");
    }
}

export async function updateEvent(id: string, data: unknown) {
    if (!ObjectId.isValid(id)) {
        throw new Error("Invalid event ID");
    }

    const validation = EventSchema.safeParse(data);
    if (!validation.success) {
        throw new Error("Invalid event data");
    }

    try {
        const db = await getDb();
        const result = await db.collection("events").updateOne(
            { _id: new ObjectId(id) },
            { $set: validation.data }
        );
        
        if (result.matchedCount === 0) {
            throw new Error("Event not found");
        }
    } catch (error) {
        console.error("Failed to update event:", error);
        throw new Error("Database operation failed. Could not update event.");
    }
}

export async function deleteEvent(id: string) {
    if (!ObjectId.isValid(id)) {
        throw new Error("Invalid event ID");
    }

    try {
        const db = await getDb();
        const result = await db.collection("events").deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
            throw new Error("Event not found");
        }
    } catch (error) {
        console.error("Failed to delete event:", error);
        throw new Error("Database operation failed. Could not delete event.");
    }
}

export async function getParticipants(): Promise<Participant[]> {
   try {
    const db = await getDb();
    const participants = await db.collection("participants").find({}).toArray();
    return participants.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      organization: p.organization,
      contact: p.contact,
      interests: p.interests,
      eventId: p.eventId.toString(),
    }));
   } catch(error) {
     console.error("Error fetching participants:", error);
     return [];
   }
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

  try {
    const db = await getDb();
    await db.collection("participants").insertOne({
      ...participantData,
      eventId: new ObjectId(eventId)
    });
  } catch (error) {
    console.error("Failed to add participant:", error);
    throw new Error("Database operation failed. Could not add participant.");
  }
}
