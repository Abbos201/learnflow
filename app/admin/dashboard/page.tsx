import Link from 'next/link';
import { BookOpen, Plus, Users, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, StatCard } from '@/components/ui';
import { relativeDay } from '@/lib/utils';

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

export default async function AdminDashboard() {
const supabase = createClient();

const count = async (q: PromiseLike<{ count: number | null }>) =>
(await q).count ?? 0;

const [students, courses, lessons, completed, recent] = await Promise.all([
count(
supabase
.from('profiles')
.select('id', { count: 'exact', head: true })
.eq('role', 'student')
),


count(
  supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
),

count(
  supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
),

count(
  supabase
    .from('student_progress')
    .select('id', { count: 'exact', head: true })
    .eq('completed', true)
),

supabase
  .from('lessons')
  .select('id, title, course_id, created_at, courses(title)')
  .order('created_at', { ascending: false })
  .limit(5),


]);

return ( <div>
<PageHeader
title="Boshqaruv paneli"
actions={
<> <Link
           href="/admin/courses/new"
           className="btn btn-primary"
         > <Plus className="h-4 w-4" />
Yangi mavzu qo‘shish </Link>


        <Link
          href="/admin/courses"
          className="btn btn-secondary"
        >
          <Video className="h-4 w-4" />
          Videolar
        </Link>

        <Link
          href="/admin/students"
          className="btn btn-secondary"
        >
          <Users className="h-4 w-4" />
          O‘quvchilar
        </Link>
      </>
    }
  />

  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <StatCard
      label="O‘quvchilar"
      value={students}
      icon={Users}
    />

    <StatCard
      label="Mavzular"
      value={courses}
      icon={BookOpen}
    />

    <StatCard
      label="Videolar"
      value={lessons}
      icon={Video}
    />
  </div>

  <h2 className="mb-3 mt-8 text-lg font-semibold">
    Yaqinda yuklangan videolar
  </h2>

  {!recent.data || recent.data.length === 0 ? (
    <div className="card p-6 text-sm text-slate-600">
      Hozircha yuklangan videolar mavjud emas.
    </div>
  ) : (
    <ul className="card divide-y divide-slate-100">
      {recent.data.map((l: any) => (
        <li key={l.id}>
          <Link
            href={`/admin/courses/${l.course_id}/lessons/${l.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
          >
            <div>
              <div className="font-medium">{l.title}</div>

              <div className="text-xs text-slate-500">
                {l.courses?.title}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-600">
                {formatUzbekDateTime(l.created_at)}

              </div>

            </div>
          </Link>
        </li>
      ))}
    </ul>
  )}
</div>


);
}
