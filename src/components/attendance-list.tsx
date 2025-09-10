"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowUpDown,
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle,
} from "lucide-react";
import type { Attendance } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, parseISO } from "date-fns";

type SortKey = keyof Attendance;

export function AttendanceList({
  initialAttendance,
  eventName,
}: {
  initialAttendance: Attendance[];
  eventName: string;
}) {
  const [attendance, setAttendance] = React.useState(initialAttendance);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>({ key: "checkedInAt", direction: "descending" });
  
  const isMobile = useIsMobile();

  const handleSort = (key: SortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredAttendance = React.useMemo(() => {
    let sortableItems = [...attendance];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems.filter((record) =>
      Object.values(record).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [attendance, searchQuery, sortConfig]);

  const exportToCSV = () => {
    const headers = [
      "S/N",
      "Participant Name",
      "Organization", 
      "Checked In At"
    ];

    const csvContent = [
      `"${eventName} - Attendance"`,
      headers.join(","),
      ...sortedAndFilteredAttendance.map((record, index) => [
        index + 1,
        `"${record.participantName}"`,
        `"${record.participantOrganization}"`,
        `"${format(new Date(record.checkedInAt), 'MMM dd, yyyy HH:mm')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance-${eventName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortableHeader = ({ sortKey, children }: { sortKey: SortKey, children: React.ReactNode }) => (
    <TableHead>
        <Button variant="ghost" onClick={() => handleSort(sortKey)}>
        {children}
        {sortConfig?.key === sortKey ? (
            sortConfig.direction === "ascending" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
            <ChevronDown className="ml-2 h-4 w-4" />
            )
        ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
        </Button>
    </TableHead>
  );

  const renderMobileList = () => (
    <div className="space-y-4">
      {sortedAndFilteredAttendance.map((record, index) => (
        <Card key={record.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {record.participantName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <span className="font-semibold">Organization: </span>
              {record.participantOrganization}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Checked In: </span>
              {format(new Date(record.checkedInAt), 'MMM dd, yyyy HH:mm')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderDesktopTable = () => (
     <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S/N</TableHead>
              <SortableHeader sortKey="participantName">Participant Name</SortableHeader>
              <SortableHeader sortKey="participantOrganization">Organization</SortableHeader>
              <SortableHeader sortKey="checkedInAt">Checked In At</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredAttendance.length > 0 ? (
              sortedAndFilteredAttendance.map((record, index) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {record.participantName}
                  </TableCell>
                  <TableCell>{record.participantOrganization}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(record.checkedInAt), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No attendance records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
  )

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-headline">Attendance Records</h2>
        <p className="text-muted-foreground mt-1">
          {sortedAndFilteredAttendance.length} attendance record{sortedAndFilteredAttendance.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="flex items-center py-4 gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search attendance records..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
     
      {isMobile ? renderMobileList() : renderDesktopTable()}
    </>
  );
}
