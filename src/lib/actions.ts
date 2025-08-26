
"use server";

import { z } from "zod";
import { MongoClient, ObjectId } from "mongodb";
import type { Event, Participant, User, CreateUserData } from "./types";
import bcrypt from "bcryptjs";

const ParticipantSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  organization: z.string().min(2, { message: "Organization must be at least 2 characters." }),
  contact: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  eventId: z.string(),
});

const EventSchema = z.object({
    name: z.string().min(5, { message: "Event name must be at least 5 characters." }),
    slug: z.string().min(3, { message: "URL slug must be at least 3 characters." }).regex(/^[a-z0-9-]+$/, { message: "URL slug can only contain lowercase letters, numbers, and hyphens." }),
    startDate: z.string().min(1, { message: "Start date is required." }),
    endDate: z.string().min(1, { message: "End date is required." }),
    location: z.string().min(3, { message: "Location must be at least 3 characters." }),
    description: z.string().optional(),
});

const UserSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(['admin', 'user'], { message: "Role must be either 'admin' or 'user'." }),
});

const UpdateUserSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.enum(['admin', 'user'], { message: "Role must be either 'admin' or 'user'." }),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
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
    const events = await db.collection("events").find({}).sort({ startDate: 1 }).toArray();
    return events.map((event) => ({
      id: event._id.toString(),
      name: event.name,
      slug: event.slug || event._id.toString(), // Use slug or fallback to ID
      startDate: event.startDate || event.date, // Handle both old and new field names
      endDate: event.endDate || event.date, // Handle both old and new field names
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
      slug: event.slug || event._id.toString(), // Use slug or fallback to ID
      startDate: event.startDate || event.date, // Handle both old and new field names
      endDate: event.endDate || event.date, // Handle both old and new field names
      location: event.location,
      description: event.description,
    };
  } catch (error) {
    console.error(`Error fetching event by id ${id}:`, error);
    return null;
  }
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    const db = await getDb();
    const event = await db.collection("events").findOne({ slug });
    if (!event) return null;
    return {
      id: event._id.toString(),
      name: event.name,
      slug: event.slug || event._id.toString(), // Use slug or fallback to ID
      startDate: event.startDate || event.date, // Handle both old and new field names
      endDate: event.endDate || event.date, // Handle both old and new field names
      location: event.location,
      description: event.description,
    };
  } catch (error) {
    console.error(`Error fetching event by slug ${slug}:`, error);
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
        
        // Check if slug already exists
        const existingEvent = await db.collection("events").findOne({ slug: validation.data.slug });
        if (existingEvent) {
            throw new Error("An event with this URL slug already exists. Please choose a different slug.");
        }
        
        await db.collection("events").insertOne(validation.data);
    } catch (error) {
        console.error("Failed to add event:", error);
        throw new Error(error instanceof Error ? error.message : "Database operation failed. Could not add event.");
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
        
        // Check if slug already exists for a different event
        const existingEvent = await db.collection("events").findOne({ 
            slug: validation.data.slug,
            _id: { $ne: new ObjectId(id) }
        });
        if (existingEvent) {
            throw new Error("An event with this URL slug already exists. Please choose a different slug.");
        }
        
        const result = await db.collection("events").updateOne(
            { _id: new ObjectId(id) },
            { $set: validation.data }
        );
        
        if (result.matchedCount === 0) {
            throw new Error("Event not found");
        }
    } catch (error) {
        console.error("Failed to update event:", error);
        throw new Error(error instanceof Error ? error.message : "Database operation failed. Could not update event.");
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

export async function getParticipants(): Promise<(Participant & { eventName: string })[]> {
   try {
    const db = await getDb();
    const participants = await db.collection("participants").find({}).toArray();
    
    // Get all events to map event names
    const events = await db.collection("events").find({}).toArray();
    const eventMap = new Map(events.map(e => [e._id.toString(), e.name]));
    
    return participants.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      organization: p.organization,
      contact: p.contact,
      phone: p.phone || p.interests, // Handle both old and new field names
      eventId: p.eventId.toString(),
      eventName: eventMap.get(p.eventId.toString()) || "Unknown Event",
    }));
   } catch(error) {
     console.error("Error fetching participants:", error);
     return [];
   }
}

