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

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Card className="flex flex-col bg-card hover:border-primary/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{event.name}</CardTitle>
        <CardDescription className="pt-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-foreground/80">{event.description}</p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-primary/90 hover:bg-primary">
          <Link href={`/register/${event.id}`}>
            Register Now <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
