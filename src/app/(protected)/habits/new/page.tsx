import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createHabit } from "@/features/habits/actions";

export default function NewHabitPage() {
  async function submitAction(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const emoji = formData.get("emoji") as string;
    const target_value = Number(formData.get("target_value")) || 1;
    const target_unit = formData.get("target_unit") as string;

    if (!title || !emoji) return;

    await createHabit({
      title,
      emoji,
      target_value,
      target_unit,
      color: "violet",
      frequency: "daily",
    });

    redirect("/dashboard");
  }

  return (
    <div className="min-h-full pb-20">
      <div className="container mx-auto max-w-xl space-y-6 px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="rounded-full p-2 hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-extrabold tracking-tight">Buat Habit Baru</h1>
        </div>

        <form action={submitAction} className="rounded-[24px] border border-white/60 bg-white/70 p-6 shadow-xs backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03] space-y-5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Emoji</label>
            <input type="text" name="emoji" defaultValue="📖" required className="mt-1 block w-16 rounded-xl border bg-background px-3 py-2 text-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary text-center" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Nama Habit</label>
            <input type="text" name="title" placeholder="Contoh: Membaca Buku" required className="mt-1 block w-full rounded-xl border bg-background px-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Target Angka</label>
              <input type="number" name="target_value" defaultValue="1" min="1" required className="mt-1 block w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Satuan</label>
              <input type="text" name="target_unit" defaultValue="kali" placeholder="halaman, menit" required className="mt-1 block w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button type="submit" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:brightness-105 transition-all">Simpan Habit</button>
          </div>
        </form>
      </div>
    </div>
  );
}