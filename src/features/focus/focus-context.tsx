"use client";

/**
 * src/features/focus/focus-context.tsx
 * React Context untuk mengelola lifecycle Focus Timer secara global di dashboard:
 * - Menyediakan trigger mulai fokus dari tombol mana pun (task list, drawer, calendar).
 * - Menampilkan FocusPlayer mengambang secara persistent.
 * - Menangani dialog konfirmasi dan ringkasan selesai.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { FocusSession, Task } from "@/types";
import {
  getActiveFocusSession,
  startFocusSession,
  completeFocusSession,
} from "./focus-actions";
import { FocusTimerModal } from "./focus-timer-modal";
import { FocusPlayer } from "./focus-player";
import { FocusSessionSummary } from "./focus-session-summary";

interface FocusContextType {
  activeSession: FocusSession | null;
  openFocusModal: (task?: Task | null) => void;
  refreshActiveSession: () => Promise<void>;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export function FocusProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession?: FocusSession | null;
}) {
  const [activeSession, setActiveSession] = useState<FocusSession | null>(
    initialSession || null
  );

  // State modal mulai fokus
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [targetTask, setTargetTask] = useState<Task | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // State modal summary selesai
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [, startTransition] = useTransition();

  // Sinkronisasi sesi aktif saat mount atau via revalidate
  async function refreshActiveSession() {
    const res = await getActiveFocusSession();
    if (res.ok) {
      setActiveSession(res.data);
    }
  }

  useEffect(() => {
    if (initialSession === undefined) {
      void refreshActiveSession();
    }
  }, [initialSession]);

  function openFocusModal(task?: Task | null) {
    setTargetTask(task || null);
    setIsStartModalOpen(true);
  }

  async function handleStartSession(plannedMinutes: number, taskId?: string | null) {
    setIsStarting(true);
    const result = await startFocusSession({ plannedMinutes, taskId });
    setIsStarting(false);

    if (result.ok) {
      setActiveSession(result.data);
      setIsStartModalOpen(false);
      setTargetTask(null);
    } else {
      alert(result.error.message || "Gagal memulai sesi fokus.");
    }
  }

  async function handleConfirmComplete(completeTask: boolean) {
    if (!activeSession) return;
    setIsCompleting(true);

    const result = await completeFocusSession(activeSession.id, completeTask);
    setIsCompleting(false);

    if (result.ok) {
      setIsSummaryOpen(false);
      setActiveSession(null);
    } else {
      alert(result.error.message || "Gagal menyelesaikan sesi fokus.");
    }
  }

  return (
    <FocusContext.Provider
      value={{
        activeSession,
        openFocusModal,
        refreshActiveSession,
      }}
    >
      {children}

      {/* Persistent Mini Player jika ada sesi aktif */}
      {activeSession && (
        <FocusPlayer
          session={activeSession}
          onSessionFinish={() => setIsSummaryOpen(true)}
        />
      )}

      {/* Modal Pemilihan Durasi */}
      <FocusTimerModal
        isOpen={isStartModalOpen}
        onClose={() => {
          setIsStartModalOpen(false);
          setTargetTask(null);
        }}
        targetTask={targetTask}
        onStart={handleStartSession}
        isStarting={isStarting}
      />

      {/* Modal Kesimpulan saat Selesai */}
      {activeSession && (
        <FocusSessionSummary
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          session={activeSession}
          onConfirmComplete={handleConfirmComplete}
          isCompleting={isCompleting}
        />
      )}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error("useFocus must be used within a FocusProvider");
  }
  return context;
}
