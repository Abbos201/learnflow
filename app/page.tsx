import Link from 'next/link';
import { ArrowRight, BookOpen, LogIn, PlayCircle, ShieldCheck } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { CourseCard } from '@/components/course/course-card';

import type { Course } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const profile = await getCurrentProfile();
  const supabase = createClient();

  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(6);

  const courses = (data ?? []) as Course[];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>

            <div>
              <div className="text-lg font-bold leading-none text-slate-900">
                Jaloliddin
              </div>
            </div>
          </Link>

          {profile ? (
            <Link
              href="/dashboard"
              className="btn btn-primary"
            >
              Bosh sahifaga o'tish
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="btn btn-primary"
            >
              <LogIn className="h-4 w-4" />
              Kirish
            </Link>
          )}
        </div>
      </header>



      {/* Courses */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-teal-700">
              O'QUV KURSLARI
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Mavjud darslar
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              O'rganishni boshlash uchun mavjud kurslardan birini tanlang.
            </p>
          </div>
        </div>

        {courses.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                href={profile ? `/courses/${course.id}` : '/login'}
                cta={
                  profile
                    ? 'Kursni ochish'
                    : 'Kirish va boshlash'
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <BookOpen className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Hozircha darslar mavjud emas
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Administrator tomonidan yangi darslar qo'shilgandan so'ng,
              ular shu yerda ko'rinadi.
            </p>
          </div>
        )}
      </section>

      {/* Login info */}
      {!profile && (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="overflow-hidden rounded-2xl bg-teal-800 px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  O'quvchimisiz?
                </h2>

                <p className="mt-1 max-w-xl text-sm leading-6 text-teal-100">
                  O'qituvchingiz bergan akkaunt orqali tizimga kiring va
                  darslaringizni boshlang.
                </p>
              </div>

              <Link
                href="/login"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
              >
                <LogIn className="h-4 w-4" />
                Tizimga kirish
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} Jaloliddin</span>
        </div>
      </footer>
    </div>
  );
}