import { requireAdmin } from '@/lib/auth';
import { SettingsForm } from '@/components/admin/settings-form';
import { PageHeader } from '@/components/ui';

export default async function AdminSettings() {
  const profile = await requireAdmin();
  return (
    <div>
      <PageHeader title="Settings" subtitle="Your admin account." />
      <SettingsForm id={profile.id} email={profile.email} fullName={profile.full_name ?? ''} />
    </div>
  );
}
