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
import { Progress } from "@/components/ui/progress";
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
import { sendQRCodeToParticipant, sendQRCodesToAllParticipants, sendFollowUpToParticipant, sendFollowUpToAllParticipants } from "@/lib/actions";
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
  const [isFollowUpLoading, setIsFollowUpLoading] = React.useState(false);
  const [isBulkFollowUpLoading, setIsBulkFollowUpLoading] = React.useState(false);
  const [followUpMessage, setFollowUpMessage] = React.useState("");
  const [surveyLink, setSurveyLink] = React.useState("");
  const [qrCodeImage, setQrCodeImage] = React.useState<File | null>(null);
  const [showFollowUpDialog, setShowFollowUpDialog] = React.useState(false);
  const [selectedParticipants, setSelectedParticipants] = React.useState<Set<string>>(new Set());
  const [showProgressDialog, setShowProgressDialog] = React.useState(false);
  const [emailProgress, setEmailProgress] = React.useState({
    total: 0,
    sent: 0,
    failed: 0,
    current: "",
    errors: [] as string[]
  });
  const [showQRProgressDialog, setShowQRProgressDialog] = React.useState(false);
  const [qrProgress, setQrProgress] = React.useState({
    total: 0,
    sent: 0,
    failed: 0,
    current: "",
    errors: [] as string[]
  });
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
      "Position",
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

  const handleSendQRCodesToSelected = async () => {
    if (selectedParticipants.size === 0) {
      toast({
        title: "No Participants Selected",
        description: "Please select at least one participant to send QR codes to.",
        variant: "destructive",
      });
      return;
    }

    const selectedParticipantsList = participants.filter(p => selectedParticipants.has(p.id));
    
    // Initialize progress
    setQrProgress({
      total: selectedParticipantsList.length,
      sent: 0,
      failed: 0,
      current: "",
      errors: []
    });
    
    // Show progress dialog
    setShowQRProgressDialog(true);
    setIsBulkEmailLoading(true);

    try {
      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < selectedParticipantsList.length; i++) {
        const participant = selectedParticipantsList[i];
        
        // Update current participant being processed
        setQrProgress(prev => ({
          ...prev,
          current: `Sending QR code to ${participant.name} (${participant.contact})...`
        }));

        try {
          const result = await sendQRCodeToParticipant(participant.id, participant.eventId);
          if (result.success) {
            sent++;
            setQrProgress(prev => ({
              ...prev,
              sent: sent,
              current: `✓ QR code sent to ${participant.name}`
            }));
            
            // Update participant's qrEmailSent status locally
            setParticipants(prev => prev.map(p => 
              p.id === participant.id ? { ...p, qrEmailSent: true } : p
            ));
          } else {
            failed++;
            const errorMsg = `Failed to send QR code to ${participant.contact}: ${result.error || 'Unknown error'}`;
            errors.push(errorMsg);
            setQrProgress(prev => ({
              ...prev,
              failed: failed,
              errors: [...prev.errors, errorMsg],
              current: `✗ Failed to send QR code to ${participant.name}`
            }));
          }
        } catch (error) {
          failed++;
          const errorMsg = `Failed to send QR code to ${participant.contact}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          setQrProgress(prev => ({
            ...prev,
            failed: failed,
            errors: [...prev.errors, errorMsg],
            current: `✗ Failed to send QR code to ${participant.name}`
          }));
        }

        // Add a small delay between emails to show progress
        if (i < selectedParticipantsList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Final update
      setQrProgress(prev => ({
        ...prev,
        current: `Completed! ${sent} sent, ${failed} failed`
      }));

      // Show completion toast
      setTimeout(() => {
        toast({
          title: "QR Code Emails Sent",
          description: `QR codes sent to ${sent} of ${selectedParticipants.size} selected participants. ${failed > 0 ? `${failed} failed.` : ''}`,
        });
      }, 1000);

      // Clear selections after a delay
      setTimeout(() => {
        setSelectedParticipants(new Set());
        setShowQRProgressDialog(false);
      }, 3000);

    } catch (error) {
      setQrProgress(prev => ({
        ...prev,
        current: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
      
      setTimeout(() => {
        toast({
          title: "Error",
          description: "Failed to send QR codes. Please try again.",
          variant: "destructive",
        });
        setShowQRProgressDialog(false);
      }, 2000);
    } finally {
      setIsBulkEmailLoading(false);
    }
  };

  const handleSendFollowUpEmail = async (participant: Participant) => {
    setIsFollowUpLoading(true);
    try {
      const result = await sendFollowUpToParticipant(participant.id, participant.eventId, followUpMessage, surveyLink);
      if (result.success) {
        toast({
          title: "Thank You Email Sent",
          description: `Thank you email sent to ${participant.contact}`,
        });
        setFollowUpMessage("");
        setSurveyLink("");
        setShowFollowUpDialog(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send thank you email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send thank you email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleSelectParticipant = (participantId: string) => {
    setSelectedParticipants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(participantId)) {
        newSet.delete(participantId);
      } else {
        newSet.add(participantId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedParticipants.size === sortedAndFilteredParticipants.length) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(sortedAndFilteredParticipants.map(p => p.id)));
    }
  };

  const handleSendFollowUpToSelected = async () => {
    if (selectedParticipants.size === 0) {
      toast({
        title: "No Participants Selected",
        description: "Please select at least one participant to send thank you emails to.",
        variant: "destructive",
      });
      return;
    }

    const selectedParticipantsList = participants.filter(p => selectedParticipants.has(p.id));
    
    // Initialize progress
    setEmailProgress({
      total: selectedParticipantsList.length,
      sent: 0,
      failed: 0,
      current: "",
      errors: []
    });
    
    // Close the follow-up dialog and show progress dialog
    setShowFollowUpDialog(false);
    setShowProgressDialog(true);
    setIsBulkFollowUpLoading(true);

    try {
      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < selectedParticipantsList.length; i++) {
        const participant = selectedParticipantsList[i];
        
        // Update current participant being processed
        setEmailProgress(prev => ({
          ...prev,
          current: `Sending to ${participant.name} (${participant.contact})...`
        }));

        try {
          const result = await sendFollowUpToParticipant(participant.id, participant.eventId, followUpMessage, surveyLink, qrCodeImage || undefined);
          if (result.success) {
            sent++;
            setEmailProgress(prev => ({
              ...prev,
              sent: sent,
              current: `✓ Sent to ${participant.name}`
            }));
          } else {
            failed++;
            const errorMsg = `Failed to send to ${participant.contact}: ${result.error || 'Unknown error'}`;
            errors.push(errorMsg);
            setEmailProgress(prev => ({
              ...prev,
              failed: failed,
              errors: [...prev.errors, errorMsg],
              current: `✗ Failed to send to ${participant.name}`
            }));
          }
        } catch (error) {
          failed++;
          const errorMsg = `Failed to send to ${participant.contact}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          setEmailProgress(prev => ({
            ...prev,
            failed: failed,
            errors: [...prev.errors, errorMsg],
            current: `✗ Failed to send to ${participant.name}`
          }));
        }

        // Add a small delay between emails to show progress
        if (i < selectedParticipantsList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Final update
      setEmailProgress(prev => ({
        ...prev,
        current: `Completed! ${sent} sent, ${failed} failed`
      }));

      // Show completion toast
      setTimeout(() => {
        toast({
          title: "Thank You Emails Sent",
          description: `Thank you emails sent to ${sent} of ${selectedParticipants.size} selected participants. ${failed > 0 ? `${failed} failed.` : ''}`,
        });
      }, 1000);

      // Clear form and selections after a delay
      setTimeout(() => {
        setFollowUpMessage("");
        setSurveyLink("");
        setQrCodeImage(null);
        setSelectedParticipants(new Set());
        setShowProgressDialog(false);
      }, 3000);

    } catch (error) {
      setEmailProgress(prev => ({
        ...prev,
        current: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
      
      setTimeout(() => {
        toast({
          title: "Error",
          description: "Failed to send thank you emails. Please try again.",
          variant: "destructive",
        });
        setShowProgressDialog(false);
      }, 2000);
    } finally {
      setIsBulkFollowUpLoading(false);
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
    <TableHead className="bg-green-50">
        <Button variant="ghost" onClick={() => handleSort(sortKey)} className="bg-green-50 hover:bg-green-100">
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
        <Card key={participant.id} className={selectedParticipants.has(participant.id) ? "ring-2 ring-blue-500" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedParticipants.has(participant.id)}
                onChange={() => handleSelectParticipant(participant.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            <CardTitle>{participant.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <span className="font-semibold">Organization: </span>
              {participant.organization}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Position: </span>
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
              variant="default"
              size="sm"
                className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              onClick={() => handleGenerateTag(participant)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Flyer
            </Button>
              <Button
                variant="default"
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                onClick={() => handleGenerateQRCode(participant)}
              >
                <QrCode className="mr-2 h-4 w-4" />
                View QR Code
              </Button>
              <Button
                variant="default"
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
            <TableRow className="bg-green-50">
              <TableHead className="bg-green-50">
                <input
                  type="checkbox"
                  checked={selectedParticipants.size === sortedAndFilteredParticipants.length && sortedAndFilteredParticipants.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </TableHead>
              <TableHead className="bg-green-50">S/N</TableHead>
              <SortableHeader sortKey="name">Name</SortableHeader>
              <SortableHeader sortKey="organization">Organization</SortableHeader>
              <SortableHeader sortKey="designation">Position</SortableHeader>
              <SortableHeader sortKey="contact">Contact</SortableHeader>
              <SortableHeader sortKey="phone">Phone</SortableHeader>
              <TableHead className="bg-green-50">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredParticipants.length > 0 ? (
              sortedAndFilteredParticipants.map((participant, index) => (
                <TableRow key={participant.id} className={selectedParticipants.has(participant.id) ? "bg-blue-50" : ""}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedParticipants.has(participant.id)}
                      onChange={() => handleSelectParticipant(participant.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{participant.name}</TableCell>
                  <TableCell>{participant.organization}</TableCell>
                  <TableCell>{participant.designation}</TableCell>
                  <TableCell className="text-muted-foreground">{participant.contact}</TableCell>
                  <TableCell className="text-muted-foreground">{participant.phone}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Button variant="default" size="sm" className="w-full bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium" onClick={() => handleGenerateTag(participant)}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Flyer
                    </Button>
                      <Button variant="default" size="sm" className="w-full bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium" onClick={() => handleGenerateQRCode(participant)}>
                        <QrCode className="mr-2 h-4 w-4" />
                        QR Code
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                <TableCell colSpan={8} className="h-24 text-center">
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
        <div className="flex items-center justify-between mt-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleSelectAll}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            {selectedParticipants.size === sortedAndFilteredParticipants.length ? "Deselect All" : "Select All"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedParticipants.size} of {sortedAndFilteredParticipants.length} selected
          </span>
        </div>
      </div>
      
      {/* Action buttons - horizontal row on both mobile and desktop */}
      <div className="flex items-center gap-2 py-4 overflow-x-auto">
        <Button
          variant="default"
          size="sm"
          onClick={toggleSortOrder}
          className="flex items-center gap-2 flex-shrink-0 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium"
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
          variant="default"
          size="sm"
          onClick={exportToCSV}
          className="flex items-center gap-2 flex-shrink-0 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleSendQRCodesToSelected}
          disabled={isBulkEmailLoading || selectedParticipants.size === 0}
          className="flex items-center gap-2 flex-shrink-0 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          {isBulkEmailLoading ? "Sending..." : `Send QR Codes (${selectedParticipants.size})`}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowFollowUpDialog(true)}
          disabled={isBulkFollowUpLoading || selectedParticipants.size === 0}
          className="flex items-center gap-2 flex-shrink-0 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mail className="h-4 w-4" />
          {isBulkFollowUpLoading ? "Sending..." : `Send Thank You Email (${selectedParticipants.size})`}
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
          <Button
            variant="default"
            size="sm"
            onClick={handleSelectAll}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            {selectedParticipants.size === sortedAndFilteredParticipants.length ? "Deselect All" : "Select All"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedParticipants.size} of {sortedAndFilteredParticipants.length} selected
          </span>
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
                variant="default" 
                onClick={() => {
                    if (generatedFlyer && selectedParticipant) {
                        downloadFlyer(generatedFlyer, `${selectedParticipant.name}-flyer.png`);
                    }
                }}
                disabled={!generatedFlyer}
                className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Printer className="mr-2 h-4 w-4" />
                Download PNG
            </Button>
            <Button onClick={() => setIsDialogOpen(false)} className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium">Close</Button>
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
                variant="default" 
                onClick={() => {
                    if (generatedQRCode && selectedQRParticipant) {
                        downloadQRCode(generatedQRCode, `${selectedQRParticipant.name}-qr-code.png`);
                    }
                }}
                disabled={!generatedQRCode}
                className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download className="mr-2 h-4 w-4" />
                Download PNG
            </Button>
            <Button onClick={() => setIsQRDialogOpen(false)} className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="text-accent" />
              Send Thank You Email
            </DialogTitle>
            <DialogDescription>
              Send a thank you message to {selectedParticipants.size} selected participant{selectedParticipants.size !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label htmlFor="followUpMessage" className="text-sm font-medium mb-2 block">
                Thank You Message (Optional)
              </label>
              <textarea
                id="followUpMessage"
                value={followUpMessage}
                onChange={(e) => setFollowUpMessage(e.target.value)}
                placeholder="Enter your thank you message here..."
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to send a general thank you message.
              </p>
            </div>
            <div>
              <label htmlFor="surveyLink" className="text-sm font-medium mb-2 block">
                Survey Form Link (Optional)
              </label>
              <input
                id="surveyLink"
                type="url"
                value={surveyLink}
                onChange={(e) => setSurveyLink(e.target.value)}
                placeholder=""
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add a survey link to collect feedback from participants.
              </p>
            </div>
            <div>
              <label htmlFor="qrCodeImage" className="text-sm font-medium mb-2 block">
                QR Code Image (Optional)
              </label>
              <input
                id="qrCodeImage"
                type="file"
                accept="image/*"
                onChange={(e) => setQrCodeImage(e.target.files?.[0] || null)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a QR code image that links to the survey form. This will be displayed below the survey button.
              </p>
              {qrCodeImage && (
                <div className="mt-2">
                  <p className="text-xs text-green-600">✓ {qrCodeImage.name} selected</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="default" 
              onClick={() => {
                setFollowUpMessage("");
                setSurveyLink("");
                setQrCodeImage(null);
                setShowFollowUpDialog(false);
                setSelectedQRParticipant(null);
              }}
              className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendFollowUpToSelected}
              disabled={isBulkFollowUpLoading}
              className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBulkFollowUpLoading ? "Sending..." : "Send Thank You"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProgressDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="text-accent" />
              Sending Thank You Emails
            </DialogTitle>
            <DialogDescription>
              Please wait while we send thank you emails to the selected participants.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{emailProgress.sent + emailProgress.failed} of {emailProgress.total}</span>
              </div>
              <Progress 
                value={emailProgress.total > 0 ? ((emailProgress.sent + emailProgress.failed) / emailProgress.total) * 100 : 0} 
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Sent: {emailProgress.sent}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Failed: {emailProgress.failed}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium text-gray-700">
                {emailProgress.current || "Preparing to send emails..."}
              </p>
            </div>

            {emailProgress.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-600">Errors:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {emailProgress.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="default" 
              onClick={() => setShowProgressDialog(false)}
              disabled={emailProgress.sent + emailProgress.failed < emailProgress.total}
              className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {emailProgress.sent + emailProgress.failed < emailProgress.total ? "Sending..." : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showQRProgressDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="text-accent" />
              Sending QR Code Emails
            </DialogTitle>
            <DialogDescription>
              Please wait while we send QR code emails to the selected participants.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{qrProgress.sent + qrProgress.failed} of {qrProgress.total}</span>
              </div>
              <Progress 
                value={qrProgress.total > 0 ? ((qrProgress.sent + qrProgress.failed) / qrProgress.total) * 100 : 0} 
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Sent: {qrProgress.sent}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Failed: {qrProgress.failed}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium text-gray-700">
                {qrProgress.current || "Preparing to send QR codes..."}
              </p>
            </div>

            {qrProgress.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-600">Errors:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {qrProgress.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="default" 
              onClick={() => setShowQRProgressDialog(false)}
              disabled={qrProgress.sent + qrProgress.failed < qrProgress.total}
              className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {qrProgress.sent + qrProgress.failed < qrProgress.total ? "Sending..." : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
