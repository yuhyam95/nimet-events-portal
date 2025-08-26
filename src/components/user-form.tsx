"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import type { User } from "@/lib/types";
import { createUser, updateUser } from "@/lib/actions";

const UserSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional(),
  confirmPassword: z.string().optional(),
  role: z.enum(['admin', 'user'], { message: "Role must be either 'admin' or 'user'." }),
}).refine((data) => {
  // For new users, password is required
  if (!data.password) {
    return false;
  }
  return true;
}, {
  message: "Password is required for new users",
  path: ["password"],
}).refine((data) => {
  // For new users, confirm password must match
  if (data.password && data.confirmPassword !== data.password) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UserFormData = z.infer<typeof UserSchema>;

interface UserFormProps {
  onSuccess: () => void;
  user?: User;
}

export function UserForm({ onSuccess, user }: UserFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      password: "",
      confirmPassword: "",
      role: user?.role || "user",
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      if (user) {
        // Update existing user
        const updateData = {
          fullName: data.fullName,
          email: data.email,
          role: data.role,
        };
        await updateUser(user.id, updateData);
        toast({
          title: "User Updated!",
          description: "The user has been successfully updated.",
        });
      } else {
        // Create new user
        if (!data.password) {
          toast({
            variant: "destructive",
            title: "Password Required",
            description: "Password is required for new users.",
          });
          return;
        }
        await createUser({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          role: data.role,
        });
        toast({
          title: "User Created!",
          description: "The user has been successfully created.",
        });
      }
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Password {user && "(leave blank to keep current password)"}
              </FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder={user ? "Enter new password (optional)" : "Enter password"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!user && (
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Confirm password" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Saving..." : user ? "Update User" : "Create User"}
        </Button>
      </form>
    </Form>
  );
}
