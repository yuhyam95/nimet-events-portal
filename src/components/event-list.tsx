
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Event } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, parseISO } from "date-fns";
import { deleteEvent, getEvents } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

type SortKey = keyof Event;

// Helper function to add ordinal suffix to day
const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

// Helper function to format date as "25th August, 2025"
const formatEventDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    const day = date.getDate();
    const ordinalSuffix = getOrdinalSuffix(day);
    return format(date, `d'${ordinalSuffix}' MMMM, yyyy`);
  } catch (error) {
    // Fallback to original date string if parsing fails
    return dateString;
  }
};

export function EventList() {
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = React.useState<Event[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>({ key: "name", direction: "ascending" });
  const [isAddEventOpen, setIsAddEventOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = React.useState<Event | null>(null);
  const isMobile = useIsMobile();

  // Fetch events on component mount
  React.useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const fetchedEvents = await getEvents();
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load events. Please refresh the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    setEditingEvent(null);
    // Refresh the events list to show the updated data
    fetchEvents();
  }

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    
    try {
      await deleteEvent(deletingEvent.id);
      toast({
        title: "Event Deleted!",
        description: "The event has been successfully deleted.",
      });
      setDeletingEvent(null);
      // Refresh the events list to show the updated data
      fetchEvents();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete the event. Please try again.",
      });
    }
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
              <span className="font-semibold">Start Date: </span>
              {formatEventDate(event.startDate)}
            </p>
            <p className="text-sm">
              <span className="font-semibold">End Date: </span>
              {formatEventDate(event.endDate)}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Location: </span>
              {event.location}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Status: </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                event.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {event.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
             <p className="text-sm text-muted-foreground pt-2">
              {event.description}
            </p>
            <div className="pt-2 space-y-2">
                {/* <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setEditingEvent(event)}
                >
                  Edit Event
                </Button> */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  asChild
                >
                  <Link href={`/admin/events/${event.id}/participants`}>
                    View Participants
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  asChild
                >
                  <Link href={`/admin/events/${event.id}/attendance`}>
                    View Attendance
                  </Link>
                </Button>
                {/* <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setDeletingEvent(event)}
                >
                  Delete Event
                </Button> */}
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
              <SortableHeader sortKey="startDate">Start Date</SortableHeader>
              <SortableHeader sortKey="endDate">End Date</SortableHeader>
              <SortableHeader sortKey="location">Location</SortableHeader>
              <SortableHeader sortKey="isActive">Status</SortableHeader>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredEvents.length > 0 ? (
              sortedAndFilteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{formatEventDate(event.startDate)}</TableCell>
                  <TableCell>{formatEventDate(event.endDate)}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {event.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingEvent(event)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/events/${event.id}/participants`}>
                              View Participants
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/events/${event.id}/attendance`}>
                              View Attendance
                            </Link>
                          </DropdownMenuItem>
                           <DropdownMenuItem 
                             className="text-destructive"
                             onClick={() => setDeletingEvent(event)}
                           >
                             Delete
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading events...</span>
      </div>
    );
  }

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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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

      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>
                    Update the event details below.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <EventForm onSuccess={onEventAdded} event={editingEvent || undefined} />
            </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingEvent} onOpenChange={(open) => !open && setDeletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event "{deletingEvent?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
