import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { Event } from "@/lib/types";
import { format, parseISO } from "date-fns";

interface EventCardProps {
  event: Event;
}

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

export function EventCard({ event }: EventCardProps) {
  return (
    <Card className="flex flex-col bg-card hover:border-primary/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{event.name}</CardTitle>
        <CardDescription className="pt-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>Start: {formatEventDate(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <CalendarDays className="h-4 w-4" />
            <span>End: {formatEventDate(event.endDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
          {event.isInternal && event.department && (
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <span className="text-xs font-medium">Department:</span>
              <span className="text-xs">{event.department}</span>
            </div>
          )}
          {event.isInternal && event.position && (
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <span className="text-xs font-medium">Position:</span>
              <span className="text-xs">{event.position}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-foreground/80">{event.description}</p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-primary/90 hover:bg-primary">
          <Link href={`/${event.slug}`}>
            Register Now <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
