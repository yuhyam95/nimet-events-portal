
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventForm } from "@/components/event-form";
import {
  ArrowUpDown,
  Search,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  PlusCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Event } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";

type SortKey = keyof Event;

export function EventList({
  events,
}: {
  events: Event[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>({ key: "name", direction: "ascending" });
  const [isAddEventOpen, setIsAddEventOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const handleSort = (key: SortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredEvents = React.useMemo(() => {
    let sortableItems = [...events];
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

    return sortableItems.filter((event) =>
      Object.values(event).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [events, searchQuery, sortConfig]);

  const onEventAdded = () => {
    setIsAddEventOpen(false);
    // Refresh the page to show the new event
    router.refresh();
  }

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
      {sortedAndFilteredEvents.map((event) => (
        <Card key={event.id}>
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <span className="font-semibold">Date: </span>
              {event.date}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Location: </span>
              {event.location}
            </p>
             <p className="text-sm text-muted-foreground pt-2">
              {event.description}
            </p>
            <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full">Edit Event</Button>
            </div>
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
              <SortableHeader sortKey="name">Name</SortableHeader>
              <SortableHeader sortKey="date">Date</SortableHeader>
              <SortableHeader sortKey="location">Location</SortableHeader>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredEvents.length > 0 ? (
              sortedAndFilteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>View Participants</DropdownMenuItem>
                           <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
  )

  return (
    <>
      <div className="flex items-center justify-between py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9"
          />
        </div>
         <Button onClick={() => setIsAddEventOpen(true)}>
            <PlusCircle />
            <span>Add Event</span>
        </Button>
      </div>
     
      {isMobile ? renderMobileList() : renderDesktopTable()}

      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add a New Event</DialogTitle>
                <DialogDescription>
                    Fill in the details below to create a new event.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <EventForm onSuccess={onEventAdded} />
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
