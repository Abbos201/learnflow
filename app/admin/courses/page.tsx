import Link from 'next/link';
import { BookOpen, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Badge, EmptyState, PageHeader } from '@/components/ui';
import type { Course } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AdminCourses() {
  const supabase = createClient();
  const [{ data }, { data: counts }] = await Promise.all([
    supabase.from('courses').select('*').order('created_at', { ascending: false }),
    supabase.from('course_lesson_counts').select('course_id, total_lessons'),
  ]);
  const courses = (data ?? []) as Course[];
  const total = new Map<string, number>((counts ?? []).map((c: { course_id: string; total_lessons: number }) => [c.course_id, c.total_lessons]));

  return (
    <div>
      <PageHeader title="Courses" actions={<Link href="/admin/courses/new" className="btn btn-primary"><Plus className="h-4 w-4" /> Add Course</Link>} />
      {courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses yet" text="Create your first course, then add lessons to it." action={<Link href="/admin/courses/new" className="btn btn-primary">Add Course</Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/admin/courses/${c.id}`} className="card p-5 hover:border-teal-400">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{c.title}</h3>
                <Badge tone={c.published ? 'green' : 'amber'}>{c.published ? 'Published' : 'Draft'}</Badge>
              </div>
              {c.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{c.description}</p>}
              <p className="mt-3 text-sm text-slate-500">{total.get(c.id) ?? 0} lessons</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
