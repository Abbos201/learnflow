'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

interface SettingsFormProps {
  id: string;
  email: string;
  fullName: string;
}

export function SettingsForm({
  id,
  email,
  fullName,
}: SettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState(fullName);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const username = email.replace(
    /@users\.learnflow\.local$/i,
    ''
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast('error', 'Ism va familiyangizni kiriting.');
      return;
    }

    if (password && password.length < 8) {
      toast(
        'error',
        'Parol kamida 8 ta belgidan iborat bo‘lishi kerak.'
      );
      return;
    }

    setBusy(true);

    try {
      // Ismni yangilash
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedName.slice(0, 120),
        })
        .eq('id', id);

      if (profileError) {
        throw new Error(
          'Ismingizni yangilab bo‘lmadi.'
        );
      }

      // Agar yangi parol kiritilgan bo‘lsa, parolni almashtirish
      if (password) {
        const { error: passwordError } =
          await supabase.auth.updateUser({
            password,
          });

        if (passwordError) {
          throw new Error(
            'Parolni yangilab bo‘lmadi. Kuchliroq parol kiriting.'
          );
        }

        setPassword('');
      }

      toast(
        'success',
        'Sozlamalar muvaffaqiyatli saqlandi.'
      );

      router.refresh();
    } catch (error) {
      toast(
        'error',
        error instanceof Error
          ? error.message
          : 'Tarmoq xatoligi. Qayta urinib ko‘ring.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="card max-w-lg space-y-4 p-5"
    >
      {/* Username */}
      <div>
        <label
          htmlFor="s-username"
          className="label"
        >
          Username
        </label>

        <input
          id="s-username"
          className="input"
          value={username}
          disabled
          readOnly
        />
      </div>

      {/* Ism */}
      <div>
        <label
          htmlFor="s-name"
          className="label"
        >
          To‘liq ism
        </label>

        <input
          id="s-name"
          type="text"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          disabled={busy}
          placeholder="Ism va familiyangiz"
        />
      </div>

      {/* Yangi parol */}
      <div>
        <label
          htmlFor="s-pw"
          className="label"
        >
          Yangi parol
        </label>

        <input
          id="s-pw"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          disabled={busy}
          placeholder="O‘zgartirmasangiz bo‘sh qoldiring"
        />

        <p className="mt-1 text-xs text-slate-500">
          Parolni o‘zgartirmasangiz, bu joyni bo‘sh qoldiring.
          Joriy parol talab qilinmaydi.
        </p>
      </div>

      {/* Saqlash */}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={busy}
      >
        {busy && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {busy
          ? 'Saqlanmoqda...'
          : 'Sozlamalarni saqlash'}
      </button>
    </form>
  );
}