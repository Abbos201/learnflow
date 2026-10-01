'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

export function SettingsForm({
id,
email,
fullName,
}: {
id: string;
email: string;
fullName: string;
}) {
const router = useRouter();
const { toast } = useToast();
const supabase = useMemo(() => createClient(), []);

const [name, setName] = useState(fullName);
const [password, setPassword] = useState('');
const [busy, setBusy] = useState(false);

const username = email.replace(/@users.learnflow.local$/i, '');

async function onSubmit(e: FormEvent) {
e.preventDefault();

if (password && password.length < 8) {
  return toast(
    'error',
    'Parol kamida 8 ta belgidan iborat bo‘lishi kerak.'
  );
}

setBusy(true);

try {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: name.trim().slice(0, 120) })
    .eq('id', id);

  if (error) {
    throw new Error('Ismingizni yangilab bo‘lmadi.');
  }

  if (password) {
    const { error: pwErr } =
      await supabase.auth.updateUser({ password });

    if (pwErr) {
      throw new Error(
        'Parolni yangilab bo‘lmadi. Kuchliroq parol kiriting.'
      );
    }

    setPassword('');
  }

  toast('success', 'Sozlamalar saqlandi.');
  router.refresh();
} catch (err) {
  toast(
    'error',
    err instanceof Error
      ? err.message
      : 'Tarmoq xatoligi. Qayta urinib ko‘ring.'
  );
} finally {
  setBusy(false);
}


}

return ( <form
   onSubmit={onSubmit}
   className="card max-w-lg space-y-4 p-5"
 > <div> <label htmlFor="s-username" className="label">
Username </label>


    <input
      id="s-username"
      className="input"
      value={username}
      disabled
      readOnly
    />
  </div>

  <div>
    <label htmlFor="s-name" className="label">
      To‘liq ism
    </label>

    <input
      id="s-name"
      className="input"
      value={name}
      onChange={(e) => setName(e.target.value)}
      maxLength={120}
      disabled={busy}
      placeholder="Ism va familiyangiz"
    />
  </div>

  <div>
    <label htmlFor="s-pw" className="label">
      Yangi parol (o‘zgartirmaslik uchun bo‘sh qoldiring)
    </label>

    <input
      id="s-pw"
      type="password"
      className="input"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      autoComplete="new-password"
      disabled={busy}
      placeholder="Kamida 8 ta belgi"
    />
  </div>

  <button
    type="submit"
    className="btn btn-primary"
    disabled={busy}
  >
    {busy && (
      <Loader2 className="h-4 w-4 animate-spin" />
    )}
    Sozlamalarni saqlash
  </button>
</form>


);
}
