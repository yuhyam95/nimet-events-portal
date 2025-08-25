import { ParticipantList } from "@/components/participant-list";
import { getParticipantsByEventId, getEventById } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventParticipantsPageProps {
  params: {
    eventId: string;
  };
}

export default async function EventParticipantsPage({ params }: EventParticipantsPageProps) {
  const { eventId } = params;
  
  const event = await getEventById(eventId);
  if (!event) {
    notFound();
  }
  
  const participants = await getParticipantsByEventId(eventId);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">Event Participants</h1>
          <p className="text-muted-foreground mt-1">{event.name}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {participants.length} participant{participants.length !== 1 ? 's' : ''} registered for this event
        </p>
      </div>
      
      <ParticipantList initialParticipants={participants} />
    </div>
  );
}
