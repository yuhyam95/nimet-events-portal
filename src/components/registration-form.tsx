"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useCallback, useEffect, Suspense } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { addParticipant, markAttendance, lookupInvitationCode } from "@/lib/actions";
import type { Event, Invitation } from "@/lib/types";
import { Briefcase, Check, CheckCircle2, Loader2, Mic, QrCode, Search, ShieldCheck, UserCheck, UserPlus, Users, Video, X } from "lucide-react";

type ParticipantCategory =
  | "invited_delegate"
  | "alliance_member"
  | "speaker"
  | "additional"
  | "invited_guest"
  | "nimet_staff"
  | "media_personality"
  | "";

const CATEGORY_LABELS: Record<string, string> = {
  invited_delegate: "Invited delegates/participants",
  alliance_member: "Alliance Members",
  speaker: "Speakers",
  additional: "Additional",
  // Backward compatibility
  invited_guest: "Invited delegates/participants",
  nimet_staff: "Alliance Members",
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
  participantCategory: z.string().optional(),
});

function RegistrationFormInner({
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

  const [selectedCategory, setSelectedCategory] = useState<ParticipantCategory>("");
  const [isAutoRecognized, setIsAutoRecognized] = useState(false);

  const [codeInput, setCodeInput] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verifiedInvitation, setVerifiedInvitation] = useState<Invitation | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const searchParams = useSearchParams();

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

    if (inv.inviteeName) form.setValue("name", inv.inviteeName, { shouldValidate: true });
    if (inv.inviteeEmail) form.setValue("contact", inv.inviteeEmail, { shouldValidate: true });
    if (inv.inviteeOrg) form.setValue("organization", inv.inviteeOrg, { shouldValidate: true });

    toast({
      title: "✓ Code Verified",
      description: `Welcome${inv.inviteeName ? `, ${inv.inviteeName}` : ""}! Your details have been pre-filled.`,
    });
  }, [codeInput, eventId, form, toast]);

  useEffect(() => {
    if (!searchParams) return;

    const urlCode = searchParams.get("code") || searchParams.get("c") || "";
    const rawCat = (searchParams.get("g") || searchParams.get("reg") || searchParams.get("category") || searchParams.get("cat") || "").toLowerCase().trim();

    const isIv =
      rawCat === "iv" ||
      rawCat === "ivguest" ||
      rawCat === "invited_guest" ||
      rawCat === "guest" ||
      rawCat === "delegate" ||
      rawCat === "delegates" ||
      rawCat === "invited_delegate" ||
      rawCat === "invited_delegates" ||
      rawCat === "participant" ||
      rawCat === "participants" ||
      rawCat === "invited_participant" ||
      !!urlCode;

    const isAlliance =
      rawCat === "alliance" ||
      rawCat === "alliance_member" ||
      rawCat === "alliance_members" ||
      rawCat === "member" ||
      rawCat === "members" ||
      rawCat === "staff" ||
      rawCat === "nimet_staff";

    const isSpeaker =
      rawCat === "speaker" ||
      rawCat === "speakers" ||
      rawCat === "presenter" ||
      rawCat === "panelist";

    const isAdditional =
      rawCat === "additional" ||
      rawCat === "other" ||
      rawCat === "others" ||
      rawCat === "media" ||
      rawCat === "media_personality";

    if (isIv) {
      setSelectedCategory("invited_delegate");
      setIsAutoRecognized(true);
    } else if (isAlliance) {
      setSelectedCategory("alliance_member");
      setIsAutoRecognized(true);
    } else if (isSpeaker) {
      setSelectedCategory("speaker");
      setIsAutoRecognized(true);
    } else if (isAdditional) {
      setSelectedCategory("additional");
      setIsAutoRecognized(true);
    }

    if (urlCode) {
      setCodeInput(urlCode.toUpperCase());
      handleVerifyCode(urlCode);
    }
  }, [searchParams, handleVerifyCode]);

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
    if (val !== "invited_delegate" && val !== "invited_guest") {
      clearVerifiedCode();
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const isInvited = selectedCategory === "invited_delegate" || selectedCategory === "invited_guest";
    if (isInvited && event?.isInvitationOnly && !onSuccessfulOnboarding) {
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
          title: "Participant Added Successfully",
          description: `${values.name} has been registered and attendance marked.`,
        });
        onSuccessfulOnboarding();
        return;
      }

      toast({
        title: "Registration Successful!",
        description: "Your registration has been submitted. Check your email for your confirmation & QR code.",
      });

      if (event?.slug) {
        router.push(`/${event.slug}?registered=true`);
      } else {
        router.push(`/events`);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: result.error || "An error occurred while registering. Please try again.",
      });
    }
  }

  const showForm = !!selectedCategory;
  const isInvitedCategory = selectedCategory === "invited_delegate" || selectedCategory === "invited_guest";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">

        {/* ─── Step 1: Participant Category ─────── */}
        {isAutoRecognized ? (
          <div className="bg-[#F0F7F4] p-5 md:p-6 rounded-3xl border-2 border-[#006B3E] shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-[#006B3E] text-white flex items-center justify-center shadow-xs shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#006B3E]">Recognized Invitation Link</span>
                <h3 className="text-base md:text-lg font-black text-gray-900 leading-tight">
                  Welcome{verifiedInvitation?.inviteeName ? `, ${verifiedInvitation.inviteeName}` : ""}!
                </h3>
                <p className="text-xs text-gray-600 font-medium">
                  {verifiedInvitation
                    ? "Your invitation details have been verified and pre-filled below. Please review and complete registration."
                    : "Your attendance category has been automatically recognized."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAutoRecognized(false)}
              className="text-xs font-bold text-[#006B3E] hover:underline cursor-pointer"
            >
              Change category
            </button>
          </div>
        ) : (
          <div className="bg-[#EBF7EE] p-5 md:p-6 rounded-3xl border border-[#D1EBE0] shadow-xs space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-[#006B3E] text-white flex items-center justify-center shadow-xs shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Choose Attendance Category</h3>
                <p className="text-sm text-gray-600 font-medium mt-0.5">
                  Select your category to continue with registration.
                </p>
              </div>
            </div>

            {/* 4 Interactive Cards in a clean, spacious 2x2 grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {/* 1. Invited delegates/participants */}
              <button
                type="button"
                onClick={() => handleCategoryChange("invited_delegate")}
                className={`group w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-start gap-4 cursor-pointer relative ${
                  selectedCategory === "invited_delegate" || selectedCategory === "invited_guest"
                    ? "bg-white border-[#006B3E] shadow-md ring-2 ring-[#006B3E]/15"
                    : "bg-white/95 border-gray-200/90 hover:border-[#006B3E]/50 hover:bg-white hover:shadow-sm"
                }`}
              >
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selectedCategory === "invited_delegate" || selectedCategory === "invited_guest"
                      ? "bg-[#006B3E] text-white shadow-xs"
                      : "bg-[#EBF7EE] text-[#006B3E] group-hover:bg-[#006B3E] group-hover:text-white"
                  }`}
                >
                  <UserCheck className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="font-bold text-base text-gray-900 leading-snug">
                    Invited delegates / participants
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-1">
                    Official delegates, dignitaries & invited attendees
                  </p>
                </div>
                <div
                  className={`absolute top-4 right-4 h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    selectedCategory === "invited_delegate" || selectedCategory === "invited_guest"
                      ? "bg-[#006B3E] text-white ring-2 ring-[#006B3E]/20 scale-105"
                      : "border-2 border-gray-300 bg-white group-hover:border-[#006B3E]"
                  }`}
                >
                  {(selectedCategory === "invited_delegate" || selectedCategory === "invited_guest") && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </button>

              {/* 2. Alliance Members */}
              <button
                type="button"
                onClick={() => handleCategoryChange("alliance_member")}
                className={`group w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-start gap-4 cursor-pointer relative ${
                  selectedCategory === "alliance_member" || selectedCategory === "nimet_staff"
                    ? "bg-white border-[#006B3E] shadow-md ring-2 ring-[#006B3E]/15"
                    : "bg-white/95 border-gray-200/90 hover:border-[#006B3E]/50 hover:bg-white hover:shadow-sm"
                }`}
              >
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selectedCategory === "alliance_member" || selectedCategory === "nimet_staff"
                      ? "bg-[#006B3E] text-white shadow-xs"
                      : "bg-[#EBF7EE] text-[#006B3E] group-hover:bg-[#006B3E] group-hover:text-white"
                  }`}
                >
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="font-bold text-base text-gray-900 leading-snug">
                    Alliance Members
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-1">
                    Partner institutions, agencies & alliance representatives
                  </p>
                </div>
                <div
                  className={`absolute top-4 right-4 h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    selectedCategory === "alliance_member" || selectedCategory === "nimet_staff"
                      ? "bg-[#006B3E] text-white ring-2 ring-[#006B3E]/20 scale-105"
                      : "border-2 border-gray-300 bg-white group-hover:border-[#006B3E]"
                  }`}
                >
                  {(selectedCategory === "alliance_member" || selectedCategory === "nimet_staff") && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </button>

              {/* 3. Speakers */}
              <button
                type="button"
                onClick={() => handleCategoryChange("speaker")}
                className={`group w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-start gap-4 cursor-pointer relative ${
                  selectedCategory === "speaker"
                    ? "bg-white border-[#006B3E] shadow-md ring-2 ring-[#006B3E]/15"
                    : "bg-white/95 border-gray-200/90 hover:border-[#006B3E]/50 hover:bg-white hover:shadow-sm"
                }`}
              >
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selectedCategory === "speaker"
                      ? "bg-[#006B3E] text-white shadow-xs"
                      : "bg-[#EBF7EE] text-[#006B3E] group-hover:bg-[#006B3E] group-hover:text-white"
                  }`}
                >
                  <Mic className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="font-bold text-base text-gray-900 leading-snug">
                    Speakers
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-1">
                    Keynote speakers, presenters, session chairs & panelists
                  </p>
                </div>
                <div
                  className={`absolute top-4 right-4 h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    selectedCategory === "speaker"
                      ? "bg-[#006B3E] text-white ring-2 ring-[#006B3E]/20 scale-105"
                      : "border-2 border-gray-300 bg-white group-hover:border-[#006B3E]"
                  }`}
                >
                  {selectedCategory === "speaker" && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </button>

              {/* 4. Additional */}
              <button
                type="button"
                onClick={() => handleCategoryChange("additional")}
                className={`group w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-start gap-4 cursor-pointer relative ${
                  selectedCategory === "additional" || selectedCategory === "media_personality"
                    ? "bg-white border-[#006B3E] shadow-md ring-2 ring-[#006B3E]/15"
                    : "bg-white/95 border-gray-200/90 hover:border-[#006B3E]/50 hover:bg-white hover:shadow-sm"
                }`}
              >
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selectedCategory === "additional" || selectedCategory === "media_personality"
                      ? "bg-[#006B3E] text-white shadow-xs"
                      : "bg-[#EBF7EE] text-[#006B3E] group-hover:bg-[#006B3E] group-hover:text-white"
                  }`}
                >
                  <UserPlus className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="font-bold text-base text-gray-900 leading-snug">
                    Additional
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-1">
                    Accredited media, observers & general event attendees
                  </p>
                </div>
                <div
                  className={`absolute top-4 right-4 h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    selectedCategory === "additional" || selectedCategory === "media_personality"
                      ? "bg-[#006B3E] text-white ring-2 ring-[#006B3E]/20 scale-105"
                      : "border-2 border-gray-300 bg-white group-hover:border-[#006B3E]"
                  }`}
                >
                  {(selectedCategory === "additional" || selectedCategory === "media_personality") && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </button>
            </div>
          </div>
        )}

        {selectedCategory && !isAutoRecognized && (
          <div className="bg-[#F0F7F4] border-l-4 border-[#006B3E] border-y border-r border-[#C8E6C9] text-[#004D2C] p-4 rounded-2xl flex items-center gap-3 font-semibold text-sm animate-in fade-in duration-200 shadow-xs">
            <CheckCircle2 className="h-5 w-5 text-[#006B3E] shrink-0" />
            <span>
              Currently selected:{" "}
              <strong className="font-black text-[#005430]">{CATEGORY_LABELS[selectedCategory] || selectedCategory}</strong>
            </span>
          </div>
        )}

        {showForm && isInvitedCategory && (
          <div className="rounded-lg border-2 border-dashed border-primary/30 p-5 bg-primary/5 space-y-3">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <p className="font-semibold text-base">Enter Your Invitation Code</p>
            </div>
            {verifiedInvitation ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-bold text-green-800">Code Verified: {verifiedInvitation.code}</p>
                  <p className="text-green-700 text-xs mt-0.5">
                    {verifiedInvitation.inviteeName
                      ? `Pre-filled for ${verifiedInvitation.inviteeName}`
                      : "Invitation code is valid"}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={clearVerifiedCode} className="text-xs h-8">
                  Change Code
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. NMT-A3X9"
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
                    className="font-mono text-base tracking-widest uppercase"
                  />
                  <Button
                    type="button"
                    onClick={() => handleVerifyCode()}
                    disabled={isVerifyingCode || !codeInput.trim()}
                    className="shrink-0"
                  >
                    {isVerifyingCode ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>
                </div>
                {codeError && <p className="text-xs text-destructive font-medium">{codeError}</p>}
              </div>
            )}
          </div>
        )}

        {showForm && (
          <>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g. name@organization.org" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your attendance QR code will be sent to this email address.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+234 803 000 0000 or +1 555 000 0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!event?.isInternal && (
              <>
                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization / Agency *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Federal Ministry of Transport, NTA, etc." {...field} />
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
                      <FormLabel>Designation / Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Manager, Director, Officer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

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

export function RegistrationForm(props: {
  eventId: string;
  event?: Event;
  onSuccessfulOnboarding?: () => void;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#006B3E]" />
        </div>
      }
    >
      <RegistrationFormInner {...props} />
    </Suspense>
  );
}
