"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Trash2, Clock, Tag, ListTodo, Plus, ChevronDown, ChevronUp } from "lucide-react";
import type { Task } from "@/types";
import { updateTaskStatus, deleteTask } from "./actions";

interface UnscheduledTasksProps {
  tasks: Task[];
  onOpenNewTask: () => void;
}

export function UnscheduledTasks({ tasks, onOpenNewTask }: UnscheduledTasksProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const unscheduled = tasks.filter((t) => !t.scheduled_date);
  const activeUnscheduled = unscheduled.filter((t) => !t.is_completed);

  function toggleTask(taskId: string, currentStatus: boolean) {
    startTransition(() => {
      updateTaskStatus(taskId, !currentStatus);
    });
  }

  function removeTask(taskId: string) {
    if (confirm("Hapus tugas ini?")) {
      startTransition(() => {
        deleteTask(taskId);
      });
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
      {/* Bar Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <ListTodo className="h-4 w-4 text-primary" />
          <span>📋 Tugas Tanpa Jadwal</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
            {activeUnscheduled.length}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
          )}
        </button>

        <button
          onClick={onOpenNewTask}
          className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Expandable Task List */}
      {isExpanded && (
        <div className="p-4 border-t border-border bg-card space-y-2">
          {unscheduled.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Tidak ada tugas tanpa jadwal. Semua agenda sudah terjadwal di kalender! 🎉
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {unscheduled.map((t) => (
                <div
                  key={t.id}
                  className={`group flex items-start gap-2.5 rounded-lg border p-2.5 transition-all ${
                    t.is_completed
                      ? "bg-muted/30 border-transparent opacity-60"
                      : "bg-background hover:border-primary/40"
                  } ${isPending ? "opacity-50" : ""}`}
                >
                  <button
                    onClick={() => toggleTask(t.id, t.is_completed)}
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t.is_completed ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-medium leading-tight truncate ${
                        t.is_completed ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-0.5 rounded bg-secondary px-1 py-0.2">
                        <Tag className="h-2 w-2" />
                        {t.category}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="h-2 w-2" />
                        {t.estimated_minutes}m
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeTask(t.id)}
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    aria-label="Hapus tugas"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
