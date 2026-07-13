import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { addEvent, generateUniqueSlug } from "@/lib/actions";
import { getDb } from "@/lib/mongodb";
import { z } from "zod";

const CreateEventSchema = z.object({
  name: z.string().min(5, { message: "Event name must be at least 5 characters." }),
  category: z.enum(["internal", "external", "meeting"], {
    required_error: "Category is required.",
  }),
  startDate: z.string().min(1, { message: "Start date is required." }),
  endDate: z.string().min(1, { message: "End date is required." }),
  location: z.string().min(2, { message: "Location is required." }),
  description: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  allowPublicRegistration: z.boolean().optional().default(false),
  slug: z.string().optional(),
  agenda: z.array(z.object({
    id: z.string(),
    title: z.string(),
    time: z.string().optional(),
    speaker: z.string().optional(),
  })).optional(),
});

async function handleCreateEvent(request: AuthenticatedRequest) {
  try {
    const body = await request.json();

    const validation = CreateEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid event data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      name, category, startDate, endDate, location, description,
      department, position, allowPublicRegistration, slug: customSlug, agenda,
    } = validation.data;

    // Auto-generate slug or validate/sanitise custom slug
    let slug: string;
    if (customSlug) {
      const sanitised = customSlug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const db = await getDb();
      const existing = await db.collection("events").findOne({ slug: sanitised });
      if (existing) {
        return NextResponse.json(
          { success: false, error: `The slug "${sanitised}" is already taken. Please choose a different one.` },
          { status: 409 }
        );
      }
      slug = sanitised;
    } else {
      slug = await generateUniqueSlug(name);
    }

    // Derive isInternal from category
    const isInternal = category !== "external";

    const eventPayload = {
      name,
      slug,
      category,
      isInternal,
      startDate,
      endDate,
      location,
      description: description || "",
      department: department || "",
      position: position || "",
      allowPublicRegistration: allowPublicRegistration ?? false,
      agenda: agenda || [],
    };

    await addEvent(eventPayload);

    // Fetch the created event to return the ID
    const db = await getDb();
    const created = await db.collection("events").findOne({ slug });

    return NextResponse.json({
      success: true,
      message: "Event created successfully.",
      eventId: created?._id?.toString(),
      slug,
    });

  } catch (error: any) {
    console.error("Mobile create-event API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: error?.message?.includes("already exists") ? 409 : 500 }
    );
  }
}

export const POST = requireAuth(handleCreateEvent);
