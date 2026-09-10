"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type MouseEvent,
} from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Plus,
  Repeat,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import type { RecurrenceRule, Task, TaskCategory, TaskPriority } from "@/types";
import { createTask, deleteTask, updateTaskStatus } from "./actions";
import { createTaskSeries, deleteRecurringTask } from "./recurrence/actions";
import { RecurrencePicker } from "./recurrence/recurrence-picker";
import { PriorityBadge } from "./priority-badge";
import { DeadlineBadge } from "./deadline-badge";
import { useFocus } from "@/features/focus/focus-context";


interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  tasks: Task[];
  onPreviousDay: () => void;
  onNextDay: () => void;
  initialStartTime?: string | null;
}

type ComposerMode = { kind: "timed"; startMinutes: number } | { kind: "unscheduled" };

const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 22;
const DEFAULT_DURATION = 30;
const SLOT_MINUTES = 30;
const HOUR_HEIGHT = 72;
const TIME_GUTTER = 64;

const categoryStyle: Record<TaskCategory, string> = {
  Kerja:
    "border-blue-200/80 bg-blue-50/90 text-blue-950 border-l-[3.5px] border-l-blue-500 dark:border-blue-800/80 dark:bg-blue-950/50 dark:text-blue-100 shadow-2xs",
  Belajar:
    "border-emerald-200/80 bg-emerald-50/90 text-emerald-950 border-l-[3.5px] border-l-emerald-500 dark:border-emerald-800/80 dark:bg-emerald-950/50 dark:text-emerald-100 shadow-2xs",
  Pribadi:
    "border-purple-200/80 bg-purple-50/90 text-purple-950 border-l-[3.5px] border-l-purple-500 dark:border-purple-800/80 dark:bg-purple-950/50 dark:text-purple-100 shadow-2xs",
  Lainnya:
    "border-amber-200/80 bg-amber-50/90 text-amber-950 border-l-[3.5px] border-l-amber-500 dark:border-amber-800/80 dark:bg-amber-950/50 dark:text-amber-100 shadow-2xs",
};

function toMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function toTimeValue(minutes: number) {
  const safeMinutes = Math.max(0, Math.min(minutes, 23 * 60 + 59));
  return `${String(Math.floor(safeMinutes / 60)).padStart(2, "0")}:${String(
    safeMinutes % 60,
  ).padStart(2, "0")}`;
}

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function calculateColumns(tasks: Task[]) {
  const layouts = new Map<string, { column: number; columns: number }>();
  const sorted = [...tasks].sort(
    (a, b) => toMinutes(a.start_time!) - toMinutes(b.start_time!),
  );
  let group: Task[] = [];
  let groupEnd = -1;

  function placeGroup(items: Task[]) {
    const columnEnds: number[] = [];
    const assignments = new Map<string, number>();

    for (const task of items) {
      const start = toMinutes(task.start_time!);
      const end = start + Math.max(task.estimated_minutes, 1);
      let column = columnEnds.findIndex((columnEnd) => columnEnd <= start);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(end);
      } else {
        columnEnds[column] = end;
      }
      assignments.set(task.id, column);
    }

    const columns = Math.max(columnEnds.length, 1);
    for (const task of items) {
      layouts.set(task.id, { column: assignments.get(task.id) ?? 0, columns });
    }
  }

  for (const task of sorted) {
    const start = toMinutes(task.start_time!);
    const end = start + Math.max(task.estimated_minutes, 1);
    if (group.length === 0 || start < groupEnd) {
      group.push(task);
      groupEnd = Math.max(groupEnd, end);
    } else {
      placeGroup(group);
      group = [task];
      groupEnd = end;
    }
  }
  placeGroup(group);

  return layouts;
}

