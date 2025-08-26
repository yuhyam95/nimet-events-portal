"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isMobile = useIsMobile();
  
  // Simple logic: show login button on non-admin routes, hide on admin routes
  // This avoids the auth context issue entirely
  const showLoginButton = !isAdminRoute;

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0">
            <Image 
              src="/nimet-logo.png" 
              alt="NIMET Logo" 
              width={isMobile ? 120 : 160} 
              height={isMobile ? 120 : 160} 
              className="object-contain flex-shrink-0"
            />
            <span className="text-sm sm:text-xl font-bold font-headline text-black-foreground truncate">
              {isMobile ? "Events Portal" : "Events Management Portal"}
            </span>
          </Link>
          <nav className="flex-shrink-0">
            {showLoginButton && (
              <Button asChild variant="ghost" size={isMobile ? "sm" : "default"}>
                <Link href="/admin/login">
                  <LogIn className={`${isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
                  {isMobile ? "Admin" : "Admin"}
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
