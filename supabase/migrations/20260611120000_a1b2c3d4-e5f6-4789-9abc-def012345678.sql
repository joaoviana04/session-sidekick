-- ========== INVOICES ==========
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

alter table public.invoices enable row level security;

create policy "Users manage own invoices select"
  on public.invoices for select using (auth.uid() = user_id);
create policy "Users manage own invoices insert"
  on public.invoices for insert with check (auth.uid() = user_id);
create policy "Users manage own invoices update"
  on public.invoices for update using (auth.uid() = user_id);
create policy "Users manage own invoices delete"
  on public.invoices for delete using (auth.uid() = user_id);

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create index invoices_user_id_idx on public.invoices(user_id);
create index invoices_client_id_idx on public.invoices(client_id);
create index invoices_project_id_idx on public.invoices(project_id);

-- ========== SESSION TEMPLATES ==========
create table public.session_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.session_type not null,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.session_templates enable row level security;

create policy "Users manage own templates select"
  on public.session_templates for select using (auth.uid() = user_id);
create policy "Users manage own templates insert"
  on public.session_templates for insert with check (auth.uid() = user_id);
create policy "Users manage own templates update"
  on public.session_templates for update using (auth.uid() = user_id);
create policy "Users manage own templates delete"
  on public.session_templates for delete using (auth.uid() = user_id);

create index session_templates_user_id_idx on public.session_templates(user_id);

-- ========== ATTACHMENTS STORAGE ==========
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

create policy "Users can upload own attachments"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own attachments"
  on storage.objects for update
  using (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own attachments"
  on storage.objects for delete
  using (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can read attachments"
  on storage.objects for select
  using (bucket_id = 'attachments');
