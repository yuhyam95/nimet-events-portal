import { EventList } from "@/components/event-list";
import { getEvents } from "@/lib/actions";

export default async function EventsPage() {
  const events = await getEvents();
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6">Manage Events</h1>
      <EventList events={events} />
    </div>
  );
}
