"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CalendarDays, MapPin, Mail, Phone, Building, User, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Event, Participant } from "@/lib/types";
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
const formatEventDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    const day = date.getDate();
    const ordinalSuffix = getOrdinalSuffix(day);
    return format(date, `d'${ordinalSuffix}' MMMM, yyyy`);
  } catch (error) {
    return dateString;
  }
};

interface RegistrationSuccessProps {
  event: Event;
  participant: Participant;
}

export function RegistrationSuccess({ event, participant }: RegistrationSuccessProps) {
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
            {/* Pending Review State */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-3xl font-headline text-amber-600">Registration Submitted!</CardTitle>
            </div>
            <p className="text-lg text-muted-foreground">
              Your registration for <strong>{event.name}</strong> has been received and is <strong className="text-amber-600">pending review</strong>.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Event Details */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Event Details
              </h3>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Start Date:</strong> {formatEventDate(event.startDate)}</span>
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span><strong>End Date:</strong> {formatEventDate(event.endDate)}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Location:</strong> {event.location}</span>
                </p>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Description:</strong> {event.description}
                  </p>
                )}
              </div>
            </div>

            {/* Participant Details */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Registration Details
              </h3>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Name:</strong> {participant.name}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Email:</strong> {participant.contact}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Phone:</strong> {participant.phone}</span>
                </p>
                {participant.organization && (
                  <p className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Organization:</strong> {participant.organization}</span>
                  </p>
                )}
                {participant.designation && (
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Position:</strong> {participant.designation}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-amber-800">
                <Clock className="h-5 w-5" />
                What Happens Next?
              </h3>
              <ul className="space-y-2 text-sm text-amber-900">
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" /> Your registration is now under review by the event organizers.</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" /> Once approved, a <strong>QR code</strong> will be sent to <strong>{participant.contact}</strong>.</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" /> Please check your email (including spam folder) after approval.</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" /> Present your QR code at the event venue for check-in.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link href="/">
                  Return to Home
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href={`/register/${event.id}`}>
                  Register Another Person
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
