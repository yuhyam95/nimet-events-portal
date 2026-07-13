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
    <Card className="flex flex-col bg-card/95 backdrop-blur-sm border-primary/10 shadow-lg hover:shadow-2xl hover:border-primary/50 transition-all duration-300 ease-in-out transform hover:-translate-y-2 group">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="font-headline text-2xl text-primary group-hover:text-primary/80 transition-colors uppercase tracking-tight">{event.name}</CardTitle>
        </div>
        <CardDescription className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-muted-foreground bg-secondary/30 px-3 py-1 rounded-full w-fit">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">{formatEventDate(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground bg-secondary/30 px-3 py-1 rounded-full w-fit">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">{event.location}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pt-4">
        <p className="text-foreground/80 line-clamp-3 text-sm leading-relaxed">{event.description}</p>

        {event.isInternal && (
          <div className="mt-4 flex flex-wrap gap-2">
            {event.department && (
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase">{event.department}</span>
            )}
            {event.position && (
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase">{event.position}</span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-6">
        <Button asChild className="w-full bg-primary hover:bg-primary/90 shadow-md group-hover:shadow-lg transition-all">
          <Link href={`/${event.slug}`} className="flex items-center justify-center">
            Register Now <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
