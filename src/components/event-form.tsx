
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
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
import type { Event, FoodMenuItem } from "@/lib/types";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { format, startOfDay, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(5, { message: "Event name must be at least 5 characters." }),
  slug: z.string().min(3, { message: "URL slug must be at least 3 characters." }).regex(/^[a-zA-Z0-9-]+$/, { message: "URL slug can only contain letters, numbers, and hyphens." }),
  startDate: z.date({ required_error: "Start date is required." }),
  startTime: z.string().optional(),
  endDate: z.date({ required_error: "End date is required." }),
  endTime: z.string().optional(),
  location: z.string().min(3, { message: "Location must be at least 3 characters." }),
  theme: z.string().optional(),
  isActive: z.boolean().optional(),
  category: z.enum(['internal', 'external', 'meeting'], { required_error: "Event category is required." }),
  eventType: z.enum(['conference', 'workshop', 'seminar', 'summit', 'banquet', 'dinner', 'symposium', 'exhibition', 'training', 'other']).optional(),
  isInvitationOnly: z.boolean().optional(),
  invitationCode: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
});

interface EventFormProps {
  onSuccess: () => void;
  event?: Event;
}

export function EventForm({ onSuccess, event }: EventFormProps) {
  const { toast } = useToast();

  // Food menu state (managed separately for dynamic add/remove)
  const [foodMenu, setFoodMenu] = useState<FoodMenuItem[]>(
    event?.foodMenu || []
  );

  const addFoodItem = () => {
    setFoodMenu(prev => [...prev, { id: crypto.randomUUID(), name: "", description: "" }]);
  };

  const removeFoodItem = (id: string) => {
    setFoodMenu(prev => prev.filter(item => item.id !== id));
  };

  const updateFoodItem = (id: string, field: keyof FoodMenuItem, value: string) => {
    setFoodMenu(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: event?.name || "",
      slug: event?.slug || "",
      startDate: event?.startDate ? new Date(event.startDate.split('T')[0] + 'T00:00:00') : new Date(),
      startTime: event?.startDate && event.startDate.includes('T') ? event.startDate.split('T')[1].substring(0, 5) : "",
      endDate: event?.endDate ? new Date(event.endDate.split('T')[0] + 'T00:00:00') : new Date(),
      endTime: event?.endDate && event.endDate.includes('T') ? event.endDate.split('T')[1].substring(0, 5) : "",
      location: event?.location || "",
      theme: event?.description || "",
      isActive: event?.isActive ?? true,
      category: event?.category || (event?.isInternal ? "internal" : "external"),
      eventType: event?.eventType,
      isInvitationOnly: event?.isInvitationOnly ?? false,
      invitationCode: event?.invitationCode || "",
      department: event?.department || "",
      position: event?.position || "",
    },
  });

  // Function to generate slug from event name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  const isEditing = !!event?.id;
  const eventName = form.watch("name");
  const currentSlug = form.watch("slug");
  const previousNameRef = useRef<string>(eventName || "");

  // Auto-generate slug when event name changes (only for new events)
  useEffect(() => {
    if (!isEditing && eventName) {
      const generatedSlug = generateSlug(eventName);
      const previousGeneratedSlug = generateSlug(previousNameRef.current);
      
      // Only auto-update if:
      // 1. Slug is empty, OR
      // 2. Current slug matches what would be generated from the previous name (meaning it was auto-generated)
      // This allows manual override - if user manually edits the slug, it won't be overwritten
      if (!currentSlug || currentSlug === previousGeneratedSlug) {
        form.setValue("slug", generatedSlug, { shouldValidate: false });
      }
      previousNameRef.current = eventName;
    }
  }, [eventName, isEditing, form, currentSlug]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const formatDateToYYYYMMDD = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const startStr = formatDateToYYYYMMDD(values.startDate);
      const endStr = formatDateToYYYYMMDD(values.endDate);

      const eventData = {
        ...values,
        startDate: values.startTime ? `${startStr}T${values.startTime}` : startStr,
        endDate: values.endTime ? `${endStr}T${values.endTime}` : endStr,
        description: values.theme || "",
        isActive: values.isActive ?? true,
        isInternal: values.category !== 'external',
        department: values.department || "",
        position: values.position || "",
        assignedStaff: event?.assignedStaff || [],
        foodMenu: foodMenu.filter(item => item.name.trim() !== ""),
      };
      
      if (event?.id) {
        await updateEvent(event.id, eventData);
        toast({
          title: "Event Updated!",
          description: "The event has been successfully updated.",
        });
      } else {
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
                {!event?.id 
                  ? `Auto-generated from event name. You can edit it if needed. This will be used in the URL: events.nimet.gov.ng/${field.value || "your-slug"}. Can contain letters, numbers, and hyphens.`
                  : `This will be used in the URL: events.nimet.gov.ng/${field.value || "your-slug"}. Can contain letters, numbers, and hyphens.`
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      disabled={(date) => {
                        const today = startOfToday();
                        const cmp = startOfDay(date);
                        return cmp < today;
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
            name="startTime"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Time (Optional)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        const today = startOfToday();
                        const minDate = startDate ? startOfDay(startDate) : today;
                        const cmp = startOfDay(date);
                        return cmp < minDate;
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
            name="endTime"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Time (Optional)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Federal Capital Territory, Abuja" {...field} />
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="internal">Internal Event</SelectItem>
                  <SelectItem value="external">External Event</SelectItem>
                  <SelectItem value="meeting">Meeting / Hybrid Event</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the category/type of this event. This determines the participant fields and registration flow.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="summit">Summit</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="symposium">Symposium</SelectItem>
                  <SelectItem value="banquet">Banquet</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="exhibition">Exhibition</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Classify the format of this event (e.g. Summit, Conference, Workshop).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isInvitationOnly"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-3">
                  <FormLabel className="text-base">Invitation Only?</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
                <FormDescription>
                  Toggle if this is a unique invitation-only event (e.g. AIC 2026). Requires invite code to register.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {form.watch("isInvitationOnly") && (
          <FormField
            control={form.control}
            name="invitationCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shared Invitation Passcode (Legacy)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. AIC2026" {...field} />
                </FormControl>
                <FormDescription>
                  Optional: A shared passcode for the event. For per-invitee unique codes, use the Invitation Manager after creating the event.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* ─── Food Menu ─────────────────────────────────────────────── */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-base">Food Menu (Optional)</p>
              <p className="text-sm text-muted-foreground">Add meal options that participants can select during registration.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addFoodItem}>
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>

          {foodMenu.length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-3">
              No menu items yet. Click &quot;Add Item&quot; to add meal options.
            </p>
          )}

          <div className="space-y-2">
            {foodMenu.map((item, index) => (
              <div key={item.id} className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    placeholder={`Item ${index + 1} name (e.g. Jollof Rice)`}
                    value={item.name}
                    onChange={(e) => updateFoodItem(item.id, "name", e.target.value)}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={item.description || ""}
                    onChange={(e) => updateFoodItem(item.id, "description", e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeFoodItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        {/* {form.watch("isInternal") && (
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
        )} */}
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
