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
  ArrowUp,
  ArrowDown,
  Download,
  QrCode,
  Mail,
  Send,
} from "lucide-react";
import type { Participant } from "@/lib/types";
import { sendQRCodeToParticipant, sendQRCodesToAllParticipants } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateFlyer, downloadFlyer } from "@/lib/flyer-generator";
import { generateQRCode, downloadQRCode } from "@/lib/qr-generator";
import { format, parseISO } from "date-fns";

type SortKey = keyof Participant;

export function ParticipantList({
  initialParticipants,
}: {
  initialParticipants: (Participant & { eventName: string; eventStartDate: string; eventEndDate: string; eventTheme: string; eventLocation: string })[];
}) {
  const eventName = initialParticipants.length > 0 ? initialParticipants[0].eventName : "Event Participants";
  const [participants, setParticipants] = React.useState(initialParticipants);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>(null);
  const [sortOrder, setSortOrder] = React.useState<"ascending" | "descending">("ascending");
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedParticipant, setSelectedParticipant] = React.useState<Participant | null>(null);
  const [generatedFlyer, setGeneratedFlyer] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const [isQRDialogOpen, setIsQRDialogOpen] = React.useState(false);
  const [selectedQRParticipant, setSelectedQRParticipant] = React.useState<Participant | null>(null);
  const [generatedQRCode, setGeneratedQRCode] = React.useState<string | null>(null);
  const [isQRLoading, setIsQRLoading] = React.useState(false);
  const [isEmailLoading, setIsEmailLoading] = React.useState(false);
  const [isBulkEmailLoading, setIsBulkEmailLoading] = React.useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSort = (key: SortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "ascending" ? "descending" : "ascending";
    setSortOrder(newOrder);
    // Reverse the current participants array to change the order
    setParticipants([...participants].reverse());
  };

  const exportToCSV = () => {
    const headers = [
      "S/N",
      "Name",
      "Organization", 
      "Designation",
      "Contact",
      "Phone"
    ];

    const csvContent = [
      `"${eventName}"`,
      headers.join(","),
      ...sortedAndFilteredParticipants.map((participant, index) => [
        index + 1,
        `"${participant.name}"`,
        `"${participant.organization}"`,
        `"${participant.designation}"`,
        `"${participant.contact}"`,
        `"${participant.phone}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `participants-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Participants data has been exported to CSV file.",
    });
  };

  const handleGenerateQRCode = async (participant: Participant) => {
    setSelectedQRParticipant(participant);
    setIsQRDialogOpen(true);
    setIsQRLoading(true);
    setGeneratedQRCode(null);
    
    try {
      const qrCodeDataURL = await generateQRCode(participant.id);
      setGeneratedQRCode(qrCodeDataURL);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate the QR code. Please try again."
      });
      setIsQRDialogOpen(false);
    } finally {
      setIsQRLoading(false);
    }
  };

  const handleSendQRCodeEmail = async (participant: Participant) => {
    setIsEmailLoading(true);
    try {
      const result = await sendQRCodeToParticipant(participant.id, participant.eventId);
      if (result.success) {
        // Update the participant's qrEmailSent status locally
        setParticipants(prev => prev.map(p => 
          p.id === participant.id ? { ...p, qrEmailSent: true } : p
        ));
        
        toast({
          title: "Email Sent",
          description: `QR code sent to ${participant.contact}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send QR code email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send QR code email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleSendQRCodesToAll = async () => {
    if (participants.length === 0) {
      toast({
        title: "No Participants",
        description: "There are no participants to send QR codes to.",
        variant: "destructive",
      });
      return;
    }

    setIsBulkEmailLoading(true);
    try {
      const result = await sendQRCodesToAllParticipants(participants[0].eventId);
      if (result.success) {
        // Update all participants' qrEmailSent status locally
        // Note: This is a simplified approach - in a real app you might want to refresh from server
        setParticipants(prev => prev.map(p => ({ ...p, qrEmailSent: true })));
        
        toast({
          title: "Bulk Email Sent",
          description: `QR codes sent to ${result.sent} of ${result.totalParticipants} participants. ${result.failed > 0 ? `${result.failed} failed.` : ''} Processed in ${result.batchesProcessed} batches.`,
        });
        
        if (result.errors.length > 0) {
          console.error("Email errors:", result.errors);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to send QR codes to participants",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send QR codes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkEmailLoading(false);
    }
  };

  const sortedAndFilteredParticipants = React.useMemo(() => {
    let sortableItems = [...participants];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
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
    <div className="space-y-4 w-full min-w-0">
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
            <div className="flex flex-col gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleGenerateTag(participant)}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Flyer
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleGenerateQRCode(participant)}
              >
                <QrCode className="mr-2 h-4 w-4" />
                View QR Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleSendQRCodeEmail(participant)}
                disabled={isEmailLoading}
              >
                <Mail className="mr-2 h-4 w-4" />
                {isEmailLoading ? "..." : participant.qrEmailSent ? "Resend QR" : "Send QR"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderDesktopTable = () => (
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>S/N</TableHead>
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
              sortedAndFilteredParticipants.map((participant, index) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{participant.name}</TableCell>
                  <TableCell>{participant.organization}</TableCell>
                  <TableCell>{participant.designation}</TableCell>
                  <TableCell className="text-muted-foreground">{participant.contact}</TableCell>
                  <TableCell className="text-muted-foreground">{participant.phone}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => handleGenerateTag(participant)}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Flyer
                      </Button>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => handleGenerateQRCode(participant)}>
                        <QrCode className="mr-2 h-4 w-4" />
                        QR Code
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleSendQRCodeEmail(participant)}
                        disabled={isEmailLoading}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        {isEmailLoading ? "..." : participant.qrEmailSent ? "Resend QR Code" : "Email QR Code"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
  )

  return (
    <div className="w-full min-w-0">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-headline">{eventName}</h2>
        <p className="text-muted-foreground mt-1">
          {sortedAndFilteredParticipants.length} participant{sortedAndFilteredParticipants.length !== 1 ? 's' : ''}
        </p>
      </div>
      {/* Search bar - full width on mobile, inline on desktop */}
      <div className="py-4 md:hidden">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      {/* Action buttons - horizontal row on both mobile and desktop */}
      <div className="flex items-center gap-2 py-4 overflow-x-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSortOrder}
          className="flex items-center gap-2 flex-shrink-0"
        >
          {sortOrder === "ascending" ? (
            <>
              <ArrowUp className="h-4 w-4" />
              Sort by Newest First
            </>
          ) : (
            <>
              <ArrowDown className="h-4 w-4" />
              Sort by Oldest First
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendQRCodesToAll}
          disabled={isBulkEmailLoading}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
          {isBulkEmailLoading ? "Sending..." : "Send QR Codes"}
        </Button>
      </div>
      
      {/* Desktop search bar - hidden on mobile */}
      <div className="hidden md:block py-4">
        <div className="flex items-center gap-4">
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

      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <QrCode className="text-accent" />
                QR Code for {selectedQRParticipant?.name}
            </DialogTitle>
            <DialogDescription>
                Scan this QR code to mark attendance for this participant.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {isQRLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-64 w-64 mx-auto" />
                </div>
            ) : generatedQRCode && (
                <>
                    <div>
                        <h3 className="font-semibold mb-2">QR Code</h3>
                        <div className="border rounded-lg p-4 bg-background text-center shadow-md">
                            <img 
                                src={generatedQRCode} 
                                alt="QR Code" 
                                className="w-64 h-64 mx-auto"
                            />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          Participant: {selectedQRParticipant?.name}<br/>
                          Organization: {selectedQRParticipant?.organization}
                        </p>
                    </div>
                </>
            )}
          </div>
          <DialogFooter>
            <Button 
                variant="outline" 
                onClick={() => {
                    if (generatedQRCode && selectedQRParticipant) {
                        downloadQRCode(generatedQRCode, `${selectedQRParticipant.name}-qr-code.png`);
                    }
                }}
                disabled={!generatedQRCode}
            >
                <Download className="mr-2 h-4 w-4" />
                Download PNG
            </Button>
            <Button onClick={() => setIsQRDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
