import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getActiveEvents } from '@/lib/actions';

async function handleGetEvents(request: NextRequest) {
  try {
    // Get only active (non-expired) events for the mobile app.
    // Expired events remain visible in the backend admin portal for reporting.
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
        category: event.category,
        allowPublicRegistration: event.allowPublicRegistration ?? false,
        department: event.department,
        position: event.position,
        agenda: event.agenda,
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
