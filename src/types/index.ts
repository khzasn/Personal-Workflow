/**
 * src/types/index.ts
 * Domain types — sesuai Architecture §2 dan PRD §11
 */

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

export type TaskCategory =
  | "Kerja"
  | "Belajar"
  | "Pribadi"
  | "Lainnya";

export const TASK_CATEGORIES: TaskCategory[] = [
  "Kerja",
  "Belajar",
  "Pribadi",
  "Lainnya",
];

export type TaskPriority = "urgent" | "high" | "medium" | "low";

export const TASK_PRIORITIES: TaskPriority[] = [
  "urgent",
  "high",
  "medium",
  "low",
];

export const AI_FALLBACK_CATEGORY: TaskCategory = "Lainnya";
export const AI_FALLBACK_ESTIMATED_MINUTES = 30;

export type RecurrenceFrequency = "none" | "daily" | "weekday" | "weekly" | "monthly" | "custom";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number; // default 1 (e.g. every 2 weeks)
  weekdays?: number[]; // 1 = Monday, 7 = Sunday
  endsOn?: string | null; // YYYY-MM-DD
}

export interface TaskSeries {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  recurrence_rule: string; // JSON string of RecurrenceRule
  timezone: string;
  starts_on: string;
  ends_on: string | null;
  start_time: string | null;
  estimated_minutes: number;
  priority: TaskPriority;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  client_request_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  estimated_minutes: number;
  scheduled_date: string | null;
  start_time: string | null;
  deadline_at: string | null;
  series_id: string | null;
  occurrence_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  estimated_minutes?: number;
  scheduled_date?: string;
  start_time?: string | null;
  deadline_at?: string;
  recurrence?: RecurrenceRule;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  estimated_minutes?: number;
  scheduled_date?: string | null;
  start_time?: string | null;
  deadline_at?: string | null;
}

// ---------------------------------------------------------------------------
// Briefing
// ---------------------------------------------------------------------------

export interface Briefing {
  id: string;
  user_id: string;
  source_name: string;
  feed_url: string;
  article_title: string;
  article_url: string;
  published_at: string | null;
  summary: [string, string, string]; // Exactly 3 bullet points
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Action Result Contract — Architecture §4.7
// ---------------------------------------------------------------------------

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code:
          | "UNAUTHORIZED"
          | "VALIDATION_ERROR"
          | "NOT_FOUND"
          | "RATE_LIMITED"
          | "INTERNAL_ERROR";
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };

// ---------------------------------------------------------------------------
// Task Statistics
// ---------------------------------------------------------------------------

export interface TaskStats {
  activeCount: number;
  completedCount: number;
  totalEstimatedMinutesActive: number;
}

// ---------------------------------------------------------------------------
// Focus Session — Architecture §Phase 4
// ---------------------------------------------------------------------------

export type FocusSessionStatus = "running" | "paused" | "completed" | "cancelled";

export interface FocusSession {
  id: string;
  user_id: string;
  task_id: string | null;
  started_at: string;
  ended_at: string | null;
  paused_at: string | null;
  paused_seconds: number;
  planned_minutes: number;
  status: FocusSessionStatus;
  created_at: string;
  task?: {
    id: string;
    title: string;
    category: TaskCategory;
    priority: TaskPriority;
  } | null;
}

export interface StartFocusInput {
  taskId?: string | null;
  plannedMinutes: number;
}

// ---------------------------------------------------------------------------
// Habit Tracker
// ---------------------------------------------------------------------------

export type HabitFrequency = "daily" | "weekly" | "monthly";
export type HabitStatus = "done" | "skipped" | "pending";
export type HabitReminderTime = "morning" | "afternoon" | "evening";
export type HabitColor = "violet" | "blue" | "green" | "rose" | "amber" | "orange" | "cyan" | "pink";

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  color: HabitColor;
  target_value: number;
  target_unit: string;
  frequency: HabitFrequency;
  frequency_days: number[] | null;
  reminder_time: HabitReminderTime | null;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string; // YYYY-MM-DD
  status: "done" | "skipped";
  created_at: string;
}

export interface HabitWithTodayStatus extends Habit {
  todayStatus: HabitStatus;
  weekCompletions: HabitCompletion[];
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // 0-100
  totalCompleted: number;
  completionsThisMonth: HabitCompletion[];
}