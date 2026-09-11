import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Flame, Star, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getHabitStats, deleteHabit } from "@/features/habits/actions";

export default async function HabitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: habit } = await supabase.from("habits").select("*").eq("id", id).single();
  if (!habit) return notFound();

  const stats = await getHabitStats(id);

  async function handleDelete() {
    "use server";
    await deleteHabit(id);
    redirect("/dashboard");
  }

  return (
    <div className="min-h-full pb-20">
      <div className="container mx-auto max-w-2xl space-y-6 px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-full p-2 hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>
          <form action={handleDelete}>
            <button type="submit" className="rounded-full p-2 text-destructive hover:bg-destructive/10 transition-colors" title="Hapus Habit">
              <Trash2 className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Header Habit */}
        <div className="rounded-[28px] border border-white/60 bg-white/70 p-6 text-center shadow-xs backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-background shadow-sm text-4xl mb-4">
            {habit.emoji}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-1">{habit.title}</h1>
          <p className="text-sm font-semibold text-muted-foreground">Target: {habit.target_value} {habit.target_unit} / hari</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border bg-orange-500/10 p-4 text-center">
            <Flame className="mx-auto h-5 w-5 text-orange-500 mb-1" />
            <p className="text-[10px] font-bold uppercase text-orange-600/80">Streak Saat Ini</p>
            <p className="text-xl font-extrabold text-orange-600">{stats?.currentStreak || 0}</p>
          </div>
          <div className="rounded-2xl border bg-amber-500/10 p-4 text-center">
            <Star className="mx-auto h-5 w-5 text-amber-500 mb-1" />
            <p className="text-[10px] font-bold uppercase text-amber-600/80">Rekor Streak</p>
            <p className="text-xl font-extrabold text-amber-600">{stats?.longestStreak || 0}</p>
          </div>
          <div className="rounded-2xl border bg-emerald-500/10 p-4 text-center">
            <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500 mb-1" />
            <p className="text-[10px] font-bold uppercase text-emerald-600/80">Total Selesai</p>
            <p className="text-xl font-extrabold text-emerald-600">{stats?.totalCompleted || 0}</p>
          </div>
          <div className="rounded-2xl border bg-blue-500/10 p-4 text-center">
            <div className="mx-auto flex h-5 w-5 items-center justify-center font-bold text-blue-500 mb-1">%</div>
            <p className="text-[10px] font-bold uppercase text-blue-600/80">Keberhasilan</p>
            <p className="text-xl font-extrabold text-blue-600">{stats?.completionRate || 0}%</p>
          </div>
        </div>

      </div>
    </div>
  );
}