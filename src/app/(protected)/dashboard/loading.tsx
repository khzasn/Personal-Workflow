import { Sparkles, Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-full pb-20">
      <div className="container mx-auto max-w-5xl space-y-7 px-4 pt-6 sm:px-6 sm:pt-8">
        {/* Skeleton Greeting + Stats */}
        <section className="overflow-hidden rounded-[28px] border border-white/60 bg-white/40 p-5 shadow-xs backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.02] sm:p-6 animate-pulse">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl flex-1">
              <div className="mb-2.5 h-6 w-32 rounded-full bg-primary/10"></div>
              <div className="h-8 w-64 rounded-md bg-muted/60 mb-2"></div>
              <div className="mt-1.5 h-4 w-48 rounded-md bg-muted/40"></div>
              <div className="mt-4 h-12 w-full max-w-md rounded-xl bg-muted/30"></div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 w-full lg:w-auto">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 w-full sm:w-28 rounded-2xl bg-muted/30"></div>
              ))}
            </div>
          </div>
        </section>

        {/* Skeleton Briefing */}
        <section className="pt-2 animate-pulse">
          <div className="h-[200px] w-full rounded-2xl bg-muted/30"></div>
        </section>

        {/* Skeleton Analytics */}
        <section className="animate-pulse">
          <div className="h-8 w-48 bg-muted/30 rounded-md mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 w-full rounded-2xl bg-muted/30"></div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
