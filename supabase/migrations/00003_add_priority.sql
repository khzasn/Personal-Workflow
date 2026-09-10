-- Migration: 00003_add_priority.sql
-- Fase 1: Tambah kolom priority pada tabel tasks

ALTER TABLE public.tasks
ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'
CHECK (priority IN ('urgent', 'high', 'medium', 'low'));

CREATE INDEX idx_tasks_priority ON public.tasks(priority);
