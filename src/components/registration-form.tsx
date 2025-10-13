"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { addParticipant } from "@/lib/actions";
import type { Event } from "@/lib/types";

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
  phone: z.string().min(11, {
    message: "Please enter a valid phone number.",
  }),
});

export function RegistrationForm({ eventId, event }: { eventId: string; event?: Event }) {
  const { toast } = useToast();
  const router = useRouter();

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
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Normalize email to lowercase
    const normalizedValues = {
      ...values,
      contact: values.contact.toLowerCase().trim()
    };
    const result = await addParticipant({ ...normalizedValues, eventId });
    
    if (result.success) {
      // Redirect to success page with event and participant data
      const successUrl = `/register/success?eventId=${eventId}&participantId=${result.participantId || 'new'}`;
      router.push(successUrl);
    } else {
      const errorMessage = result.error || "Could not complete your registration. Please try again.";
      
      // Check for specific duplicate errors and provide user-friendly messages
      if (errorMessage.includes("email address has already registered")) {
        toast({
          variant: "destructive",
          title: "Email Already Registered",
          description: "This email address has already been used to register for this event. Please use a different email address.",
        });
      } else if (errorMessage.includes("phone number has already registered")) {
        toast({
          variant: "destructive",
          title: "Phone Number Already Registered",
          description: "This phone number has already been used to register for this event. Please use a different phone number.",
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
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
                  placeholder="080300000"
                  type="tel"
                  {...field}
                />
              </FormControl>
              {/* <FormDescription>
                Each phone number can only be used once per event.
              </FormDescription> */}
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
              {/* <FormDescription>
                Each email address can only be used once per event.
              </FormDescription> */}
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
                  <FormLabel>Position</FormLabel>
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
                  <FormLabel>Department/Unit</FormLabel>
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
      </form>
    </Form>
  );
}
