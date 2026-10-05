import Link from 'next/link';
import { Plus, Users } from 'lucide-react';

import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

import { StudentActions } from '@/components/admin/student-actions';
import { Badge, EmptyState, PageHeader } from '@/components/ui';

type StudentProgress = {
  user_id: string;
  completed_lessons: number | null;
  last_activity: string | null;
};

type Student = {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  created_at: string;
};

function formatUzbekDateTime(value: string | null) {
  if (!value) return 'Hali faollik yo‘q';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Hali faollik yo‘q';
  }

  return new Intl.DateTimeFormat('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export default async function AdminStudentsPage() {
  await requireAdmin();

  const supabase = createClient();

  // Faqat studentlarni olamiz.
  // Adminlar bu ro‘yxatga umuman tushmaydi.
  const {
    data: students,
    error: studentsError,
  } = await supabase
    .from('profiles')
    .select(
      'id, email, username, full_name, created_at'
    )
    .eq('role', 'student')
    .order('created_at', {
      ascending: false,
    });

  if (studentsError) {
    throw new Error(
      'O‘quvchilar ro‘yxatini yuklab bo‘lmadi.'
    );
  }

  const visibleStudents = (students ?? []) as Student[];

  const {
    data: progressRows,
    error: progressError,
  } = await supabase
    .from('course_progress_summary')
    .select(
      'user_id, completed_lessons, last_activity'
    );

  if (progressError) {
    throw new Error(
      'O‘quvchilar natijalarini yuklab bo‘lmadi.'
    );
  }

  const progressByUser = new Map<
    string,
    {
      completed: number;
      last: string | null;
    }
  >();

  for (
    const row of (progressRows ?? []) as StudentProgress[]
  ) {
    const current =
      progressByUser.get(row.user_id) ?? {
        completed: 0,
        last: null,
      };

    current.completed +=
      row.completed_lessons ?? 0;

    if (
      row.last_activity &&
      (!current.last ||
        new Date(row.last_activity).getTime() >
          new Date(current.last).getTime())
    ) {
      current.last = row.last_activity;
    }

    progressByUser.set(row.user_id, current);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="O‘quvchilar"
        subtitle="O‘quvchilar akkauntlarini boshqaring."
        actions={
          <Link
            href="/admin/students/add"
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            O‘quvchi qo‘shish
          </Link>
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {visibleStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="O‘quvchilar topilmadi"
            text="Birinchi o‘quvchini qo‘shish uchun quyidagi tugmani bosing."
            action={
              <Link
                href="/admin/students/add"
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4" />
                O‘quvchi qo‘shish
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="border-b bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">
                    O‘quvchi
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Yakunlangan videolar
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Oxirgi faollik
                  </th>

                  <th className="px-4 py-3 text-right font-semibold">
                    Amallar
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {visibleStudents.map((student) => {
                  const progress =
                    progressByUser.get(student.id);

                  const username =
                    student.username ||
                    student.email
                      .replace(
                        /@users\.learnflow\.local$/i,
                        ''
                      )
                      .trim();

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {student.full_name ||
                            'Ism kiritilmagan'}
                        </Link>
                      </td>


                      <td className="px-4 py-4 font-medium text-gray-700">
                        {progress?.completed ?? 0} ta
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {formatUzbekDateTime(
                          progress?.last ?? null
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <StudentActions
                            id={student.id}
                            name={
                              student.full_name ||
                              username ||
                              'O‘quvchi'
                            }
                            role="student"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}