"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import {
  getInvitations,
  createInvitations,
  addInvitation,
  deleteInvitation,
  sendInvitationEmailAction,
} from "@/lib/actions";
import type { Invitation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Mail,
  QrCode,
  Trash2,
  UserPlus,
  Zap,
} from "lucide-react";

// ─── QR + Barcode Card ────────────────────────────────────────────────────────

function InvitationCodeCard({ invitation, eventName }: { invitation: Invitation; eventName: string }) {
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Strip hyphens for the barcode value (CODE128 friendly)
  const barcodeValue = invitation.code.replace(/-/g, "");

  useEffect(() => {
    // Generate QR code from local qrcode package
    QRCode.toDataURL(invitation.code, {
      width: 180,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#006B3E", light: "#FFFFFF" },
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [invitation.code]);

  useEffect(() => {
    // Generate barcode using locally installed jsbarcode
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, barcodeValue, {
          format: "CODE128",
          width: 1.8,
          height: 45,
          displayValue: false,
          lineColor: "#006B3E",
          background: "#FFFFFF",
          margin: 4,
        });
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
  }, [barcodeValue]);

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border shadow-sm">
      {/* QR Code */}
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt={`QR for ${invitation.code}`}
          id={`qr-${invitation.code}`}
          className="w-36 h-36 rounded"
        />
      ) : (
        <div className="w-36 h-36 bg-muted animate-pulse rounded" />
      )}

      {/* Barcode */}
      <svg ref={barcodeRef} className="w-full max-w-[180px]" />

      {/* Text code */}
      <p className="font-mono font-bold text-base tracking-[0.2em] text-primary border border-primary/20 bg-primary/5 px-3 py-1 rounded-md">
        {invitation.code}
      </p>

      {invitation.inviteeName && (
        <div className="text-center text-sm">
          <p className="font-semibold">{invitation.inviteeName}</p>
          {invitation.inviteeOrg && (
            <p className="text-xs text-muted-foreground">{invitation.inviteeOrg}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={handleCopy}
      title="Copy code"
    >
      {copied ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface InvitationManagerProps {
  eventId: string;
  eventName: string;
}

export function InvitationManager({ eventId, eventName }: InvitationManagerProps) {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bulk generate
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(10);
  const [customCodePrefix, setCustomCodePrefix] = useState('');
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  // Single add
  const [isSingleOpen, setIsSingleOpen] = useState(false);
  const [singleName, setSingleName] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [singleOrg, setSingleOrg] = useState("");
  const [singleCustomCode, setSingleCustomCode] = useState("");
  const [isAddingSingle, setIsAddingSingle] = useState(false);

  // View QR/barcode
  const [viewingInvitation, setViewingInvitation] = useState<Invitation | null>(null);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Email sending
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState("");

  const fetchInvitations = useCallback(async () => {
    setIsLoading(true);
    const data = await getInvitations(eventId);
    setInvitations(data);
    setIsLoading(false);
  }, [eventId]);

  const handleSendEmail = async (inv: Invitation) => {
    if (!inv.inviteeEmail) return;
    setSendingEmailId(inv.id);
    const result = await sendInvitationEmailAction(inv.id);
    setSendingEmailId(null);

    if (!result.success) {
      toast({ variant: "destructive", title: "Failed to Send Email", description: result.error });
      return;
    }

    toast({ title: "Email Sent!", description: `Invitation sent to ${inv.inviteeEmail}` });
  };

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleBulkGenerate = async () => {
    setIsBulkGenerating(true);
    const result = await createInvitations(eventId, bulkCount, customCodePrefix.trim() || undefined);
    setIsBulkGenerating(false);

    if (!result.success) {
      toast({ variant: "destructive", title: "Error", description: result.error });
      return;
    }

    toast({
      title: `${bulkCount} Codes Generated`,
      description: "New invitation codes are ready.",
    });
    setIsBulkOpen(false);
    setCustomCodePrefix('');
    fetchInvitations();
  };

  const handleAddSingle = async () => {
    setIsAddingSingle(true);
    const result = await addInvitation(eventId, {
      inviteeName: singleName,
      inviteeEmail: singleEmail,
      inviteeOrg: singleOrg,
      customCode: singleCustomCode,
    });
    setIsAddingSingle(false);

    if (!result.success) {
      toast({ variant: "destructive", title: "Error", description: result.error });
      return;
    }

    toast({ title: "Invitation Added", description: `Code: ${result.invitation?.code}` });
    setSingleName("");
    setSingleEmail("");
    setSingleOrg("");
    setSingleCustomCode("");
    setIsSingleOpen(false);
    fetchInvitations();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const result = await deleteInvitation(deletingId);
    setDeletingId(null);

    if (!result.success) {
      toast({ variant: "destructive", title: "Error", description: result.error });
      return;
    }

    toast({ title: "Invitation Deleted" });
    fetchInvitations();
  };

  const handleDownloadCSV = () => {
    const rows = [
      ["Code", "Invitee Name", "Invitee Email", "Organization", "Status", "Created At"],
      ...invitations.map((inv) => [
        inv.code,
        inv.inviteeName || "",
        inv.inviteeEmail || "",
        inv.inviteeOrg || "",
        inv.isUsed ? "Used" : "Unused",
        inv.createdAt,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName.replace(/\s+/g, "_")}_invitations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = (inv: Invitation) => {
    const qrImg = document.getElementById(`qr-${inv.code}`) as HTMLImageElement | null;
    const printWin = window.open("", "_blank", "width=420,height=560");
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invitation - ${inv.code}</title>
        <style>
          body { font-family: monospace; text-align: center; padding: 24px; }
          h3 { font-size: 13px; margin-bottom: 4px; }
          .code { font-size: 22px; font-weight: bold; letter-spacing: 6px; color: #006B3E; margin: 12px 0; border: 2px solid #006B3E; display: inline-block; padding: 6px 16px; border-radius: 6px; }
          .note { font-size: 11px; color: #888; margin-top: 12px; }
          img { width: 160px; height: 160px; }
        </style>
      </head>
      <body>
        <h3>${eventName}</h3>
        ${qrImg ? `<img src="${qrImg.src}" alt="QR Code" />` : ""}
        <br/>
        <span class="code">${inv.code}</span>
        ${inv.inviteeName ? `<p style="font-size:13px;margin:4px 0">${inv.inviteeName}</p>` : ""}
        ${inv.inviteeOrg ? `<p style="font-size:11px;color:#555">${inv.inviteeOrg}</p>` : ""}
        <p class="note">Present this code at the event registration desk</p>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); printWin.close(); }, 400);
  };

  const filtered = invitations.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.code.toLowerCase().includes(q) ||
      (inv.inviteeName || "").toLowerCase().includes(q) ||
      (inv.inviteeEmail || "").toLowerCase().includes(q)
    );
  });

  const usedCount = invitations.filter((i) => i.isUsed).length;
  const unusedCount = invitations.length - usedCount;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-3">
          <p className="text-2xl font-bold">{invitations.length}</p>
          <p className="text-xs text-muted-foreground">Total Codes</p>
        </Card>
        <Card className="text-center p-3 bg-green-50">
          <p className="text-2xl font-bold text-green-700">{unusedCount}</p>
          <p className="text-xs text-muted-foreground">Unused</p>
        </Card>
        <Card className="text-center p-3 bg-blue-50">
          <p className="text-2xl font-bold text-blue-700">{usedCount}</p>
          <p className="text-xs text-muted-foreground">Redeemed</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button id="bulk-generate-btn" onClick={() => setIsBulkOpen(true)}>
          <Zap className="h-4 w-4 mr-2" />
          Bulk Generate
        </Button>
        <Button id="add-single-btn" variant="outline" onClick={() => setIsSingleOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Single
        </Button>
        <Button
          id="download-csv-btn"
          variant="outline"
          onClick={handleDownloadCSV}
          disabled={invitations.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search codes or names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Empty state */}
      {invitations.length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center space-y-3">
            <QrCode className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No invitation codes yet.</p>
            <p className="text-xs text-muted-foreground">
              Sample format:{" "}
              <span className="font-mono font-bold text-primary tracking-widest">
                NMT-A3X-9F2B
              </span>
            </p>
            <Button onClick={() => setIsBulkOpen(true)}>
              <Zap className="h-4 w-4 mr-2" />
              Generate Codes Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {(isLoading || filtered.length > 0) && (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Invitee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inv) => (
                  <TableRow key={inv.id} className={inv.isUsed ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-semibold text-sm text-primary tracking-widest">
                          {inv.code}
                        </span>
                        <CopyButton text={inv.code} />
                      </div>
                    </TableCell>
                    <TableCell>
                      {inv.inviteeName ? (
                        <div className="text-sm">
                          <p className="font-medium">{inv.inviteeName}</p>
                          {inv.inviteeEmail && (
                            <p className="text-xs text-muted-foreground">{inv.inviteeEmail}</p>
                          )}
                          {inv.inviteeOrg && (
                            <p className="text-xs text-muted-foreground">{inv.inviteeOrg}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">
                          Open invitation
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={inv.isUsed ? "secondary" : "default"}
                        className={
                          inv.isUsed
                            ? ""
                            : "bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
                        }
                      >
                        {inv.isUsed ? "Used" : "Unused"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {inv.inviteeEmail && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700"
                            title="Send Invitation Email"
                            disabled={sendingEmailId === inv.id}
                            onClick={() => handleSendEmail(inv)}
                          >
                            {sendingEmailId === inv.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="View QR & Barcode"
                          onClick={() => setViewingInvitation(inv)}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        {!inv.isUsed && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete"
                            onClick={() => setDeletingId(inv.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── Bulk Generate Dialog ──────────────────────────────────────── */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Generate Invitation Codes</DialogTitle>
            <DialogDescription>
              Each code follows the format{" "}
              <span className="font-mono font-bold text-primary">NMT-XXX-XXXX</span> — unique to
              each invitee and one-use only.
            </DialogDescription>
          </DialogHeader>

          {/* Sample preview */}
          <div className="bg-muted/40 rounded-lg p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sample Codes
            </p>
            <div className="flex flex-wrap gap-2">
              {["NMT-A3X-9F2B", "NMT-B7K-3MNP", "NMT-H2R-5QWZ"].map((c) => (
                <span
                  key={c}
                  className="font-mono text-xs bg-white border rounded px-2 py-1 text-primary font-bold tracking-widest"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Number of codes to generate</label>
            <div className="flex gap-2 items-center">
              <Input
                id="bulk-count-input"
                type="number"
                min={1}
                max={500}
                value={bulkCount}
                onChange={(e) =>
                  setBulkCount(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))
                }
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">max 500 per batch</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {[10, 25, 50, 100].map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkCount(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Custom Code Prefix{" "}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="bulk-prefix-input"
              placeholder="e.g. AIC, CONF, EVT — defaults to NMT"
              value={customCodePrefix}
              onChange={(e) => setCustomCodePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Generated code will look like:{" "}
              <span className="font-mono font-bold text-primary">
                {(customCodePrefix || 'NMT').toUpperCase()}-A3X-9F2B
              </span>
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkOpen(false)}>
              Cancel
            </Button>
            <Button
              id="confirm-bulk-btn"
              onClick={handleBulkGenerate}
              disabled={isBulkGenerating}
            >
              {isBulkGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate {bulkCount} Codes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Single Dialog ─────────────────────────────────────────── */}
      <Dialog open={isSingleOpen} onOpenChange={setIsSingleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Single Invitation</DialogTitle>
            <DialogDescription>
              Optionally pre-fill the invitee&apos;s details. When they enter their code at
              registration, these fields will auto-populate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">
                Custom Code <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="single-custom-code-input"
                placeholder="e.g. AIC2026-VIP — leave blank to auto-generate"
                value={singleCustomCode}
                onChange={(e) => setSingleCustomCode(e.target.value.toUpperCase())}
                className="mt-1 font-mono tracking-wider"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to auto-generate a code like <span className="font-mono font-bold text-primary">NMT-A3X-9F2B</span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">
                Name <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="single-name-input"
                placeholder="e.g. Dr. Amina Ibrahim"
                value={singleName}
                onChange={(e) => setSingleName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Email <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="single-email-input"
                placeholder="e.g. amina@example.gov.ng"
                type="email"
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Organization <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="single-org-input"
                placeholder="e.g. Ministry of Aviation"
                value={singleOrg}
                onChange={(e) => setSingleOrg(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSingleOpen(false)}>
              Cancel
            </Button>
            <Button
              id="confirm-single-btn"
              onClick={handleAddSingle}
              disabled={isAddingSingle}
            >
              {isAddingSingle ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── View QR + Barcode Dialog ──────────────────────────────────── */}
      <Dialog
        open={!!viewingInvitation}
        onOpenChange={(open) => !open && setViewingInvitation(null)}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Invitation Pass</DialogTitle>
            <DialogDescription>
              Invitee can scan the QR or barcode, or type the code manually at registration.
            </DialogDescription>
          </DialogHeader>

          {viewingInvitation && (
            <div className="flex flex-col items-center gap-3">
              <InvitationCodeCard
                invitation={viewingInvitation}
                eventName={eventName}
              />
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(viewingInvitation.code);
                    toast({ title: "Code copied!" });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => handlePrint(viewingInvitation)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ───────────────────────────────────────── */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invitation Code?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The code will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
