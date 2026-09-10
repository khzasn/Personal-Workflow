/**
 * src/lib/tasks/layout.ts
 * Helper algoritma murni untuk menghitung penataan kolom tugas yang saling bertabrakan (overlapping tasks).
 * Digunakan bersama oleh Day View dan Weekly Calendar View.
 */

import type { Task } from "@/types";
import { timeToMinutes } from "@/lib/date-time";

export interface TaskColumnLayout {
  column: number;
  totalColumns: number;
}

/**
 * Menghitung posisi kolom untuk setiap tugas dalam satu hari
 * agar tugas-tugas yang waktunya bertabrakan dibagi lebarnya secara proporsional.
 */
export function calculateOverlappingColumns(tasks: Task[]): Map<string, TaskColumnLayout> {
  const layouts = new Map<string, TaskColumnLayout>();
  
  // Hanya proses tugas yang memiliki start_time
  const timedTasks = tasks
    .filter((t) => Boolean(t.start_time))
    .sort((a, b) => timeToMinutes(a.start_time!) - timeToMinutes(b.start_time!));

  if (timedTasks.length === 0) return layouts;

  let currentGroup: Task[] = [];
  let currentGroupEnd = -1;

  function layoutGroup(group: Task[]) {
    if (group.length === 0) return;

    // Lacak waktu berakhir setiap kolom dalam grup overlap ini
    const columnEnds: number[] = [];
    const assignments = new Map<string, number>();

    for (const task of group) {
      const start = timeToMinutes(task.start_time!);
      const duration = Math.max(task.estimated_minutes, 15);
      const end = start + duration;

      // Cari kolom pertama yang sudah kosong pada jam 'start'
      let colIdx = columnEnds.findIndex((colEnd) => colEnd <= start);
      if (colIdx === -1) {
        colIdx = columnEnds.length;
        columnEnds.push(end);
      } else {
        columnEnds[colIdx] = end;
      }

      assignments.set(task.id, colIdx);
    }

    const totalColumns = Math.max(columnEnds.length, 1);
    for (const task of group) {
      layouts.set(task.id, {
        column: assignments.get(task.id) ?? 0,
        totalColumns,
      });
    }
  }

  for (const task of timedTasks) {
    const start = timeToMinutes(task.start_time!);
    const duration = Math.max(task.estimated_minutes, 15);
    const end = start + duration;

    if (currentGroup.length === 0 || start < currentGroupEnd) {
      // Masih dalam grup bentrok waktu yang sama
      currentGroup.push(task);
      currentGroupEnd = Math.max(currentGroupEnd, end);
    } else {
      // Mulai grup bentrok baru
      layoutGroup(currentGroup);
      currentGroup = [task];
      currentGroupEnd = end;
    }
  }

  // Proses grup terakhir
  layoutGroup(currentGroup);

  return layouts;
}
