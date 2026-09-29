-- =====================================================================
-- LearnFlow: schema, functions, RLS policies, storage buckets
-- Run this whole file once in Supabase: SQL Editor > New query > Run
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'student' check (role in ('admin', 'student')),
  created_at  timestamptz not null default now()
);

create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 1 and 200),
  description   text,
  thumbnail_url text,
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.lessons (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.courses (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 200),
  description   text,
  video_path    text not null,
  duration      numeric,                       -- seconds
  lesson_order  integer not null default 1 check (lesson_order >= 0),
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists lessons_course_order_idx on public.lessons (course_id, lesson_order, created_at);
create index if not exists lessons_video_path_idx on public.lessons (video_path);

create table if not exists public.student_progress (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles (id) on delete cascade,
  course_id            uuid not null references public.courses (id) on delete cascade,
  lesson_id            uuid not null references public.lessons (id) on delete cascade,
  watched_seconds      numeric not null default 0 check (watched_seconds >= 0),
  video_duration       numeric,
  progress_percentage  numeric(5,2) not null default 0 check (progress_percentage between 0 and 100),
  completed            boolean not null default false,
  completed_at         timestamptz,
  last_watched_at      timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint student_progress_user_lesson_key unique (user_id, lesson_id)
);
create index if not exists student_progress_user_course_idx on public.student_progress (user_id, course_id);
create index if not exists student_progress_lesson_idx on public.student_progress (lesson_id);
create index if not exists student_progress_last_watched_idx on public.student_progress (last_watched_at desc);

-- ---------------------------------------------------------------------
-- HELPER FUNCTIONS
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- True when the current user may watch the lesson:
--   admins: always; students: lesson + course published, and the previous
--   published lesson (by lesson_order) is completed (or there is none).
create or replace function public.can_access_lesson(p_lesson_id uuid)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare
  l public.lessons;
  prev_id uuid;
begin
  if auth.uid() is null then return false; end if;
  select * into l from public.lessons where id = p_lesson_id;
  if not found then return false; end if;
  if public.is_admin() then return true; end if;
  if not l.published then return false; end if;
  if not exists (select 1 from public.courses c where c.id = l.course_id and c.published) then return false; end if;

  select id into prev_id
  from public.lessons
  where course_id = l.course_id
    and published
    and (lesson_order, created_at, id) < (l.lesson_order, l.created_at, l.id)
  order by lesson_order desc, created_at desc, id desc
  limit 1;

  if prev_id is null then return true; end if;
  return exists (
    select 1 from public.student_progress sp
    where sp.user_id = auth.uid() and sp.lesson_id = prev_id and sp.completed
  );
end;
$$;

-- ---------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists courses_touch on public.courses;
create trigger courses_touch before update on public.courses for each row execute function public.touch_updated_at();
drop trigger if exists lessons_touch on public.lessons;
create trigger lessons_touch before update on public.lessons for each row execute function public.touch_updated_at();
drop trigger if exists progress_touch on public.student_progress;
create trigger progress_touch before update on public.student_progress for each row execute function public.touch_updated_at();

-- Create a profile automatically for every new auth user (always as 'student').
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, coalesce(new.email, ''), left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120), 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Students can edit their name but never their own role or email.
-- (The SQL editor / service role have no auth.uid(), so promoting the first admin there works.)
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role or new.email is distinct from old.email or new.id is distinct from old.id then
      raise exception 'You are not allowed to change role or email';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile_update();

-- Progress integrity, enforced in the database even if someone calls the REST API directly:
--   * course_id always comes from the lesson
--   * locked lessons cannot be written
--   * a lesson can only be completed after ~95% of it was watched
--   * once completed, it stays completed
create or replace function public.guard_progress_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  l public.lessons;
  total numeric;
begin
  select * into l from public.lessons where id = new.lesson_id;
  if not found then raise exception 'Lesson not found'; end if;
  new.course_id := l.course_id;

  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if not public.can_access_lesson(new.lesson_id) then
    raise exception 'This lesson is locked';
  end if;

  if tg_op = 'UPDATE' then
    if old.completed then
      new.completed := true;
      new.completed_at := old.completed_at;
      new.progress_percentage := 100;
      new.watched_seconds := greatest(new.watched_seconds, old.watched_seconds);
      return new;
    end if;
  end if;

  if new.completed then
    total := coalesce(nullif(l.duration, 0), new.video_duration);
    if total is null or total <= 0 or new.watched_seconds < total * 0.95 then
      raise exception 'Lesson not fully watched';
    end if;
    new.completed_at := coalesce(new.completed_at, now());
    new.progress_percentage := 100;
  end if;
  return new;
