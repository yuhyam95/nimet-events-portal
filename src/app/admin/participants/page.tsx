import { ParticipantList } from "@/components/participant-list";
import { getParticipants } from "@/lib/actions";

export default async function ParticipantsPage() {
  const participants = await getParticipants();
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6">Registered Participants</h1>
      <ParticipantList initialParticipants={participants} />
    </div>
  );
}
