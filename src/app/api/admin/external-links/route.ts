import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth-middleware';
import { addParticipant, addEvent, generateUniqueSlug } from '@/lib/actions';
import { z } from 'zod';

const ExternalLinkSchema = z.object({
  url: z.string().url({ message: 'A valid URL is required' }),
  // eventId is now optional — if absent, a new event is created from newEvent fields
  eventId: z.string().optional(),
  newEvent: z.object({
    name: z.string().min(3),
    startDate: z.string().min(1),
    endDate: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
  action: z.enum(['parse', 'accept']),
  participants: z.array(z.object({
    name: z.string(),
    organization: z.string().optional(),
    designation: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional()
  })).optional()
});

async function handleExternalLinks(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = ExternalLinkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { url, eventId: existingEventId, newEvent, action, participants: payloadParticipants } = validation.data;

    // Validate: must have either an existing eventId or newEvent details (on accept)
    if (action === 'accept' && !existingEventId && !newEvent?.name) {
      return NextResponse.json(
        { success: false, error: 'Either select an existing event or provide a new event name.' },
        { status: 400 }
      );
    }

    // ── ACTION 1: PARSE ─────────────────────────────────────────────────────
    if (action === 'parse') {
      const parsedParticipants: any[] = [];
      const parsedEventMeta: any = {};

      if (url.includes('docs.google.com/spreadsheets') || url.endsWith('.csv')) {
        let csvUrl = url;
        if (url.includes('/edit') || url.includes('/view')) {
          const sheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
          csvUrl = sheetId
            ? `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
            : url.replace(/\/(edit|view).*$/, '/export?format=csv');
        }

        try {
          const response = await fetch(csvUrl);
          if (response.ok) {
            const csvText = await response.text();
            const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length > 1) {
              const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());

              const nameIdx = headers.findIndex(h => h.includes('name'));
              const orgIdx = headers.findIndex(h => h.includes('org') || h.includes('agency') || h.includes('company') || h.includes('institution'));
              const desigIdx = headers.findIndex(h => h.includes('designation') || h.includes('title') || h.includes('position'));
              const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('contact'));
              const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('tel'));
              const eventIdx = headers.findIndex(h => h.includes('event'));
              const dateIdx = headers.findIndex(h => h.includes('date'));
              const venueIdx = headers.findIndex(h => h.includes('venue') || h.includes('location'));

              // Try to extract event meta from first row if present
              if (eventIdx !== -1 && lines[1]) {
                const firstRow = lines[1].split(',').map(c => c.replace(/"/g, '').trim());
                parsedEventMeta.name = firstRow[eventIdx] || '';
                parsedEventMeta.date = dateIdx !== -1 ? firstRow[dateIdx] : '';
                parsedEventMeta.location = venueIdx !== -1 ? firstRow[venueIdx] : '';
              }

              for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
                const rowName = cols[nameIdx !== -1 ? nameIdx : 0];
                if (cols.length > 0 && rowName) {
                  parsedParticipants.push({
                    name: rowName || `Participant ${i}`,
                    organization: orgIdx !== -1 ? cols[orgIdx] : 'External Agency',
                    designation: desigIdx !== -1 ? cols[desigIdx] : 'Delegate',
                    email: emailIdx !== -1 ? cols[emailIdx] : '',
                    phone: phoneIdx !== -1 ? cols[phoneIdx] : '',
                  });
                }
              }
            }
          }
        } catch (fetchError) {
          console.error('Failed to fetch spreadsheet CSV:', fetchError);
        }
      }

      // Fallback: single formatted URL parameter extraction
      if (parsedParticipants.length === 0) {
        try {
          const parsedUrl = new URL(url);
          const name = parsedUrl.searchParams.get('name') || parsedUrl.searchParams.get('fullname') || 'External Participant';
          const organization = parsedUrl.searchParams.get('org') || parsedUrl.searchParams.get('organization') || 'External Partner';
          const designation = parsedUrl.searchParams.get('designation') || parsedUrl.searchParams.get('title') || 'Invited Delegate';
          const email = parsedUrl.searchParams.get('email') || '';
          const phone = parsedUrl.searchParams.get('phone') || '';

          // Try to extract event info from URL params too
          parsedEventMeta.name = parsedUrl.searchParams.get('event') || parsedUrl.searchParams.get('event_name') || '';
          parsedEventMeta.date = parsedUrl.searchParams.get('date') || '';
          parsedEventMeta.location = parsedUrl.searchParams.get('venue') || parsedUrl.searchParams.get('location') || '';

          parsedParticipants.push({ name, organization, designation, email, phone });
        } catch (e) {
          parsedParticipants.push({
            name: 'Invited External Delegate',
            organization: 'External Source',
            designation: 'Delegate',
            email: '',
            phone: ''
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Parsed ${parsedParticipants.length} participant(s) from external link`,
        participants: parsedParticipants,
        eventMeta: parsedEventMeta // Returns detected event info for admin to review/confirm
      });
    }

    // ── ACTION 2: ACCEPT ─────────────────────────────────────────────────────
    if (action === 'accept') {
      let resolvedEventId = existingEventId;

      // If no existing event selected → auto-create a new External Event
      if (!resolvedEventId && newEvent?.name) {
        const today = new Date().toISOString().split('T')[0];
        const slug = await generateUniqueSlug(newEvent.name);

        const createdEvent = await addEvent({
          name: newEvent.name,
          slug,
          startDate: newEvent.startDate || today,
          endDate: newEvent.endDate || newEvent.startDate || today,
          location: newEvent.location || 'TBD',
          description: `External event created via link intake.`,
          isActive: true,
          isInternal: false,
          category: 'external',
          allowPublicRegistration: false,
          isInvitationOnly: true,
        });

        if (!createdEvent?.id) {
          return NextResponse.json(
            { success: false, error: 'Failed to create new external event. Please try again.' },
            { status: 500 }
          );
        }

        resolvedEventId = createdEvent.id;
      }

      if (!resolvedEventId) {
        return NextResponse.json(
          { success: false, error: 'Could not resolve a target event for participant registration.' },
          { status: 400 }
        );
      }

      const itemsToAdd = payloadParticipants || [];
      const added: Array<{ id: string; name: string; organization: string; designation: string }> = [];

      for (const item of itemsToAdd) {
        const participantData = {
          name: item.name,
          organization: item.organization || 'External Partner',
          designation: item.designation || 'Delegate',
          contact: item.email || `external-${Date.now()}-${Math.random().toString(36).slice(2)}@nimet.gov.ng`,
          phone: item.phone || '00000000000',
          eventId: resolvedEventId,
          department: 'External',
          position: item.designation || 'Delegate',
          skipDuplicateCheck: true,
        };

        const result = await addParticipant(participantData);
        if (result.success && result.participantId) {
          added.push({
            id: result.participantId,
            name: item.name,
            organization: item.organization || 'External Partner',
            designation: item.designation || 'Delegate',
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully accepted link and registered ${added.length} external participant(s)`,
        registeredCount: added.length,
        participants: added,
        eventId: resolvedEventId,
        newEventCreated: !existingEventId,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('External link API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = requireSuperAdmin(handleExternalLinks);
