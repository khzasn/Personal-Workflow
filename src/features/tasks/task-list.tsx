"use client";

/**
 * src/features/tasks/task-list.tsx
 * Daftar tugas dengan PriorityBadge, DeadlineBadge, dan sorting otomatis.
 */

import { useTransition } from "react";
import { updateTaskStatus, deleteTask } from "./actions";
import { deleteRecurringTask } from "./recurrence/actions";
import { useFocus } from "@/features/focus/focus-context";
import type { Task } from "@/types";
import { CheckCircle2, Circle, Trash2, Clock, Tag, Repeat, Timer } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { PriorityBadge } from "./priority-badge";
import { DeadlineBadge } from "./deadline-badge";
import { sortTasksByPriority } from "@/lib/tasks/sorting";

function TaskItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const { openFocusModal } = useFocus();

  function toggleStatus() {
    startTransition(() => {
      updateTaskStatus(task.id, !task.is_completed);
    });
  }

  function handleDelete() {
    if (task.series_id) {
      const choice = window.prompt(
        "Tugas ini bagian dari seri berulang. Pilih tindakan:\n1 = Hanya tugas ini\n2 = Tugas ini dan yang akan datang\n3 = Semua tugas dalam seri\n\nKetik 1, 2, atau 3:",
        "1"
      );
      if (!choice) return;
      const mode = choice === "2" ? "future" : choice === "3" ? "all" : "single";
      startTransition(() => {
        deleteRecurringTask(task.id, mode);
      });
      return;
    }

    if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
      startTransition(() => {
        deleteTask(task.id);
      });
    }
  }

  return (
    <div
      className={`group flex items-start gap-3 rounded-lg border p-4 transition-all ${
        task.is_completed ? "bg-muted/50 border-transparent opacity-60" : "bg-card hover:border-primary/50"
      } ${isPending ? "opacity-50 pointer-events-none" : ""}`}
    >
      <button
        onClick={toggleStatus}
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
        aria-label={task.is_completed ? "Tandai belum selesai" : "Tandai selesai"}
      >
        {task.is_completed ? (
          <CheckCircle2 className="h-6 w-6 text-primary" />
        ) : (
          <Circle className="h-6 w-6" />
        )}
      </button>

      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className={`font-semibold truncate ${task.is_completed ? "line-through" : ""}`}>
            {task.title}
          </h3>
          {task.series_id && (
            <span title="Tugas berulang">
              <Repeat className="h-3.5 w-3.5 shrink-0 text-primary opacity-80" />
            </span>
          )}
        </div>
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Badges: Priority + Deadline */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <PriorityBadge priority={task.priority} />
          <DeadlineBadge deadlineAt={task.deadline_at} isCompleted={task.is_completed} />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 bg-secondary px-2 py-0.5 rounded-full">
            <Tag className="h-3 w-3" />
            {task.category}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.estimated_minutes} menit
          </span>
          <span className="text-[10px] opacity-75">
            Dibuat {format(new Date(task.created_at), "d MMM", { locale: id })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!task.is_completed && (
          <button
            type="button"
            onClick={() => openFocusModal(task)}
            className="flex items-center gap-1 rounded-lg border border-violet-200/80 bg-violet-50/90 px-2.5 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-100 hover:scale-105 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300"
            title="Mulai sesi fokus untuk tugas ini"
          >
            <Timer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Fokus</span>
          </button>
        )}

        <button
          onClick={handleDelete}
          className="rounded p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
          aria-label="Hapus tugas"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center text-muted-foreground">
        <div className="mb-4 rounded-full bg-muted p-4">
          <CheckCircle2 className="h-8 w-8 opacity-50" />
        </div>
        <p className="text-lg font-medium">Belum ada tugas</p>
        <p className="text-sm">Mulai tambahkan tugas pertama Anda di atas.</p>
      </div>
    );
  }

  const pendingTasks = sortTasksByPriority(tasks.filter((t) => !t.is_completed));
  const completedTasks = tasks.filter((t) => t.is_completed);

  return (
    <div className="space-y-6">
      {pendingTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            Dalam Proses ({pendingTasks.length})
          </h3>
          <div className="grid gap-3">
            {pendingTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="space-y-3 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            Selesai ({completedTasks.length})
          </h3>
          <div className="grid gap-3">
            {completedTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
