-- Migration: 00001_initial_schema.sql
-- Fase 1: Setup Tabel Tugas (tasks) dan Briefing (briefings)

-- 1. Create tasks table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_request_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    estimated_minutes INTEGER NOT NULL DEFAULT 30,
    scheduled_date DATE,
    deadline_at TIMESTAMPTZ,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT tasks_idempotency UNIQUE (user_id, client_request_id)
);

-- 2. Create briefings table
CREATE TABLE public.briefings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_name TEXT NOT NULL,
    feed_url TEXT NOT NULL,
    article_title TEXT NOT NULL,
    article_url TEXT NOT NULL,
    published_at TIMESTAMPTZ,
    summary JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT briefings_summary_three_items CHECK (jsonb_array_length(summary) = 3)
);

-- 3. Setup Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;

-- Tasks Policies
CREATE POLICY "Users can only view their own tasks" 
    ON public.tasks FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" 
    ON public.tasks FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
    ON public.tasks FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
    ON public.tasks FOR DELETE 
    USING (auth.uid() = user_id);

-- Briefings Policies
CREATE POLICY "Users can only view their own briefings" 
    ON public.briefings FOR SELECT 
    USING (auth.uid() = user_id);

-- Note: Briefings are inserted by the background job (admin service role), 
-- which bypasses RLS, so we don't strictly need an INSERT policy for users here.
-- But we can add it if needed later.

-- 4. Setup triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_tasks_updated
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_briefings_updated
    BEFORE UPDATE ON public.briefings
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
