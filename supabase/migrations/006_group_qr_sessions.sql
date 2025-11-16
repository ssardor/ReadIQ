-- QR enrollment sessions for quick student onboarding

create table if not exists group_qr_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  mentor_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  status text not null default 'active' check (status in ('active','expired','revoked')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_count integer not null default 0,
  last_consumed_at timestamptz
);

alter table group_qr_sessions enable row level security;

create policy "mentor owns qr sessions" on group_qr_sessions
  for all
  using (mentor_id = auth.uid())
  with check (mentor_id = auth.uid());

create unique index if not exists idx_group_qr_sessions_token on group_qr_sessions(token);
create index if not exists idx_group_qr_sessions_group on group_qr_sessions(group_id);
create index if not exists idx_group_qr_sessions_status on group_qr_sessions(status);
