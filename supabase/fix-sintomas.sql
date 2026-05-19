-- ============================================================
-- Remover constraint de humor e adaptar para sintomas livres
-- Execute no Supabase: SQL Editor > New query
-- ============================================================

alter table public.mood_entries
  drop constraint if exists mood_entries_mood_level_check;
