import Link from 'next/link';
import { Users } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { StudentActions } from '@/components/admin/student-actions';
import { Badge, EmptyState, PageHeader } from '@/components/ui';
import { relativeDay } from '@/lib/utils';
import type { Profile } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AdminStudents() {
  const me = await requireAdmin();
  const supabase = createClient();
  const [{ data }, { data: summary }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000),
    supabase.from('course_progress_summary').select('user_id, completed_lessons, last_activity').limit(5000),
  ]);
  const profiles = (data ?? []) as Profile[];
  const stats = new Map<string, { done: number; last: string | null }>();
  (summary ?? []).forEach((r: { user_id: string; completed_lessons: number; last_activity: string }) => {
    const s = stats.get(r.user_id) ?? { done: 0, last: null };
    s.done += r.completed_lessons;
    if (!s.last || r.last_activity > s.last) s.last = r.last_activity;
    stats.set(r.user_id, s);
  });

  return (
    <div>
      <PageHeader title="Students" subtitle="Everyone who registered. Open a student to see detailed progress." />
      {profiles.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" text="Students appear here after they register." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Lessons completed</th><th className="px-4 py-3 font-medium">Last activity</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.map((p) => {
                const s = stats.get(p.id);
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium"><Link href={`/admin/students/${p.id}`} className="hover:text-teal-700">{p.full_name || 'Unnamed'}</Link></td>
                    <td className="px-4 py-3 text-slate-600">{p.email}</td>
                    <td className="px-4 py-3"><Badge tone={p.role === 'admin' ? 'teal' : 'slate'}>{p.role}</Badge></td>
                    <td className="px-4 py-3">{s?.done ?? 0}</td>
                    <td className="px-4 py-3 text-slate-600">{s?.last ? relativeDay(s.last) : 'never'}</td>
                    <td className="px-4 py-3">{p.id !== me.id && <StudentActions id={p.id} name={p.full_name || p.email} role={p.role} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
