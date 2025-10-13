
"use server";

import { z } from "zod";
import { MongoClient, ObjectId } from "mongodb";
import type { Event, Participant, User, CreateUserData, Attendance } from "./types";
import bcrypt from "bcryptjs";
import { sendRegistrationEmail, sendAttendanceQREmail, sendFollowUpEmail } from "./email-service";

const ParticipantSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  organization: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  contact: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(11, { message: "Please enter a valid phone number." }),
  eventId: z.string(),
});

const EventSchema = z.object({
    name: z.string().min(5, { message: "Event name must be at least 5 characters." }),
    slug: z.string().min(3, { message: "URL slug must be at least 3 characters." }).regex(/^[a-zA-Z0-9-]+$/, { message: "URL slug can only contain letters, numbers, and hyphens." }),
    startDate: z.string().min(1, { message: "Start date is required." }),
    endDate: z.string().min(1, { message: "End date is required." }),
    location: z.string().min(3, { message: "Location must be at least 3 characters." }),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    isInternal: z.boolean().optional(),
    department: z.string().optional(),
    position: z.string().optional(),
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
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional(),
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
    const events = await db.collection("events").find({}).sort({ _id: -1 }).toArray();
    const now = new Date();
    
    return events.map((event) => {
      const startDate = new Date(event.startDate || event.date);
      const endDate = new Date(event.endDate || event.date);
      
      // Calculate if event should be active based on dates
      const shouldBeActive = now >= startDate && now <= endDate;
      
      // Use stored isActive if it exists, otherwise calculate based on dates
      const isActive = event.isActive !== undefined ? event.isActive : shouldBeActive;
      
      return {
        id: event._id.toString(),
        name: event.name,
        slug: event.slug || event._id.toString(), // Use slug or fallback to ID
        startDate: event.startDate || event.date, // Handle both old and new field names
        endDate: event.endDate || event.date, // Handle both old and new field names
        location: event.location,
        description: event.description,
        isActive: isActive,
        isInternal: event.isInternal ?? false,
        department: event.department,
        position: event.position,
      };
    }); // Return all events (both active and inactive)
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function getActiveEvents(): Promise<Event[]> {
  try {
    const db = await getDb();
    const events = await db.collection("events").find({}).sort({ _id: -1 }).toArray();
    const now = new Date();
    
    return events.map((event) => {
      const startDate = new Date(event.startDate || event.date);
      const endDate = new Date(event.endDate || event.date);
      
      // Calculate if event should be active based on dates
      const shouldBeActive = now >= startDate && now <= endDate;
      
      // Use stored isActive if it exists, otherwise calculate based on dates
      const isActive = event.isActive !== undefined ? event.isActive : shouldBeActive;
      
      return {
        id: event._id.toString(),
        name: event.name,
        slug: event.slug || event._id.toString(), // Use slug or fallback to ID
        startDate: event.startDate || event.date, // Handle both old and new field names
        endDate: event.endDate || event.date, // Handle both old and new field names
        location: event.location,
        description: event.description,
        isActive: isActive,
        isInternal: event.isInternal ?? false,
        department: event.department,
        position: event.position,
      };
    }).filter(event => event.isActive); // Only return active events
  } catch (error) {
    console.error("Error fetching active events:", error);
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
    
    const now = new Date();
    const startDate = new Date(event.startDate || event.date);
    const endDate = new Date(event.endDate || event.date);
    
    // Calculate if event should be active based on dates
    const shouldBeActive = now >= startDate && now <= endDate;
    
    // Use stored isActive if it exists, otherwise calculate based on dates
    const isActive = event.isActive !== undefined ? event.isActive : shouldBeActive;
    
    return {
      id: event._id.toString(),
      name: event.name,
      slug: event.slug || event._id.toString(), // Use slug or fallback to ID
      startDate: event.startDate || event.date, // Handle both old and new field names
      endDate: event.endDate || event.date, // Handle both old and new field names
      location: event.location,
      description: event.description,
      isActive: isActive,
      isInternal: event.isInternal ?? false,
      department: event.department,
      position: event.position,
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
    
    const now = new Date();
    const startDate = new Date(event.startDate || event.date);
    const endDate = new Date(event.endDate || event.date);
    
    // Calculate if event should be active based on dates
    const shouldBeActive = now >= startDate && now <= endDate;
    
    // Use stored isActive if it exists, otherwise calculate based on dates
    const isActive = event.isActive !== undefined ? event.isActive : shouldBeActive;
    
    return {
      id: event._id.toString(),
      name: event.name,
      slug: event.slug || event._id.toString(), // Use slug or fallback to ID
      startDate: event.startDate || event.date, // Handle both old and new field names
      endDate: event.endDate || event.date, // Handle both old and new field names
      location: event.location,
      description: event.description,
      isActive: isActive,
      isInternal: event.isInternal ?? false,
      department: event.department,
      position: event.position,
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
        
        // Calculate isActive based on dates if not provided
        const now = new Date();
        const startDate = new Date(validation.data.startDate);
        const endDate = new Date(validation.data.endDate);
        const shouldBeActive = now >= startDate && now <= endDate;
        
        const eventData = {
            ...validation.data,
            isActive: validation.data.isActive !== undefined ? validation.data.isActive : shouldBeActive
        };
        
        await db.collection("events").insertOne(eventData);
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
        
        // Calculate isActive based on dates if not provided
        const now = new Date();
        const startDate = new Date(validation.data.startDate);
        const endDate = new Date(validation.data.endDate);
        const shouldBeActive = now >= startDate && now <= endDate;
        
        const eventData = {
            ...validation.data,
            isActive: validation.data.isActive !== undefined ? validation.data.isActive : shouldBeActive
        };
        
        const result = await db.collection("events").updateOne(
            { _id: new ObjectId(id) },
            { $set: eventData }
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
    const participants = await db.collection("participants").find({}).sort({ _id: 1 }).toArray();
    
    // Get all events to map event names
    const events = await db.collection("events").find({}).toArray();
    const eventMap = new Map(events.map(e => [e._id.toString(), e.name]));
    
    return participants.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      organization: p.organization,
      designation: p.designation || "", // Handle missing designation field
      department: p.department,
      position: p.position,
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

export async function getParticipantsByEventId(eventId: string): Promise<(Participant & { eventName: string; eventStartDate: string; eventEndDate: string; eventTheme: string; eventLocation: string })[]> {
   if (!ObjectId.isValid(eventId)) {
     return [];
   }

   try {
    const db = await getDb();
    const participants = await db.collection("participants").find({ 
      eventId: new ObjectId(eventId) 
    }).sort({ _id: 1 }).toArray();
    
    // Get the specific event to get its details
    const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) });
    const eventName = event?.name || "Unknown Event";
    const eventStartDate = event?.startDate || "";
    const eventEndDate = event?.endDate || "";
    const eventTheme = event?.description || "";
    const eventLocation = event?.location || "";
    
    return participants.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      organization: p.organization,
      designation: p.designation || "", // Handle missing designation field
      department: p.department,
      position: p.position,
      contact: p.contact,
      phone: p.phone || p.interests, // Handle both old and new field names
      eventId: p.eventId.toString(),
      eventName: eventName,
      eventStartDate: eventStartDate,
      eventEndDate: eventEndDate,
      eventTheme: eventTheme,
      eventLocation: eventLocation,
    }));
   } catch(error) {
     console.error("Error fetching participants for event:", error);
     return [];
   }
}

export async function addParticipant(data: unknown): Promise<{ success: boolean; error?: string; participantId?: string }> {
  const validation = ParticipantSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid participant data" };
  }

  const { eventId, ...participantData } = validation.data;
  
  // Normalize email to lowercase
  participantData.contact = participantData.contact.toLowerCase().trim();
  
  if (!ObjectId.isValid(eventId)) {
    return { success: false, error: "Invalid event ID" };
  }

  try {
    const db = await getDb();
    
    // Check if email already exists for this event
    const existingEmail = await db.collection("participants").findOne({ 
      eventId: new ObjectId(eventId),
      contact: participantData.contact 
    });
    
    if (existingEmail) {
      return { success: false, error: "A participant with this email address has already registered for this event." };
    }
    
    // Check if phone number already exists for this event
    const existingPhone = await db.collection("participants").findOne({ 
      eventId: new ObjectId(eventId),
      phone: participantData.phone 
    });
    
    if (existingPhone) {
      return { success: false, error: "A participant with this phone number has already registered for this event." };
    }
    
    const result = await db.collection("participants").insertOne({
      ...participantData,
      eventId: new ObjectId(eventId)
    });

    // Send attendance QR code email
    try {
      // Get event details for the email
      const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) });
      if (event) {
        // Map event data to match Event type
        const now = new Date();
        const startDate = new Date(event.startDate || event.date);
        const endDate = new Date(event.endDate || event.date);
        const shouldBeActive = now >= startDate && now <= endDate;
        const isActive = event.isActive !== undefined ? event.isActive : shouldBeActive;
        
        const mappedEvent: Event = {
          id: event._id.toString(),
          name: event.name,
          slug: event.slug || event._id.toString(),
          startDate: event.startDate || event.date,
          endDate: event.endDate || event.date,
          location: event.location,
          description: event.description,
          isActive: isActive,
          isInternal: event.isInternal ?? false,
        };

        // Map participant data to match component format (with id field)
        const mappedParticipant: Participant = {
          id: result.insertedId.toString(),
          name: participantData.name,
          organization: participantData.organization || "",
          designation: participantData.designation || "",
          contact: participantData.contact,
          phone: participantData.phone || "",
          eventId: eventId,
          qrEmailSent: false
        };

        // Send attendance QR email
        await sendAttendanceQREmail({
          participant: mappedParticipant,
          event: mappedEvent
        });

        // Mark participant as having received QR code email
        await db.collection("participants").updateOne(
          { _id: result.insertedId },
          { $set: { qrEmailSent: true } }
        );
      }
    } catch (emailError) {
      // Log email error but don't fail the registration
      console.error("Failed to send attendance QR email:", emailError);
      // Note: We don't throw here to avoid failing the registration if email fails
    }

    return { success: true, participantId: result.insertedId.toString() };
  } catch (error) {
    console.error("Failed to add participant:", error);
    
    // Return generic error for unexpected issues
    return { success: false, error: "Database operation failed. Could not add participant." };
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
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
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
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
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
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
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
    const updateData: any = {
      fullName: validation.data.fullName,
      email: validation.data.email,
      role: validation.data.role,
      updatedAt: now,
    };
    
    // Hash password if provided
    if (validation.data.password) {
      updateData.password = await bcrypt.hash(validation.data.password, 12);
    }
    
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: updateData
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

// Attendance functions
export async function markAttendance(participantId: string, eventId: string, attendanceDate?: string): Promise<{ success: boolean; error?: string; attendance?: Attendance }> {
  console.log('markAttendance called with participantId:', participantId, 'eventId:', eventId, 'attendanceDate:', attendanceDate);
  console.log('participantId isValid:', ObjectId.isValid(participantId));
  console.log('eventId isValid:', ObjectId.isValid(eventId));
  
  if (!ObjectId.isValid(participantId) || !ObjectId.isValid(eventId)) {
    console.log('Invalid IDs - participantId:', participantId, 'eventId:', eventId);
    return { success: false, error: "Invalid participant or event ID" };
  }

  try {
    const db = await getDb();
    
    // Check if participant exists and belongs to the event
    const participant = await db.collection("participants").findOne({ 
      _id: new ObjectId(participantId),
      eventId: new ObjectId(eventId)
    });
    
    if (!participant) {
      return { success: false, error: "Participant not found for this event" };
    }
    
    // Use provided date or default to today
    const dateToUse = attendanceDate || new Date().toISOString().split('T')[0];
    
    // Check if already checked in for this specific date
    const existingAttendance = await db.collection("attendance").findOne({
      participantId: new ObjectId(participantId),
      eventId: new ObjectId(eventId),
      attendanceDate: dateToUse
    });
    
    if (existingAttendance) {
      return { 
        success: false, 
        error: `Participant has already been marked as present for ${dateToUse}`,
        attendance: {
          id: existingAttendance._id.toString(),
          participantId: existingAttendance.participantId.toString(),
          eventId: existingAttendance.eventId.toString(),
          checkedInAt: existingAttendance.checkedInAt,
          attendanceDate: existingAttendance.attendanceDate,
          participantName: participant.name,
          participantOrganization: participant.organization
        }
      };
    }
    
    // Mark attendance
    const now = new Date().toISOString();
    const attendanceData = {
      participantId: new ObjectId(participantId),
      eventId: new ObjectId(eventId),
      checkedInAt: now,
      attendanceDate: dateToUse
    };
    
    const result = await db.collection("attendance").insertOne(attendanceData);
    
    return {
      success: true,
      attendance: {
        id: result.insertedId.toString(),
        participantId: participantId,
        eventId: eventId,
        checkedInAt: now,
        attendanceDate: dateToUse,
        participantName: participant.name,
        participantOrganization: participant.organization
      }
    };
  } catch (error) {
    console.error("Failed to mark attendance:", error);
    return { success: false, error: "Database operation failed. Could not mark attendance." };
  }
}

export async function getAttendanceByEventId(eventId: string, attendanceDate?: string): Promise<Attendance[]> {
  if (!ObjectId.isValid(eventId)) {
    return [];
  }

  try {
    const db = await getDb();
    
    // Build query filter
    const filter: any = { eventId: new ObjectId(eventId) };
    if (attendanceDate) {
      filter.attendanceDate = attendanceDate;
    }
    
    const attendance = await db.collection("attendance").find(filter).sort({ checkedInAt: -1 }).toArray();
    
    // Get participant details for each attendance record
    const participantIds = attendance.map(a => a.participantId);
    const participants = await db.collection("participants").find({
      _id: { $in: participantIds }
    }).toArray();
    
    const participantMap = new Map(participants.map(p => [p._id.toString(), p]));
    
    return attendance.map((a) => ({
      id: a._id.toString(),
      participantId: a.participantId.toString(),
      eventId: a.eventId.toString(),
      checkedInAt: a.checkedInAt,
      attendanceDate: a.attendanceDate || new Date(a.checkedInAt).toISOString().split('T')[0],
      participantName: participantMap.get(a.participantId.toString())?.name || "Unknown",
      participantOrganization: participantMap.get(a.participantId.toString())?.organization || "Unknown"
    }));
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return [];
  }
}

export async function getAttendanceStats(eventId: string, attendanceDate?: string): Promise<{ totalParticipants: number; checkedIn: number; notCheckedIn: number }> {
  if (!ObjectId.isValid(eventId)) {
    return { totalParticipants: 0, checkedIn: 0, notCheckedIn: 0 };
  }

  try {
    const db = await getDb();
    
    // Get total participants for the event
    const totalParticipants = await db.collection("participants").countDocuments({ 
      eventId: new ObjectId(eventId) 
    });
    
    // Build attendance filter
    const attendanceFilter: any = { eventId: new ObjectId(eventId) };
    if (attendanceDate) {
      attendanceFilter.attendanceDate = attendanceDate;
    }
    
    // Get checked in count for the specific date or all time
    const checkedIn = await db.collection("attendance").countDocuments(attendanceFilter);
    
    return {
      totalParticipants,
      checkedIn,
      notCheckedIn: totalParticipants - checkedIn
    };
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    return { totalParticipants: 0, checkedIn: 0, notCheckedIn: 0 };
  }
}

export async function getAttendanceStatsByDate(eventId: string): Promise<{ date: string; totalParticipants: number; checkedIn: number; notCheckedIn: number }[]> {
  if (!ObjectId.isValid(eventId)) {
    return [];
  }

  try {
    const db = await getDb();
    
    // Get total participants for the event
    const totalParticipants = await db.collection("participants").countDocuments({ 
      eventId: new ObjectId(eventId) 
    });
    
    // Get all attendance records grouped by date
    const attendanceByDate = await db.collection("attendance").aggregate([
      { $match: { eventId: new ObjectId(eventId) } },
      { $group: { 
        _id: "$attendanceDate", 
        checkedIn: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]).toArray();
    
    return attendanceByDate.map(record => ({
      date: record._id,
      totalParticipants,
      checkedIn: record.checkedIn,
      notCheckedIn: totalParticipants - record.checkedIn
    }));
  } catch (error) {
    console.error("Error fetching attendance stats by date:", error);
    return [];
  }
}

export async function sendQRCodeToParticipant(participantId: string, eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();

    console.log("Looking for participant with ID:", participantId);
    console.log("Looking for event with ID:", eventId);

    // Get participant and event details
    const participant = await db.collection("participants").findOne({ _id: new ObjectId(participantId) });
    const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) });

    console.log("Found participant:", participant ? "Yes" : "No");
    console.log("Found event:", event ? "Yes" : "No");

    if (!participant) {
      console.log("Participant not found with ID:", participantId);
      return { success: false, error: "Participant not found" };
    }

    if (!event) {
      console.log("Event not found with ID:", eventId);
      return { success: false, error: "Event not found" };
    }

    // Map participant data to match component format (with id field)
    const mappedParticipant: Participant = {
      id: participant._id.toString(),
      name: participant.name,
      organization: participant.organization,
      designation: participant.designation || "",
      contact: participant.contact,
      phone: participant.phone || "",
      eventId: participant.eventId.toString(),
      qrEmailSent: participant.qrEmailSent
    };

    // Map event data to match Event type
    const mappedEvent: Event = {
      id: event._id.toString(),
      name: event.name,
      slug: event.slug || event._id.toString(),
      startDate: event.startDate || event.date,
      endDate: event.endDate || event.date,
      location: event.location,
      description: event.description,
      isActive: event.isActive !== undefined ? event.isActive : (new Date() >= new Date(event.startDate || event.date) && new Date() <= new Date(event.endDate || event.date)),
      isInternal: event.isInternal ?? false,
    };

    // Send QR code email
    await sendAttendanceQREmail({
      participant: mappedParticipant,
      event: mappedEvent
    });

    // Mark participant as having received QR code email
    await db.collection("participants").updateOne(
      { _id: new ObjectId(participantId) },
      { $set: { qrEmailSent: true } }
    );

    return { success: true };
  } catch (error) {
    console.error("Error sending QR code to participant:", error);
    return { success: false, error: "Failed to send QR code email" };
  }
}

