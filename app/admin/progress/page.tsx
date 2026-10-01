import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { EmptyState, PageHeader, ProgressBar } from '@/components/ui';
import { relativeDay } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Row = {
user_id: string;
course_id: string;
completed_lessons: number;
last_activity: string;
};

export default async function AdminProgress() {
const supabase = createClient();

const [{ data: rows }, { data: profiles }, { data: courses }, { data: counts }] =
await Promise.all([
supabase
.from('course_progress_summary')
.select('*')
.order('last_activity', { ascending: false })
.limit(1000),


  supabase.from('profiles').select('id, email, full_name'),

  supabase.from('courses').select('id, title'),

  supabase
    .from('course_lesson_counts')
    .select('course_id, published_lessons'),
]);


const name = new Map<
string,
{ email: string; full_name: string | null }

> ((profiles ?? []).map((p: any) => [p.id, p]));

const title = new Map<string, string>(
(courses ?? []).map((c: any) => [c.id, c.title])
);

const total = new Map<string, number>(
(counts ?? []).map((c: any) => [c.course_id, c.published_lessons])
);

const list = (rows ?? []) as Row[];

return ( <div> <PageHeader
     title="O‘quvchilar natijalari"
     subtitle="Har bir o‘quvchining mavzular bo‘yicha o‘zlashtirish darajasi. Eng so‘nggi faollik birinchi ko‘rsatiladi."
   />

```
  {list.length === 0 ? (
    <EmptyState
      icon={BarChart3}
      title="Hozircha natijalar mavjud emas"
      text="O‘quvchilar videolarni ko‘rishni boshlaganidan so‘ng ularning natijalari shu yerda ko‘rinadi."
    />
  ) : (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="border-b border-slate-200 text-left text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">O‘quvchi</th>
            <th className="px-4 py-3 font-medium">Username</th>
            <th className="px-4 py-3 font-medium">Mavzu</th>
            <th className="px-4 py-3 font-medium">Yakunlangan videolar</th>
            <th className="px-4 py-3 font-medium">Umumiy natija</th>
            <th className="px-4 py-3 font-medium">Oxirgi faollik</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {list.map((r) => {
            const t = total.get(r.course_id) ?? 0;

            const pct = t
              ? Math.min(
                  100,
                  Math.round((r.completed_lessons / t) * 100)
                )
              : 0;

            const p = name.get(r.user_id);

            const username = p?.email
              ? p.email.replace(/@users\.learnflow\.local$/i, '')
              : '-';

            return (
              <tr
                key={r.user_id + r.course_id}
                className="hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/admin/students/${r.user_id}`}
                    className="hover:text-teal-700"
                  >
                    {p?.full_name || 'Ismi ko‘rsatilmagan'}
                  </Link>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {username}
                </td>

                <td className="px-4 py-3">
                  {title.get(r.course_id)}
                </td>

                <td className="px-4 py-3 tabular-nums">
                  {r.completed_lessons} / {t}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={pct} className="w-24" />
                    <span className="tabular-nums">{pct}%</span>
                  </div>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {relativeDay(r.last_activity)}
                </td>
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
