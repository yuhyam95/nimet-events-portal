import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getParticipantsByEventId } from '@/lib/actions';

async function handleGetParticipants(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    
    // Get participants for the event
    const participants = await getParticipantsByEventId(eventId);
    
    return NextResponse.json({
      success: true,
      participants: participants.map(participant => ({
        id: participant.id,
        name: participant.name,
        organization: participant.organization,
        designation: participant.designation,
        department: participant.department,
        position: participant.position,
        contact: participant.contact,
        phone: participant.phone,
        eventId: participant.eventId,
        eventName: participant.eventName,
      })),
    });

  } catch (error) {
    console.error('Mobile participants API error:', error);
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
export const GET = requireAuth(handleGetParticipants);
