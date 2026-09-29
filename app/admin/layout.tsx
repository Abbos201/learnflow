import { requireAdmin } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin(); // server-side role check; RLS enforces the same rule in the database
  return (
    <div className="min-h-screen lg:flex">
      <AdminSidebar name={profile.full_name || profile.email} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
