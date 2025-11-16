-- Mentor feature schema: groups, group_students, quizzes, quiz_instances, questions, attempts, telemetry_events

-- groups
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  course_id uuid,
  term text,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  capacity int,
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table groups enable row level security;

create policy "mentor owns group" on groups for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- group_students
create table if not exists group_students (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  status text default 'active'
);

alter table group_students enable row level security;
create policy "mentor can manage group_students" on group_students for all using (
  exists(select 1 from groups g where g.id = group_id and g.teacher_id = auth.uid())
) with check (
  exists(select 1 from groups g where g.id = group_id and g.teacher_id = auth.uid())
);

-- quizzes (templates)
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  creator_id uuid not null references auth.users(id) on delete cascade,
  presentation_id text,
  is_template boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table quizzes enable row level security;
create policy "mentor owns quiz" on quizzes for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

-- questions (for templates)
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  text text not null,
  choices jsonb not null,
  correct_indexes int[] not null default '{0}',
  source_slide_index int,
  difficulty text check (difficulty in ('easy','medium','hard')),
  created_at timestamptz default now()
);

alter table questions enable row level security;
create policy "mentor view/edit own questions" on questions for all using (
  exists(select 1 from quizzes q where q.id = quiz_id and q.creator_id = auth.uid())
) with check (
  exists(select 1 from quizzes q where q.id = quiz_id and q.creator_id = auth.uid())
);

-- quiz_instances
create table if not exists quiz_instances (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds int,
  status text default 'draft' check (status in ('draft','scheduled','active','closed'))
);

alter table quiz_instances enable row level security;
create policy "mentor owns instance via group" on quiz_instances for all using (
  exists(select 1 from groups g where g.id = group_id and g.teacher_id = auth.uid())
) with check (
  exists(select 1 from groups g where g.id = group_id and g.teacher_id = auth.uid())
);

-- attempts
create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_instance_id uuid not null references quiz_instances(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null,
  score float,
  duration_seconds int,
  submitted_at timestamptz default now()
);

alter table attempts enable row level security;
create policy "mentor view attempts via instance" on attempts for select using (
  exists(
    select 1 from quiz_instances i join groups g on g.id = i.group_id
    where i.id = quiz_instance_id and g.teacher_id = auth.uid()
  )
);

-- telemetry_events
create table if not exists telemetry_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  meta jsonb,
  created_at timestamptz default now()
);

alter table telemetry_events enable row level security;
create policy "user can insert own telemetry" on telemetry_events for insert with check (auth.uid() = user_id);

-- helper indexes
create index if not exists idx_groups_teacher on groups(teacher_id);
create index if not exists idx_group_students_group on group_students(group_id);
create index if not exists idx_quiz_instances_group on quiz_instances(group_id);
create index if not exists idx_attempts_instance on attempts(quiz_instance_id);
