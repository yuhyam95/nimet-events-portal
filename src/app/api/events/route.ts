import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/lib/actions';

export async function GET(request: NextRequest) {
  try {
    const events = await getEvents();
    
    return NextResponse.json(events);
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
