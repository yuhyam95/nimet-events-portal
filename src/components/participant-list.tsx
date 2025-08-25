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
import { generateParticipantTags } from "@/ai/flows/generate-tags";
import type { Participant } from "@/lib/types";
import type { GenerateParticipantTagsOutput } from "@/ai/flows/generate-tags";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

type SortKey = keyof Participant;

export function ParticipantList({
  initialParticipants,
}: {
  initialParticipants: Participant[];
}) {
  const [participants, setParticipants] = React.useState(initialParticipants);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>({ key: "name", direction: "ascending" });
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedParticipant, setSelectedParticipant] = React.useState<Participant | null>(null);
  const [generatedContent, setGeneratedContent] = React.useState<GenerateParticipantTagsOutput | null>(null);
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

  const handleGenerateTag = async (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsDialogOpen(true);
    setIsLoading(true);
    setGeneratedContent(null);
    try {
        const result = await generateParticipantTags({
            name: participant.name,
            organization: participant.organization,
            interests: participant.interests,
            contactDetails: participant.contact,
        });
        setGeneratedContent(result);
    } catch(error) {
        console.error("Failed to generate tags:", error);
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: "Could not generate the participant tag. Please try again."
        })
        setIsDialogOpen(false);
    } finally {
        setIsLoading(false);
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
              <span className="font-semibold text-foreground">Contact: </span>
              {participant.contact}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={() => handleGenerateTag(participant)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Tag
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
              <SortableHeader sortKey="contact">Contact</SortableHeader>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredParticipants.length > 0 ? (
              sortedAndFilteredParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">{participant.name}</TableCell>
                  <TableCell>{participant.organization}</TableCell>
                  <TableCell className="text-muted-foreground">{participant.contact}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleGenerateTag(participant)}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Tag
                    </Button>
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
                Generated Tag for {selectedParticipant?.name}
            </DialogTitle>
            <DialogDescription>
                AI-generated content for the participant's name tag and a personalized message.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                </div>
            ) : generatedContent && (
                <>
                    <div>
                        <h3 className="font-semibold mb-2">Tag Preview</h3>
                        <div className="border rounded-lg p-4 bg-background text-center shadow-md">
                            <pre className="text-lg font-bold whitespace-pre-wrap font-headline">{generatedContent.tagContent}</pre>
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">Personalized Message</h3>
                        <p className="text-muted-foreground italic border-l-4 border-primary pl-4 py-2">{generatedContent.personalizedMessage}</p>
                    </div>
                </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
