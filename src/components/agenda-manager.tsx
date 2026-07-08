"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateEventAgenda } from "@/lib/actions";
import type { AgendaItem } from "@/lib/types";

const formSchema = z.object({
  agenda: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, { message: "Title is required" }),
    time: z.string().optional(),
    speaker: z.string().optional()
  }))
});

export function AgendaManager({ eventId, initialAgenda }: { eventId: string, initialAgenda?: AgendaItem[] }) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agenda: initialAgenda || []
    }
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "agenda"
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updateEventAgenda(eventId, values.agenda);
      toast({
        title: "Agenda Updated",
        description: "The event agenda has been successfully updated.",
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update agenda. Please try again."
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Agenda Items</h2>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => append({ id: crypto.randomUUID(), title: "", time: "", speaker: "" })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
            No agenda items added yet. Click "Add Item" to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="p-4 pt-6">
                  <div className="flex items-start gap-4">
                    <div className="pt-2 cursor-grab text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-3">
                        <FormField
                          control={form.control}
                          name={`agenda.${index}.time`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 09:00 AM - 10:00 AM" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="md:col-span-5">
                        <FormField
                          control={form.control}
                          name={`agenda.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title / Activity</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Opening Remarks" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="md:col-span-4">
                        <FormField
                          control={form.control}
                          name={`agenda.${index}.speaker`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Speaker (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Dr. John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save Agenda"}
        </Button>
      </form>
    </Form>
  );
}
