
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  number text not null default '',
  status text not null default 'draft',
  issue_date date not null default current_date,
  due_date date,
  currency text not null default 'EUR',
  items jsonb not null default '[]'::jsonb,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.invoices to authenticated;
grant all on public.invoices to service_role;

alter table public.invoices enable row level security;

create policy "Users select own invoices" on public.invoices for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own invoices" on public.invoices for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own invoices" on public.invoices for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own invoices" on public.invoices for delete to authenticated using (auth.uid() = user_id);

create trigger invoices_set_updated_at before update on public.invoices for each row execute function public.set_updated_at();

create index invoices_user_id_idx on public.invoices(user_id);
create index invoices_client_id_idx on public.invoices(client_id);
create index invoices_project_id_idx on public.invoices(project_id);

create table public.session_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.session_type not null,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.session_templates to authenticated;
grant all on public.session_templates to service_role;

alter table public.session_templates enable row level security;

create policy "Users select own templates" on public.session_templates for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own templates" on public.session_templates for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own templates" on public.session_templates for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own templates" on public.session_templates for delete to authenticated using (auth.uid() = user_id);

create index session_templates_user_id_idx on public.session_templates(user_id);