export async function sendQRCodesToAllParticipants(eventId: string, batchSize: number = 25): Promise<{ success: boolean; sent: number; failed: number; errors: string[]; totalParticipants: number; batchesProcessed: number }> {
  try {
    const db = await getDb();

    // Get event details
    const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) });
    if (!event) {
      return { success: false, sent: 0, failed: 0, errors: ["Event not found"], totalParticipants: 0, batchesProcessed: 0 };
    }

    // Get all participants for this event
    const participants = await db.collection("participants").find({ eventId }).toArray();
    const totalParticipants = participants.length;

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    let batchesProcessed = 0;

    // Process participants in batches
    for (let i = 0; i < participants.length; i += batchSize) {
      const batch = participants.slice(i, i + batchSize);
      console.log(`Processing batch ${batchesProcessed + 1}: participants ${i + 1}-${Math.min(i + batchSize, participants.length)} of ${totalParticipants}`);
      
      for (const participant of batch) {
        try {
          // Map participant data to match component format (with id field)
          const mappedParticipant: Participant = {
            id: participant._id.toString(),
            name: participant.name,
            organization: participant.organization,
            designation: participant.designation || "",
            contact: participant.contact.toLowerCase().trim(),
            phone: participant.phone || "",
            eventId: participant.eventId.toString(),
            qrEmailSent: participant.qrEmailSent
          };

          // Map event data to match Event type
          const mappedEvent: Event = {
            id: event._id.toString(),
            name: event.name,
            slug: event.slug || event._id.toString(),
            startDate: event.startDate || event.date,
            endDate: event.endDate || event.date,
            location: event.location,
            description: event.description,
            isActive: event.isActive !== undefined ? event.isActive : (new Date() >= new Date(event.startDate || event.date) && new Date() <= new Date(event.endDate || event.date)),
            isInternal: event.isInternal ?? false,
          };

          await sendAttendanceQREmail({
            participant: mappedParticipant,
            event: mappedEvent
          });
          
          // Mark participant as having received QR code email
          await db.collection("participants").updateOne(
            { _id: participant._id },
            { $set: { qrEmailSent: true } }
          );
          
          sent++;
          
        } catch (error) {
          failed++;
          errors.push(`Failed to send to ${participant.contact}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      batchesProcessed++;
      
      // Add delay between batches (2 seconds) to respect rate limits
      if (i + batchSize < participants.length) {
        console.log(`Batch ${batchesProcessed} completed. Waiting 2 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`Bulk email sending completed: ${sent} sent, ${failed} failed`);
    return { success: true, sent, failed, errors, totalParticipants, batchesProcessed };
  } catch (error) {
    console.error("Error sending QR codes to all participants:", error);
    return { success: false, sent: 0, failed: 0, errors: ["Failed to process bulk QR code sending"], totalParticipants: 0, batchesProcessed: 0 };
  }
}

export async function sendFollowUpToParticipant(participantId: string, eventId: string, message?: string, surveyLink?: string, qrCodeImage?: File): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();

    console.log("Looking for participant with ID:", participantId);
    console.log("Looking for event with ID:", eventId);

    // Get participant and event details
    const participant = await db.collection("participants").findOne({ _id: new ObjectId(participantId) });
    const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) });

    console.log("Found participant:", participant ? "Yes" : "No");
    console.log("Found event:", event ? "Yes" : "No");

    if (!participant) {
      console.log("Participant not found with ID:", participantId);
      return { success: false, error: "Participant not found" };
    }

    if (!event) {
      console.log("Event not found with ID:", eventId);
      return { success: false, error: "Event not found" };
    }

    // Map participant data to match component format (with id field)
    const mappedParticipant: Participant = {
      id: participant._id.toString(),
      name: participant.name,
      organization: participant.organization,
      designation: participant.designation || "",
      contact: participant.contact,
      phone: participant.phone || "",
      eventId: participant.eventId.toString(),
      qrEmailSent: participant.qrEmailSent
    };

    // Map event data to match Event type
    const mappedEvent: Event = {
      id: event._id.toString(),
      name: event.name,
      slug: event.slug || event._id.toString(),
      startDate: event.startDate || event.date,
      endDate: event.endDate || event.date,
      location: event.location,
      description: event.description,
      isActive: event.isActive !== undefined ? event.isActive : (new Date() >= new Date(event.startDate || event.date) && new Date() <= new Date(event.endDate || event.date)),
      isInternal: event.isInternal ?? false,
    };

    // Send follow-up email
    await sendFollowUpEmail({
      participant: mappedParticipant,
      event: mappedEvent,
      message: message,
      surveyLink: surveyLink,
      qrCodeImage: qrCodeImage
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending follow-up to participant:", error);
    return { success: false, error: "Failed to send follow-up email" };
  }
}