end;
$$;
drop trigger if exists progress_guard on public.student_progress;
create trigger progress_guard before insert or update on public.student_progress for each row execute function public.guard_progress_write();

-- ---------------------------------------------------------------------
-- VIEWS (security_invoker: RLS of the caller applies)
-- ---------------------------------------------------------------------
create or replace view public.course_progress_summary with (security_invoker = true) as
select sp.user_id,
       sp.course_id,
       (count(*) filter (where sp.completed))::int as completed_lessons,
       max(sp.last_watched_at) as last_activity
from public.student_progress sp
join public.lessons l on l.id = sp.lesson_id and l.published
group by sp.user_id, sp.course_id;

create or replace view public.lesson_completion_counts with (security_invoker = true) as
select sp.lesson_id,
       sp.course_id,
       (count(*) filter (where sp.completed))::int as completed_count,
       count(*)::int as started_count
from public.student_progress sp
group by sp.lesson_id, sp.course_id;

create or replace view public.course_lesson_counts with (security_invoker = true) as
select l.course_id,
       (count(*) filter (where l.published))::int as published_lessons,
       count(*)::int as total_lessons
from public.lessons l
group by l.course_id;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.courses          enable row level security;
alter table public.lessons          enable row level security;
alter table public.student_progress enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- courses
drop policy if exists courses_read_published on public.courses;
create policy courses_read_published on public.courses for select to anon, authenticated
  using (published);
drop policy if exists courses_admin_all on public.courses;
create policy courses_admin_all on public.courses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- lessons
drop policy if exists lessons_read_published on public.lessons;
create policy lessons_read_published on public.lessons for select to authenticated
  using (published and exists (select 1 from public.courses c where c.id = course_id and c.published));
drop policy if exists lessons_admin_all on public.lessons;
create policy lessons_admin_all on public.lessons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- student_progress
drop policy if exists progress_select on public.student_progress;
create policy progress_select on public.student_progress for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists progress_insert_own on public.student_progress;
create policy progress_insert_own on public.student_progress for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists progress_update_own on public.student_progress;
create policy progress_update_own on public.student_progress for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists progress_admin_delete on public.student_progress;
create policy progress_admin_delete on public.student_progress for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- STORAGE
-- ---------------------------------------------------------------------
-- Private bucket for lesson videos: videos/<course-id>/<lesson-id>/video.mp4
-- NOTE: Supabase's free plan caps every file at 50 MB. On a paid plan raise the
-- global limit in Storage > Settings, then adjust file_size_limit below and MAX_VIDEO_BYTES in lib/utils/index.ts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-videos', 'course-videos', false, 524288000, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Public bucket for course thumbnails (images are not sensitive)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-thumbnails', 'course-thumbnails', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Videos: students may read (and create signed URLs for) a file only if they may access its lesson
drop policy if exists videos_select on storage.objects;
create policy videos_select on storage.objects for select to authenticated
  using (
    bucket_id = 'course-videos'
    and (
      public.is_admin()
      or exists (
        select 1 from public.lessons l
        where l.video_path = storage.objects.name and public.can_access_lesson(l.id)
      )
    )
  );
drop policy if exists videos_admin_insert on storage.objects;
create policy videos_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'course-videos' and public.is_admin());
drop policy if exists videos_admin_update on storage.objects;
create policy videos_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'course-videos' and public.is_admin())
  with check (bucket_id = 'course-videos' and public.is_admin());
drop policy if exists videos_admin_delete on storage.objects;
create policy videos_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'course-videos' and public.is_admin());

-- Thumbnails: admins manage, everyone can read (public bucket)
drop policy if exists thumbs_admin_insert on storage.objects;
create policy thumbs_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'course-thumbnails' and public.is_admin());
drop policy if exists thumbs_admin_update on storage.objects;
create policy thumbs_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'course-thumbnails' and public.is_admin())
  with check (bucket_id = 'course-thumbnails' and public.is_admin());
drop policy if exists thumbs_admin_delete on storage.objects;
create policy thumbs_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'course-thumbnails' and public.is_admin());
drop policy if exists thumbs_read on storage.objects;
create policy thumbs_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'course-thumbnails');