export function TaskDrawer({
  isOpen,
  onClose,
  selectedDate,
  tasks,
  onPreviousDay,
  onNextDay,
  initialStartTime,
}: TaskDrawerProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const lastScrolledDateRef = useRef<string | null>(null);
  const [composer, setComposer] = useState<ComposerMode | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("Kerja");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [duration, setDuration] = useState(String(DEFAULT_DURATION));
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({ frequency: "none" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [isMutating, startTransition] = useTransition();

  const dayTasks = useMemo(
    () => (selectedDate ? tasks.filter((task) => task.scheduled_date === selectedDate) : []),
    [selectedDate, tasks],
  );
  const timedTasks = useMemo(
    () => dayTasks.filter((task) => task.start_time),
    [dayTasks],
  );
  const unscheduledTasks = useMemo(
    () => dayTasks.filter((task) => !task.start_time),
    [dayTasks],
  );

  const { startHour, endHour } = useMemo(() => {
    if (timedTasks.length === 0) {
      return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
    }

    const earliest = Math.min(...timedTasks.map((task) => toMinutes(task.start_time!)));
    const latest = Math.max(
      ...timedTasks.map(
        (task) => toMinutes(task.start_time!) + Math.max(task.estimated_minutes, DEFAULT_DURATION),
      ),
    );

    return {
      startHour: Math.max(0, Math.min(DEFAULT_START_HOUR, Math.floor(earliest / 60))),
      endHour: Math.min(24, Math.max(DEFAULT_END_HOUR, Math.ceil(latest / 60))),
    };
  }, [timedTasks]);

  const timelineStart = startHour * 60;
  const timelineEnd = endHour * 60;
  const timelineHeight = (endHour - startHour) * HOUR_HEIGHT;
  const hourRows = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
  const taskLayouts = useMemo(() => calculateColumns(timedTasks), [timedTasks]);

  function resetComposer() {
    setComposer(null);
    setTitle("");
    setCategory("Kerja");
    setPriority("medium");
    setDuration(String(DEFAULT_DURATION));
    setRecurrence({ frequency: "none" });
    setErrorMsg(null);
  }

  function openComposer(nextComposer: ComposerMode) {
    setComposer(nextComposer);
    setTitle("");
    setCategory("Kerja");
    setPriority("medium");
    setDuration(String(DEFAULT_DURATION));
    setRecurrence({ frequency: "none" });
    setErrorMsg(null);
  }

  useEffect(() => {
    if (composer) {
      titleRef.current?.focus({ preventScroll: true });
    }
  }, [composer]);

  useEffect(() => {
    if (!isOpen) {
      lastScrolledDateRef.current = null;
      resetComposer();
      return;
    }
    if (initialStartTime) {
      openComposer({ kind: "timed", startMinutes: toMinutes(initialStartTime) });
    } else {
      resetComposer();
    }
  }, [isOpen, selectedDate, initialStartTime]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !isOpen) return;
      if (composer) resetComposer();
      else onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [composer, isOpen, onClose]);

  // Android Back button: push a history entry when drawer opens,
  // intercept popstate so Back closes drawer instead of leaving the page.
  useEffect(() => {
    if (!isOpen) return;

    // Push a dummy history entry so Back can be intercepted
    history.pushState({ drawerOpen: true }, "");

    function handlePopState() {
      // If composer is open, close it first (one step back)
      if (composer) {
        resetComposer();
        // Re-push so next Back still closes the drawer
        history.pushState({ drawerOpen: true }, "");
      } else {
        onClose();
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      // If the drawer closes via another path (not Back), pop the history entry
      // to keep the history stack clean
      if (history.state?.drawerOpen) {
        history.back();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const updateCurrentTime = () => setNow(new Date());
    updateCurrentTime();
    const interval = window.setInterval(updateCurrentTime, 60_000);

    return () => window.clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedDate) return;
    // Hindari scroll ulang jika tanggal yang sama sudah di-scroll saat drawer dibuka
    if (lastScrolledDateRef.current === selectedDate) return;

    const timer = window.setTimeout(() => {
      const container = scrollAreaRef.current;
      const timeline = timelineRef.current;
      if (!container || !timeline) return;

      const currentDate = new Date();
      const selectedIsToday = selectedDate === format(currentDate, "yyyy-MM-dd");
      const focusMinutes = initialStartTime
        ? toMinutes(initialStartTime)
        : selectedIsToday
          ? currentDate.getHours() * 60 + currentDate.getMinutes()
          : timedTasks.length > 0
            ? Math.min(...timedTasks.map((task) => toMinutes(task.start_time!)))
            : timelineStart;
      const focusTop = ((focusMinutes - timelineStart) / 60) * HOUR_HEIGHT;
      const containerRect = container.getBoundingClientRect();
      const timelineRect = timeline.getBoundingClientRect();

      container.scrollTo({
        top: Math.max(
          0,
          container.scrollTop + timelineRect.top - containerRect.top + focusTop - 160,
        ),
        behavior: "smooth",
      });
      lastScrolledDateRef.current = selectedDate;
    }, 350);

    return () => window.clearTimeout(timer);
  }, [isOpen, selectedDate, timelineStart, initialStartTime]);

  function handleTimelineClick(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("[data-calendar-interactive]")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetY = Math.max(0, Math.min(event.clientY - rect.top, timelineHeight - 1));
    const rawMinutes = timelineStart + (offsetY / HOUR_HEIGHT) * 60;
    const snappedMinutes = Math.floor(rawMinutes / SLOT_MINUTES) * SLOT_MINUTES;
    openComposer({ kind: "timed", startMinutes: snappedMinutes });
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDate || !composer || !title.trim()) return;

    setIsCreating(true);
    setErrorMsg(null);

    if (recurrence.frequency !== "none") {
      const startTimeVal =
        composer.kind === "timed" ? toTimeValue(composer.startMinutes) : null;

      const result = await createTaskSeries({
        title,
        category,
        priority,
        recurrenceRule: {
          ...recurrence,
          interval: recurrence.interval ?? 1,
          endsOn: recurrence.endsOn || null,
        },
        startsOn: selectedDate,
        startTime: startTimeVal,
        estimatedMinutes: Number(duration) || 30,
      });

      if (result.ok) {
        resetComposer();
      } else {
        setErrorMsg(result.error.message || "Gagal membuat tugas berulang.");
      }
    } else {
      const formData = new FormData(event.currentTarget);
      const result = await createTask(formData, crypto.randomUUID());

      if (result.ok) {
        resetComposer();
      } else {
        setErrorMsg(result.error.message || "Tugas belum berhasil disimpan.");
      }
    }

    setIsCreating(false);
  }

  function toggleTask(task: Task) {
    startTransition(() => {
      void updateTaskStatus(task.id, !task.is_completed);
    });
  }

  function removeTask(task: Task) {
    if (task.series_id) {
      const choice = window.prompt(
        "Tugas ini bagian dari seri berulang. Pilih tindakan:\n1 = Hanya tugas ini\n2 = Tugas ini dan yang akan datang\n3 = Semua tugas dalam seri\n\nKetik 1, 2, atau 3:",
        "1"
      );
      if (!choice) return;
      const mode = choice === "2" ? "future" : choice === "3" ? "all" : "single";
      startTransition(() => {
        void deleteRecurringTask(task.id, mode);
      });
      return;
    }

    if (!confirm("Hapus tugas ini?")) return;
    startTransition(() => {
      void deleteTask(task.id);
    });
  }

  const formattedDate = selectedDate
    ? format(parseISO(selectedDate), "EEEE, d MMMM yyyy", { locale: id })
    : "Agenda harian";

  const currentMinutes = now ? now.getHours() * 60 + now.getMinutes() : null;
  const currentTimeTop =
    currentMinutes === null ? null : ((currentMinutes - timelineStart) / 60) * HOUR_HEIGHT;
  const showCurrentTime =
    now !== null &&
    selectedDate === format(now, "yyyy-MM-dd") &&
    currentTimeTop !== null &&
    currentTimeTop >= 0 &&
    currentTimeTop <= timelineHeight;

  const composerTop =
    composer?.kind === "timed"
      ? Math.min(
          ((composer.startMinutes - timelineStart) / 60) * HOUR_HEIGHT,
          Math.max(0, timelineHeight - 238),
        )
      : 0;

  return (
    <div
      className={`fixed inset-0 z-50 transition-[visibility] duration-300 ${
        isOpen ? "visible" : "invisible delay-300"
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        aria-label="Tutup agenda harian"
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/25 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        aria-label="Agenda harian"
        className={`absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden border-l border-white/50 bg-[#fbfaff] shadow-2xl transition-transform duration-300 ease-out dark:border-white/5 dark:bg-[#0d0d16] lg:w-[72vw] lg:max-w-[860px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="z-30 border-b bg-white/90 px-4 py-4 backdrop-blur-xl dark:bg-slate-950/90 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <CalendarDays className="h-3.5 w-3.5" />
                Rencana harian
              </div>
              <h2 className="truncate text-xl font-bold capitalize tracking-tight text-foreground sm:text-2xl">
                {formattedDate}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {dayTasks.length} tugas · Klik area waktu untuk menambahkan agenda
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onPreviousDay}
                  className="flex h-8 w-8 items-center justify-center rounded-full border bg-background/70 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Hari sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  Daily flow
                </span>
                <button
                  type="button"
                  onClick={onNextDay}
                  className="flex h-8 w-8 items-center justify-center rounded-full border bg-background/70 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Hari berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border bg-background p-2.5 text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
              aria-label="Tutup panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div
          ref={scrollAreaRef}
          className="pretty-scrollbar flex-1 overflow-y-auto overscroll-contain"
        >
          <section className="border-b bg-white px-4 py-4 dark:bg-slate-950 sm:px-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Tanpa waktu
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground/75">
                  Tugas untuk hari ini yang belum diberi jam
                </p>
              </div>
              <button
                type="button"
                onClick={() => openComposer({ kind: "unscheduled" })}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/15"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah
              </button>
            </div>

            {composer?.kind === "unscheduled" && (
              <QuickComposer
                titleRef={titleRef}
                title={title}
                onTitleChange={setTitle}
                category={category}
                onCategoryChange={setCategory}
                priority={priority}
                onPriorityChange={setPriority}
                duration={duration}
                onDurationChange={setDuration}
                recurrence={recurrence}
                onRecurrenceChange={setRecurrence}
                selectedDate={selectedDate}
                startTime={null}
                errorMsg={errorMsg}
                isCreating={isCreating}
                onSubmit={handleCreate}
                onCancel={resetComposer}
              />
            )}

            <div className="flex gap-2 overflow-x-auto pb-1">
              {unscheduledTasks.length === 0 && composer?.kind !== "unscheduled" ? (
                <button
                  type="button"
                  onClick={() => openComposer({ kind: "unscheduled" })}
                  className="w-full rounded-xl border border-dashed px-4 py-3 text-left text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5"
                >
                  Semua tugas sudah memiliki waktu. Tambahkan catatan tanpa jam jika diperlukan.
                </button>
              ) : (
                unscheduledTasks.map((task) => (
                  <UnscheduledCard
                    key={task.id}
                    task={task}
                    disabled={isMutating}
                    onToggle={() => toggleTask(task)}
                    onDelete={() => removeTask(task)}
                  />
                ))
              )}
            </div>
          </section>

          <section className="px-2 py-5 sm:px-5">
            <div className="mb-3 flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock3 className="h-4 w-4 text-primary" />
                Timeline
              </div>
              <span className="rounded-full border bg-white px-2.5 py-1 text-[11px] font-semibold text-muted-foreground dark:bg-slate-900">
                Interval 30 menit
              </span>
            </div>

            <div
              ref={timelineRef}
              className="relative cursor-crosshair overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-slate-950"
              style={{ height: timelineHeight }}
              onClick={handleTimelineClick}
            >
              {hourRows.map((hour, index) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-t border-slate-200/80 dark:border-slate-800"
                  style={{ top: index * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                >
                  <span className="absolute left-0 top-0 w-14 -translate-y-1/2 bg-white pr-2 text-right text-[11px] font-medium tabular-nums text-muted-foreground dark:bg-slate-950">
                    {hourLabel(hour)}
                  </span>
                  <div
                    className="absolute bottom-1/2 border-t border-dashed border-slate-200/70 dark:border-slate-800/80"
                    style={{ left: TIME_GUTTER, right: 0 }}
                  />
                </div>
              ))}
              <div
                className="absolute inset-y-0 border-l border-slate-200 dark:border-slate-800"
                style={{ left: TIME_GUTTER }}
              />

              {showCurrentTime && now && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                  style={{ top: currentTimeTop! }}
                >
                  <span className="w-14 pr-2 text-right text-[10px] font-black tabular-nums text-rose-500">
                    {format(now, "HH:mm")}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                  <span className="h-[2px] flex-1 bg-gradient-to-r from-rose-500 to-rose-400/30" />
                </div>
              )}

              {timedTasks.map((task) => {
                const start = toMinutes(task.start_time!);
                const visibleStart = Math.max(start, timelineStart);
                const visibleEnd = Math.min(start + task.estimated_minutes, timelineEnd);
                const top = ((visibleStart - timelineStart) / 60) * HOUR_HEIGHT;
                const height = Math.max(((visibleEnd - visibleStart) / 60) * HOUR_HEIGHT, 30);
                const layout = taskLayouts.get(task.id) ?? { column: 0, columns: 1 };
                const availableWidth = `calc((100% - ${TIME_GUTTER + 12}px) / ${layout.columns})`;

                return (
                  <TimedTaskCard
                    key={task.id}
                    task={task}
                    disabled={isMutating}
                    top={top}
                    height={height}
                    width={availableWidth}
                    column={layout.column}
                    columns={layout.columns}
                    onToggle={() => toggleTask(task)}
                    onDelete={() => removeTask(task)}
                  />
                );
              })}

              {composer?.kind === "timed" && (
                <div
                  data-calendar-interactive
                  className="absolute z-30"
                  style={{ left: TIME_GUTTER + 6, right: 8, top: composerTop }}
                >
                  <QuickComposer
                    titleRef={titleRef}
                    title={title}
                    onTitleChange={setTitle}
                    category={category}
                    onCategoryChange={setCategory}
                    priority={priority}
                    onPriorityChange={setPriority}
                    duration={duration}
                    onDurationChange={setDuration}
                    recurrence={recurrence}
                    onRecurrenceChange={setRecurrence}
                    selectedDate={selectedDate}
                    startTime={toTimeValue(composer.startMinutes)}
                    errorMsg={errorMsg}
                    isCreating={isCreating}
                    onSubmit={handleCreate}
                    onCancel={resetComposer}
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

interface QuickComposerProps {
  titleRef: React.RefObject<HTMLInputElement | null>;
  title: string;
  onTitleChange: (value: string) => void;
  category: TaskCategory;
  onCategoryChange: (value: TaskCategory) => void;
  priority: TaskPriority;
  onPriorityChange: (value: TaskPriority) => void;
  duration: string;
  onDurationChange: (value: string) => void;
  recurrence: RecurrenceRule;
  onRecurrenceChange: (value: RecurrenceRule) => void;
  selectedDate: string | null;
  startTime: string | null;
  errorMsg: string | null;
  isCreating: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

function QuickComposer({
  titleRef,
  title,
  onTitleChange,
  category,
  onCategoryChange,
  priority,
  onPriorityChange,
  duration,
  onDurationChange,
  recurrence,
  onRecurrenceChange,
  selectedDate,
  startTime,
  errorMsg,
  isCreating,
  onSubmit,
  onCancel,
}: QuickComposerProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-3 rounded-2xl border border-primary/25 bg-white p-3 shadow-xl ring-4 ring-primary/5 dark:bg-slate-900"
    >
      <input type="hidden" name="scheduled_date" value={selectedDate ?? ""} />
      <input type="hidden" name="start_time" value={startTime ?? ""} />
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-primary">
          {startTime ? `${startTime} · Agenda baru` : "Tugas tanpa waktu"}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-1 text-muted-foreground hover:bg-muted"
          aria-label="Batalkan"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        ref={titleRef}
        name="title"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        maxLength={100}
        required
        placeholder="Tulis judul tugas…"
        className="w-full border-0 bg-transparent px-0 py-1 text-base font-semibold outline-none placeholder:font-medium placeholder:text-muted-foreground/60"
      />
      <input type="hidden" name="description" value="" />
      <div className="mt-2 grid grid-cols-3 gap-1.5 sm:gap-2">
        <select
          name="category"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value as TaskCategory)}
          className="min-w-0 rounded-lg border bg-background px-1.5 py-1.5 sm:px-2.5 sm:py-2 text-[11px] sm:text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Kategori"
        >
          <option value="Kerja">Kerja</option>
          <option value="Belajar">Belajar</option>
          <option value="Pribadi">Pribadi</option>
          <option value="Lainnya">Lainnya</option>
        </select>
        <select
          name="priority"
          value={priority}
          onChange={(event) => onPriorityChange(event.target.value as TaskPriority)}
          className="min-w-0 rounded-lg border bg-background px-1.5 py-1.5 sm:px-2.5 sm:py-2 text-[11px] sm:text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Prioritas"
        >
          <option value="urgent">🔴 Urgent</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟣 Medium</option>
          <option value="low">⚪ Low</option>
        </select>
        <select
          name="estimated_minutes"
          value={duration}
          onChange={(event) => onDurationChange(event.target.value)}
          className="min-w-0 rounded-lg border bg-background px-1.5 py-1.5 sm:px-2.5 sm:py-2 text-[11px] sm:text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Durasi"
        >
          <option value="15">15 menit</option>
          <option value="30">30 menit</option>
          <option value="45">45 menit</option>
          <option value="60">1 jam</option>
          <option value="90">1,5 jam</option>
          <option value="120">2 jam</option>
        </select>
      </div>

      {/* Kontrol Pengulangan Tugas (Recurrence Picker) */}
      <div className="mt-3 pt-2.5 border-t border-border/50">
        <RecurrencePicker value={recurrence} onChange={onRecurrenceChange} />
      </div>

      {errorMsg && <p className="mt-2 text-xs font-medium text-destructive">{errorMsg}</p>}
      <div className="mt-3 flex items-center justify-end gap-2">
        <span className="mr-auto hidden text-[10px] text-muted-foreground sm:inline">
          Enter untuk menyimpan · Esc untuk batal
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isCreating || !title.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          {isCreating ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </form>
  );
}

function UnscheduledCard({
  task,
  disabled,
  onToggle,
  onDelete,
}: {
  task: Task;
  disabled: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { openFocusModal } = useFocus();

  return (
    <div
      className={`group flex min-w-[220px] max-w-[280px] items-start gap-2 rounded-xl border px-3 py-2.5 ${
        task.is_completed ? "bg-muted/50 opacity-60" : categoryStyle[task.category]
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <button type="button" onClick={onToggle} aria-label="Ubah status tugas" className="mt-0.5">
        {task.is_completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className={`truncate text-xs font-bold ${task.is_completed ? "line-through" : ""}`}>
            {task.title}
          </p>
          {task.series_id && (
            <Repeat className="h-3 w-3 shrink-0 text-primary opacity-80" />
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <PriorityBadge priority={task.priority} compact />
          <DeadlineBadge deadlineAt={task.deadline_at} isCompleted={task.is_completed} compact />
        </div>
        <p className="mt-1 text-[10px] font-medium opacity-65">{task.estimated_minutes} menit</p>
      </div>
      <div className="flex items-center gap-0.5">
        {!task.is_completed && (
          <button
            type="button"
            onClick={() => openFocusModal(task)}
            className="rounded p-1 text-primary/80 opacity-100 sm:opacity-0 transition hover:bg-primary/10 hover:text-primary sm:group-hover:opacity-100 focus:opacity-100"
            title="Mulai sesi fokus"
            aria-label="Mulai sesi fokus"
          >
            <Timer className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-1 text-muted-foreground opacity-100 sm:opacity-0 transition hover:bg-black/5 hover:text-destructive sm:group-hover:opacity-100 focus:opacity-100"
          aria-label="Hapus tugas"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function TimedTaskCard({
  task,
  disabled,
  top,
  height,
  width,
  column,
  columns,
  onToggle,
  onDelete,
}: {
  task: Task;
  disabled: boolean;
  top: number;
  height: number;
  width: string;
  column: number;
  columns: number;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { openFocusModal } = useFocus();

  return (
    <article
      data-calendar-interactive
      className={`group absolute z-10 overflow-hidden rounded-xl border-l-4 px-2.5 py-2 shadow-sm transition hover:z-20 hover:brightness-[0.98] ${
        task.is_completed ? "border-slate-300 bg-slate-100 text-slate-500 opacity-65" : categoryStyle[task.category]
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      style={{
        top,
        height,
        left: `calc(${TIME_GUTTER + 6}px + (${column} * (100% - ${TIME_GUTTER + 12}px) / ${columns}))`,
        width,
      }}
    >
      <div className="flex h-full items-start gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="mt-0.5 shrink-0 opacity-70 hover:opacity-100"
          aria-label={task.is_completed ? "Tandai belum selesai" : "Tandai selesai"}
        >
          {task.is_completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className={`truncate text-xs font-bold leading-tight ${task.is_completed ? "line-through" : ""}`}>
              {task.title}
            </p>
            {task.series_id && (
              <Repeat className="h-2.5 w-2.5 shrink-0 text-primary opacity-80" />
            )}
          </div>
          {height >= 58 && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <PriorityBadge priority={task.priority} compact />
              <DeadlineBadge deadlineAt={task.deadline_at} isCompleted={task.is_completed} compact />
            </div>
          )}
          {height >= 42 && (
            <p className="mt-1 truncate text-[10px] font-semibold opacity-65">
              {task.start_time!.slice(0, 5)} · {task.estimated_minutes} menit
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {!task.is_completed && (
            <button
              type="button"
              onClick={() => openFocusModal(task)}
              className="rounded p-1 text-primary/80 opacity-100 sm:opacity-0 transition hover:bg-primary/10 hover:text-primary sm:group-hover:opacity-100 focus:opacity-100"
              title="Mulai sesi fokus"
              aria-label="Mulai sesi fokus"
            >
              <Timer className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1 text-muted-foreground opacity-100 sm:opacity-0 transition hover:bg-black/5 hover:text-destructive sm:group-hover:opacity-100 focus:opacity-100"
            aria-label="Hapus tugas"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