export async function sendFollowUpToAllParticipants(eventId: string, message?: string, surveyLink?: string, qrCodeImage?: File, batchSize: number = 25): Promise<{ success: boolean; sent: number; failed: number; errors: string[]; totalParticipants: number; batchesProcessed: number }> {
  try {
    const db = await getDb();

    // Get event details
    const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) });
    if (!event) {
      return { success: false, sent: 0, failed: 0, errors: ["Event not found"], totalParticipants: 0, batchesProcessed: 0 };
    }

    // Get all participants for this event
    const participants = await db.collection("participants").find({ eventId }).toArray();
    const totalParticipants = participants.length;

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    let batchesProcessed = 0;

    // Process participants in batches
    for (let i = 0; i < participants.length; i += batchSize) {
      const batch = participants.slice(i, i + batchSize);
      console.log(`Processing follow-up batch ${batchesProcessed + 1}: participants ${i + 1}-${Math.min(i + batchSize, participants.length)} of ${totalParticipants}`);
      
      for (const participant of batch) {
        try {
          // Map participant data to match component format (with id field)
          const mappedParticipant: Participant = {
            id: participant._id.toString(),
            name: participant.name,
            organization: participant.organization,
            designation: participant.designation || "",
            contact: participant.contact.toLowerCase().trim(),
            phone: participant.phone || "",
            eventId: participant.eventId.toString(),
            qrEmailSent: participant.qrEmailSent
          };

          // Map event data to match Event type
          const mappedEvent: Event = {
            id: event._id.toString(),
            name: event.name,
            slug: event.slug || event._id.toString(),
            startDate: event.startDate || event.date,
            endDate: event.endDate || event.date,
            location: event.location,
            description: event.description,
            isActive: event.isActive !== undefined ? event.isActive : (new Date() >= new Date(event.startDate || event.date) && new Date() <= new Date(event.endDate || event.date)),
            isInternal: event.isInternal ?? false,
          };

          await sendFollowUpEmail({
            participant: mappedParticipant,
            event: mappedEvent,
            message: message,
            surveyLink: surveyLink,
            qrCodeImage: qrCodeImage
          });
          
          sent++;
          
        } catch (error) {
          failed++;
          errors.push(`Failed to send follow-up to ${participant.contact}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      batchesProcessed++;
      
      // Add delay between batches (2 seconds) to respect rate limits
      if (i + batchSize < participants.length) {
        console.log(`Follow-up batch ${batchesProcessed} completed. Waiting 2 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`Bulk follow-up email sending completed: ${sent} sent, ${failed} failed`);
    return { success: true, sent, failed, errors, totalParticipants, batchesProcessed };
  } catch (error) {
    console.error("Error sending follow-up to all participants:", error);
    return { success: false, sent: 0, failed: 0, errors: ["Failed to process bulk follow-up sending"], totalParticipants: 0, batchesProcessed: 0 };
  }
}
