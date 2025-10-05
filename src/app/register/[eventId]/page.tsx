import { RegistrationForm } from "@/components/registration-form";
import { getEventById } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import { format, parseISO } from "date-fns";

// Helper function to add ordinal suffix to day
const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

// Helper function to format event date
const formatEventDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    const day = date.getDate();
    const ordinalSuffix = getOrdinalSuffix(day);
    return format(date, `d'${ordinalSuffix}' MMMM, yyyy`);
  } catch (error) {
    return dateString;
  }
};

export default async function RegisterPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await getEventById(eventId);

  if (!event) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center">
      <div className="w-full max-w-2xl">
        <Card>
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Image 
                    src="/nimet-logo.png" 
                    alt="NIMET Logo" 
                    width={200} 
                    height={200} 
                    className="object-contain"
                  />
                </div>
                <CardTitle className="text-3xl font-headline">{event.name}</CardTitle>
                 <CardDescription className="pt-2">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>Start: {formatEventDate(event.startDate)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mt-1">
                        <CalendarDays className="h-4 w-4" />
                        <span>End: {formatEventDate(event.endDate)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RegistrationForm eventId={event.id} event={event} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
