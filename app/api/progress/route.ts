import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * Saves watch progress. Authorization: the user session (RLS) + can_access_lesson().
 * Anti-skip: watched_seconds may only grow about as fast as real time passes between saves,
 * and a lesson only completes when the video ended and >= 95% of it was actually watched.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail('Your session has expired. Please log in again.', 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail('Invalid request.', 400);
  }

  const lessonId = String(body.lessonId ?? '');
  const watchedIn = Number(body.watchedSeconds);
  const durationIn = Number(body.duration);
  const ended = body.ended === true;
  if (!UUID.test(lessonId) || !isFinite(watchedIn) || watchedIn < 0 || !isFinite(durationIn)) {
    return fail('Invalid request.', 400);
  }

  const { data: lesson } = await supabase.from('lessons').select('id, course_id, duration').eq('id', lessonId).maybeSingle();
  if (!lesson) return fail('Lesson not found.', 404);

  const { data: allowed } = await supabase.rpc('can_access_lesson', { p_lesson_id: lessonId });
  if (!allowed) return fail('This lesson is locked.', 403);

  const { data: existing } = await supabase
    .from('student_progress')
    .select('watched_seconds, completed, last_watched_at')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (existing?.completed) {
    return NextResponse.json({ completed: true, progress_percentage: 100, watched_seconds: Number(existing.watched_seconds) });
  }

  const storedDuration = Number(lesson.duration);
  const duration = storedDuration > 0 ? storedDuration : Math.min(durationIn, 60 * 60 * 10);
  if (!(duration > 0)) return fail('Invalid video duration.', 400);

  const now = Date.now();
  const previous = Number(existing?.watched_seconds ?? 0);
  const elapsed = existing ? Math.max(0, (now - new Date(existing.last_watched_at).getTime()) / 1000) : 0;
  const maxIncrease = elapsed * 2.5 + 90;
  const watched = Math.max(previous, Math.min(watchedIn, duration, previous + maxIncrease));

  const completed = ended && watched >= duration * 0.95;
  const percentage = completed ? 100 : Math.min(99, Math.round((watched / duration) * 10000) / 100);

  const { error } = await supabase.from('student_progress').upsert(
    {
      user_id: user.id,
      course_id: lesson.course_id,
      lesson_id: lessonId,
      watched_seconds: watched,
      video_duration: duration,
      progress_percentage: percentage,
      completed,
      completed_at: completed ? new Date(now).toISOString() : null,
      last_watched_at: new Date(now).toISOString(),
    },
    { onConflict: 'user_id,lesson_id' }
  );
  if (error) {
    console.error('progress upsert failed', error.message);
    return fail('Could not save your progress.', 500);
  }

  if (ended && !completed) {
    return NextResponse.json({ completed: false, progress_percentage: percentage, watched_seconds: watched, error: 'Please watch the whole lesson to complete it.' }, { status: 200 });
  }
  return NextResponse.json({ completed, progress_percentage: percentage, watched_seconds: watched });
}
