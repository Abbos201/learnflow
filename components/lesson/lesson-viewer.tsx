'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Lock, PlayCircle } from 'lucide-react';
import VideoPlayer from '@/components/video-player/video-player';
import { ProgressBar } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { computeLessonStates } from '@/lib/utils/lessons';
import { cn, formatDuration } from '@/lib/utils';
import type { Lesson } from '@/types';

type Props = {
  course: { id: string; title: string };
  lessons: Lesson[];
  completedIds: string[];
  currentId: string;
  src: string;
  initialWatched: number;
  initialPercent: number;
};

export function LessonViewer({ course, lessons, completedIds, currentId, src, initialWatched, initialPercent }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [done, setDone] = useState<string[]>(completedIds);
  const [percent, setPercent] = useState(initialPercent);
  const alreadyCompleted = completedIds.includes(currentId);

  const states = useMemo(
    () => computeLessonStates(lessons, done.map((id) => ({ lesson_id: id, completed: true }))),
    [lessons, done]
  );
  const index = states.findIndex((l) => l.id === currentId);
  const lesson = states[index];
  const prev = index > 0 ? states[index - 1] : null;
  const next = index < states.length - 1 ? states[index + 1] : null;
  const completed = done.includes(currentId);
  const base = `/courses/${course.id}/lessons`;

  return (
    <div>
      <div className="mb-4">
        <Link href={`/courses/${course.id}`} className="text-sm font-medium text-teal-700 hover:underline">{course.title}</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Lesson {index + 1}: {lesson.title}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <VideoPlayer
            src={src}
            lessonId={currentId}
            initialWatched={initialWatched}
            alreadyCompleted={alreadyCompleted}
            knownDuration={lesson.duration}
            onPercent={setPercent}
            onCompleted={() => {
              setDone((d) => (d.includes(currentId) ? d : [...d, currentId]));
              setPercent(100);
              toast('success', 'Lesson completed!');
              router.refresh(); // clears the client cache so the next lesson is fetched as unlocked
            }}
            onError={(m) => toast('error', m)}
          />

          <div>
            <div className="mb-1 flex justify-between text-sm text-slate-600">
              <span>{completed ? 100 : percent}% completed</span>
              <span>Lesson {index + 1} of {states.length}</span>
            </div>
            <ProgressBar value={completed ? 100 : percent} />
          </div>

          {completed && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-800">Lesson completed!</p>
              {next ? (
                <Link href={`${base}/${next.id}`} prefetch={false} className="btn btn-primary mt-3">
                  Continue to Next Lesson <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <p className="mt-1 text-sm text-emerald-800">Congratulations! You completed the course.</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            {prev ? (
              <Link href={`${base}/${prev.id}`} prefetch={false} className="btn btn-secondary"><ChevronLeft className="h-4 w-4" /> Previous Lesson</Link>
            ) : (
              <button className="btn btn-secondary" disabled><ChevronLeft className="h-4 w-4" /> Previous Lesson</button>
            )}
            {next && completed ? (
              <Link href={`${base}/${next.id}`} prefetch={false} className="btn btn-primary">Next Lesson <ChevronRight className="h-4 w-4" /></Link>
            ) : (
              <button className="btn btn-primary" disabled title={next ? 'Finish this lesson to unlock the next one' : 'This is the last lesson'}>Next Lesson <ChevronRight className="h-4 w-4" /></button>
            )}
          </div>

          {lesson.description && (
            <div className="card p-5">
              <h2 className="mb-2 font-semibold">About this lesson</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{lesson.description}</p>
            </div>
          )}
        </div>

        <aside className="card h-fit self-start p-3 lg:sticky lg:top-20">
          <h2 className="px-2 pb-2 pt-1 text-sm font-semibold">Lessons</h2>
          <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
            {states.map((l, i) => {
              const Icon = l.completed ? CheckCircle2 : l.unlocked ? PlayCircle : Lock;
              const row = (
                <span className={cn('flex items-center gap-3 rounded-lg px-2 py-2 text-sm', l.id === currentId ? 'bg-teal-50 font-medium text-teal-900' : l.unlocked ? 'hover:bg-slate-100' : 'text-slate-400')}>
                  <Icon className={cn('h-5 w-5 shrink-0', l.completed && 'text-emerald-600', !l.completed && l.unlocked && 'text-teal-700')} />
                  <span className="flex-1">{i + 1}. {l.title}</span>
                  {l.duration ? <span className="text-xs text-slate-500">{formatDuration(l.duration)}</span> : null}
                </span>
              );
              return (
                <li key={l.id}>
                  {l.unlocked ? <Link href={`${base}/${l.id}`} prefetch={false}>{row}</Link> : <div aria-disabled title="Complete the previous lesson to unlock">{row}</div>}
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}
