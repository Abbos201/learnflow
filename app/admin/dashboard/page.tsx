import Link from 'next/link';
import { BookOpen, CheckCircle2, Plus, Users, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, StatCard } from '@/components/ui';
import { relativeDay } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = createClient();
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

  const [students, courses, lessons, completed, recent] = await Promise.all([
    count(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student')),
    count(supabase.from('courses').select('id', { count: 'exact', head: true })),
    count(supabase.from('lessons').select('id', { count: 'exact', head: true })),
    count(supabase.from('student_progress').select('id', { count: 'exact', head: true }).eq('completed', true)),
    supabase.from('lessons').select('id, title, course_id, created_at, courses(title)').order('created_at', { ascending: false }).limit(5),
  ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        actions={
          <>
            <Link href="/admin/courses/new" className="btn btn-primary"><Plus className="h-4 w-4" /> Add Course</Link>
            <Link href="/admin/courses" className="btn btn-secondary"><Video className="h-4 w-4" /> Add Lesson</Link>
            <Link href="/admin/students" className="btn btn-secondary"><Users className="h-4 w-4" /> Manage Students</Link>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={students} icon={Users} />
        <StatCard label="Courses" value={courses} icon={BookOpen} />
        <StatCard label="Lessons" value={lessons} icon={Video} />
        <StatCard label="Completed lessons" value={completed} icon={CheckCircle2} />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Recently uploaded lessons</h2>
      {!recent.data || recent.data.length === 0 ? (
        <div className="card p-6 text-sm text-slate-600">No lessons yet. Create a course, then add your first lesson.</div>
      ) : (
        <ul className="card divide-y divide-slate-100">
          {recent.data.map((l: any) => (
            <li key={l.id}>
              <Link href={`/admin/courses/${l.course_id}/lessons/${l.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                <div>
                  <div className="font-medium">{l.title}</div>
                  <div className="text-xs text-slate-500">{l.courses?.title}</div>
                </div>
                <span className="text-sm text-slate-600">uploaded {relativeDay(l.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
