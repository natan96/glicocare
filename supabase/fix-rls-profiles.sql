-- ============================================================
-- CORREÇÃO: Recursão infinita na política RLS de profiles
-- Execute este SQL no Supabase: SQL Editor > New query
-- ============================================================

-- 1. Remove a política problemática
drop policy if exists "Usuário lê seu perfil" on public.profiles;

-- 2. Cria uma função com security definer para verificar parentesco
--    (security definer = a função lê a tabela SEM acionar RLS, evitando o loop)
create or replace function public.current_user_is_parent_of(profile_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'parent'
      and parent_of = profile_id
  );
$$;

-- 3. Recria a política usando a função (sem recursão)
create policy "Usuário lê seu perfil"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.current_user_is_parent_of(id)
  );
