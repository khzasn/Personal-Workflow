import { BookOpen } from "lucide-react";

export default function JurnalLoading() {
  return (
    <div className="min-h-full pb-20">
      <div className="container mx-auto max-w-3xl space-y-6 px-4 pt-6 sm:px-6 sm:pt-8 animate-pulse">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/50">
            <BookOpen className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <div>
            <div className="h-6 w-32 rounded-md bg-muted/60 mb-1"></div>
            <div className="h-4 w-48 rounded-md bg-muted/40"></div>
          </div>
        </div>

        {/* Editor Skeleton */}
        <div className="h-64 w-full rounded-[24px] bg-muted/20"></div>

        {/* List Skeleton */}
        <div>
          <div className="mb-3 h-5 w-40 rounded-md bg-muted/60"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 w-full rounded-2xl bg-muted/20"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
