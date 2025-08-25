"use client";

import { usePathname } from 'next/navigation';
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
import { Users, Calendar, UserCog, Bot } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
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
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="Admin" data-ai-hint="profile picture" />
                    <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">Admin User</span>
                    <span className="text-xs text-muted-foreground">admin@nimet.com</span>
                </div>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-4 md:hidden border-b">
            <div className="p-4 sm:p-6 lg:p-8">
                <SidebarTrigger />
            </div>
            <h1 className="text-xl font-semibold text-black">Dashboard</h1>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
