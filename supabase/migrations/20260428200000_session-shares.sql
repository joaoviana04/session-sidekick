
-- ========== SESSION SHARES ==========
create table public.session_shares (
  token text primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.session_shares enable row level security;

create policy "Owners manage own shares select"
  on public.session_shares for select using (auth.uid() = created_by);
create policy "Owners manage own shares insert"
  on public.session_shares for insert with check (auth.uid() = created_by);
create policy "Owners manage own shares update"
  on public.session_shares for update using (auth.uid() = created_by);
create policy "Owners manage own shares delete"
  on public.session_shares for delete using (auth.uid() = created_by);

create index session_shares_session_id_idx on public.session_shares(session_id);

-- Public read-only RPC: returns session data if token is active, null otherwise.
-- SECURITY DEFINER lets anon bypass sessions RLS without exposing other rows.
create or replace function public.get_shared_session(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_result jsonb;
begin
  select session_id into v_session_id
  from public.session_shares
  where token = p_token and revoked_at is null;

  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'id', s.id,
    'title', s.title,
    'artist', s.artist,
    'type', s.type,
    'revisions', s.revisions,
    'created_at', s.created_at
  ) into v_result
  from public.sessions s
  where s.id = v_session_id;

  return v_result;
end;
$$;

revoke execute on function public.get_shared_session(text) from public;
grant execute on function public.get_shared_session(text) to anon, authenticated;
