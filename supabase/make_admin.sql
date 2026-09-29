-- Run in the Supabase SQL Editor AFTER registering your account on the site.
-- Replace the email with yours. No admin email or password is hard-coded in the app.
update public.profiles set role = 'admin' where email = 'you@example.com';
