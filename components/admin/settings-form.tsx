'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

export function SettingsForm({ id, email, fullName }: { id: string; email: string; fullName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState(fullName);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password && password.length < 8) return toast('error', 'Password must be at least 8 characters.');
    setBusy(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: name.trim().slice(0, 120) }).eq('id', id);
      if (error) throw new Error('Could not update your name.');
      if (password) {
        const { error: pwErr } = await supabase.auth.updateUser({ password });
        if (pwErr) throw new Error('Could not update your password. Try a stronger one.');
        setPassword('');
      }
      toast('success', 'Settings saved.');
      router.refresh();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-lg space-y-4 p-5">
      <div>
        <label className="label">Email</label>
        <input className="input" value={email} disabled readOnly />
      </div>
      <div>
        <label htmlFor="s-name" className="label">Full name</label>
        <input id="s-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} disabled={busy} />
      </div>
      <div>
        <label htmlFor="s-pw" className="label">New password (leave empty to keep current)</label>
        <input id="s-pw" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" disabled={busy} />
      </div>
      <button className="btn btn-primary" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save settings</button>
    </form>
  );
}
