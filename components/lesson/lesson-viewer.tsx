'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
} from 'lucide-react';

import VideoPlayer from '@/components/video-player/video-player';
import { ProgressBar } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { computeLessonStates } from '@/lib/utils/lessons';
import { cn, formatDuration } from '@/lib/utils';
import type { Lesson } from '@/types';

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
};

export function LessonViewer({
  course,
  lessons,
  completedIds,
  currentId,
  src,
  initialWatched,
  initialPercent,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [done, setDone] = useState<string[]>(completedIds);

  const [percent, setPercent] = useState(initialPercent);

  /*
   * Videolar holati.
   *
   * lib/utils/lessons.ts dagi yangi kod bilan
   * barcha videolar unlocked=true bo'ladi.
   */
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

  /*
   * Hozirgi video indexi
   */
  const index = states.findIndex(
    (l) => l.id === currentId
  );

  const lesson = states[index];

  /*
   * Oldingi video
   */
  const prev =
    index > 0
      ? states[index - 1]
      : null;

  /*
   * Keyingi video
   */
  const next =
    index < states.length - 1
      ? states[index + 1]
      : null;

  /*
   * Hozirgi video tugaganmi?
   */
  const completed = done.includes(currentId);

  /*
   * Video URL bazasi
   */
  const base = `/courses/${course.id}/lessons`;

  /*
   * Agar current lesson topilmasa
   */
  if (!lesson) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-semibold text-red-800">
          Video topilmadi
        </p>

        <Link
          href={`/courses/${course.id}`}
          className="mt-3 inline-flex text-sm font-medium text-red-700 hover:underline"
        >
          Kursga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Kurs nomi va video nomi */}
      <div className="mb-4">
        <Link
          href={`/courses/${course.id}`}
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          {course.title}
        </Link>

        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {index + 1}-video: {lesson.title}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ========================================================= */}
        {/* ASOSIY VIDEO QISMI */}
        {/* ========================================================= */}

        <div className="min-w-0 space-y-4">
          <VideoPlayer
            src={src}
            lessonId={currentId}
            initialWatched={initialWatched}
            alreadyCompleted={completed}
            knownDuration={lesson.duration}
            onPercent={setPercent}
            onCompleted={() => {
              setDone((d) =>
                d.includes(currentId)
                  ? d
                  : [...d, currentId]
              );

              setPercent(100);

              toast(
                'success',
                'Video muvaffaqiyatli yakunlandi!'
              );

              router.refresh();
            }}
            onError={(message) =>
              toast('error', message)
            }
          />

          {/* Progress */}
          <div>
            <div className="mb-1 flex justify-between text-sm text-slate-600">
              <span>
                {completed ? 100 : percent}% yakunlandi
              </span>

              <span>
                {index + 1} / {states.length}-video
              </span>
            </div>

            <ProgressBar
              value={completed ? 100 : percent}
            />
          </div>

          {/* ========================================================= */}
          {/* VIDEO TUGAGANDA CHIQADIGAN XABAR */}
          {/* ========================================================= */}

          {completed && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-800">
                Video yakunlandi!
              </p>

              {next ? (
                <Link
                  href={`${base}/${next.id}`}
                  prefetch={false}
                  className="btn btn-primary mt-3"
                >
                  Keyingi videoga o‘tish

                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <p className="mt-1 text-sm text-emerald-800">
                  Tabriklaymiz! Siz ushbu mavzudagi barcha
                  videolarni yakunladingiz.
                </p>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* OLDINGI / KEYINGI VIDEO */}
          {/* ========================================================= */}

          <div className="flex items-center justify-between gap-3">
            {/* OLDINGI VIDEO */}

            {prev ? (
              <Link
                href={`${base}/${prev.id}`}
                prefetch={false}
                className="btn btn-secondary"
              >
                <ChevronLeft className="h-4 w-4" />

                Oldingi video
              </Link>
            ) : (
              <button
                className="btn btn-secondary"
                disabled
              >
                <ChevronLeft className="h-4 w-4" />

                Oldingi video
              </button>
            )}

            {/* KEYINGI VIDEO */}

            {next ? (
              /*
               * MUHIM:
               *
               * Bu yerda endi `completed` tekshirilmaydi.
               *
               * Shuning uchun videoni tugatmasdan ham
               * keyingi videoga o'tish mumkin.
               */
              <Link
                href={`${base}/${next.id}`}
                prefetch={false}
                className="btn btn-primary"
              >
                Keyingi video

                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                className="btn btn-primary"
                disabled
                title="Bu oxirgi video"
              >
                Keyingi video

                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* ========================================================= */}
          {/* VIDEO TAVSIFI */}
          {/* ========================================================= */}

          {lesson.description && (
            <div className="card p-5">
              <h2 className="mb-2 font-semibold">
                Video haqida
              </h2>

              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {lesson.description}
              </p>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* O'NG TOMON — BARCHA VIDEOLAR */}
        {/* ========================================================= */}

        <aside className="card h-fit self-start p-3 lg:sticky lg:top-20">
          <h2 className="px-2 pb-2 pt-1 text-sm font-semibold">
            Mavzudagi videolar
          </h2>

          <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
            {states.map((l, i) => {
              /*
               * Tugagan video:
               * CheckCircle2
               *
               * Tugamagan video:
               * PlayCircle
               *
               * LOCK YO'Q.
               */
              const Icon = l.completed
                ? CheckCircle2
                : PlayCircle;

              const row = (
                <span
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-2 py-2 text-sm',

                    l.id === currentId
                      ? 'bg-teal-50 font-medium text-teal-900'
                      : 'hover:bg-slate-100'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0',

                      l.completed &&
                        'text-emerald-600',

                      !l.completed &&
                        'text-teal-700'
                    )}
                  />

                  <span className="flex-1">
                    {i + 1}. {l.title}
                  </span>

                  {l.duration ? (
                    <span className="text-xs text-slate-500">
                      {formatDuration(l.duration)}
                    </span>
                  ) : null}
                </span>
              );

              return (
                <li key={l.id}>
                  {/*
                   * MUHIM:
                   *
                   * Bu yerda endi:
                   *
                   * l.unlocked ?
                   *
                   * tekshiruvi YO'Q.
                   *
                   * Barcha videolar Link bo'ladi.
                   */}

                  <Link
                    href={`${base}/${l.id}`}
                    prefetch={false}
                  >
                    {row}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}