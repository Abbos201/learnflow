# LearnFlow: video course platform

Next.js 14 (App Router) + TypeScript + Tailwind + Supabase (Auth, Postgres, Storage), deployable on Vercel.
The admin uploads lesson videos from the browser; students watch lessons in order, and each lesson unlocks only after the previous one has been fully watched.

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

1. Go to https://supabase.com, create a project and wait for it to finish provisioning.
2. Open **Project Settings > API** and copy the **Project URL**, the **anon public key** and the **service_role key**.
3. Optional while testing: **Authentication > Providers > Email > turn off "Confirm email"** so new students can log in immediately. Leave it on in production.

## 3-6. Create tables, run the migration, create the Storage buckets, configure RLS

Everything is in one file. Open **SQL Editor > New query**, paste the contents of `supabase/migrations/001_init.sql` and run it. It creates:

- tables `profiles`, `courses`, `lessons`, `student_progress` (foreign keys, indexes, `unique (user_id, lesson_id)`)
- a trigger that creates a `student` profile for every new sign-up
- the `can_access_lesson()` function (the lesson-locking rule, enforced in the database)
- Row Level Security policies for every table (RLS stays enabled)
- the private `course-videos` bucket (mp4/webm/mov, 500 MB limit) and the public `course-thumbnails` bucket, with storage policies (only admins can upload; students can only read videos of lessons they have unlocked)

> **File size limit:** Supabase's Free plan caps every file at 50 MB. On a paid plan raise the global limit in **Storage > Settings**, and keep `MAX_VIDEO_BYTES` in `lib/utils/index.ts` and the bucket `file_size_limit` in the SQL in sync.

## 7. Create the first admin

1. Run the app (or the deployed site) and **register** your account at `/register`.
2. In the SQL Editor run (with your email), also saved in `supabase/make_admin.sql`:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

3. Log out and back in, then open `/admin`. Later admins can be created from **Admin > Students > Make admin**.

## 8. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server only, never exposed to the browser
```

The service-role key is used in exactly one place: deleting a student account (`app/admin/actions.ts`, file `lib/supabase/admin.ts` is marked `server-only`).

## 9. Run locally

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run build
```

## 10. Deploy to Vercel

1. Push this folder to a Git repository and import it in Vercel (framework: Next.js, no extra settings).
2. Add the three environment variables above in **Project Settings > Environment Variables**.
3. Deploy. In Supabase, set **Authentication > URL Configuration > Site URL** to your Vercel URL.

## How it works

- **Upload:** the admin form reads the video duration in the browser, asks Supabase for a signed upload URL and sends the file straight to Storage (it never passes through Next.js), with a live progress bar. Then a server action verifies the admin, checks the file exists at `course-id/lesson-id/video.ext` and inserts the lesson. New lessons show up immediately.
- **Locking:** lessons are ordered by `lesson_order`. The first published lesson is open; every other one needs the previous published lesson completed. The rule lives in SQL (`can_access_lesson`) and is used by the lesson page, the progress API, a database trigger and the storage policy, so a locked video cannot even get a signed URL. Inserting a lesson between two others re-locks correctly by order.
- **Progress tracking:** the player tracks the furthest point reached by real playback. Seeking beyond it is blocked (snaps back). Progress is saved about every 15 s, on pause, on tab hide / page leave (`sendBeacon`) and at the end, and resumes on return. The server only lets `watched_seconds` grow about as fast as real time passes, and completes a lesson only when the `ended` event fired and at least 95% was watched. Completed lessons can be freely re-watched.
- **Security:** admin routes are guarded in middleware, in the admin layout (role read from the database) and in every server action, and by RLS. Students cannot change their own role (trigger).

## Notes and limits

- This is "normal student" protection, not DRM; a technically skilled user can still bypass client-side restrictions, but the server-side checks above limit skipping.
- Lists such as the admin progress table are capped at 1000 rows per query (Supabase default); add pagination if you expect more.
- Replacing a lesson video keeps existing student progress as is.
