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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpDown,
  Search,
  Sparkles,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Participant } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateFlyer, downloadFlyer } from "@/lib/flyer-generator";
import { format, parseISO } from "date-fns";

type SortKey = keyof Participant;

export function ParticipantList({
  initialParticipants,
}: {
  initialParticipants: (Participant & { eventName: string; eventStartDate: string; eventEndDate: string; eventTheme: string; eventLocation: string })[];
}) {
  const [participants, setParticipants] = React.useState(initialParticipants);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedParticipant, setSelectedParticipant] = React.useState<Participant | null>(null);
  const [generatedFlyer, setGeneratedFlyer] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSort = (key: SortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredParticipants = React.useMemo(() => {
    let sortableItems = [...participants];
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

    return sortableItems.filter((participant) =>
      Object.values(participant).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [participants, searchQuery, sortConfig]);

  const handleGenerateTag = async (participant: Participant & { eventName: string; eventStartDate: string; eventEndDate: string; eventTheme: string; eventLocation: string }) => {
    setSelectedParticipant(participant);
    setIsDialogOpen(true);
    setIsLoading(true);
    setGeneratedFlyer(null);
    try {
        // Format the event date
        const formattedDate = formatEventDate(participant.eventStartDate);
        const formattedEndDate = formatEventDate(participant.eventEndDate);
        
        const flyerDataUrl = await generateFlyer({
            eventName: participant.eventName,
            eventTheme: participant.eventTheme,
            eventStartDate: formattedDate,
            eventEndDate: formattedEndDate,
            eventLocation: participant.eventLocation,
            participantName: participant.name,
        });
        setGeneratedFlyer(flyerDataUrl);
    } catch(error) {
        console.error("Failed to generate flyer:", error);
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: "Could not generate the participant flyer. Please try again."
        })
        setIsDialogOpen(false);
    } finally {
        setIsLoading(false);
    }
  };

  // Helper function to format event date
  const formatEventDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      const day = date.getDate();
      const ordinalSuffix = getOrdinalSuffix(day);
      return format(date, `d'${ordinalSuffix}' MMMM, yyyy`);
    } catch (error) {
      return dateString;
    }
  };

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
      {sortedAndFilteredParticipants.map((participant) => (
        <Card key={participant.id}>
          <CardHeader>
            <CardTitle>{participant.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <span className="font-semibold">Organization: </span>
              {participant.organization}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Designation: </span>
              {participant.designation}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Contact: </span>
              {participant.contact}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Phone: </span>
              {participant.phone}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Event: </span>
              {participant.eventName}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={() => handleGenerateTag(participant)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Flyer
            </Button>
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
              <SortableHeader sortKey="organization">Organization</SortableHeader>
              <SortableHeader sortKey="designation">Designation</SortableHeader>
              <SortableHeader sortKey="contact">Contact</SortableHeader>
              <SortableHeader sortKey="phone">Phone</SortableHeader>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredParticipants.length > 0 ? (
              sortedAndFilteredParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">{participant.name}</TableCell>
                  <TableCell>{participant.organization}</TableCell>
                  <TableCell>{participant.designation}</TableCell>
                  <TableCell className="text-muted-foreground">{participant.contact}</TableCell>
                  <TableCell className="text-muted-foreground">{participant.phone}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleGenerateTag(participant)}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Flyer
                    </Button>
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

  return (
    <>
      <div className="flex items-center py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>
     
      {isMobile ? renderMobileList() : renderDesktopTable()}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Sparkles className="text-accent" />
                Generated Flyer for {selectedParticipant?.name}
            </DialogTitle>
            <DialogDescription>
                A personalized flyer for the participant with event details.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-96 w-full" />
                </div>
            ) : generatedFlyer && (
                <>
                    <div>
                        <h3 className="font-semibold mb-2">Flyer Preview</h3>
                        <div className="border rounded-lg p-4 bg-background text-center shadow-md">
                            <img 
                                src={generatedFlyer} 
                                alt="Generated Flyer" 
                                className="w-full h-auto max-h-96 object-contain mx-auto"
                            />
                        </div>
                    </div>
                </>
            )}
          </div>
          <DialogFooter>
            <Button 
                variant="outline" 
                onClick={() => {
                    if (generatedFlyer && selectedParticipant) {
                        downloadFlyer(generatedFlyer, `${selectedParticipant.name}-flyer.png`);
                    }
                }}
                disabled={!generatedFlyer}
            >
                <Printer className="mr-2 h-4 w-4" />
                Download PNG
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
