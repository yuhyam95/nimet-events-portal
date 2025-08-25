import { EventList } from "@/components/event-list";
import { events } from "@/lib/data";

export default function EventsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6">Manage Events</h1>
      <EventList events={events} />
    </div>
  );
}
