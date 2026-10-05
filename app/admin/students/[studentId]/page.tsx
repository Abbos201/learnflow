import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Activity, ArrowLeft, Clock, PlayCircle } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import {
  Badge,
  EmptyState,
  PageHeader,
  ProgressBar,
} from '@/components/ui';

import type {
  Course,
  Lesson,
  Profile,
  Progress,
} from '@/types';

export const dynamic = 'force-dynamic';

function formatUzbekDateTime(
  value: string | null | undefined
) {
  if (!value) return 'Ma’lumot yo‘q';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Ma’lumot yo‘q';
  }

  return new Intl.DateTimeFormat('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function formatWatchedTime(seconds: number | null | undefined) {
  const total = Math.max(
    0,
    Math.floor(Number(seconds ?? 0))
  );

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours} soat ${minutes} daqiqa`;
  }

  if (minutes > 0) {
    return `${minutes} daqiqa ${secs} soniya`;
  }

  return `${secs} soniya`;
}

export default async function AdminStudentDetail({
  params,
}: {
  params: { studentId: string };
}) {
  const supabase = createClient();

  // O'quvchini olish
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.studentId)
    .eq('role', 'student')
    .maybeSingle();

  if (!profileData) {
    notFound();
  }

  const profile = profileData as Profile;

  // O'quvchining progresslari
  const { data: progressRows } = await supabase
    .from('student_progress')
    .select('*')
    .eq('user_id', profile.id)
    .order('updated_at', {
      ascending: false,
    })
    .limit(5000);

  const progress = (progressRows ?? []) as Progress[];

  // Barcha published kurslar
  const { data: courseRows } = await supabase
    .from('courses')
    .select('*')
    .eq('published', true)
    .order('created_at', {
      ascending: false,
    });

  const courses = (courseRows ?? []) as Course[];

  // Barcha published videolar
  const { data: lessonRows } = await supabase
    .from('lessons')
    .select('*')
    .eq('published', true)
    .order('lesson_order', {
      ascending: true,
    })
    .order('created_at', {
      ascending: true,
    })
    .order('id', {
      ascending: true,
    });

  const lessons = (lessonRows ?? []) as Lesson[];

  // lesson_id -> progress
  const byLesson = new Map(
    progress.map((row) => [row.lesson_id, row])
  );

  // Faqat videolari bor kurslarni ko'rsatamiz.
  const coursesWithLessons = courses
    .map((course) => ({
      course,
      lessons: lessons.filter(
        (lesson) => lesson.course_id === course.id
      ),
    }))
    .filter((item) => item.lessons.length > 0);

  return (
    <div className="max-w-6xl">
      {/* Orqaga */}
      <Link
        href="/admin/students"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Barcha o‘quvchilar
      </Link>

      {/* O'quvchi */}
      <PageHeader
        title={
          profile.full_name ||
          'Ismi ko‘rsatilmagan o‘quvchi'
        }
        subtitle={`${profile.username || ''} · ${profile.email} · Ro‘yxatdan o‘tgan: ${formatUzbekDateTime(
          profile.created_at
        )}`}
      />

      {/* Umumiy statistika */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
              <PlayCircle className="h-5 w-5" />
            </div>

            <div>
              <div className="text-xs text-slate-500">
                Boshlangan videolar
              </div>

              <div className="text-xl font-bold text-slate-900">
                {progress.length}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-2 text-green-700">
              <Activity className="h-5 w-5" />
            </div>

            <div>
              <div className="text-xs text-slate-500">
                Yakunlangan videolar
              </div>

              <div className="text-xl font-bold text-slate-900">
                {progress.filter((p) => p.completed).length}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
              <Clock className="h-5 w-5" />
            </div>

            <div>
              <div className="text-xs text-slate-500">
                Jami ko‘rilgan vaqt
              </div>

              <div className="text-xl font-bold text-slate-900">
                {formatWatchedTime(
                  progress.reduce(
                    (sum, row) =>
                      sum +
                      Number(row.watched_seconds ?? 0),
                    0
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {coursesWithLessons.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Hozircha videolar mavjud emas"
          text="Tizimda hali published video mavjud emas."
        />
      ) : (
        coursesWithLessons.map(
          ({ course, lessons: courseLessons }) => {
            const completedCount = courseLessons.filter(
              (lesson) =>
                byLesson.get(lesson.id)?.completed
            ).length;

            const startedCount = courseLessons.filter(
              (lesson) =>
                !!byLesson.get(lesson.id)
            ).length;

            const progressPercent = courseLessons.length
              ? Math.round(
                  (completedCount /
                    courseLessons.length) *
                    100
                )
              : 0;

            return (
              <section
                key={course.id}
                className="card mb-6 overflow-hidden"
              >
                {/* Kurs header */}
                <div className="border-b border-slate-100 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        {course.title}
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        {startedCount} /{' '}
                        {courseLessons.length} ta video
                        boshlangan
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-sm font-semibold text-slate-700">
                        {completedCount} /{' '}
                        {courseLessons.length} ta
                        yakunlangan
                      </div>

                      <div className="text-xs text-slate-500">
                        {progressPercent}% tugallangan
                      </div>
                    </div>
                  </div>

                  <ProgressBar
                    value={progressPercent}
                    className="mt-3"
                  />
                </div>

                {/* Video list */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-slate-50 text-left text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">
                          Video
                        </th>

                        <th className="px-4 py-3 font-medium">
                          O‘zlashtirish
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Ko‘rilgan vaqt
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Holati
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Oxirgi faollik
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {courseLessons.map((lesson) => {
                        const row = byLesson.get(
                          lesson.id
                        );

                        const percentage = row
                          ? Math.round(
                              Number(
                                row.progress_percentage ??
                                  0
                              )
                            )
                          : 0;

                        return (
                          <tr
                            key={lesson.id}
                            className="hover:bg-slate-50"
                          >
                            {/* Video */}
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">
                                {lesson.lesson_order}.{' '}
                                {lesson.title}
                              </div>
                            </td>

                            {/* Progress */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-24">
                                  <ProgressBar
                                    value={percentage}
                                  />
                                </div>

                                <span className="tabular-nums text-slate-600">
                                  {percentage}%
                                </span>
                              </div>
                            </td>

                            {/* Watched time */}
                            <td className="px-4 py-3 text-slate-600">
                              {formatWatchedTime(
                                row?.watched_seconds
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              {row?.completed ? (
                                <Badge tone="green">
                                  Yakunlangan
                                </Badge>
                              ) : row ? (
                                <Badge tone="teal">
                                  Jarayonda
                                </Badge>
                              ) : (
                                <Badge>
                                  Hali boshlanmagan
                                </Badge>
                              )}
                            </td>

                            {/* Last activity */}
                            <td className="px-4 py-3 text-slate-600">
                              {formatUzbekDateTime(
                                row?.updated_at
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          }
        )
      )}
    </div>
  );
}