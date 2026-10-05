import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  PlayCircle,
} from 'lucide-react';

import { ProgressBar } from '@/components/ui';
import type { Course } from '@/types';

export function CourseCard({
  course,
  completed,
  total,
  href,
  cta,
}: {
  course: Course;
  completed?: number;
  total?: number;
  href: string;
  cta?: string;
}) {
  const showProgress =
    typeof completed === 'number' && typeof total === 'number';

  const pct =
    showProgress && total > 0
      ? Math.round((completed / total) * 100)
      : 0;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg">
      {/* Thumbnail */}
      {course.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={course.thumbnail_url}
          alt={course.title}
          className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 to-cyan-50">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-teal-100/60 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-cyan-100/60 blur-2xl" />

          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm">
            <BookOpen className="h-8 w-8" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <BookOpen className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-bold leading-6 text-slate-900">
              {course.title}
            </h3>
          </div>
        </div>

        {course.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
            {course.description}
          </p>
        )}

        {/* Progress */}
        {showProgress && (
          <div className="mt-5 rounded-xl bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">
                O‘zlashtirish
              </span>

              <span className="font-bold text-teal-700">
                {pct}%
              </span>
            </div>

            <ProgressBar value={pct} />

            <div className="mt-2 text-xs text-slate-500">
              {completed} / {total} ta video yakunlangan
            </div>
          </div>
        )}

        {/* Button */}
        <div className="mt-auto pt-5">
          <Link
            href={href}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            <PlayCircle className="h-4 w-4" />
            {cta ?? 'Mavzuni ochish'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}