import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getActiveEvents } from '@/lib/actions';

async function handleGetEvents(request: NextRequest) {
  try {
    // Get active events for mobile app
    const events = await getActiveEvents();
    
    return NextResponse.json({
      success: true,
      events: events.map(event => ({
        id: event.id,
        name: event.name,
        slug: event.slug,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        description: event.description,
        isInternal: event.isInternal,
        department: event.department,
        position: event.position,
      })),
    });

  } catch (error) {
    console.error('Mobile events API error:', error);
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
export const GET = requireAuth(handleGetEvents);
