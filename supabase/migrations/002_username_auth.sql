
-- ============================================================
-- LearnFlow: username authentication support
-- ============================================================

-- 1. Add username to profiles
alter table public.profiles
add column if not exists username text;

-- 2. Normalize usernames to lowercase and make them unique
create unique index if not exists profiles_username_lower_idx
on public.profiles (lower(username))
where username is not null;

-- 3. Validate username
alter table public.profiles
drop constraint if exists profiles_username_format;

alter table public.profiles
add constraint profiles_username_format
check (
  username is null
  or username ~ '^[a-zA-Z0-9_]{3,30}$'
);

-- 4. Update automatic profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    username,
    full_name,
    role
  )
  values (
    new.id,
    coalesce(new.email, ''),
    lower(nullif(trim(new.raw_user_meta_data ->> 'username'), '')),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    'student'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    username = coalesce(public.profiles.username, excluded.username),
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);

  return new;
end;
$$;

-- 5. Allow authenticated users to find the email belonging
--    to a username.
--
--    This function returns only the email, not the profile row.
create or replace function public.get_email_by_username(
  p_username text
)
returns text
language sql
security definer
set search_path = public
as $$
  select email
  from public.profiles
  where lower(username) = lower(trim(p_username))
  limit 1;
$$;

grant execute on function public.get_email_by_username(text)
to anon, authenticated;