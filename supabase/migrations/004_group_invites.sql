-- Group invites and assignments schema

-- pending_invites table stores invitations for students not yet in auth.users
create table if not exists pending_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  email text not null,
  token text not null,
  status text not null default 'pending' check (status in ('pending','accepted','expired','cancelled')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  meta jsonb,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

alter table pending_invites enable row level security;

create policy "mentor owns pending invites" on pending_invites
  for all
  using (exists(select 1 from groups g where g.id = group_id and g.teacher_id = auth.uid()))
  with check (exists(select 1 from groups g where g.id = group_id and g.teacher_id = auth.uid()));

-- Ensure we do not create duplicate invites per group/email pair
create unique index if not exists idx_pending_invites_group_email on pending_invites (group_id, lower(email));
create unique index if not exists idx_pending_invites_token on pending_invites (token);

-- Ensure group_students uniqueness at the database level
create unique index if not exists idx_group_students_unique on group_students (group_id, student_id);

-- Quiz assignments track upcoming quiz instances for students
create table if not exists quiz_assignments (
  id uuid primary key default gen_random_uuid(),
  quiz_instance_id uuid not null references quiz_instances(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'assigned' check (status in ('assigned','notified','completed','cancelled')),
  assignment_source text,
  created_at timestamptz default now(),
  notified_at timestamptz,
  completed_at timestamptz
);

alter table quiz_assignments enable row level security;

create policy "mentor owns assignments" on quiz_assignments
  for all
  using (
    exists(
      select 1 from quiz_instances qi
      join groups g on g.id = qi.group_id
      where qi.id = quiz_instance_id
        and g.teacher_id = auth.uid()
    )
  )
  with check (
    exists(
      select 1 from quiz_instances qi
      join groups g on g.id = qi.group_id
      where qi.id = quiz_instance_id
        and g.teacher_id = auth.uid()
    )
  );

create unique index if not exists idx_quiz_assignments_unique on quiz_assignments (quiz_instance_id, student_id);
