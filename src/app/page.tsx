import { EventCard } from "@/components/event-card";
import { getActiveEvents } from "@/lib/actions";
import type { Event } from "@/lib/types";

export default async function Home() {
  const events = await getActiveEvents();
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          
        </div>
        <h1 className="text-4xl font-headline font-bold">Upcoming Events</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event: Event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
