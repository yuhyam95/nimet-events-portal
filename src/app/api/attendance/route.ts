import { NextRequest, NextResponse } from 'next/server';
import { markAttendance } from '@/lib/actions';
import { decryptQRCodeData } from '@/lib/qr-generator';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

async function handlePostAttendance(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { qrData, eventId, attendanceDate } = body;
    const scannerUserId = request.user?.id;

    if (!qrData || !eventId) {
      return NextResponse.json(
        { success: false, error: 'QR code data and event ID are required' },
        { status: 400 }
      );
    }

    // Decrypt the participant ID from the QR code
    let participantId: string;
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

    // Mark attendance with optional date and scanner user ID
    const result = await markAttendance(participantId, eventId, attendanceDate, scannerUserId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Attendance marked successfully',
        attendance: result.attendance
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Attendance API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = requireAuth(handlePostAttendance);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const attendanceDate = searchParams.get('attendanceDate');

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Import the function here to avoid circular dependencies
    const { getAttendanceByEventId } = await import('@/lib/actions');

    const attendance = await getAttendanceByEventId(eventId, attendanceDate || undefined);

    return NextResponse.json({
      success: true,
      attendance
    });
  } catch (error) {
    console.error('Attendance GET API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
