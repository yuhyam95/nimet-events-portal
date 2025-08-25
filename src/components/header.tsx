import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function Header() {
  return (
    <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold font-headline text-black-foreground hover:text-accent transition-colors">
            NIMET Events Management Portal
          </Link>
          <nav>
            <Button asChild variant="ghost">
              <Link href="/admin/login">
                <LogIn className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
