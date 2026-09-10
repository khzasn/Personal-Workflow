-- Migration: 00004_add_task_series.sql
-- Fase 3: Recurring Tasks (Tabel Seri Tugas & Kolom Relasi)

-- 1. Buat tabel task_series untuk menyimpan aturan perulangan tugas
CREATE TABLE IF NOT EXISTS public.task_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Kerja',
  recurrence_rule TEXT NOT NULL, -- JSON string berisi format aturan pengulangan
  timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok',
  starts_on DATE NOT NULL,
  ends_on DATE,
  start_time TIME,
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa query seri per user
CREATE INDEX IF NOT EXISTS idx_task_series_user_id ON public.task_series(user_id);

-- 2. Tambahkan kolom relasi pada tabel tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.task_series(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS occurrence_date DATE;

-- 3. Cegah duplikasi occurrence untuk series yang sama pada tanggal yang sama
CREATE UNIQUE INDEX IF NOT EXISTS tasks_series_occurrence_unique
ON public.tasks(series_id, occurrence_date)
WHERE series_id IS NOT NULL;

-- 4. Aktifkan Row Level Security (RLS) pada task_series
ALTER TABLE public.task_series ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: User hanya boleh mengakses dan memodifikasi series miliknya sendiri
CREATE POLICY "Users can view their own task series"
ON public.task_series FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task series"
ON public.task_series FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task series"
ON public.task_series FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task series"
ON public.task_series FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
