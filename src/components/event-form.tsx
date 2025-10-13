
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { addEvent, updateEvent } from "@/lib/actions";
import type { Event } from "@/lib/types";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(5, { message: "Event name must be at least 5 characters." }),
  slug: z.string().min(3, { message: "URL slug must be at least 3 characters." }).regex(/^[a-zA-Z0-9-]+$/, { message: "URL slug can only contain letters, numbers, and hyphens." }),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  location: z.string().min(3, { message: "Location must be at least 3 characters." }),
  theme: z.string().optional(),
  isActive: z.boolean().optional(),
  isInternal: z.boolean().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
});

interface EventFormProps {
  onSuccess: () => void;
  event?: Event;
}

export function EventForm({ onSuccess, event }: EventFormProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: event?.name || "",
      slug: event?.slug || "",
      startDate: event?.startDate ? new Date(event.startDate + 'T00:00:00') : undefined,
      endDate: event?.endDate ? new Date(event.endDate + 'T00:00:00') : undefined,
      location: event?.location || "",
      theme: event?.description || "",
      isActive: event?.isActive ?? true, // Default to true for new events
      isInternal: event?.isInternal ?? false, // Default to external for new events
      department: event?.department || "",
      position: event?.position || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Format dates to YYYY-MM-DD without timezone issues
      const formatDateToYYYYMMDD = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const eventData = {
        ...values,
        startDate: formatDateToYYYYMMDD(values.startDate), // Convert start date to string format
        endDate: formatDateToYYYYMMDD(values.endDate), // Convert end date to string format
        description: values.theme || "", // Map theme to description for backend compatibility
        isActive: values.isActive ?? true, // Include active status
        isInternal: values.isInternal ?? false, // Include internal status
        department: values.department || "", // Include department
        position: values.position || "", // Include position
      };
      
      if (event?.id) {
        // Update existing event
        await updateEvent(event.id, eventData);
        toast({
          title: "Event Updated!",
          description: "The event has been successfully updated.",
        });
      } else {
        // Create new event
        await addEvent(eventData);
        toast({
          title: "Event Created!",
          description: "The new event has been successfully added.",
        });
      }
      onSuccess();
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Operation Failed",
        description: event?.id ? "Could not update the event. Please try again." : "Could not create the event. Please try again.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-full">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Annual Tech Conference" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Slug</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Annual-Tech-Conference" {...field} />
              </FormControl>
              <FormDescription>
                This will be used in the URL: events.nimet.gov.ng/{field.value || "your-slug"}. Can contain letters, numbers, and hyphens.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a start date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>End Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick an end date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => {
                      const startDate = form.getValues("startDate");
                      return date < (startDate || new Date());
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. San Francisco, CA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Theme (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the event theme or leave blank"
                  className="resize-none min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-3">
                  <FormLabel className="text-base">Event Status - Active?</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
                <FormDescription>
                  Toggle to make this event active or inactive. Active events are visible.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isInternal"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-3">
                  <FormLabel className="text-base">Event Type - Internal?</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
                <FormDescription>
                  Toggle for NiMet internal or external event. Internal events hide organization/designation fields.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        {form.watch("isInternal") && (
          <>
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department/Unit</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Information Technology, Human Resources" {...field} />
                  </FormControl>
                  <FormDescription>
                    Specify the department or unit organizing this internal event.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position/Level</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Level, Management, All Staff" {...field} />
                  </FormControl>
                  <FormDescription>
                    Specify the position level or target audience for this internal event.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <Button type="submit" className="w-full mt-6" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting 
              ? (event?.id ? "Updating..." : "Creating...") 
              : (event?.id ? "Update Event" : "Create Event")
            }
        </Button>
      </form>
    </Form>
  );
}
