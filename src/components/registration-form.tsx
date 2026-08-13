"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { addParticipant, markAttendance, lookupInvitationCode } from "@/lib/actions";
import type { Event, Invitation } from "@/lib/types";
import { Briefcase, Check, CheckCircle2, Loader2, QrCode, Search, UserCheck, Users, Video, X } from "lucide-react";

type ParticipantCategory = "invited_guest" | "nimet_staff" | "media_personality" | "";

const CATEGORY_LABELS: Record<string, string> = {
  invited_guest: "Invited Guest",
  nimet_staff: "NiMet Staff",
  media_personality: "Media Personality",
};

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  organization: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  contact: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(6, {
    message: "Please enter a valid phone number with country code.",
  }),
  isMediaPersonnel: z.boolean().default(false).optional(),
  mealPreference: z.string().optional(),
  invitationCode: z.string().optional(),
  participantCategory: z.enum(["invited_guest", "nimet_staff", "media_personality"]).optional(),
});

export function RegistrationForm({
  eventId,
  event,
  onSuccessfulOnboarding,
}: {
  eventId: string;
  event?: Event;
  onSuccessfulOnboarding?: () => void;
}) {
  const { toast } = useToast();
  const router = useRouter();

  // Category state
  const [selectedCategory, setSelectedCategory] = useState<ParticipantCategory>("");

  // Invitation code state — only used for Invited Guests
  const [codeInput, setCodeInput] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verifiedInvitation, setVerifiedInvitation] = useState<Invitation | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      organization: "",
      designation: "",
      department: "",
      position: "",
      contact: "",
      phone: "",
      isMediaPersonnel: false,
      mealPreference: "",
      invitationCode: "",
    },
  });

  // Verify the typed/scanned invitation code
  const handleVerifyCode = useCallback(async (code?: string) => {
    const codeToVerify = (code ?? codeInput).trim().toUpperCase();
    if (!codeToVerify) {
      setCodeError("Please enter an invitation code.");
      return;
    }

    setIsVerifyingCode(true);
    setCodeError(null);

    const result = await lookupInvitationCode(eventId, codeToVerify);
    setIsVerifyingCode(false);

    if (!result.found || !result.invitation) {
      setCodeError(result.error || "Invalid or unrecognised code. Please check and try again.");
      setVerifiedInvitation(null);
      return;
    }

    const inv = result.invitation;
    setVerifiedInvitation(inv);
    setCodeError(null);

    // Auto-populate form fields from invitation data
    if (inv.inviteeName) form.setValue("name", inv.inviteeName, { shouldValidate: true });
    if (inv.inviteeEmail) form.setValue("contact", inv.inviteeEmail, { shouldValidate: true });
    if (inv.inviteeOrg) form.setValue("organization", inv.inviteeOrg, { shouldValidate: true });

    toast({
      title: "✓ Code Verified",
      description: `Welcome${inv.inviteeName ? `, ${inv.inviteeName}` : ""}! Your details have been pre-filled.`,
    });
  }, [codeInput, eventId, form, toast]);

  const clearVerifiedCode = () => {
    setVerifiedInvitation(null);
    setCodeInput("");
    setCodeError(null);
    form.setValue("name", "");
    form.setValue("contact", "");
    form.setValue("organization", "");
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val as ParticipantCategory);
    // Clear code state if switching away from Invited Guest
    if (val !== "invited_guest") {
      clearVerifiedCode();
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // For Invited Guests on invitation-only events, require a verified code
    if (selectedCategory === "invited_guest" && event?.isInvitationOnly && !onSuccessfulOnboarding) {
      if (!verifiedInvitation) {
        toast({
          variant: "destructive",
          title: "Invitation Code Required",
          description: "Please enter and verify your invitation code before registering.",
        });
        return;
      }
    }

    const isMedia = selectedCategory === "media_personality";

    const result = await addParticipant({
      ...values,
      contact: values.contact.toLowerCase().trim(),
      eventId,
      isMediaPersonnel: isMedia,
      participantCategory: selectedCategory || undefined,
      skipDuplicateCheck: !!onSuccessfulOnboarding,
      onboardedBy: !!onSuccessfulOnboarding ? "Admin" : undefined,
      invitationId: verifiedInvitation?.id,
    });

    if (result.success) {
      if (onSuccessfulOnboarding) {
        if (result.participantId) {
          try {
            await markAttendance(result.participantId, eventId, new Date().toISOString().split("T")[0], "Admin");
          } catch (e) {
            console.error("Failed to auto-mark attendance", e);
          }
        }

        toast({
          title: "Registration Successful",
          description: "Participant has been successfully registered and attendance marked.",
        });
        form.reset();
        setSelectedCategory("");
        clearVerifiedCode();
        onSuccessfulOnboarding();
        return;
      }

      const successUrl = `/register/success?eventId=${eventId}&participantId=${result.participantId || "new"}`;
      router.push(successUrl);
    } else {
      const errorMessage = result.error || "Could not complete your registration. Please try again.";

      if (errorMessage.includes("email address has already registered")) {
        toast({
          variant: "destructive",
          title: "Email Already Registered",
          description: "This email address has already been used to register for this event.",
        });
      } else if (errorMessage.includes("phone number has already registered")) {
        toast({
          variant: "destructive",
          title: "Phone Number Already Registered",
          description: "This phone number has already been used to register for this event.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: errorMessage,
        });
      }
    }
  }

  const hasFoodMenu = event?.foodMenu && event.foodMenu.length > 0;
  const showForm = !!selectedCategory;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">

        {/* ─── Step 1: Participant Category (RGIS-guided Design) ─────── */}
        <div className="bg-[#EBF7EE] p-6 rounded-3xl border border-[#D1EBE0] shadow-sm space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#006B3E] text-white flex items-center justify-center shadow-sm shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Choose Attendance Category</h3>
              <p className="text-sm text-gray-600 font-medium mt-0.5">
                Select your category to continue with registration.
              </p>
            </div>
          </div>

          {/* 3 Interactive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Invited Guest */}
            <button
              type="button"
              onClick={() => handleCategoryChange("invited_guest")}
              className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${
                selectedCategory === "invited_guest"
                  ? "bg-white border-[#005691] shadow-md ring-2 ring-[#005691]/20"
                  : "bg-white border-transparent hover:border-gray-200 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selectedCategory === "invited_guest"
                      ? "bg-[#005691] text-white shadow-sm"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-extrabold text-base text-gray-900 leading-tight">
                    Invited Guest
                  </p>
                  <p className="text-xs text-gray-500 font-medium mt-1 leading-snug">
                    Official invitation holders
                  </p>
                </div>
              </div>
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ml-2 ${
                  selectedCategory === "invited_guest"
                    ? "bg-[#005691] text-white shadow-sm"
                    : "border-2 border-gray-300 bg-white"
                }`}
              >
                {selectedCategory === "invited_guest" && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
            </button>

            {/* 2. NiMet Staff */}
            <button
              type="button"
              onClick={() => handleCategoryChange("nimet_staff")}
              className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${
                selectedCategory === "nimet_staff"
                  ? "bg-white border-[#005691] shadow-md ring-2 ring-[#005691]/20"
                  : "bg-white border-transparent hover:border-gray-200 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selectedCategory === "nimet_staff"
                      ? "bg-[#005691] text-white shadow-sm"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-extrabold text-base text-gray-900 leading-tight">
                    NiMet Staff
                  </p>
                  <p className="text-xs text-gray-500 font-medium mt-1 leading-snug">
                    Nigerian Meteorological Agency
                  </p>
                </div>
              </div>
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ml-2 ${
                  selectedCategory === "nimet_staff"
                    ? "bg-[#005691] text-white shadow-sm"
                    : "border-2 border-gray-300 bg-white"
                }`}
              >
                {selectedCategory === "nimet_staff" && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
            </button>

            {/* 3. Media Personality */}
            <button
              type="button"
              onClick={() => handleCategoryChange("media_personality")}
              className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between cursor-pointer ${
                selectedCategory === "media_personality"
                  ? "bg-white border-[#005691] shadow-md ring-2 ring-[#005691]/20"
                  : "bg-white border-transparent hover:border-gray-200 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selectedCategory === "media_personality"
                      ? "bg-[#005691] text-white shadow-sm"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Video className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-extrabold text-base text-gray-900 leading-tight">
                    Media Personality
                  </p>
                  <p className="text-xs text-gray-500 font-medium mt-1 leading-snug">
                    Accredited press & media
                  </p>
                </div>
              </div>
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ml-2 ${
                  selectedCategory === "media_personality"
                    ? "bg-[#005691] text-white shadow-sm"
                    : "border-2 border-gray-300 bg-white"
                }`}
              >
                {selectedCategory === "media_personality" && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>

        {/* Currently Selected Banner */}
        {selectedCategory && (
          <div className="bg-[#EBF3FA] border border-[#D0E2F4] text-[#004B82] p-4 rounded-2xl flex items-center gap-3 font-semibold text-sm animate-in fade-in duration-200 shadow-xs">
            <CheckCircle2 className="h-5 w-5 text-[#005691] shrink-0" />
            <span>
              Currently selected:{" "}
              <strong className="font-black text-[#003761]">{CATEGORY_LABELS[selectedCategory]}</strong>
            </span>
          </div>
        )}

        {/* ─── Step 2: Invitation Code (Invited Guests only) ────────── */}
        {showForm && selectedCategory === "invited_guest" && (
          <div className="rounded-lg border-2 border-dashed border-primary/30 p-5 bg-primary/5 space-y-3">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <p className="font-semibold text-base">Enter Your Invitation Code</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter the unique code from your invitation letter or scan the QR/barcode. Your details will be auto-filled.
            </p>

            {verifiedInvitation ? (
              /* Verified state */
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-green-800 text-sm">Code Verified ✓</p>
                  <p className="text-xs text-green-700 font-mono">{verifiedInvitation.code}</p>
                  {verifiedInvitation.inviteeName && (
                    <p className="text-xs text-green-700 mt-0.5">Details pre-filled for <strong>{verifiedInvitation.inviteeName}</strong></p>
                  )}
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={clearVerifiedCode} className="h-7 w-7">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              /* Code entry state */
              <div className="flex gap-2">
                <Input
                  id="invitationCodeInput"
                  placeholder="e.g. NMT-A3X-9F2B"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase());
                    setCodeError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleVerifyCode();
                    }
                  }}
                  className={`font-mono tracking-widest ${codeError ? "border-destructive" : ""}`}
                />
                <Button
                  type="button"
                  variant="default"
                  onClick={() => handleVerifyCode()}
                  disabled={isVerifyingCode || !codeInput.trim()}
                >
                  {isVerifyingCode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-1 hidden sm:inline">Verify</span>
                </Button>
              </div>
            )}

            {codeError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <X className="h-3 w-3" /> {codeError}
              </p>
            )}
          </div>
        )}

        {/* ─── Main Form Fields (shown once category is selected) ───── */}
        {showForm && (
          <>
            {/* Full Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Surname First" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+234 803 000 0000 or +1 555 000 0000"
                      type="tel"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    Include country code for international phone numbers (e.g. +234, +1, +44).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* External event fields (Organization, Position) */}
            {!event?.isInternal && (
              <>
                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of your organization" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position / Designation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Manager, Director, Officer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Internal event fields (Department, Position) */}
            {event?.isInternal && (
              <>
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department / Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. ICT, Human Resources" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. General Manager, Director" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Registering..." : "Register"}
            </Button>
          </>
        )}
      </form>
    </Form>
  );
}
