
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profiles (id, full_name, role, university, email_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    nullif(new.raw_user_meta_data->>'university',''),
    (new.email_confirmed_at is not null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Update verification status when it flips to confirmed
  if (new.email_confirmed_at is distinct from old.email_confirmed_at) then
    update public.users_profiles
      set email_verified = (new.email_confirmed_at is not null),
          updated_at = now()
      where id = new.id;
  end if;

  -- Optionally keep name/role/university in sync when provided in metadata
  if (new.raw_user_meta_data is not null) then
    update public.users_profiles
      set full_name = coalesce(nullif(new.raw_user_meta_data->>'full_name',''), full_name),
          role = coalesce(nullif(new.raw_user_meta_data->>'role',''), role),
          university = coalesce(nullif(new.raw_user_meta_data->>'university',''), university),
          updated_at = now()
      where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update on auth.users
for each row execute function public.handle_auth_user_updated();

insert into public.users_profiles (id, full_name, role, university, email_verified)
select u.id,
       coalesce(u.raw_user_meta_data->>'full_name',''),
       coalesce(u.raw_user_meta_data->>'role','student'),
       nullif(u.raw_user_meta_data->>'university',''),
       (u.email_confirmed_at is not null)
from auth.users u
left join public.users_profiles p on p.id = u.id
where p.id is null;

       (u.email_confirmed_at is not null)
