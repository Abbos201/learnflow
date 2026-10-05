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
 * Barcha published videolar ochiq.
 *
 * O'quvchi:
 * - istalgan videoni ochishi mumkin
 * - videolarni tartib bilan ko'rishi shart emas
 * - oldingi videoni tugatishi shart emas
 */
export function computeLessonStates(
  lessons: Lesson[],
  progress: ProgressLike[]
): LessonState[] {
  const map = new Map(progress.map((p) => [p.lesson_id, p]));

  return lessons.map((lesson) => {
    const p = map.get(lesson.id);

    const completed = !!p?.completed;

    return {
      ...lesson,

      // Har bir video ochiq
      unlocked: true,

      completed,

      status: completed ? 'completed' : 'current',

      watched_seconds: Number(
        p?.watched_seconds ?? 0
      ),

      progress_percentage: completed
        ? 100
        : Number(p?.progress_percentage ?? 0),
    };
  });
}