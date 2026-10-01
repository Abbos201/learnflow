import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Activity } from 'lucide-react';
import { Badge, EmptyState, PageHeader, ProgressBar } from '@/components/ui';
import { relativeDay } from '@/lib/utils';
import type { Course, Lesson, Profile, Progress } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AdminStudentDetail({
params,
}: {
params: { studentId: string };
}) {
const supabase = createClient();

const { data: p } = await supabase
.from('profiles')
.select('*')
.eq('id', params.studentId)
.maybeSingle();

if (!p) notFound();

const profile = p as Profile;

const { data: progressRows } = await supabase
.from('student_progress')
.select('*')
.eq('user_id', profile.id)
.limit(1000);

const progress = (progressRows ?? []) as Progress[];
const courseIds = Array.from(new Set(progress.map((r) => r.course_id)));

let courses: Course[] = [];
let lessons: Lesson[] = [];

if (courseIds.length) {
const [c, l] = await Promise.all([
supabase.from('courses').select('*').in('id', courseIds),
supabase
.from('lessons')
.select('*')
.in('course_id', courseIds)
.eq('published', true)
.order('lesson_order')
.order('created_at')
.order('id'),
]);


courses = (c.data ?? []) as Course[];
lessons = (l.data ?? []) as Lesson[];


}

const byLesson = new Map(progress.map((r) => [r.lesson_id, r]));

return ( <div className="max-w-4xl"> <Link
     href="/admin/students"
     className="text-sm font-medium text-teal-700 hover:underline"
   >
Barcha o‘quvchilar </Link>

```
  <PageHeader
    title={profile.full_name || 'Ismi ko‘rsatilmagan o‘quvchi'}
    subtitle={`${profile.email} · Ro‘yxatdan o‘tgan: ${relativeDay(profile.created_at)}`}
  />

  {courses.length === 0 ? (
    <EmptyState
      icon={Activity}
      title="Hozircha faollik mavjud emas"
      text="Ushbu o‘quvchi hali birorta videoni boshlamagan."
    />
  ) : (
    courses.map((course) => {
      const cl = lessons.filter((l) => l.course_id === course.id);
      const done = cl.filter((l) => byLesson.get(l.id)?.completed).length;
      const pct = cl.length ? Math.round((done / cl.length) * 100) : 0;

      return (
        <section
          key={course.id}
          className="card mb-6 overflow-x-auto"
        >
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{course.title}</h2>

              <span className="text-sm text-slate-600">
                {done} / {cl.length} ta video · {pct}%
              </span>
            </div>

            <ProgressBar value={pct} className="mt-2" />
          </div>

          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Video</th>
                <th className="px-4 py-2 font-medium">O‘zlashtirish</th>
                <th className="px-4 py-2 font-medium">Holati</th>
                <th className="px-4 py-2 font-medium">Oxirgi ko‘rilgan vaqt</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {cl.map((l) => {
                const r = byLesson.get(l.id);

                return (
                  <tr key={l.id}>
                    <td className="px-4 py-2">
                      {l.lesson_order}. {l.title}
                    </td>

                    <td className="px-4 py-2 tabular-nums">
                      {r ? Math.round(Number(r.progress_percentage)) : 0}%
                    </td>

                    <td className="px-4 py-2">
                      {r?.completed ? (
                        <Badge tone="green">Yakunlangan</Badge>
                      ) : r ? (
                        <Badge tone="teal">Jarayonda</Badge>
                      ) : (
                        <Badge>Hali boshlanmagan</Badge>
                      )}
                    </td>

                    <td className="px-4 py-2 text-slate-600">
                      {r ? relativeDay(r.last_watched_at) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      );
    })
  )}
</div>


);
}
