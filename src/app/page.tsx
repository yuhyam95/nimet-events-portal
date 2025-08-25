import { EventCard } from "@/components/event-card";
import { events } from "@/lib/data";
import type { Event } from "@/lib/types";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-headline font-bold mb-8 text-center">Upcoming Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event: Event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
