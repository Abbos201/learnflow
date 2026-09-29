'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { DeleteButton } from '@/components/admin/delete-button';
import { setUserRole } from '@/app/admin/actions';

export function StudentActions({ id, name, role }: { id: string; name: string; role: 'admin' | 'student' }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function change() {
    setBusy(true);
    try {
      const res = await setUserRole(id, role === 'admin' ? 'student' : 'admin');
      if (!res.ok) return toast('error', res.error ?? 'Could not change the role.');
      toast('success', 'Role updated.');
      router.refresh();
    } catch {
      toast('error', 'Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <button onClick={change} disabled={busy} className="btn btn-ghost px-2 py-1 text-xs">{role === 'admin' ? 'Make student' : 'Make admin'}</button>
      {role === 'student' && <DeleteButton kind="student" id={id} name={name} iconOnly />}
    </div>
  );
}
