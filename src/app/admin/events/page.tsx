import { EventList } from "@/components/event-list";

export default async function EventsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6">Manage Events</h1>
      <EventList />
    </div>
  );
}
