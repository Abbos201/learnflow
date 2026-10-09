
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Pencil,
  Plus,
  Video,
  BookOpen,
  PlayCircle,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { CourseForm } from '@/components/admin/course-form';
import { DeleteButton } from '@/components/admin/delete-button';
import CourseTestsManager from '@/components/admin/course-tests-manager';

import {
  EmptyState,
  PageHeader,
} from '@/components/ui';

import { formatDuration } from '@/lib/utils';
import type { Course, Lesson } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AdminCourseDetail({
  params,
}: {
  params: {
    courseId: string;
  };
}) {
  const supabase = createClient();

  // Mavzuni olish
  const { data: courseRow } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.courseId)
    .maybeSingle();

  if (!courseRow) {
    notFound();
  }

  const course = courseRow as Course;

  // Mavzudagi videolarni olish
  const { data: lessonRows } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course.id)
    .order('lesson_order')
    .order('created_at')
    .order('id');

  const lessons = (lessonRows ?? []) as Lesson[];

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      {/* Mavzu nomi va o‘chirish */}
      <PageHeader
        title={course.title}
        subtitle="Mavzu ma’lumotlarini tahrirlang va videolarni boshqaring."
        actions={
          <DeleteButton
            kind="course"
            id={course.id}
            name={course.title}
            redirectTo="/admin/courses"
          />
        }
      />

      {/* Mavzu ma’lumotlari */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <BookOpen className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Mavzu ma’lumotlari
            </h2>
            <p className="text-sm text-slate-500">
              Mavzu nomi, tavsifi va muqova rasmini o‘zgartiring.
            </p>
          </div>
        </div>

        <CourseForm course={course} />
      </section>

      {/* Mavzudagi videolar */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Video className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Mavzudagi videolar
              </h2>
              <p className="text-sm text-slate-500">
                {lessons.length === 0
                  ? 'Hozircha video qo‘shilmagan'
                  : `${lessons.length} ta video mavjud`}
              </p>
            </div>
          </div>

          <Link
            href={`/admin/courses/${course.id}/lessons/new`}
            className="btn btn-primary w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Video qo‘shish
          </Link>
        </div>

        {lessons.length === 0 ? (
          <div className="card border-dashed p-8">
            <EmptyState
              icon={Video}
              title="Hozircha videolar mavjud emas"
              text="Birinchi videoni qo‘shing. Video o‘quvchilarga avtomatik ko‘rinadi."
              action={
                <Link
                  href={`/admin/courses/${course.id}/lessons/new`}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4" />
                  Birinchi videoni qo‘shish
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Kompyuter uchun jadval */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="w-20 px-5 py-3 text-left font-semibold text-slate-600">
                      №
                    </th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-600">
                      Video
                    </th>
                    <th className="w-40 px-5 py-3 text-left font-semibold text-slate-600">
                      Davomiyligi
                    </th>
                    <th className="w-28 px-5 py-3 text-right font-semibold text-slate-600">
                      Amal
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {lessons.map((lesson, index) => (
                    <tr
                      key={lesson.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                          {index + 1}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                            <PlayCircle className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {lesson.title}
                            </p>

                            {lesson.description ? (
                              <p className="mt-0.5 max-w-xl truncate text-xs text-slate-500">
                                {lesson.description}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-xs text-slate-400">
                                Tavsif kiritilmagan
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {lesson.duration
                          ? formatDuration(lesson.duration)
                          : '-'}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/courses/${course.id}/lessons/${lesson.id}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-teal-50 hover:text-teal-700"
                            aria-label={`${lesson.title} videosini tahrirlash`}
                            title="Tahrirlash"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>

                          <DeleteButton
                            kind="lesson"
                            id={lesson.id}
                            name={lesson.title}
                            iconOnly
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Telefon uchun ro‘yxat */}
            <div className="divide-y divide-slate-100 md:hidden">
              {lessons.map((lesson, index) => (
                <div key={lesson.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <PlayCircle className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-slate-400">
                        {index + 1}-video
                      </span>

                      <h3 className="mt-1 font-semibold text-slate-900">
                        {lesson.title}
                      </h3>

                      {lesson.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                          {lesson.description}
                        </p>
                      )}

                      <div className="mt-2 text-xs text-slate-500">
                        {lesson.duration
                          ? formatDuration(lesson.duration)
                          : 'Davomiyligi noma’lum'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <Link
                      href={`/admin/courses/${course.id}/lessons/${lesson.id}`}
                      className="btn btn-secondary"
                    >
                      <Pencil className="h-4 w-4" />
                      Tahrirlash
                    </Link>

                    <DeleteButton
                      kind="lesson"
                      id={lesson.id}
                      name={lesson.title}
                      iconOnly
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* PDF fayllar — videolardan keyin */}
      <CourseTestsManager courseId={course.id} />
    </div>
  );
}
