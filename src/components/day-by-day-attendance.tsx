"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { format, parseISO, eachDayOfInterval, isSameDay } from "date-fns";
import { AttendanceList } from "./attendance-list";
import { getAttendanceByEventId, getAttendanceStats } from "@/lib/actions";
import type { Attendance } from "@/lib/types";

interface DayByDayAttendanceProps {
  eventId: string;
  eventName: string;
  eventStartDate: string;
  eventEndDate: string;
  initialStatsByDate: { date: string; totalParticipants: number; checkedIn: number; notCheckedIn: number }[];
}

export function DayByDayAttendance({
  eventId,
  eventName,
  eventStartDate,
  eventEndDate,
  initialStatsByDate
}: DayByDayAttendanceProps) {
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [attendance, setAttendance] = React.useState<Attendance[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [stats, setStats] = React.useState<{ totalParticipants: number; checkedIn: number; notCheckedIn: number } | null>(null);

  // Generate all days between start and end date
  const eventDays = React.useMemo(() => {
    const start = parseISO(eventStartDate);
    const end = parseISO(eventEndDate);
    return eachDayOfInterval({ start, end });
  }, [eventStartDate, eventEndDate]);

  // Create a map of stats by date for quick lookup
  const statsByDateMap = React.useMemo(() => {
    const map = new Map<string, { totalParticipants: number; checkedIn: number; notCheckedIn: number }>();
    initialStatsByDate.forEach(stat => {
      map.set(stat.date, stat);
    });
    return map;
  }, [initialStatsByDate]);

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setLoading(true);
    
    try {
      const [attendanceData, statsData] = await Promise.all([
        getAttendanceByEventId(eventId, date),
        getAttendanceStats(eventId, date)
      ]);
      
      setAttendance(attendanceData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceRate = (date: string) => {
    const stats = statsByDateMap.get(date);
    if (!stats || stats.totalParticipants === 0) return 0;
    return Math.round((stats.checkedIn / stats.totalParticipants) * 100);
  };

  const getTotalAttendanceRate = () => {
    if (initialStatsByDate.length === 0) return 0;
    const totalCheckedIn = initialStatsByDate.reduce((sum, stat) => sum + stat.checkedIn, 0);
    const totalParticipants = initialStatsByDate[0]?.totalParticipants || 0;
    if (totalParticipants === 0) return 0;
    return Math.round((totalCheckedIn / (initialStatsByDate.length * totalParticipants)) * 100);
  };

  // Auto-select first day on component mount
  React.useEffect(() => {
    if (eventDays.length > 0 && !selectedDate) {
      const firstDay = format(eventDays[0], 'yyyy-MM-dd');
      handleDateSelect(firstDay);
    }
  }, [eventDays, selectedDate]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Day-by-Day Attendance
        </h2>
        <p className="text-muted-foreground mt-1">
          Track attendance for each day of the event
        </p>
      </div>

      {/* Event Days Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayStats = statsByDateMap.get(dateStr);
          const attendanceRate = getAttendanceRate(dateStr);
          const isToday = isSameDay(day, new Date());
          const isPast = day < new Date() && !isToday;
          const isFuture = day > new Date();

          return (
            <Card 
              key={dateStr} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedDate === dateStr 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : isToday 
                    ? 'border-green-200 bg-green-50' 
                    : isPast 
                      ? 'border-gray-200' 
                      : 'border-gray-100 bg-gray-50'
              }`}
              onClick={() => handleDateSelect(dateStr)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{format(day, 'EEEE, MMM dd')}</span>
                  {isToday && <Badge variant="secondary" className="text-xs">Today</Badge>}
                  {isFuture && <Badge variant="outline" className="text-xs">Future</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {dayStats ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Attendance Rate</span>
                      <span className="font-semibold text-green-600">{attendanceRate}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Present</span>
                      <span className="font-semibold">{dayStats.checkedIn}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Absent</span>
                      <span className="font-semibold text-red-600">{dayStats.notCheckedIn}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${attendanceRate}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      {isFuture ? 'No attendance yet' : 'No attendance recorded'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>


      {/* Selected Date Details */}
      {selectedDate && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              Attendance for {format(parseISO(selectedDate), 'EEEE, MMMM dd, yyyy')}
            </h3>
            {/* <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedDate(null)}
            >
              Close
            </Button> */}
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading attendance data...</p>
            </div>
          ) : (
            <>
              {stats && (
                // <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                //   <Card>
                //     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                //       <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                //       <Users className="h-4 w-4 text-muted-foreground" />
                //     </CardHeader>
                //     <CardContent>
                //       <div className="text-2xl font-bold">{stats.totalParticipants}</div>
                //     </CardContent>
                //   </Card>
                  
                //   <Card>
                //     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                //       <CardTitle className="text-sm font-medium">Present</CardTitle>
                //       <CheckCircle className="h-4 w-4 text-green-600" />
                //     </CardHeader>
                //     <CardContent>
                //       <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
                //       <p className="text-xs text-muted-foreground">
                //         {stats.totalParticipants > 0 ? Math.round((stats.checkedIn / stats.totalParticipants) * 100) : 0}% attendance rate
                //       </p>
                //     </CardContent>
                //   </Card>
                  
                //   <Card>
                //     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                //       <CardTitle className="text-sm font-medium">Absent</CardTitle>
                //       <XCircle className="h-4 w-4 text-red-600" />
                //     </CardHeader>
                //     <CardContent>
                //       <div className="text-2xl font-bold text-red-600">{stats.notCheckedIn}</div>
                //       <p className="text-xs text-muted-foreground">
                //         {stats.totalParticipants > 0 ? Math.round((stats.notCheckedIn / stats.totalParticipants) * 100) : 0}% absent
                //       </p>
                //     </CardContent>
                //   </Card>
                // </div>
                <AttendanceList 
                initialAttendance={attendance} 
                eventName={`${eventName} - ${format(parseISO(selectedDate), 'MMM dd, yyyy')}`}
              />
              )}
              
              
            </>
          )}
        </div>
      )}
    </div>
  );
}
