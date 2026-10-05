import { redirect } from 'next/navigation';

import { getCurrentProfile } from '@/lib/auth';
import { AdminLoginForm } from '@/components/admin/admin-login-form';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const profile = await getCurrentProfile();

  if (profile?.role === 'admin') {
    redirect('/admin/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <AdminLoginForm />
    </main>
  );
}