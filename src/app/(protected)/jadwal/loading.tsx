import { CalendarDays } from "lucide-react";

export default function JadwalLoading() {
  return (
    <div className="min-h-full pb-20">
      <div className="container mx-auto max-w-5xl space-y-6 px-4 pt-6 sm:px-6 sm:pt-8 animate-pulse">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/50">
            <CalendarDays className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <div>
            <div className="h-6 w-32 rounded-md bg-muted/60 mb-1"></div>
            <div className="h-4 w-48 rounded-md bg-muted/40"></div>
          </div>
        </div>

        {/* Calendar Skeleton */}
        <div className="h-12 w-full max-w-2xl rounded-full bg-muted/30 mb-4"></div>
        <div className="h-[500px] w-full rounded-[28px] bg-muted/20"></div>
      </div>
    </div>
  );
}
