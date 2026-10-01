
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
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
    showProgress && total! > 0
      ? Math.round((completed! / total!) * 100)
      : 0;

  return (
    <div className="card flex flex-col overflow-hidden">
      {course.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={course.thumbnail_url}
          alt=""
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-teal-50 text-teal-700">
          <BookOpen className="h-10 w-10" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-slate-900">
          {course.title}
        </h3>

        {course.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
            {course.description}
          </p>
        )}

        {showProgress && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-slate-600">
              <span>O‘zlashtirish: {pct}%</span>
              <span>
                {completed} / {total} ta video
              </span>
            </div>

            <ProgressBar value={pct} />
          </div>
        )}

        <Link
          href={href}
          className="btn btn-primary mt-5 self-start"
        >
          {cta ?? 'Mavzuni ochish'}
        </Link>
      </div>
    </div>
  );
}

