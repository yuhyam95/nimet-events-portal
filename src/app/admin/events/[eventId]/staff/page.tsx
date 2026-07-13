import { StaffAssignment } from "@/components/staff-assignment";
import { getEventById, getEventAssignedStaff, getUsers } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventStaffPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function EventStaffPage({ params }: EventStaffPageProps) {
  const { eventId } = await params;
  
  const event = await getEventById(eventId);
  if (!event) {
    notFound();
  }
  
  const [assignedStaff, allUsers] = await Promise.all([
    getEventAssignedStaff(eventId),
    getUsers()
  ]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="default" size="sm" asChild className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium">
          <Link href="/admin/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <Users className="h-8 w-8" />
            Event Staff Management
          </h1>
          <p className="text-muted-foreground mt-1">{event.name}</p>
        </div>
      </div>
      
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Manage which staff members can take attendance for this event. Only assigned staff (and admins) will be able to mark attendance.
        </p>
      </div>
      
      <StaffAssignment 
        eventId={eventId}
        assignedStaff={assignedStaff}
        allUsers={allUsers}
      />
    </div>
  );
}
