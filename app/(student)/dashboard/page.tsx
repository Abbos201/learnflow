import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { CourseCard } from '@/components/course/course-card';
import { EmptyState, PageHeader } from '@/components/ui';
import { relativeDay } from '@/lib/utils';
import type { Course } from '@/types';

export const dynamic = 'force-dynamic';

export default async function StudentDashboard() {
  const profile = await requireUser();
  const supabase = createClient();

const [
  { data: courseRows, error: coursesError },
  { data: counts, error: countsError },
  { data: summary, error: summaryError },
  { data: recent, error: recentError },
] = await Promise.all([
  supabase
    .from('courses')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: true }),

  supabase
    .from('course_lesson_counts')
    .select('course_id, published_lessons'),

  supabase
    .from('course_progress_summary')
    .select('course_id, completed_lessons')
    .eq('user_id', profile.id),

  supabase
    .from('student_progress')
    .select(
      'lesson_id, course_id, progress_percentage, completed, last_watched_at, lessons(title), courses(title)'
    )
    .eq('user_id', profile.id)
    .order('last_watched_at', { ascending: false })
    .limit(5),
]);

console.log('COURSES ERROR:', coursesError);
console.log('COUNTS ERROR:', countsError);
console.log('SUMMARY ERROR:', summaryError);
console.log('RECENT ERROR:', recentError);
console.log('COURSES DATA:', courseRows);

  const courses = (courseRows ?? []) as Course[];
  const total = new Map<string, number>((counts ?? []).map((c: { course_id: string; published_lessons: number }) => [c.course_id, c.published_lessons]));
  const done = new Map<string, number>((summary ?? []).map((c: { course_id: string; completed_lessons: number }) => [c.course_id, c.completed_lessons]));

  return (
    <div>
      <PageHeader title={`Welcome, ${profile.full_name || 'student'}`} subtitle="Pick up where you left off." />

      <h2 className="mb-3 text-lg font-semibold">My Courses</h2>
      {courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses yet" text="New courses will appear here as soon as they are published." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const t = total.get(c.id) ?? 0;
            const d = done.get(c.id) ?? 0;
            return <CourseCard key={c.id} course={c} completed={d} total={t} href={`/courses/${c.id}`} cta={d > 0 && d < t ? 'Continue Learning' : d >= t && t > 0 ? 'Review course' : 'Start Learning'} />;
          })}
        </div>
      )}

      {recent && recent.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Recently watched</h2>
          <ul className="card divide-y divide-slate-100">
            {recent.map((r: any) => (
              <li key={r.lesson_id}>
                <Link href={`/courses/${r.course_id}/lessons/${r.lesson_id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                  <div>
                    <div className="font-medium text-slate-900">{r.lessons?.title ?? 'Lesson'}</div>
                    <div className="text-xs text-slate-500">{r.courses?.title} · {relativeDay(r.last_watched_at)}</div>
                  </div>
                  <span className="text-sm text-slate-600">{r.completed ? 'Completed' : `${Math.round(Number(r.progress_percentage))}%`}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
