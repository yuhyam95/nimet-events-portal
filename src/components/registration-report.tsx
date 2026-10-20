"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ClipboardList, Download } from "lucide-react";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import { getRegistrationReport, type RegistrationReportRow } from "@/lib/actions";

interface RegistrationReportProps {
  eventId: string;
  eventName: string;
  eventStartDate: string;
  eventEndDate: string;
}

type View = "absent" | "attended" | "all";

export function RegistrationReport({ eventId, eventName, eventStartDate, eventEndDate }: RegistrationReportProps) {
  const eventDays = React.useMemo(
    () => eachDayOfInterval({ start: parseISO(eventStartDate), end: parseISO(eventEndDate) }).map(d => format(d, "yyyy-MM-dd")),
    [eventStartDate, eventEndDate]
  );

  const [attendanceDate, setAttendanceDate] = React.useState<string>(eventDays[0] ?? "");
  const [registeredOn, setRegisteredOn] = React.useState<string>("");
  const [view, setView] = React.useState<View>("absent");
  const [rows, setRows] = React.useState<RegistrationReportRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRegistrationReport(eventId, attendanceDate || undefined)
      .then(data => { if (!cancelled) setRows(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [eventId, attendanceDate]);

  const filtered = React.useMemo(() => {
    return rows.filter(r => {
      if (view === "absent" && r.attended) return false;
      if (view === "attended" && !r.attended) return false;
      if (registeredOn) {
        if (!r.registeredAt) return false;
        if (format(new Date(r.registeredAt), "yyyy-MM-dd") !== registeredOn) return false;
      }
      return true;
    });
  }, [rows, view, registeredOn]);

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = ["Name", "Organization", "Email", "Phone", "Registered On", "Status", "Attended"];
    const lines = filtered.map(r => [
      r.name, r.organization, r.email, r.phone,
      r.registeredAt ? format(new Date(r.registeredAt), "yyyy-MM-dd HH:mm") : "Date unknown",
      r.registrationStatus, r.attended ? "Yes" : "No",
    ].map(esc).join(","));
    const blob = new Blob([[header.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName.replace(/\s+/g, "_")}_${view}_${attendanceDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-4 w-4" />
          Registration Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Attendance day</label>
            <select
              id="report-attendance-day"
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={attendanceDate}
              onChange={e => setAttendanceDate(e.target.value)}
            >
              {eventDays.map(d => (
                <option key={d} value={d}>{format(parseISO(d), "EEE, MMM dd, yyyy")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Registered on (optional)</label>
            <div className="flex gap-2">
              <Input id="report-registered-on" type="date" value={registeredOn} onChange={e => setRegisteredOn(e.target.value)} />
              {registeredOn && <Button variant="outline" onClick={() => setRegisteredOn("")}>Clear</Button>}
            </div>
          </div>
          <div className="flex gap-2">
            {(["absent", "attended", "all"] as View[]).map(v => (
              <Button key={v} size="sm" variant={view === v ? "default" : "outline"} onClick={() => setView(v)}>
                {v === "absent" ? "Registered, not attended" : v === "attended" ? "Attended" : "All"}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0} className="md:ml-auto">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${filtered.length} of ${rows.length} registered participants`}
          {registeredOn && " · participants without a recorded registration date are hidden by the date filter"}
        </p>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Organization</th>
                <th className="p-2">Email</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Registered on</th>
                <th className="p-2">Attended</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-medium">{r.name}</td>
                  <td className="p-2">{r.organization}</td>
                  <td className="p-2">{r.email}</td>
                  <td className="p-2">{r.phone}</td>
                  <td className="p-2">
                    {r.registeredAt ? format(new Date(r.registeredAt), "MMM dd, yyyy HH:mm") : <span className="text-muted-foreground">Date unknown</span>}
                  </td>
                  <td className="p-2">
                    <Badge variant={r.attended ? "secondary" : "outline"}>{r.attended ? "Yes" : "No"}</Badge>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No participants match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
