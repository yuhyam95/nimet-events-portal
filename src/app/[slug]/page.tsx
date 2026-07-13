import { RegistrationForm } from "@/components/registration-form";
import { getEventBySlug } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import { format, parseISO } from "date-fns";

// Helper function to add ordinal suffix to day
const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

// Helper function to format event date
const formatEventDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    const day = date.getDate();
    const ordinalSuffix = getOrdinalSuffix(day);
    return format(date, `d'${ordinalSuffix}' MMMM, yyyy`);
  } catch (error) {
    return dateString;
  }
};

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }
  return (
    <div className="min-h-screen bg-[#fcfdfd] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      {/* High-Visibility Geometric Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Subtle base blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[80px]" />

        {/* Prominent Geometric Shapes */}
        <div className="absolute top-[5%] left-[5%] w-12 h-4 bg-primary/30 -rotate-12 rounded-sm" />
        <div className="absolute top-[12%] left-[35%] w-10 h-10 border-[3px] border-primary/25 rounded-full" />
        <div className="absolute top-[22%] left-[45%] w-8 h-8 bg-primary/20 rotate-12 rounded-sm border border-primary/40" />
        <div className="absolute top-[8%] left-[15%] w-4 h-4 bg-primary/40 rounded-full" />

        <div className="absolute top-[25%] left-[65%] w-3 h-3 bg-primary/40 rounded-full" />
        <div className="absolute top-[32%] left-[55%] w-16 h-5 bg-primary/20 rotate-[20deg] rounded-sm" />
        <div className="absolute top-[48%] left-[75%] w-14 h-14 border-[3px] border-primary/20 rounded-full" />
        <div className="absolute top-[5%] left-[78%] w-6 h-6 bg-primary/30 -rotate-45 rounded-sm" />

        <div className="absolute top-[45%] left-[8%] w-5 h-5 bg-primary/40 rounded-full" />
        <div className="absolute top-[62%] left-[10%] w-10 h-10 bg-primary/20 -rotate-12 rounded-sm border border-primary/40" />
        <div className="absolute top-[35%] left-[5%] w-8 h-8 border-[3px] border-primary/30 rounded-full" />
        <div className="absolute top-[18%] left-[90%] w-12 h-12 border-[3px] border-primary/20 rounded-full" />

        <div className="absolute top-[72%] left-[20%] w-14 h-14 border-[3px] border-primary/25 rounded-full" />
        <div className="absolute top-[78%] left-[40%] w-18 h-7 bg-primary/30 -rotate-6 rounded-sm" />
        <div className="absolute top-[85%] left-[45%] w-4 h-4 bg-primary/50 rounded-full" />
        <div className="absolute top-[65%] left-[85%] w-5 h-5 bg-primary/40 rounded-full" />

        <div className="absolute top-[82%] left-[75%] w-10 h-10 bg-primary/30 rotate-45 rounded-sm border border-primary/40" />
        <div className="absolute top-[55%] left-[88%] w-12 h-4 bg-primary/25 rotate-[45deg] rounded-sm" />
        <div className="absolute top-[90%] left-[88%] w-4 h-4 bg-primary/40 rounded-full" />
        <div className="absolute top-[55%] left-[30%] w-5 h-5 bg-primary/50 rounded-full" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <Card className="shadow-2xl border-primary/10 backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-6">
              <div className="bg-white p-3 rounded-full shadow-md border border-primary/5">
                <Image
                  src="/nimet-logo.png"
                  alt="NIMET Logo"
                  width={160}
                  height={160}
                  className="object-contain"
                />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-primary mb-2">{event.name}</CardTitle>
            <CardDescription className="space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-medium">
                <div className="flex items-center gap-1.5 text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  <span>{formatEventDate(event.startDate)}</span>
                  <span className="mx-1 opacity-50">-</span>
                  <span>{formatEventDate(event.endDate)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{event.location}</span>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <hr className="mx-6 border-t border-primary/10" />
          <CardContent className="pt-6">
            <RegistrationForm eventId={event.id} event={event} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
