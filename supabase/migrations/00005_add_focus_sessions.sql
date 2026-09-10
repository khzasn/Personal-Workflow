-- Migration: 00005_add_focus_sessions.sql
-- Fase 4: Focus Timer (Tabel Sesi Fokus & Proteksi Single Active Session)

CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  paused_seconds INTEGER NOT NULL DEFAULT 0,
  planned_minutes INTEGER NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa query sesi per user dan per task
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task_id ON public.focus_sessions(task_id);

-- Constraint parsial: Pastikan satu user hanya memiliki MAKSIMAL SATU sesi aktif ('running' atau 'paused')
CREATE UNIQUE INDEX IF NOT EXISTS idx_focus_sessions_single_active
ON public.focus_sessions(user_id)
WHERE status IN ('running', 'paused');

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: User hanya boleh mengakses dan mengubah focus session miliknya sendiri
CREATE POLICY "Users can view their own focus sessions"
ON public.focus_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus sessions"
ON public.focus_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus sessions"
ON public.focus_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus sessions"
ON public.focus_sessions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
