-- ============================================================
-- Migration: Buat tabel journal_entries untuk fitur Jurnal Harian
-- Jalankan script ini di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================================

create table if not exists public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  content     text not null,
  mood        text not null check (mood in ('happy', 'excited', 'neutral', 'tired', 'sad')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index untuk query per user, diurutkan terbaru
create index if not exists journal_entries_user_id_created_at
  on public.journal_entries (user_id, created_at desc);

-- Row Level Security: setiap user hanya bisa akses entri miliknya sendiri
alter table public.journal_entries enable row level security;

create policy "Users can view their own journal entries"
  on public.journal_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own journal entries"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own journal entries"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger journal_entries_updated_at
  before update on public.journal_entries
  for each row execute function public.handle_updated_at();