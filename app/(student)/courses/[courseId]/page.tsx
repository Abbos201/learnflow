import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Lock, PlayCircle, Video } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { computeLessonStates } from '@/lib/utils/lessons';
import { Alert, EmptyState, ProgressBar } from '@/components/ui';
import { cn, formatDuration } from '@/lib/utils';
import type { Course, Lesson, Progress } from '@/types';

export const dynamic = 'force-dynamic';

export default async function CoursePage({ params, searchParams }: { params: { courseId: string }; searchParams: { locked?: string } }) {
  const profile = await requireUser();
  const supabase = createClient();

  const { data: courseRow } = await supabase.from('courses').select('*').eq('id', params.courseId).maybeSingle();
  if (!courseRow) notFound();
  const course = courseRow as Course;

  const [{ data: lessonRows }, { data: progressRows }] = await Promise.all([
    supabase.from('lessons').select('*').eq('course_id', course.id).eq('published', true).order('lesson_order').order('created_at').order('id'),
    supabase.from('student_progress').select('*').eq('user_id', profile.id).eq('course_id', course.id),
  ]);

  const states = computeLessonStates((lessonRows ?? []) as Lesson[], (progressRows ?? []) as Progress[]);
  const completed = states.filter((s) => s.completed).length;
  const pct = states.length ? Math.round((completed / states.length) * 100) : 0;
  const current = states.find((s) => s.unlocked && !s.completed) ?? null;
  const target = current ?? states[0] ?? null;

  return (
    <div className="mx-auto max-w-3xl">
      {searchParams.locked && <div className="mb-4"><Alert tone="info">Video qulflangan ochish uchun oldingi darslarni koring!</Alert></div>}

      <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
      {course.description && <p className="mt-2 whitespace-pre-line text-slate-600">{course.description}</p>}

      <div className="card mt-6 p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">{completed} / {states.length}Video ko'rildi</span>
          <span className="text-slate-600">{pct}%</span>
        </div>
        <ProgressBar value={pct} />
        {target && (
          <Link href={`/courses/${course.id}/lessons/${target.id}`} className="btn btn-primary mt-4">
            {completed === 0 ? 'Videoni boshlash' : current ? 'Videoni davom ittirish' : 'Darsni korish'}
          </Link>
        )}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Videolar</h2>
      {states.length === 0 ? (
        <EmptyState icon={Video} title="Hali video yo'q" text="Video tez orada joylanadi" />
      ) : (
        <ul className="card divide-y divide-slate-100 overflow-hidden">
          {states.map((l, i) => {
            const Icon = l.completed ? CheckCircle2 : l.unlocked ? PlayCircle : Lock;
            const label = l.completed ? 'Completed' : l.unlocked ? (l.watched_seconds > 0 ? 'Davom etish' : 'Boshlash') : 'Qulflangan';
            const content = (
              <div className={cn('flex items-center gap-3 px-4 py-3', l.unlocked ? 'hover:bg-slate-50' : 'bg-slate-50 text-slate-400')}>
                <Icon className={cn('h-5 w-5 shrink-0', l.completed && 'text-emerald-600', !l.completed && l.unlocked && 'text-teal-700')} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">Video {i + 1} — {l.title}</div>
                  {l.duration ? <div className="text-xs text-slate-500">{formatDuration(l.duration)}</div> : null}
                </div>
                <span className="text-sm">{label}{!l.completed && l.unlocked && l.progress_percentage > 0 ? ` (${Math.round(l.progress_percentage)}%)` : ''}</span>
              </div>
            );
            return (
              <li key={l.id}>
                {l.unlocked ? <Link href={`/courses/${course.id}/lessons/${l.id}`}>{content}</Link> : <div aria-disabled title="Ochish uchun oldingi darslarni ko'ring">{content}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
