import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { computeLessonStates } from '@/lib/utils/lessons';
import { LessonViewer } from '@/components/lesson/lesson-viewer';
import { Alert } from '@/components/ui';
import { VIDEO_BUCKET } from '@/lib/utils';
import type { Course, Lesson, Progress } from '@/types';

export const dynamic = 'force-dynamic';

export default async function LessonPage({ params }: { params: { courseId: string; lessonId: string } }) {
  const profile = await requireUser();
  const supabase = createClient();

  const { data: courseRow } = await supabase.from('courses').select('id, title').eq('id', params.courseId).maybeSingle();
  if (!courseRow) notFound();
  const course = courseRow as Pick<Course, 'id' | 'title'>;

  const [{ data: lessonRows }, { data: progressRows }] = await Promise.all([
    supabase.from('lessons').select('*').eq('course_id', course.id).eq('published', true).order('lesson_order').order('created_at').order('id'),
    supabase.from('student_progress').select('*').eq('user_id', profile.id).eq('course_id', course.id),
  ]);

  const lessons = (lessonRows ?? []) as Lesson[];
  const progress = (progressRows ?? []) as Progress[];
  const states = computeLessonStates(lessons, progress);
  const current = states.find((l) => l.id === params.lessonId);
  if (!current) notFound();
  if (!current.unlocked) redirect(`/courses/${course.id}?locked=1`);

  // The storage policy re-checks can_access_lesson(), so a locked video can never be signed.
  const { data: signed, error } = await supabase.storage.from(VIDEO_BUCKET).createSignedUrl(current.video_path, 60 * 60 * 3);
  if (error || !signed) {
    return <Alert tone="error">This lesson video is not available right now. Please try again later.</Alert>;
  }

  return (
    <LessonViewer
      key={current.id}
      course={course}
      lessons={lessons}
      completedIds={progress.filter((p) => p.completed).map((p) => p.lesson_id)}
      currentId={current.id}
      src={signed.signedUrl}
      initialWatched={current.completed ? 0 : current.watched_seconds}
      initialPercent={current.progress_percentage}
    />
  );
}
