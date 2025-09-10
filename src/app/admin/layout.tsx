"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarTitle,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Users, Calendar, UserCog, Bot, LogOut, User } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/header";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* <Header /> */}
      <SidebarProvider>
        <Sidebar>
          <SidebarContent className="pt-16">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/events')}>
                  <Link href="/admin/events">
                    <Calendar />
                    <span>Events</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/participants')}>
                  <Link href="/admin/participants">
                    <Users />
                    <span>Participants</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/users')}>
                  <Link href="/admin/users">
                    <UserCog />
                    <span>Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/profile')}>
                  <Link href="/admin/profile">
                    <User />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
              <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                      <AvatarImage src="https://placehold.co/100x100.png" alt="Admin" data-ai-hint="profile picture" />
                      <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                      <span className="font-semibold text-sm">{user?.fullName || "Admin User"}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="ml-auto p-2 hover:bg-gray-100 rounded-md"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
              </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="overflow-x-auto">
          <header className="flex items-center gap-4 md:hidden border-b">
              <div className="p-4 sm:p-6 lg:p-8">
                  <SidebarTrigger />
              </div>
              <h1 className="text-xl font-semibold text-black">Dashboard</h1>
          </header>
          <div className="p-4 sm:p-6 lg:p-8 min-w-0 w-full">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}

function UnauthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {children}
    </div>
  );
}

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Always call useEffect to avoid Rules of Hooks violation
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // If on login page, don't show sidebar
  if (pathname === '/admin/login') {
    return (
      <UnauthenticatedLayout>
        {children}
      </UnauthenticatedLayout>
    );
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <UnauthenticatedLayout>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </UnauthenticatedLayout>
    );
  }

  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <UnauthenticatedLayout>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting to login...</p>
        </div>
      </UnauthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    </AuthenticatedLayout>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </AuthProvider>
  );
}
