-- Migration: Fitur Habit Tracker
-- Jalankan di Supabase SQL Editor

CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '✅',
  color TEXT NOT NULL DEFAULT 'violet',
  target_value INT NOT NULL DEFAULT 1,
  target_unit TEXT NOT NULL DEFAULT 'kali',
  frequency TEXT NOT NULL DEFAULT 'daily',
  frequency_days INT[] DEFAULT NULL,
  reminder_time TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('done', 'skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (habit_id, completed_date)
);

-- RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habits_own" ON public.habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "completions_own" ON public.habit_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);