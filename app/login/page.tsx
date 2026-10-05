import Link from 'next/link';

import { AuthForm } from '@/components/auth/auth-form';
import { safeNext } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type Student = {
  username: string;
  full_name: string | null;
};

export default async function Page({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const admin = createAdminClient();

  const { data: students } = await admin
    .from('profiles')
    .select('username, full_name')
    .eq('role', 'student')
    .not('username', 'is', null)
    .order('full_name', {
      ascending: true,
      nullsFirst: false,
    });

  const loginStudents: Student[] = (students ?? [])
    .filter(
      (
        student
      ): student is {
        username: string;
        full_name: string | null;
      } =>
        typeof student.username === 'string' &&
        student.username.trim().length > 0
    )
    .map((student) => ({
      username: student.username,
      full_name: student.full_name,
    }));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link
        href="/"
        className="mb-6 text-xl font-bold text-teal-800"
      >
        Jaloliddin
      </Link>

      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900">
          Xush kelibsiz
        </h1>

        <p className="mb-5 mt-1 text-sm text-slate-600">
          Davom etish uchun o‘quvchini tanlang:
        </p>

        <AuthForm
          mode="login"
          next={safeNext(searchParams.next)}
          students={loginStudents}
        />
      </div>
    </div>
  );
}