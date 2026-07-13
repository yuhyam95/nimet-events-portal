import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { markAttendance } from '@/lib/actions';
import { decryptQRCodeData } from '@/lib/qr-generator';
import { z } from 'zod';

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

    // Handle both qrData (new format) and participantId (old format)
    let participantId: string;
    
    if (qrData) {
      // New format: decrypt QR code data
      try {
        console.log('QR Data received:', qrData);
        participantId = decryptQRCodeData(qrData);
        console.log('Decrypted participant ID:', participantId);
      } catch (error) {
        console.error('QR decryption error:', error);
        return NextResponse.json(
          { success: false, error: 'Invalid QR code' },
          { status: 400 }
        );
      }
    } else if (rawParticipantId) {
      // Old format: check if it's QR data or already decrypted
      if (rawParticipantId.startsWith('nimet://attendance/')) {
        // It's QR data, decrypt it
        try {
          console.log('Participant ID appears to be QR data, decrypting:', rawParticipantId);
          participantId = decryptQRCodeData(rawParticipantId);
          console.log('Decrypted participant ID:', participantId);
        } catch (error) {
          console.error('QR decryption error:', error);
          return NextResponse.json(
            { success: false, error: 'Invalid QR code format' },
            { status: 400 }
          );
        }
      } else {
        // It's already a participant ID
        participantId = rawParticipantId;
        console.log('Using participant ID directly:', participantId);
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Either qrData or participantId is required' },
        { status: 400 }
      );
    }

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
