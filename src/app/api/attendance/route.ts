import { NextRequest, NextResponse } from 'next/server';
import { markAttendance } from '@/lib/actions';
import { decryptQRCodeData } from '@/lib/qr-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrData, eventId } = body;

    if (!qrData || !eventId) {
      return NextResponse.json(
        { success: false, error: 'QR code data and event ID are required' },
        { status: 400 }
      );
    }

    // Decrypt the participant ID from the QR code
    let participantId: string;
    try {
      participantId = decryptQRCodeData(qrData);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid QR code' },
        { status: 400 }
      );
    }

    // Mark attendance
    const result = await markAttendance(participantId, eventId);

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // This would be used to get attendance data
    // For now, return a simple response
    return NextResponse.json({
      success: true,
      message: 'Attendance endpoint is working'
    });
  } catch (error) {
    console.error('Attendance GET API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
