import { notFound } from "next/navigation";
import { getEventById } from "@/lib/actions";
import { AgendaManager } from "@/components/agenda-manager";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function EventAgendaPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await getEventById(eventId);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Agenda</h1>
          <p className="text-muted-foreground">
            {event.name}
          </p>
        </div>
      </div>
      
      <AgendaManager eventId={event.id} initialAgenda={event.agenda} />
    </div>
  );
}
