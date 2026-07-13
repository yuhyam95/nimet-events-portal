import { RegistrationSuccess } from "@/components/registration-success";
import { getEventById, getParticipantsByEventId } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface SuccessPageProps {
  searchParams: Promise<{
    eventId?: string;
    participantId?: string;
  }>;
}

export default async function RegistrationSuccessPage({ searchParams }: SuccessPageProps) {
  const { eventId, participantId } = await searchParams;

  if (!eventId || !participantId) {
    notFound();
  }

  const event = await getEventById(eventId);
  
  if (!event) {
    notFound();
  }

  // Fetch the participant data
  const participants = await getParticipantsByEventId(eventId);
  const participant = participants.find(p => p.id === participantId);

  if (!participant) {
    notFound();
  }

  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
          </div>
        </div>
      </div>
    }>
      <RegistrationSuccess event={event} participant={participant} />
    </Suspense>
  );
}