export async function getParticipantsByEventId(eventId: string): Promise<(Participant & { eventName: string; eventDate: string; eventTheme: string })[]> {
   if (!ObjectId.isValid(eventId)) {
     return [];
   }

   try {
    const db = await getDb();
    const participants = await db.collection("participants").find({ 
      eventId: new ObjectId(eventId) 
    }).toArray();
    
    // Get the specific event to get its details
    const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) });
    const eventName = event?.name || "Unknown Event";
    const eventDate = event?.date || "";
    const eventTheme = event?.description || "";
    
    return participants.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      organization: p.organization,
      contact: p.contact,
      phone: p.phone || p.interests, // Handle both old and new field names
      eventId: p.eventId.toString(),
      eventName: eventName,
      eventDate: eventDate,
      eventTheme: eventTheme,
    }));
   } catch(error) {
     console.error("Error fetching participants for event:", error);
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

export async function getUsers(): Promise<User[]> {
  try {
    const db = await getDb();
    const users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();
    return users.map((user) => ({
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function getUserById(id: string): Promise<User | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
    if (!user) return null;
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error(`Error fetching user by id ${id}:`, error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({ email });
    if (!user) return null;
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error(`Error fetching user by email ${email}:`, error);
    return null;
  }
}

export async function createUser(data: unknown): Promise<User> {
  const validation = UserSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Invalid user data");
  }

  try {
    const db = await getDb();
    
    // Check if email already exists
    const existingUser = await db.collection("users").findOne({ email: validation.data.email });
    if (existingUser) {
      throw new Error("A user with this email already exists.");
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(validation.data.password, 12);
    
    const now = new Date().toISOString();
    const userData = {
      ...validation.data,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await db.collection("users").insertOne(userData);
    
    return {
      id: result.insertedId.toString(),
      fullName: validation.data.fullName,
      email: validation.data.email,
      role: validation.data.role,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error("Failed to create user:", error);
    throw new Error(error instanceof Error ? error.message : "Database operation failed. Could not create user.");
  }
}

export async function updateUser(id: string, data: unknown): Promise<User> {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid user ID");
  }

  const validation = UpdateUserSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Invalid user data");
  }

  try {
    const db = await getDb();
    
    // Check if email already exists for a different user
    const existingUser = await db.collection("users").findOne({ 
      email: validation.data.email,
      _id: { $ne: new ObjectId(id) }
    });
    if (existingUser) {
      throw new Error("A user with this email already exists.");
    }
    
    const now = new Date().toISOString();
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...validation.data,
          updatedAt: now,
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error("User not found");
    }
    
    const updatedUser = await getUserById(id);
    if (!updatedUser) {
      throw new Error("Failed to retrieve updated user");
    }
    
    return updatedUser;
  } catch (error) {
    console.error("Failed to update user:", error);
    throw new Error(error instanceof Error ? error.message : "Database operation failed. Could not update user.");
  }
}

export async function deleteUser(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid user ID");
  }

  try {
    const db = await getDb();
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      throw new Error("User not found");
    }
  } catch (error) {
    console.error("Failed to delete user:", error);
    throw new Error("Database operation failed. Could not delete user.");
  }
}

export async function changePassword(id: string, data: unknown): Promise<void> {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid user ID");
  }

  const validation = ChangePasswordSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Invalid password data");
  }

  try {
    const db = await getDb();
    
    // Get the user to verify current password
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
    if (!user) {
      throw new Error("User not found");
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(validation.data.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }
    
    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(validation.data.newPassword, 12);
    
    const now = new Date().toISOString();
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          password: hashedNewPassword,
          updatedAt: now,
        }
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error("User not found");
    }
  } catch (error) {
    console.error("Failed to change password:", error);
    throw new Error(error instanceof Error ? error.message : "Database operation failed. Could not change password.");
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({ email });
    
    if (!user) {
      return null;
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    const userData = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    return userData;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}
