"use client";

/**
 * src/features/tasks/use-calendar-drag.ts
 * Hook untuk menangani drag-to-move dan drag-to-resize pada Weekly Calendar View.
 * Menggunakan native pointer events dengan snap 15 menit dan preview real-time.
 */

import { useState, useCallback, useRef } from "react";
import type { Task } from "@/types";
import { rescheduleTask } from "./actions";
import { timeToMinutes, minutesToTime } from "@/lib/date-time";

interface UseCalendarDragOptions {
  startHour: number;
  endHour: number;
  hourHeight: number;
  weekDays: Date[];
  onSuccess?: () => void;
}

export interface DragPreviewState {
  task: Task;
  mode: "move" | "resize";
  targetDate: string;
  targetStartTime: string;
  targetDuration: number;
  // Posisi preview visual
  top: number;
  height: number;
  dayIndex: number;
}

export function useCalendarDrag({
  startHour,
  endHour,
  hourHeight,
  weekDays,
  onSuccess,
}: UseCalendarDragOptions) {
  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Ref untuk melacak data sesi drag aktif
  const dragSession = useRef<{
    task: Task;
    mode: "move" | "resize";
    initialPointerY: number;
    initialPointerX: number;
    initialStartMinutes: number;
    initialDuration: number;
    initialDayIndex: number;
    gridRect: DOMRect;
    columnWidth: number;
  } | null>(null);

  /**
   * Mulai drag (Move seluruh kartu atau Resize bagian bawah)
   */
  const startDrag = useCallback(
    (
      task: Task,
      mode: "move" | "resize",
      e: React.PointerEvent<HTMLElement>,
      gridElement: HTMLElement
    ) => {
      // Jika tugas sudah selesai, minta konfirmasi pengguna
      if (task.is_completed) {
        const confirmed = confirm(
          "Tugas ini sudah selesai. Apakah Anda ingin mengubah jadwalnya kembali?"
        );
        if (!confirmed) return;
      }

      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);

      const gridRect = gridElement.getBoundingClientRect();
      const timeGutterWidth = 52;
      const effectiveWidth = gridRect.width - timeGutterWidth;
      const columnWidth = effectiveWidth / 7;

      const initialStartMinutes = timeToMinutes(task.start_time || "08:00");
      const initialDuration = Math.max(task.estimated_minutes, 15);

      // Cari indeks hari tugas dalam weekDays (0-6)
      const taskDate = task.scheduled_date;
      const initialDayIndex = weekDays.findIndex(
        (d) => d.toISOString().slice(0, 10) === taskDate
      );

      dragSession.current = {
        task,
        mode,
        initialPointerY: e.clientY,
        initialPointerX: e.clientX,
        initialStartMinutes,
        initialDuration,
        initialDayIndex: initialDayIndex >= 0 ? initialDayIndex : 0,
        gridRect,
        columnWidth,
      };

      const top = ((initialStartMinutes - startHour * 60) / 60) * hourHeight;
      const height = (initialDuration / 60) * hourHeight;

      setDragPreview({
        task,
        mode,
        targetDate: taskDate || weekDays[0].toISOString().slice(0, 10),
        targetStartTime: task.start_time || "08:00",
        targetDuration: initialDuration,
        top,
        height,
        dayIndex: initialDayIndex >= 0 ? initialDayIndex : 0,
      });
    },
    [startHour, hourHeight, weekDays]
  );

  /**
   * Menangani pergerakan pointer saat drag/resize
   */
  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!dragSession.current) return;

      const {
        task,
        mode,
        initialPointerY,
        initialPointerX,
        initialStartMinutes,
        initialDuration,
        initialDayIndex,
        gridRect,
        columnWidth,
      } = dragSession.current;

      const deltaY = e.clientY - initialPointerY;
      const deltaX = e.clientX - initialPointerX;

      // Konversi pergeseran piksel ke menit (snap ke kelipatan 15 menit)
      const minutesPerPixel = 60 / hourHeight;
      const rawDeltaMinutes = deltaY * minutesPerPixel;
      const snappedDeltaMinutes = Math.round(rawDeltaMinutes / 15) * 15;

      if (mode === "resize") {
        // Resize hanya mengubah durasi ke bawah (minimal 15 menit)
        const newDuration = Math.max(15, initialDuration + snappedDeltaMinutes);
        const maxAllowedDuration = endHour * 60 - initialStartMinutes;
        const boundedDuration = Math.min(newDuration, Math.max(15, maxAllowedDuration));

        const top = ((initialStartMinutes - startHour * 60) / 60) * hourHeight;
        const height = (boundedDuration / 60) * hourHeight;

        setDragPreview((prev) =>
          prev
            ? {
                ...prev,
                targetDuration: boundedDuration,
                top,
                height,
              }
            : null
        );
      } else {
        // Move: Mengubah jam (vertikal) dan hari (horizontal)
        let newStartMinutes = initialStartMinutes + snappedDeltaMinutes;
        // Batasi rentang jam agar tidak keluar timeline
        newStartMinutes = Math.max(
          startHour * 60,
          Math.min(newStartMinutes, endHour * 60 - initialDuration)
        );

        // Hitung pergeseran hari
        const daysShift = Math.round(deltaX / columnWidth);
        const newDayIndex = Math.max(0, Math.min(6, initialDayIndex + daysShift));
        const targetDay = weekDays[newDayIndex];
        const targetDate = targetDay
          ? targetDay.toISOString().slice(0, 10)
          : task.scheduled_date || "";

        const top = ((newStartMinutes - startHour * 60) / 60) * hourHeight;
        const height = (initialDuration / 60) * hourHeight;

        setDragPreview((prev) =>
          prev
            ? {
                ...prev,
                targetDate,
                targetStartTime: minutesToTime(newStartMinutes),
                top,
                height,
                dayIndex: newDayIndex,
              }
            : null
        );
      }
    },
    [startHour, endHour, hourHeight, weekDays]
  );

  /**
   * Mengakhiri drag dan menyimpan perubahan melalui server action
   */
  const onPointerUp = useCallback(
    async (e: React.PointerEvent<HTMLElement>) => {
      if (!dragSession.current || !dragPreview) {
        dragSession.current = null;
        setDragPreview(null);
        return;
      }

      e.currentTarget.releasePointerCapture(e.pointerId);

      const { task } = dragSession.current;
      const { targetDate, targetStartTime, targetDuration } = dragPreview;

      // Cek apakah ada perubahan nyata
      const isDateChanged = task.scheduled_date !== targetDate;
      const isTimeChanged = task.start_time !== targetStartTime;
      const isDurationChanged = task.estimated_minutes !== targetDuration;

      if (!isDateChanged && !isTimeChanged && !isDurationChanged) {
        // Tidak ada perubahan, batalkan tanpa mutasi
        dragSession.current = null;
        setDragPreview(null);
        return;
      }

      setIsSaving(true);

      // Simpan perubahan ke server
      const result = await rescheduleTask(task.id, {
        scheduledDate: targetDate,
        startTime: targetStartTime,
        estimatedMinutes: targetDuration,
      });

      setIsSaving(false);
      dragSession.current = null;
      setDragPreview(null);

      if (!result.ok) {
        alert(result.error.message || "Gagal memperbarui jadwal tugas.");
      } else {
        onSuccess?.();
      }
    },
    [dragPreview, onSuccess]
  );

  return {
    dragPreview,
    isSaving,
    startDrag,
    onPointerMove,
    onPointerUp,
  };
}
