
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PlayCircle, CheckCircle2 } from 'lucide-react';

import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDuration } from '@/lib/utils';
import type { Course, Lesson, Progress } from '@/types';

export const dynamic = 'force-dynamic';

export default async function CoursePage({
  params,
}: {
  params: { courseId: string };
}) {
  const profile = await requireUser();
  const supabase = createClient();

  const { data: courseRow } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.courseId)
    .maybeSingle();

  if (!courseRow) {
    notFound();
  }

  const course = courseRow as Course;

  const [{ data: lessonRows }, { data: progressRows }] =
    await Promise.all([
      supabase
        .from('lessons')
        .select('*')
        .eq('course_id', course.id)
        .eq('published', true)
        .order('lesson_order')
        .order('created_at')
        .order('id'),

      supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', profile.id)
        .eq('course_id', course.id),
    ]);

  const lessons = (lessonRows ?? []) as Lesson[];
  const progress = (progressRows ?? []) as Progress[];

  const completedIds = new Set(
    progress.filter((item) => item.completed).map((item) => item.lesson_id),
  );

  const completedCount = lessons.filter((lesson) =>
    completedIds.has(lesson.id),
  ).length;

  const courseTitle = course.title;
  const courseDescription =
    'description' in course && typeof course.description === 'string'
      ? course.description
      : '';

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/courses"
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          ← Barcha kurslar
        </Link>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          {courseTitle}
        </h1>

        {courseDescription && (
          <p className="mt-3 whitespace-pre-line text-slate-600">
            {courseDescription}
          </p>
        )}

        <p className="mt-3 text-sm text-slate-600">
          {completedCount} / {lessons.length} ta video yakunlangan
        </p>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-teal-600"
            style={{
              width: `${
                lessons.length > 0
                  ? (completedCount / lessons.length) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-xl border border-slate-200 p-6">
          <p className="font-medium">Bu kursda hozircha video yo‘q.</p>
        </div>
      ) : (
        <section>
          <h2 className="mb-4 text-xl font-semibold">
            Kurs videolari
          </h2>

          <div className="space-y-3">
            {lessons.map((lesson, index) => {
              const completed = completedIds.has(lesson.id);

              return (
                <Link
                  key={lesson.id}
                  href={`/courses/${course.id}/lessons/${lesson.id}`}
                  prefetch={false}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-teal-300 hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50">
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <PlayCircle className="h-5 w-5 text-teal-700" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {index + 1}. {lesson.title}
                    </p>

                    {lesson.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {lesson.description}
                      </p>
                    )}

                    {lesson.duration ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDuration(lesson.duration)}
                      </p>
                    ) : null}
                  </div>

                  <span className="shrink-0 text-sm text-teal-700">
                    {completed ? 'Qayta ko‘rish' : 'Ochish'}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
