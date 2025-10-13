"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { X, UserPlus, Users } from "lucide-react";
import type { User } from "@/lib/types";

interface StaffAssignmentProps {
  eventId: string;
  assignedStaff: User[];
  allUsers: User[];
}

export function StaffAssignment({ eventId, assignedStaff, allUsers }: StaffAssignmentProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentAssignedStaff, setCurrentAssignedStaff] = React.useState(assignedStaff);

  const handleAssignStaff = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Staff Assigned!",
          description: "Staff member has been assigned to this event.",
        });
        // Update local state
        const assignedUser = allUsers.find(user => user.id === userId);
        if (assignedUser) {
          setCurrentAssignedStaff(prev => [...prev, assignedUser]);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Assignment Failed",
          description: data.error || "Failed to assign staff member.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while assigning staff.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassignStaff = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/staff`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Staff Unassigned!",
          description: "Staff member has been unassigned from this event.",
        });
        // Update local state
        setCurrentAssignedStaff(prev => prev.filter(staff => staff.id !== userId));
      } else {
        toast({
          variant: "destructive",
          title: "Unassignment Failed",
          description: data.error || "Failed to unassign staff member.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while unassigning staff.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const assignedStaffIds = currentAssignedStaff.map(staff => staff.id);
  const availableUsers = allUsers.filter(user => !assignedStaffIds.includes(user.id));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigned Staff
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentAssignedStaff.length > 0 ? (
            <div className="space-y-2">
              {currentAssignedStaff.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{staff.fullName}</p>
                    <p className="text-sm text-muted-foreground">{staff.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={staff.role === 'admin' ? 'default' : 'secondary'}>
                      {staff.role}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnassignStaff(staff.id)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No staff assigned to this event yet.
            </p>
          )}
        </CardContent>
      </Card>

      {availableUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Available Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignStaff(user.id)}
                      disabled={isLoading}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {availableUsers.length === 0 && currentAssignedStaff.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              All available staff members have been assigned to this event.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
