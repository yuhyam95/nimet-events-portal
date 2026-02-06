"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { RegistrationForm } from "@/components/registration-form";
import type { Event } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";

interface AdminOnboardingModalProps {
    event: Event;
    trigger?: React.ReactNode;
}

export function AdminOnboardingModal({ event, trigger }: AdminOnboardingModalProps) {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();

    // Only admin or staff can access this, but we'll assume the parent component handles that check
    // or that this component is only rendered for authorized users.
    // For extra safety, we can check basic auth context existence
    if (!user) {
        return null;
    }

    const handleSuccessfulOnboarding = () => {
        setOpen(false);
        // Refresh the page or trigger a data refresh?
        // Since this is a server component page, reloading the page is the easiest way to refresh data
        window.location.reload();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium">
                        <Plus className="h-4 w-4 mr-2" />
                        Manually Onboard
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manual Onboarding</DialogTitle>
                    <DialogDescription>
                        Register a new participant and automatically mark their attendance.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    <RegistrationForm
                        eventId={event.id}
                        event={event}
                        onSuccessfulOnboarding={handleSuccessfulOnboarding}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
