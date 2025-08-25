import { RegistrationForm } from "@/components/registration-form";
import { events } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, MapPin } from "lucide-react";

export default function RegisterPage({ params }: { params: { eventId: string } }) {
  const event = events.find((e) => e.id === params.eventId);

  if (!event) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center">
      <div className="w-full max-w-2xl">
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-headline text-center">{event.name}</CardTitle>
                 <CardDescription className="pt-2 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>{event.date}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RegistrationForm eventId={event.id} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
