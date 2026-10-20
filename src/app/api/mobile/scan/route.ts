import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { markAttendance } from '@/lib/actions';
import { decryptQRCodeData } from '@/lib/qr-generator';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

const ScanSchema = z.object({
  qrData: z.string().min(1, { message: "QR code data is required." }).optional(),
  participantId: z.string().min(1, { message: "Participant ID is required." }).optional(),
  eventId: z.string().min(1, { message: "Event ID is required." }),
  attendanceDate: z.string().optional(),
}).refine((data) => data.qrData || data.participantId, {
  message: "Either qrData or participantId is required",
  path: ["qrData"]
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

    const { qrData, participantId: rawParticipantId, eventId, attendanceDate } = validation.data;

    // Normalize raw input from either qrData or participantId
    const rawInput = (qrData || rawParticipantId || '').trim();
    let participantId: string = '';

    // 1. If encrypted QR format (nimet://attendance/...)
    if (rawInput.startsWith('nimet://attendance/')) {
      try {
        console.log('Deciphering QR data URI:', rawInput);
        participantId = decryptQRCodeData(rawInput);
        console.log('Decrypted participant ID:', participantId);
      } catch (error) {
        console.error('QR decryption error:', error);
        return NextResponse.json(
          { success: false, error: 'Invalid or corrupt QR code format' },
          { status: 400 }
        );
      }
    } 
    // 2. Direct MongoDB ObjectId format (24 hex chars)
    else if (ObjectId.isValid(rawInput) && rawInput.length === 24) {
      participantId = rawInput;
      console.log('Using valid MongoDB participant ID directly:', participantId);
    } 
    // 3. Fallback: try decrypting in case the prefix was omitted
    else {
      let resolved = false;
      try {
        participantId = decryptQRCodeData(`nimet://attendance/${rawInput}`);
        if (ObjectId.isValid(participantId)) {
          resolved = true;
          console.log('Decrypted raw token to participant ID:', participantId);
        }
      } catch {
        // Not a prefixed or raw encrypted string
      }

      // 4. Check if it is an invitation code for this event
      if (!resolved) {
        try {
          const db = await getDb();
          const invitation = await db.collection("invitations").findOne({
            eventId,
            code: rawInput.toUpperCase()
          });

          if (invitation?.participantId) {
            participantId = invitation.participantId;
            resolved = true;
            console.log('Resolved invitation code to participant ID:', participantId);
          }
        } catch (dbErr) {
          console.error('Invitation code lookup error:', dbErr);
        }
      }

      if (!resolved || !participantId) {
        return NextResponse.json(
          { success: false, error: 'Unrecognized QR code or participant ID' },
          { status: 400 }
        );
      }
    }

    // Get user ID from authenticated request
    const userId = (request as any).user?.id;

    // Mark attendance
    const result = await markAttendance(participantId, eventId, attendanceDate, userId);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || "Failed to mark attendance",
          attendance: result.attendance,
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
