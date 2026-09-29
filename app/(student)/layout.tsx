import { requireUser } from '@/lib/auth';
import { StudentHeader } from '@/components/course/student-header';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser();
  return (
    <div className="min-h-screen">
      <StudentHeader profile={profile} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  );
}
