import { NextRequest, NextResponse } from "next/server";
import { lookupInvitationCode, createInvitations, addInvitation, deleteInvitation, getInvitations } from "@/lib/actions";
import { authenticateRequest } from "@/lib/auth-middleware";

// GET /api/invitations?eventId=...&code=...   → lookup a code (public)
// GET /api/invitations?eventId=...            → list all codes (admin)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const code = searchParams.get("code");

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  // If a code is provided → public lookup (no auth required)
  if (code) {
    const result = await lookupInvitationCode(eventId, code);
    if (!result.found) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ invitation: result.invitation });
  }

  // Listing all invitations requires admin auth
  const authResult = await authenticateRequest(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: 401 });
  }

  const invitations = await getInvitations(eventId);
  return NextResponse.json({ invitations });
}

// POST /api/invitations  → create invitations (admin only)
// Body: { eventId, count } for bulk  OR  { eventId, inviteeName, inviteeEmail, inviteeOrg } for single
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { eventId, count, inviteeName, inviteeEmail, inviteeOrg } = body;

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  // Bulk generation
  if (count && typeof count === "number") {
    const result = await createInvitations(eventId, count);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ invitations: result.invitations }, { status: 201 });
  }

  // Single invitation
  const result = await addInvitation(eventId, { inviteeName, inviteeEmail, inviteeOrg });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ invitation: result.invitation }, { status: 201 });
}

// DELETE /api/invitations?id=...  → delete an unused invitation (admin only)
export async function DELETE(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const result = await deleteInvitation(id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
