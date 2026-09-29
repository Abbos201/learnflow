import type { Lesson, Progress } from '@/types';

export type LessonState = Lesson & {
  completed: boolean;
  unlocked: boolean;
  status: 'completed' | 'current' | 'locked';
  watched_seconds: number;
  progress_percentage: number;
};

type ProgressLike = Pick<Progress, 'lesson_id' | 'completed'> &
  Partial<Pick<Progress, 'watched_seconds' | 'progress_percentage'>>;

/**
 * `lessons` must already be published lessons sorted by lesson_order.
 * The first lesson is unlocked; every other lesson needs the previous one completed.
 * This mirrors public.can_access_lesson() in the database, which is the real enforcement.
 */
export function computeLessonStates(lessons: Lesson[], progress: ProgressLike[]): LessonState[] {
  const map = new Map(progress.map((p) => [p.lesson_id, p]));
  let previousDone = true;
  return lessons.map((lesson) => {
    const p = map.get(lesson.id);
    const completed = !!p?.completed;
    const unlocked = previousDone;
    previousDone = completed;
    return {
      ...lesson,
      completed,
      unlocked,
      status: completed ? 'completed' : unlocked ? 'current' : 'locked',
      watched_seconds: Number(p?.watched_seconds ?? 0),
      progress_percentage: completed ? 100 : Number(p?.progress_percentage ?? 0),
    };
  });
}
