import Link from 'next/link';
import { Video, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Badge, EmptyState, PageHeader } from '@/components/ui';
import { formatDuration } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function formatUzbekDateTime(date: string) {
return new Intl.DateTimeFormat('uz-UZ', {
timeZone: 'Asia/Tashkent',
day: 'numeric',
month: 'long',
year: 'numeric',
hour: '2-digit',
minute: '2-digit',
hour12: false,
}).format(new Date(date));
}

export default async function AdminLessons() {
const supabase = createClient();

const [{ data: lessons }, { data: courses }, { data: counts }] =
await Promise.all([
supabase
.from('lessons')
.select(
'id, title, course_id, lesson_order, duration, published, created_at, courses(title)'
)
.order('created_at', { ascending: false })
.limit(500),


  supabase
    .from('courses')
    .select('id, title')
    .order('created_at', { ascending: false }),

  supabase
    .from('lesson_completion_counts')
    .select('lesson_id, completed_count'),
]);


const completed = new Map<string, number>(
(counts ?? []).map(
(c: { lesson_id: string; completed_count: number }) => [
c.lesson_id,
c.completed_count,
]
)
);

return ( <div>
<PageHeader
title="Videolar"
subtitle="Barcha mavzularga tegishli videolarni boshqaring."
actions={ <Link href="/admin/courses" className="btn btn-primary"> <Plus className="h-4 w-4" />
Video qo‘shish </Link>
}
/>


  {!lessons || lessons.length === 0 ? (
    <EmptyState
      icon={Video}
      title="Hozircha videolar mavjud emas"
      text="Video qo‘shish uchun avval mavzuni tanlang."
      action={
        <Link href="/admin/courses" className="btn btn-primary">
          Mavzuni tanlash
        </Link>
      }
    />
  ) : (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-slate-200 text-left text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Video</th>
            <th className="px-4 py-3 font-medium">Mavzu</th>
            <th className="px-4 py-3 font-medium">Tartib</th>
            <th className="px-4 py-3 font-medium">Davomiyligi</th>
            <th className="px-4 py-3 font-medium">Yakunlaganlar</th>
            <th className="px-4 py-3 font-medium">Holati</th>
            <th className="px-4 py-3 font-medium">Yuklangan vaqt</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {lessons.map((l: any) => (
            <tr key={l.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">
                <Link
                  href={`/admin/courses/${l.course_id}/lessons/${l.id}`}
                  className="hover:text-teal-700"
                >
                  {l.title}
                </Link>
              </td>

              <td className="px-4 py-3 text-slate-600">
                {l.courses?.title}
              </td>

              <td className="px-4 py-3 tabular-nums">
                {l.lesson_order}
              </td>

              <td className="px-4 py-3 tabular-nums text-slate-600">
                {l.duration ? formatDuration(l.duration) : '-'}
              </td>

              <td className="px-4 py-3">
                {completed.get(l.id) ?? 0} nafar
              </td>

              <td className="px-4 py-3">
                <Badge tone={l.published ? 'green' : 'amber'}>
                  {l.published ? 'Nashr qilingan' : 'Qoralama'}
                </Badge>
              </td>

              <td className="px-4 py-3 text-slate-600">
                {formatUzbekDateTime(l.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>


);
}
