import { getEventById } from "@/lib/actions";
import { InvitationManager } from "@/components/invitation-manager";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, QrCode, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EventInvitationsPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function EventInvitationsPage({ params }: EventInvitationsPageProps) {
  const { eventId } = await params;

  const event = await getEventById(eventId);
  if (!event) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="default" size="sm" asChild className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium">
          <Link href="/admin/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold font-headline">Invitation Manager</h1>
            {event.isInvitationOnly && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                Invitation Only
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{event.name}</p>
        </div>
      </div>

      {!event.isInvitationOnly && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 text-sm">Event is not set as Invitation Only</p>
              <p className="text-xs text-amber-700 mt-1">
                You can still create invitation codes here, but the registration page will not prompt for a code unless you enable &quot;Invitation Only&quot; in the event settings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <QrCode className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Per-Invitee Unique Codes</CardTitle>
              <CardDescription>
                Generate unique invitation codes for each attendee. Each code produces both a scannable QR code and a barcode. When an invitee scans or enters their code on the registration page, their details auto-populate.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <InvitationManager eventId={eventId} eventName={event.name} />
        </CardContent>
      </Card>
    </div>
  );
}
