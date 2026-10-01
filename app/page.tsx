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
        <span className="text-xl font-bold text-teal-800">Jaloliddin</span>
        <div className="flex gap-2">
          {profile ? (
            <Link href="/dashboard" className="btn btn-primary">Bosh sahifaga o'tish</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary">Kirish</Link>
              <Link href="/register" className="btn btn-primary">Ro'yxatdan o'tish</Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Assalomu Alaykum</h1>
        {!profile && (
          <div className="mt-8 flex gap-3">
            <Link href="/register" className="btn btn-primary px-6 py-3">Akkaunt yarating</Link>
            <Link href="/login" className="btn btn-secondary px-6 py-3">Kirish</Link>
          </div>
        )}
      </section>

      {courses.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <h2 className="mb-5 text-xl font-semibold">Mavjud darslar</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} href={profile ? `/courses/${c.id}` : '/register'} cta={profile ? 'Open course' : 'Boshlash uchun ro`yxatdan oting'} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
