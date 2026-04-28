
-- ========== PROFILES ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== CLIENTS ==========
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "Users manage own clients select"
  on public.clients for select using (auth.uid() = user_id);
create policy "Users manage own clients insert"
  on public.clients for insert with check (auth.uid() = user_id);
create policy "Users manage own clients update"
  on public.clients for update using (auth.uid() = user_id);
create policy "Users manage own clients delete"
  on public.clients for delete using (auth.uid() = user_id);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create index clients_user_id_idx on public.clients(user_id);

-- ========== PROJECTS ==========
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  notes text default '',
  color text default 'amber',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users manage own projects select"
  on public.projects for select using (auth.uid() = user_id);
create policy "Users manage own projects insert"
  on public.projects for insert with check (auth.uid() = user_id);
create policy "Users manage own projects update"
  on public.projects for update using (auth.uid() = user_id);
create policy "Users manage own projects delete"
  on public.projects for delete using (auth.uid() = user_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create index projects_user_id_idx on public.projects(user_id);
create index projects_client_id_idx on public.projects(client_id);

-- ========== SESSIONS ==========
create type public.session_type as enum ('recording', 'mix');

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  type public.session_type not null,
  title text not null,
  artist text default '',
  notes text default '',
  bpm text default '',
  key text default '',
  sample_rate text default '48 kHz / 24-bit',
  lufs_target text default '-14 LUFS',
  true_peak_target text default '-1 dBTP',
  inputs jsonb not null default '[]'::jsonb,
  takes jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  "references" jsonb not null default '[]'::jsonb,
  revisions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sessions enable row level security;

create policy "Users manage own sessions select"
  on public.sessions for select using (auth.uid() = user_id);
create policy "Users manage own sessions insert"
  on public.sessions for insert with check (auth.uid() = user_id);
create policy "Users manage own sessions update"
  on public.sessions for update using (auth.uid() = user_id);
create policy "Users manage own sessions delete"
  on public.sessions for delete using (auth.uid() = user_id);

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

create index sessions_user_id_idx on public.sessions(user_id);
create index sessions_project_id_idx on public.sessions(project_id);
