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

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  organization: z.string().min(2, {
    message: "Organization must be at least 2 characters.",
  }),
  designation: z.string().min(2, {
    message: "Designation must be at least 2 characters.",
  }),
  contact: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(11, {
    message: "Please enter a valid phone number.",
  }),
});

export function RegistrationForm({ eventId }: { eventId: string }) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      organization: "",
      designation: "",
      contact: "",
      phone: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await addParticipant({ ...values, eventId });
      toast({
        title: "Registration Successful!",
        description: "We've received your registration. Check your email for confirmation with event details and QR code!",
      });
      // In a real app, you would redirect or clear the form.
      // For this demo, we'll redirect back home after a short delay.
      setTimeout(() => router.push('/'), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not complete your registration. Please try again.";
      
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
              <FormLabel>Designation</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Manager, Director, Officer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Registering..." : "Register"}
        </Button>
      </form>
    </Form>
  );
}
