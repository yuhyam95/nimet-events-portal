import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
<<<<<<< HEAD
import { getEvents } from '@/lib/actions';

async function handleGetEvents(request: NextRequest) {
  try {
    // Get all events for mobile app (app handles active/inactive display)
    const events = await getEvents();
=======
import { getActiveEvents } from '@/lib/actions';

async function handleGetEvents(request: NextRequest) {
  try {
    // Get active events for mobile app
    const events = await getActiveEvents();
>>>>>>> 6b8d2698d05877becfca6b9699a253c973cf9ce0
    
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
<<<<<<< HEAD
        category: event.category,
        allowPublicRegistration: event.allowPublicRegistration ?? false,
=======
>>>>>>> 6b8d2698d05877becfca6b9699a253c973cf9ce0
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
