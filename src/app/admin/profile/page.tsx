"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordForm } from "@/components/change-password-form";
import { useAuth } from "@/contexts/auth-context";
import { format, parseISO } from "date-fns";
import { User, Lock } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            User not found. Please log in again.
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, "MMMM dd, yyyy 'at' h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information and security settings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your account details and information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="text-sm">{user.fullName}</p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm">{user.email}</p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <div className="mt-1">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Account Created</label>
              <p className="text-sm">{formatDate(user.createdAt)}</p>
            </div>
            
            {user.updatedAt !== user.createdAt && (
              <>
                <Separator />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">{formatDate(user.updatedAt)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage your password and security preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showChangePassword ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Keep your account secure by using a strong password and updating it regularly.
                </p>
                <Button 
                  onClick={() => setShowChangePassword(true)}
                  variant="outline"
                  className="w-full"
                >
                  Change Password
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <ChangePasswordForm 
                  onSuccess={() => setShowChangePassword(false)}
                />
                <Button 
                  onClick={() => setShowChangePassword(false)}
                  variant="ghost"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
