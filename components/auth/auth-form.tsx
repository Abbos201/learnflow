
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Alert } from '@/components/ui';

export function AuthForm({
  mode,
  next,
}: {
  mode: 'login' | 'register';
  next: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isRegister = mode === 'register';

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);
    setInfo(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);

    let username = String(form.get('username') ?? '')
      .trim()
      .toLowerCase();

    // Username boshiga @ avtomatik qo‘shiladi.
    if (username && !username.startsWith('@')) {
      username = `@${username}`;
    }

    const fullName = String(form.get('full_name') ?? '')
      .trim()
      .slice(0, 120);

    const password = String(form.get('password') ?? '');
    const confirmPassword = String(
      form.get('confirm_password') ?? ''
    );

    try {
      if (isRegister) {
        if (!username) {
          throw new Error('Foydalanuvchi nomini kiriting.');
        }

        if (!/^@[a-zA-Z0-9_]{3,30}$/.test(username)) {
          throw new Error(
            'Foydalanuvchi nomi 3–30 ta belgidan iborat bo‘lishi kerak. Faqat harflar, raqamlar va _ belgisidan foydalaning.'
          );
        }

        if (!fullName) {
          throw new Error('Ism va familiyangizni kiriting.');
        }

        if (password.length < 8) {
          throw new Error('Parol kamida 8 ta belgidan iborat bo‘lishi kerak.');
        }

        if (password !== confirmPassword) {
          throw new Error('Parollar bir-biriga mos kelmadi.');
        }

        /*
         * Supabase autentifikatsiyasi uchun texnik email yaratiladi.
         * Foydalanuvchidan email talab qilinmaydi.
         */
        const technicalUsername = username.slice(1);
        const technicalEmail = `${technicalUsername}@users.learnflow.local`;

        const { data, error: signUpError } =
          await supabase.auth.signUp({
            email: technicalEmail,
            password,
            options: {
              data: {
                username,
                full_name: fullName,
              },
            },
          });

        if (signUpError) {
          const message = signUpError.message.toLowerCase();

          if (
            message.includes('already registered') ||
            message.includes('already been registered') ||
            message.includes('user already exists')
          ) {
            throw new Error('Bu foydalanuvchi nomi band.');
          }

          throw signUpError;
        }

        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setInfo('Hisob yaratildi. Endi tizimga kirishingiz mumkin.');
        }
      } else {
        if (!username) {
          throw new Error('Foydalanuvchi nomini kiriting.');
        }

        if (!password) {
          throw new Error('Parolingizni kiriting.');
        }

        /*
         * Foydalanuvchi nomi orqali texnik email serverda aniqlanadi.
         */
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identifier: username,
            password,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.email) {
          throw new Error('Foydalanuvchi nomi yoki parol noto‘g‘ri.');
        }

        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email: result.email,
            password,
          });

        if (loginError) {
          throw new Error('Foydalanuvchi nomi yoki parol noto‘g‘ri.');
        }

        router.push(next);
        router.refresh();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '';

      setError(
        message ||
          (isRegister
            ? 'Hisob yaratib bo‘lmadi.'
            : 'Foydalanuvchi nomi yoki parol noto‘g‘ri.')
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="card space-y-4 p-6 shadow-sm"
    >
      {error && <Alert tone="error">{error}</Alert>}
      {info && <Alert tone="success">{info}</Alert>}

      <div>
        <label htmlFor="username" className="label">
          Foydalanuvchi nomi
        </label>

        <input
          id="username"
          name="username"
          className="input"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          placeholder="@abbos123"
        />

        <p className="mt-1 text-xs text-slate-500">
          3–30 ta belgi: harflar, raqamlar va pastki chiziq (_).
          @ belgisi avtomatik qo‘shiladi.
        </p>
      </div>

      {isRegister && (
        <div>
          <label htmlFor="full_name" className="label">
            Ism va familiya
          </label>

          <input
            id="full_name"
            name="full_name"
            className="input"
            autoComplete="name"
            required
            maxLength={120}
            placeholder="Abbos Mamarajapov"
          />
        </div>
      )}

      <div>
        <label htmlFor="password" className="label">
          Parol
        </label>

        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete={
            isRegister ? 'new-password' : 'current-password'
          }
          required
          minLength={8}
          placeholder="••••••••"
        />
      </div>

      {isRegister && (
        <div>
          <label
            htmlFor="confirm_password"
            className="label"
          >
            Parolni tasdiqlang
          </label>

          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            className="input"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="••••••••"
          />
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {isRegister ? 'Ro‘yxatdan o‘tish' : 'Tizimga kirish'}
      </button>

      <p className="text-center text-sm text-slate-600">
        {isRegister ? (
          <>
            Hisobingiz bormi?{' '}
            <Link
              href="/login"
              className="font-medium text-teal-700 hover:underline"
            >
              Tizimga kiring
            </Link>
          </>
        ) : (
          <>
            Hali hisobingiz yo‘qmi?{' '}
            <Link
              href="/register"
              className="font-medium text-teal-700 hover:underline"
            >
              Ro‘yxatdan o‘ting
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

