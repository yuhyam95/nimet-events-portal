import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { addParticipant, markAttendance } from '@/lib/actions';

async function handleOnboardParticipant(request: AuthenticatedRequest) {
    try {
        const body = await request.json();
        console.log("Mobile onboard request body:", body);
        const { firstName, lastName, email, organization, phone, position, designation, eventId } = body;

        // Get the logged-in user (staff) ID from the authenticated request
        const staffId = request.user?.id;

        if (!eventId || !firstName || !lastName || !organization || !phone) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const name = `${firstName} ${lastName}`.trim();

        // Prepare data for addParticipant
        const participantData = {
            name,
            contact: email, // Map email to contact
            phone,
            organization,
            position: position || "",
            designation: designation || "",
            eventId,
            skipDuplicateCheck: true, // Allow multiple registrations with same email/phone for staff-assisted onboarding
            onboardedBy: staffId,
            onboardingDate: new Date().toISOString(),
        };

        const result = await addParticipant(participantData);

        if (result.success && result.participantId) {
            // Automatically mark attendance since they are physically being onboarded
            try {
                await markAttendance(
                    result.participantId,
                    eventId,
                    new Date().toISOString().split('T')[0], // Today's date
                    staffId // Marked by staff
                );
                console.log(`Auto-attendance marked for participant ${result.participantId} by staff ${staffId}`);
            } catch (attendanceError) {
                console.error('Failed to auto-mark attendance during onboarding:', attendanceError);
                // We don't fail the request since onboarding itself was successful
            }

            return NextResponse.json({
                success: true,
                data: result,
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('Mobile onboard API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const POST = requireAuth(handleOnboardParticipant);
