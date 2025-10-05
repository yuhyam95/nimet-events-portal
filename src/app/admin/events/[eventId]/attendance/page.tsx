import { AttendanceList } from "@/components/attendance-list";
import { getAttendanceByEventId, getAttendanceStats, getAttendanceStatsByDate, getEventById } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, CheckCircle, XCircle, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DayByDayAttendance } from "@/components/day-by-day-attendance";

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
  
  const [attendance, stats, statsByDate] = await Promise.all([
    getAttendanceByEventId(eventId),
    getAttendanceStats(eventId),
    getAttendanceStatsByDate(eventId)
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
          <h1 className="text-3xl font-bold font-headline">Event Attendance</h1>
          <p className="text-muted-foreground mt-1">{event.name}</p>
        </div>
      </div>
      
      <CardTitle className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4" />
            Overall Event Statistics
      </CardTitle>
      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.totalParticipants}</div>
            <p className="text-xs text-blue-600">
              Registered for this event
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.checkedIn}</div>
            <p className="text-xs text-green-600">
              {stats.totalParticipants > 0 ? Math.round((stats.checkedIn / stats.totalParticipants) * 100) : 0}% attendance rate
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.notCheckedIn}</div>
            <p className="text-xs text-red-600">
              {stats.totalParticipants > 0 ? Math.round((stats.notCheckedIn / stats.totalParticipants) * 100) : 0}% absent
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Overall Event Statistics */}
      {/* <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Event Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statsByDate.length}
              </div>
              <div className="text-sm text-muted-foreground">Event Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statsByDate.length > 0 ? Math.round((statsByDate.reduce((sum, stat) => sum + stat.checkedIn, 0) / (statsByDate.length * stats.totalParticipants)) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Average Attendance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {statsByDate.reduce((sum, stat) => sum + stat.checkedIn, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Check-ins</div>
            </div>
          </div>
        </CardContent>
      </Card> */}
      
      {/* Day-by-Day Attendance Overview */}
      <DayByDayAttendance 
        eventId={eventId}
        eventName={event.name}
        eventStartDate={event.startDate}
        eventEndDate={event.endDate}
        initialStatsByDate={statsByDate}
      />
      
      {/* <AttendanceList initialAttendance={attendance} eventName={event.name} /> */}
    </div>
  );
}
