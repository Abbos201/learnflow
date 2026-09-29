import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { CourseCard } from '@/components/course/course-card';
import type { Course } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const profile = await getCurrentProfile();
  const supabase = createClient();
  const { data } = await supabase.from('courses').select('*').eq('published', true).order('created_at', { ascending: false }).limit(6);
  const courses = (data ?? []) as Course[];

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="text-xl font-bold text-teal-800">LearnFlow</span>
        <div className="flex gap-2">
          {profile ? (
            <Link href="/dashboard" className="btn btn-primary">Go to dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary">Log in</Link>
              <Link href="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Learn at your own pace.</h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">Watch every lesson step by step and track your progress. Each lesson unlocks when you finish the one before it.</p>
        {!profile && (
          <div className="mt-8 flex gap-3">
            <Link href="/register" className="btn btn-primary px-6 py-3">Create your account</Link>
            <Link href="/login" className="btn btn-secondary px-6 py-3">Log in</Link>
          </div>
        )}
      </section>

      {courses.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <h2 className="mb-5 text-xl font-semibold">Available courses</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} href={profile ? `/courses/${c.id}` : '/register'} cta={profile ? 'Open course' : 'Register to start'} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
