import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil, Plus, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { CourseForm } from '@/components/admin/course-form';
import { DeleteButton } from '@/components/admin/delete-button';
import { PublishToggle } from '@/components/admin/publish-toggle';
import { EmptyState, PageHeader } from '@/components/ui';
import { formatDuration } from '@/lib/utils';
import type { Course, Lesson } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AdminCourseDetail({
params,
}: {
params: { courseId: string };
}) {
const supabase = createClient();

const { data: courseRow } = await supabase
.from('courses')
.select('*')
.eq('id', params.courseId)
.maybeSingle();

if (!courseRow) notFound();

const course = courseRow as Course;

const [{ data: lessonRows }, { data: counts }] = await Promise.all([
supabase
.from('lessons')
.select('*')
.eq('course_id', course.id)
.order('lesson_order')
.order('created_at')
.order('id'),


supabase
  .from('lesson_completion_counts')
  .select('lesson_id, completed_count')
  .eq('course_id', course.id),


]);

const lessons = (lessonRows ?? []) as Lesson[];

const completed = new Map<string, number>(
(counts ?? []).map(
(c: { lesson_id: string; completed_count: number }) => [
c.lesson_id,
c.completed_count,
]
)
);

const nextOrder =
lessons.reduce((m, l) => Math.max(m, l.lesson_order), 0) + 1;

return ( <div className="max-w-4xl">
<PageHeader
title={course.title}
subtitle="Mavzu ma’lumotlarini tahrirlang va unga tegishli videolarni boshqaring."
actions={ <DeleteButton
         kind="course"
         id={course.id}
         name={course.title}
         redirectTo="/admin/courses"
       />
}
/>


  <CourseForm course={course} />

  <div className="mb-3 mt-10 flex items-center justify-between">
    <h2 className="text-lg font-semibold">
      Videolar ({lessons.length})
    </h2>

    <Link
      href={`/admin/courses/${course.id}/lessons/new`}
      className="btn btn-primary"
    >
      <Plus className="h-4 w-4" />
      Video qo‘shish
    </Link>
  </div>

  {lessons.length === 0 ? (
    <EmptyState
      icon={Video}
      title="Hozircha videolar mavjud emas"
      text="Birinchi videoni qo‘shing: video faylini tanlang, unga nom bering va yuklang."
      action={
        <Link
          href={`/admin/courses/${course.id}/lessons/new`}
          className="btn btn-primary"
        >
          Birinchi videoni qo‘shish
        </Link>
      }
    />
  ) : (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="border-b border-slate-200 text-left text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Tartib</th>
            <th className="px-4 py-3 font-medium">Video nomi</th>
            <th className="px-4 py-3 font-medium">Davomiyligi</th>
            <th className="px-4 py-3 font-medium">Yakunlagan o‘quvchilar</th>
            <th className="px-4 py-3 font-medium">Holati</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {lessons.map((l) => (
            <tr key={l.id}>
              <td className="px-4 py-3 tabular-nums">
                {l.lesson_order}
              </td>

              <td className="px-4 py-3 font-medium">
                {l.title}
              </td>

              <td className="px-4 py-3 tabular-nums text-slate-600">
                {l.duration ? formatDuration(l.duration) : '-'}
              </td>

              <td className="px-4 py-3 text-slate-600">
                {completed.get(l.id) ?? 0} nafar
              </td>

              <td className="px-4 py-3">
                <PublishToggle
                  lessonId={l.id}
                  published={l.published}
                />
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/courses/${course.id}/lessons/${l.id}`}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                    aria-label={`${l.title} videosini tahrirlash`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>

                  <DeleteButton
                    kind="lesson"
                    id={l.id}
                    name={l.title}
                    iconOnly
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>


);
}
