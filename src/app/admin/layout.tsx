import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarInset,
} from "@/components/ui/sidebar"
import { Users } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    {/* Could add a logo or title here */}
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive>
                                <Link href="/admin/participants">
                                    <Users />
                                    <span>Participants</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
