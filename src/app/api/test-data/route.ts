import { NextRequest, NextResponse } from 'next/server';
import { getParticipants, getEvents } from '@/lib/actions';
import { generateQRCodeData } from '@/lib/qr-generator';

export async function GET(request: NextRequest) {
  try {
    // Get events and participants for testing
    const [events, participants] = await Promise.all([
      getEvents(),
      getParticipants()
    ]);

    // Get the first event and first participant for testing
    const testEvent = events[0];
    const testParticipant = participants[0];

    if (!testEvent || !testParticipant) {
      return NextResponse.json({
        success: false,
        error: 'No events or participants found. Please create some test data first.'
      });
    }

    // Generate QR code data for the test participant
    const qrData = generateQRCodeData(testParticipant.id);

    return NextResponse.json({
      success: true,
      testData: {
        event: {
          id: testEvent.id,
          name: testEvent.name
        },
        participant: {
          id: testParticipant.id,
          name: testParticipant.name,
          organization: testParticipant.organization
        },
        qrData: qrData,
        apiEndpoint: 'POST /api/attendance',
        requestBody: {
          qrData: qrData,
          eventId: testEvent.id
        }
      }
    });
  } catch (error) {
    console.error('Test data API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
