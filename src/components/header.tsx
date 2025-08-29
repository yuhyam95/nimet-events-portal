"use client";

import Link from "next/link";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const isMobile = useIsMobile();

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
        </div>
      </div>
    </header>
  );
}
