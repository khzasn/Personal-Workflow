"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Habit, HabitWithTodayStatus, HabitStats, HabitCompletion } from "@/types";
import { format } from "date-fns";

export async function getTodayHabits(): Promise<HabitWithTodayStatus[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const todayDate = format(new Date(), "yyyy-MM-dd");

  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .order("created_at", { ascending: true });

  const { data: completions } = await supabase
    .from("habit_completions")
    .select("*")
    .eq("completed_date", todayDate);

  if (!habits) return [];

  return habits.map((habit) => {
    const todayLog = completions?.find((c) => c.habit_id === habit.id);
    return {
      ...habit,
      todayStatus: todayLog ? (todayLog.status as "done" | "skipped") : "pending",
    };
  });
}

export async function createHabit(input: Partial<Habit>): Promise<ActionResult<Habit>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };

  const { data, error } = await supabase
    .from("habits")
    .insert([{ ...input, user_id: user.id }])
    .select()
    .single();

  if (error) return { ok: false, error: { code: "INTERNAL_ERROR", message: error.message } };

  revalidatePath("/dashboard");
  return { ok: true, data };
}

export async function deleteHabit(id: string): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const { error } = await supabase.from("habits").delete().eq("id", id);
  if (error) return { ok: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  
  revalidatePath("/dashboard");
  revalidatePath(`/habits/${id}`);
  return { ok: true, data: undefined };
}

export async function setHabitStatus(habitId: string, date: string, status: "done" | "skipped" | "pending"): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };

  if (status === "pending") {
    // Delete log
    await supabase
      .from("habit_completions")
      .delete()
      .eq("habit_id", habitId)
      .eq("completed_date", date);
  } else {
    // Upsert log
    await supabase
      .from("habit_completions")
      .upsert({
        user_id: user.id,
        habit_id: habitId,
        completed_date: date,
        status: status,
      }, { onConflict: 'habit_id, completed_date' });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/habits/${habitId}`);
  return { ok: true, data: undefined };
}

export async function getHabitStats(habitId: string): Promise<HabitStats | null> {
  const supabase = await createClient();
  const { data: habit } = await supabase.from("habits").select("created_at").eq("id", habitId).single();
  if (!habit) return null;

  const { data: completions } = await supabase
    .from("habit_completions")
    .select("*")
    .eq("habit_id", habitId)
    .order("completed_date", { ascending: false });

  const allCompletions = (completions || []) as HabitCompletion[];
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let isCheckingCurrent = true;

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");

  const datesSet = new Set(allCompletions.filter(c => c.status === "done").map(c => c.completed_date));
  const sortedDoneDates = Array.from(datesSet).sort((a, b) => b.localeCompare(a)); // Descending

  // Calculate streaks
  if (sortedDoneDates.length > 0) {
    let expectedDate = sortedDoneDates[0] === today ? today : (sortedDoneDates[0] === yesterday ? yesterday : null);
    
    if (expectedDate) {
      for (const d of sortedDoneDates) {
        if (d === expectedDate) {
          tempStreak++;
          if (isCheckingCurrent) currentStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
          
          const prevDateObj = new Date(d);
          prevDateObj.setDate(prevDateObj.getDate() - 1);
          expectedDate = format(prevDateObj, "yyyy-MM-dd");
        } else {
          isCheckingCurrent = false;
          tempStreak = 1;
          const prevDateObj = new Date(d);
          prevDateObj.setDate(prevDateObj.getDate() - 1);
          expectedDate = format(prevDateObj, "yyyy-MM-dd");
        }
      }
    } else {
       // Started breaking streak before yesterday
       currentStreak = 0;
       // We still need to calculate longest streak correctly
       tempStreak = 1;
       longestStreak = 1;
       for (let i = 0; i < sortedDoneDates.length - 1; i++) {
           const curr = new Date(sortedDoneDates[i]);
           const next = new Date(sortedDoneDates[i+1]);
           const diffTime = Math.abs(curr.getTime() - next.getTime());
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
           if (diffDays === 1) {
               tempStreak++;
               longestStreak = Math.max(longestStreak, tempStreak);
           } else {
               tempStreak = 1;
           }
       }
    }
  }

  const createdDate = new Date(habit.created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  const totalCompleted = datesSet.size;
  const completionRate = Math.round((totalCompleted / diffDays) * 100);

  // This month's completions
  const thisMonth = format(new Date(), "yyyy-MM");
  const completionsThisMonth = allCompletions.filter(c => c.completed_date.startsWith(thisMonth));

  return {
    currentStreak,
    longestStreak,
    completionRate: Math.min(100, completionRate),
    totalCompleted,
    completionsThisMonth
  };
}