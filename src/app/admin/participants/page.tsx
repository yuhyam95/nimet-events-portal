import { ParticipantList } from "@/components/participant-list";
import { participants } from "@/lib/data";

export default function ParticipantsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6">Registered Participants</h1>
      <ParticipantList initialParticipants={participants} />
    </div>
  );
}
