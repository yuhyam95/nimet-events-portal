import { EventCard } from "@/components/event-card";
import { getActiveEvents } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Event } from "@/lib/types";

export default async function Home() {
  const events = await getActiveEvents();
  return (
    <div className="min-h-screen bg-[#fcfdfd] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* High-Visibility Geometric Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Subtle base blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[80px]" />

        {/* Prominent Geometric Shapes */}
        <div className="absolute top-[5%] left-[5%] w-12 h-4 bg-primary/30 -rotate-12 rounded-sm" />
        <div className="absolute top-[12%] left-[35%] w-10 h-10 border-[3px] border-primary/25 rounded-full" />
        <div className="absolute top-[22%] left-[45%] w-8 h-8 bg-primary/20 rotate-12 rounded-sm border border-primary/40" />
        <div className="absolute top-[8%] left-[15%] w-4 h-4 bg-primary/40 rounded-full" />

        <div className="absolute top-[25%] left-[65%] w-3 h-3 bg-primary/40 rounded-full" />
        <div className="absolute top-[32%] left-[55%] w-16 h-5 bg-primary/20 rotate-[20deg] rounded-sm" />
        <div className="absolute top-[48%] left-[75%] w-14 h-14 border-[3px] border-primary/20 rounded-full" />
        <div className="absolute top-[5%] left-[78%] w-6 h-6 bg-primary/30 -rotate-45 rounded-sm" />

        <div className="absolute top-[45%] left-[8%] w-5 h-5 bg-primary/40 rounded-full" />
        <div className="absolute top-[62%] left-[10%] w-10 h-10 bg-primary/20 -rotate-12 rounded-sm border border-primary/40" />
        <div className="absolute top-[35%] left-[5%] w-8 h-8 border-[3px] border-primary/30 rounded-full" />
        <div className="absolute top-[18%] left-[90%] w-12 h-12 border-[3px] border-primary/20 rounded-full" />

        <div className="absolute top-[72%] left-[20%] w-14 h-14 border-[3px] border-primary/25 rounded-full" />
        <div className="absolute top-[78%] left-[40%] w-18 h-7 bg-primary/30 -rotate-6 rounded-sm" />
        <div className="absolute top-[85%] left-[45%] w-4 h-4 bg-primary/50 rounded-full" />
        <div className="absolute top-[65%] left-[85%] w-5 h-5 bg-primary/40 rounded-full" />

        <div className="absolute top-[82%] left-[75%] w-10 h-10 bg-primary/30 rotate-45 rounded-sm border border-primary/40" />
        <div className="absolute top-[55%] left-[88%] w-12 h-4 bg-primary/25 rotate-[45deg] rounded-sm" />
        <div className="absolute top-[90%] left-[88%] w-4 h-4 bg-primary/40 rounded-full" />
        <div className="absolute top-[55%] left-[30%] w-5 h-5 bg-primary/50 rounded-full" />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-headline font-bold text-primary tracking-tight">Upcoming Events</h1>
          {/* <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover and register for the latest meteorological workshops, seminars, and events hosted by NIMET.
          </p> */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event: Event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}
