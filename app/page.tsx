import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  LogIn,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* =========================
          NAVBAR
      ========================== */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm transition group-hover:scale-105">
              <BookOpen className="h-5 w-5" />
            </div>

            <div>
              <div className="text-base font-bold leading-none text-slate-950">
                Jaloliddin
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {profile ? (
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Boshqaruv paneli
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                <LogIn className="h-4 w-4" />
                Kirish
              </Link>
            )}
          </div>
        </div>
      </header>



      {/* =========================
          SIMPLE INFO
      ========================== */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">

          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <PlayCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                Video darslar
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Istalgan vaqtda ko‘ring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                Jarayon nazorati
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Qayerda qolganingizni biling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                O‘quvchilar uchun
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Sodda va tushunarli tizim
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* =========================
          COURSES
      ========================== */}
      <section
        id="courses"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-teal-700">
              <BookOpen className="h-4 w-4" />
              KURSLAR
            </div>

            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              Mavjud darslar
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              O‘zingizga kerakli kursni tanlang va bilim olishni boshlang.
            </p>
          </div>

          {courses.length > 0 && (
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {courses.length} ta kurs
            </span>
          )}
        </div>

        {courses.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:shadow-lg"
              >
                <CourseCard
                  course={course}
                  href={
                    profile
                      ? `/courses/${course.id}`
                      : '/login'
                  }
                  cta={
                    profile
                      ? 'Kursni ochish'
                      : 'Kirish va boshlash'
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <BookOpen className="h-8 w-8" />
            </div>

            <h3 className="mt-5 text-xl font-bold text-slate-900">
              Hozircha kurslar mavjud emas
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Administrator yangi kurs yoki dars qo‘shgandan so‘ng,
              ular shu yerda ko‘rinadi.
            </p>
          </div>
        )}
      </section>

      {/* =========================
          CTA
      ========================== */}
      {!profile && (
        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-teal-800 px-6 py-10 sm:px-10 sm:py-12">

            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-teal-600/30 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-teal-100">
                  <LogIn className="h-3.5 w-3.5" />
                  O‘quvchilar uchun
                </div>

                <h2 className="text-2xl font-black text-white sm:text-3xl">
                  Darslarni boshlashga tayyormisiz?
                </h2>

                <p className="mt-3 text-sm leading-6 text-teal-100 sm:text-base">
                  O‘qituvchingiz bergan akkaunt orqali tizimga kiring
                  va o‘zingizga biriktirilgan darslarni ko‘ring.
                </p>
              </div>

              <Link
                href="/login"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-teal-800 shadow-sm transition hover:bg-teal-50"
              >
                <LogIn className="h-4 w-4" />
                Tizimga kirish
                <ArrowRight className="h-4 w-4" />
              </Link>

            </div>
          </div>
        </section>
      )}

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white">
              <BookOpen className="h-3.5 w-3.5" />
            </div>

            <span className="font-semibold text-slate-700">
              Jaloliddin
            </span>
          </div>

          <span>
            © {new Date().getFullYear()} Jaloliddin. Barcha huquqlar himoyalangan.
          </span>

        </div>
      </footer>

    </div>
  );
}