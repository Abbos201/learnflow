import Link from 'next/link';
import { Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Badge, EmptyState, PageHeader } from '@/components/ui';
import { formatDuration, relativeDay } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminLessons() {
  const supabase = createClient();
  const [{ data: lessons }, { data: counts }] = await Promise.all([
    supabase.from('lessons').select('id, title, course_id, lesson_order, duration, published, created_at, courses(title)').order('created_at', { ascending: false }).limit(500),
    supabase.from('lesson_completion_counts').select('lesson_id, completed_count'),
  ]);
  const completed = new Map<string, number>((counts ?? []).map((c: { lesson_id: string; completed_count: number }) => [c.lesson_id, c.completed_count]));

  return (
    <div>
      <PageHeader title="Lessons" subtitle="All lessons across courses. Newest first. Add lessons from a course page." />
      {!lessons || lessons.length === 0 ? (
        <EmptyState icon={Video} title="No lessons yet" action={<Link href="/admin/courses" className="btn btn-primary">Go to courses</Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr><th className="px-4 py-3 font-medium">Lesson</th><th className="px-4 py-3 font-medium">Course</th><th className="px-4 py-3 font-medium">Order</th><th className="px-4 py-3 font-medium">Length</th><th className="px-4 py-3 font-medium">Completed by</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Uploaded</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lessons.map((l: any) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium"><Link href={`/admin/courses/${l.course_id}/lessons/${l.id}`} className="hover:text-teal-700">{l.title}</Link></td>
                  <td className="px-4 py-3 text-slate-600">{l.courses?.title}</td>
                  <td className="px-4 py-3 tabular-nums">{l.lesson_order}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">{l.duration ? formatDuration(l.duration) : '-'}</td>
                  <td className="px-4 py-3">{completed.get(l.id) ?? 0}</td>
                  <td className="px-4 py-3"><Badge tone={l.published ? 'green' : 'amber'}>{l.published ? 'Published' : 'Draft'}</Badge></td>
                  <td className="px-4 py-3 text-slate-600">{relativeDay(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
