import { AttendanceList } from "@/components/attendance-list";
import { getAttendanceByEventId, getAttendanceStats, getEventById } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EventAttendancePageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function EventAttendancePage({ params }: EventAttendancePageProps) {
  const { eventId } = await params;
  
  const event = await getEventById(eventId);
  if (!event) {
    notFound();
  }
  
  const [attendance, stats] = await Promise.all([
    getAttendanceByEventId(eventId),
    getAttendanceStats(eventId)
  ]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">Event Attendance</h1>
          <p className="text-muted-foreground mt-1">{event.name}</p>
        </div>
      </div>
      
      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParticipants}</div>
            <p className="text-xs text-muted-foreground">
              Registered for this event
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalParticipants > 0 ? Math.round((stats.checkedIn / stats.totalParticipants) * 100) : 0}% attendance rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.notCheckedIn}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalParticipants > 0 ? Math.round((stats.notCheckedIn / stats.totalParticipants) * 100) : 0}% absent
            </p>
          </CardContent>
        </Card>
      </div>
      
      <AttendanceList initialAttendance={attendance} eventName={event.name} />
    </div>
  );
}
