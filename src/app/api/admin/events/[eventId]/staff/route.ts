import { NextRequest, NextResponse } from 'next/server';
import { getEventAssignedStaff, assignStaffToEvent, unassignStaffFromEvent } from '@/lib/actions';
import { z } from 'zod';

const AssignStaffSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required." }),
});

const UnassignStaffSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required." }),
});

async function handleGetStaff(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    
    // Get assigned staff for the event
    const staff = await getEventAssignedStaff(eventId);
    
    return NextResponse.json({
      success: true,
      staff,
    });

  } catch (error) {
    console.error('Get event staff API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

async function handleAssignStaff(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    
    // Validate request body
    const validation = AssignStaffSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request data",
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { userId } = validation.data;

    // Assign staff to event
    const result = await assignStaffToEvent(eventId, userId);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || "Failed to assign staff" 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Staff assigned successfully",
    });

  } catch (error) {
    console.error('Assign staff API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

async function handleUnassignStaff(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    
    // Validate request body
    const validation = UnassignStaffSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request data",
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { userId } = validation.data;

    // Unassign staff from event
    const result = await unassignStaffFromEvent(eventId, userId);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || "Failed to unassign staff" 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Staff unassigned successfully",
    });

  } catch (error) {
    console.error('Unassign staff API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Export handlers without authentication middleware for admin interface
export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  return handleGetStaff(request, { params });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  return handleAssignStaff(request, { params });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  return handleUnassignStaff(request, { params });
}