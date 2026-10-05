import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { requireAdmin } from '@/lib/auth';
import { StudentBulkForm } from '@/components/admin/student-bulk-form';

export default async function AddStudentsPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div>
        <Link
          href="/admin/students"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          O‘quvchilar ro‘yxatiga qaytish
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            O‘quvchilar qo‘shish
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Bir vaqtning o‘zida bir nechta o‘quvchi akkauntini yarating.
          </p>
        </div>
      </div>

      <StudentBulkForm />
    </div>
  );
}