-- ============================================================
-- GlicoCare — Schema do Banco de Dados
-- Execute este SQL no painel do Supabase: SQL Editor > New query
-- ============================================================

-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: profiles
-- Dados do perfil do usuário (complementa a tabela auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('user', 'parent')) default 'user',
  parent_of uuid references public.profiles(id) on delete set null,
  alert_email text,
  created_at timestamptz default now()
);

-- Criar perfil automaticamente quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TABELA: glucose_readings (registros de glicemia)
-- ============================================================
create table public.glucose_readings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  value integer not null check (value > 0 and value < 1000),
  source text not null check (source in ('sensor', 'dedo')) default 'dedo',
  context text not null check (context in ('jejum', 'pre-refeicao', 'pos-refeicao', 'antes-dormir', 'outro')) default 'outro',
  notes text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: insulin_doses (doses de insulina)
-- ============================================================
create table public.insulin_doses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(5,1) not null check (amount > 0),
  insulin_type text not null check (insulin_type in ('basal', 'bolus')),
  brand text,
  notes text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: meals (refeições)
-- ============================================================
create table public.meals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  description text not null,
  carbs_estimate integer check (carbs_estimate >= 0),
  notes text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: physical_activities (atividades físicas)
-- ============================================================
create table public.physical_activities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_type text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  intensity text not null check (intensity in ('leve', 'moderada', 'intensa')),
  notes text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: mood_entries (humor)
-- ============================================================
create table public.mood_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  mood_level text not null check (mood_level in ('otima', 'bem', 'cansada', 'mal')),
  notes text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Garante que cada usuário só acessa seus próprios dados
-- ============================================================

alter table public.profiles enable row level security;
alter table public.glucose_readings enable row level security;
alter table public.insulin_doses enable row level security;
alter table public.meals enable row level security;
alter table public.physical_activities enable row level security;
alter table public.mood_entries enable row level security;

-- PROFILES: usuário lê/atualiza seu próprio perfil; pais leem o perfil da afilhada
create policy "Usuário lê seu perfil"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.parent_of = profiles.id
    )
  );

create policy "Usuário atualiza seu perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- GLUCOSE_READINGS: usuário gerencia os próprios; pais só leem
create policy "Usuário gerencia sua glicemia"
  on public.glucose_readings for all
  using (auth.uid() = user_id);

create policy "Pais leem glicemia da afilhada"
  on public.glucose_readings for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'parent'
        and p.parent_of = glucose_readings.user_id
    )
  );

-- INSULIN_DOSES: usuário gerencia os próprios; pais só leem
create policy "Usuário gerencia sua insulina"
  on public.insulin_doses for all
  using (auth.uid() = user_id);

create policy "Pais leem insulina da afilhada"
  on public.insulin_doses for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'parent'
        and p.parent_of = insulin_doses.user_id
    )
  );

-- MEALS: usuário gerencia os próprios; pais só leem
create policy "Usuário gerencia suas refeições"
  on public.meals for all
  using (auth.uid() = user_id);

create policy "Pais leem refeições da afilhada"
  on public.meals for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'parent'
        and p.parent_of = meals.user_id
    )
  );

-- PHYSICAL_ACTIVITIES: usuário gerencia os próprios; pais só leem
create policy "Usuário gerencia suas atividades"
  on public.physical_activities for all
  using (auth.uid() = user_id);

create policy "Pais leem atividades da afilhada"
  on public.physical_activities for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'parent'
        and p.parent_of = physical_activities.user_id
    )
  );

-- MOOD_ENTRIES: somente a própria usuária
create policy "Usuário gerencia seu humor"
  on public.mood_entries for all
  using (auth.uid() = user_id);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
create index idx_glucose_user_recorded on public.glucose_readings(user_id, recorded_at desc);
create index idx_insulin_user_recorded on public.insulin_doses(user_id, recorded_at desc);
create index idx_meals_user_recorded on public.meals(user_id, recorded_at desc);
create index idx_activities_user_recorded on public.physical_activities(user_id, recorded_at desc);
create index idx_mood_user_recorded on public.mood_entries(user_id, recorded_at desc);
create index idx_profiles_parent_of on public.profiles(parent_of);
