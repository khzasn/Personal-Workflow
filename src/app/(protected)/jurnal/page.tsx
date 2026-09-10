import { BookOpen } from "lucide-react";
import { JournalEditor } from "@/features/journal/journal-editor";
import { JournalList } from "@/features/journal/journal-list";
import { getJournalEntries } from "@/features/journal/actions";

export const metadata = {
  title: "Dayflow | Jurnal Harian",
};

export const dynamic = "force-dynamic";

export default async function JurnalPage() {
  const entries = await getJournalEntries();

  return (
    <div className="min-h-full pb-20">
      <div className="container mx-auto max-w-3xl space-y-6 px-4 pt-6 sm:px-6 sm:pt-8">

        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              Jurnal Harian
            </h1>
            <p className="text-xs text-muted-foreground">
              Ruang pribadimu untuk merenung dan mencatat perjalanan hari ini.
            </p>
          </div>
        </div>

        {/* Editor — tulis entri baru */}
        <JournalEditor />

        {/* Daftar entri lama */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              Entri Sebelumnya
            </h2>
            <span className="rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {entries.length} entri
            </span>
          </div>
          <JournalList initialEntries={entries} />
        </div>

      </div>
    </div>
  );
}
