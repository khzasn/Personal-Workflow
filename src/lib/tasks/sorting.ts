/**
 * src/lib/tasks/sorting.ts
 * Fungsi murni untuk mengurutkan tugas berdasarkan prioritas dan deadline.
 * Dipisah agar mudah di-test secara unit.
 *
 * Urutan: overdue → urgent → deadline terdekat → high → medium → low
 */

import type { Task } from "@/types";
import { getDeadlineStatus } from "@/lib/date-time";

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const statusA = getDeadlineStatus(a.deadline_at, a.is_completed);
    const statusB = getDeadlineStatus(b.deadline_at, b.is_completed);

    // 1. Overdue selalu paling atas
    const isOverdueA = statusA === "overdue" ? 0 : 1;
    const isOverdueB = statusB === "overdue" ? 0 : 1;
    if (isOverdueA !== isOverdueB) return isOverdueA - isOverdueB;

    // 2. Urgent di atas yang lain (kecuali overdue)
    const priorityA = PRIORITY_ORDER[a.priority] ?? 2;
    const priorityB = PRIORITY_ORDER[b.priority] ?? 2;
    if (priorityA !== priorityB) return priorityA - priorityB;

    // 3. Jika prioritas sama, urutkan berdasarkan deadline terdekat
    if (a.deadline_at && b.deadline_at) {
      return new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
    }
    if (a.deadline_at) return -1; // a punya deadline, b tidak → a lebih dulu
    if (b.deadline_at) return 1;

    // 4. Terakhir, urutkan berdasarkan waktu dibuat (terbaru dulu)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
