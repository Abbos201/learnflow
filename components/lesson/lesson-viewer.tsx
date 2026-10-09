
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  PlayCircle,
} from 'lucide-react';

import VideoPlayer from '@/components/video-player/video-player';
import { ProgressBar } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { computeLessonStates } from '@/lib/utils/lessons';
import { cn, formatDuration } from '@/lib/utils';
import { getCourseTests } from '@/app/admin/actions';
import type { Lesson } from '@/types';

type CourseTest = {
  id: string;
  title: string;
  url: string;
};

type Props = {
  course: {
    id: string;
    title: string;
  };
  lessons: Lesson[];
  completedIds: string[];
  currentId: string;
  src: string;
  initialWatched: number;
  initialPercent: number;
  alreadyCompleted?: boolean;
  knownDuration?: number | null;
};

export function LessonViewer({
  course,
  lessons,
  completedIds,
  currentId,
  src,
  initialWatched,
  initialPercent,
  alreadyCompleted = false,
  knownDuration = null,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [done, setDone] = useState<string[]>(completedIds);
  const [percent, setPercent] = useState(initialPercent);
  const [playerError, setPlayerError] = useState('');
  const [tests, setTests] = useState<CourseTest[]>([]);
  const [testsLoading, setTestsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadTests() {
      setTestsLoading(true);

      try {
        const result = await getCourseTests(course.id);

        if (!active) return;

        if (result.ok) {
          setTests(result.tests as CourseTest[]);
        } else {
          setTests([]);
        }
      } catch {
        if (active) setTests([]);
      } finally {
        if (active) setTestsLoading(false);
      }
    }

    void loadTests();

    return () => {
      active = false;
    };
  }, [course.id]);

  const states = useMemo(
    () =>
      computeLessonStates(
        lessons,
        done.map((id) => ({
          lesson_id: id,
          completed: true,
        }))
      ),
    [lessons, done]
  );

  const index = states.findIndex((item) => item.id === currentId);
  const lesson = states[index];
  const prev = index > 0 ? states[index - 1] : null;
  const next =
    index >= 0 && index < states.length - 1
      ? states[index + 1]
      : null;

  const completed =
    alreadyCompleted || done.includes(currentId);

  const base = `/courses/${course.id}/lessons`;

  if (!lesson) {
    return (
      <div className="card p-6">
        <p className="text-sm text-slate-600">
          Video topilmadi yoki u mavjud emas.
        </p>

        <Link
          href={`/courses/${course.id}`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Mavzuga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/courses/${course.id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-700"
        >
          <ChevronLeft className="h-4 w-4" />
          {course.title}
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {lesson.title}
        </h1>

        {lesson.description && (
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
            {lesson.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Video player va progress */}
        <div className="min-w-0 space-y-4">
          <VideoPlayer
            key={currentId}
            src={src}
            lessonId={currentId}
            initialWatched={initialWatched}
            alreadyCompleted={completed}
            knownDuration={knownDuration}
            onPercent={(value) => {
              setPercent(value);
            }}
            onCompleted={() => {
              setDone((previous) =>
                previous.includes(currentId)
                  ? previous
                  : [...previous, currentId]
              );

              setPercent(100);
              setPlayerError('');


              router.refresh();
            }}
            onError={(message) => {
              setPlayerError(message);


            }}
          />

          {playerError && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {playerError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {prev ? (
              <Link
                href={`${base}/${prev.id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Oldingi video
              </Link>
            ) : (
              <span />
            )}

            {next && (
              <Link
                href={`${base}/${next.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800"
              >
                Keyingi video
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {/* O'ng panel: videolar va PDF fayllar */}
        <aside className="card h-fit min-w-0 self-start p-3 lg:sticky lg:top-20">
          <h2 className="mb-3 px-2 text-base font-semibold text-slate-900">
            Mavzudagi videolar
          </h2>

          <ul className="max-h-[45vh] space-y-1 overflow-y-auto">
            {states.map((item, itemIndex) => {
              const isCurrent = item.id === currentId;
              const isCompleted = done.includes(item.id);

              return (
                <li key={item.id}>
                  <Link
                    href={`${base}/${item.id}`}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={cn(
                      'flex items-start gap-3 rounded-lg px-3 py-2.5 transition',
                      isCurrent
                        ? 'bg-teal-50 text-teal-800'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <span className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <PlayCircle
                          className={cn(
                            'h-5 w-5',
                            isCurrent
                              ? 'text-teal-700'
                              : 'text-slate-400'
                          )}
                        />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-slate-400">
                        Video {itemIndex + 1}
                      </span>

                      <span className="block break-words text-sm font-medium">
                        {item.title}
                      </span>


                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* PDF ro'yxati */}
          <div className="mt-4 border-t border-slate-200 pt-4">
            <h2 className="mb-2 px-2 text-sm font-semibold text-slate-900">
              PDF fayllar
            </h2>

            {testsLoading ? (
              <p className="px-2 py-2 text-sm text-slate-500">
                PDF fayllar yuklanmoqda...
              </p>
            ) : tests.length === 0 ? (
              <p className="px-2 py-2 text-sm text-slate-500">
                Hozircha PDF fayl yo‘q.
              </p>
            ) : (
              <ul className="space-y-1">
                {tests.map((test) => (
                  <li key={test.id}>
                    <a
                      href={test.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <FileText className="h-5 w-5 shrink-0 text-teal-700" />

                      <span className="min-w-0 flex-1 break-words">
                        {test.title}
                      </span>

                      <span className="shrink-0 text-xs font-medium text-teal-700">
                        Ochish
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
