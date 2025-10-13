import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { markAttendance } from '@/lib/actions';
import { z } from 'zod';

const ScanSchema = z.object({
  participantId: z.string().min(1, { message: "Participant ID is required." }),
  eventId: z.string().min(1, { message: "Event ID is required." }),
  attendanceDate: z.string().optional(),
});

async function handleScan(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = ScanSchema.safeParse(body);
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

    const { participantId, eventId, attendanceDate } = validation.data;

    // Get user ID from authenticated request
    const userId = (request as any).user?.id;

    // Mark attendance
    const result = await markAttendance(participantId, eventId, attendanceDate, userId);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || "Failed to mark attendance" 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Attendance marked successfully",
      attendance: result.attendance,
    });

  } catch (error) {
    console.error('Mobile scan API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Export the handler with authentication middleware
export const POST = requireAuth(handleScan);
