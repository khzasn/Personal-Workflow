"use client";

/**
 * src/features/reminders/reminder-context.tsx
 * Provider React untuk manajemen alarm & pengingat tugas harian:
 * - Memeriksa tugas hari ini yang mencapai start_time (ticker setiap 15 detik).
 * - Memicu nada bel (chime) + notifikasi browser OS + banner in-app.
 * - Idempotent guard via sessionStorage (mencegah alarm berulang).
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Task } from "@/types";
import { todayLocalDate, timeToMinutes } from "@/lib/date-time";
import { playZenChime } from "@/lib/audio/chime";
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTaskNotification,
  isNotificationSupported,
} from "@/lib/notifications/browser-notification";

interface ReminderContextType {
  permission: NotificationPermission;
  isSoundEnabled: boolean;
  activeAlarmTask: Task | null;
  requestPermission: () => Promise<void>;
  toggleSound: () => void;
  dismissAlarm: () => void;
  testSound: () => void;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

const SOUND_STORAGE_KEY = "dayflow_sound_enabled";

export function ReminderProvider({
  tasks,
  children,
}: {
  tasks: Task[];
  children: ReactNode;
}) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [activeAlarmTask, setActiveAlarmTask] = useState<Task | null>(null);

  // Set ID tugas yang sudah dibunyikan hari ini
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  // Inisialisasi izin & pengaturan audio dari storage
  useEffect(() => {
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    }

    try {
      const stored = localStorage.getItem(SOUND_STORAGE_KEY);
      if (stored !== null) {
        setIsSoundEnabled(stored === "true");
      }
    } catch {
      // Abaikan jika localStorage tidak dapat diakses
    }

    // Muat riwayat tugas yang sudah dibunyikan hari ini dari sessionStorage
    try {
      const today = todayLocalDate();
      const sessionKey = `dayflow_notified_${today}`;
      const sessionData = sessionStorage.getItem(sessionKey);
      if (sessionData) {
        const parsed = JSON.parse(sessionData) as string[];
        notifiedIdsRef.current = new Set(parsed);
      }
    } catch {
      // Abaikan jika sessionStorage tidak dapat diakses
    }
  }, []);

  function markTaskNotified(taskId: string) {
    notifiedIdsRef.current.add(taskId);
    try {
      const today = todayLocalDate();
      const sessionKey = `dayflow_notified_${today}`;
      sessionStorage.setItem(
        sessionKey,
        JSON.stringify(Array.from(notifiedIdsRef.current))
      );
    } catch {
      // Abaikan
    }
  }

  // Ticker pengecekan jam tugas setiap 15 detik
  useEffect(() => {
    function checkReminders() {
      const today = todayLocalDate();
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Cari tugas hari ini yang belum selesai dan punya start_time
      const todaysTasks = tasks.filter(
        (t) =>
          !t.is_completed &&
          t.scheduled_date === today &&
          Boolean(t.start_time)
      );

      for (const task of todaysTasks) {
        if (!task.start_time) continue;
        if (notifiedIdsRef.current.has(task.id)) continue;

        const taskStartMin = timeToMinutes(task.start_time);

        // Pemicu: Tepat saat jam tiba (toleransi keterlambatan s/d 3 menit)
        if (
          currentMinutes >= taskStartMin &&
          currentMinutes <= taskStartMin + 3
        ) {
          // Tandai sudah dibunyikan
          markTaskNotified(task.id);

          // Bunyikan audio chime jika aktif
          if (isSoundEnabled) {
            playZenChime();
          }

          // Kirim notifikasi browser jika diizinkan
          sendTaskNotification(task);

          // Tampilkan in-app alarm banner
          setActiveAlarmTask(task);
          break; // Tampilkan satu alarm utama per tick
        }
      }
    }

    // Cek pertama kali
    checkReminders();

    const interval = setInterval(checkReminders, 15000); // 15 detik
    return () => clearInterval(interval);
  }, [tasks, isSoundEnabled]);

  async function handleRequestPermission() {
    const res = await requestNotificationPermission();
    setPermission(res);
  }

  function toggleSound() {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      } catch {
        // Abaikan
      }
      return next;
    });
  }

  function dismissAlarm() {
    setActiveAlarmTask(null);
  }

  function testSound() {
    playZenChime();
  }

  return (
    <ReminderContext.Provider
      value={{
        permission,
        isSoundEnabled,
        activeAlarmTask,
        requestPermission: handleRequestPermission,
        toggleSound,
        dismissAlarm,
        testSound,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminder() {
  const ctx = useContext(ReminderContext);
  if (!ctx) {
    throw new Error("useReminder must be used within a ReminderProvider");
  }
  return ctx;
}
