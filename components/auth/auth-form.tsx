
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

    const fullName = String(form.get('full_name') ?? '')
      .trim()
      .slice(0, 120);

    const password = String(form.get('password') ?? '');

    const confirmPassword = String(
      form.get('confirm_password') ?? ''
    );

    try {
      /*
       * ==========================================
       * USERNAME NI NORMAL HOLATGA KELTIRISH
       * ==========================================
       *
       * Foydalanuvchi:
       *   abbos123
       *
       * deb yozsa:
       *   @abbos123
       *
       * bo'ladi.
       */
      if (username && !username.startsWith('@')) {
        username = `@${username}`;
      }

      if (!username) {
        throw new Error(
          'Foydalanuvchi nomini kiriting.'
        );
      }

      /*
       * Username formati:
       *
       * @abbos
       * @abbos123
       * @user_name
       *
       * 3-30 ta belgi.
       */
      if (!/^@[a-z0-9_]{3,30}$/.test(username)) {
        throw new Error(
          'Foydalanuvchi nomi 3–30 ta belgidan iborat bo‘lishi kerak. Faqat harflar, raqamlar va _ belgisidan foydalaning.'
        );
      }

      /*
       * @ belgisini Supabase texnik emailidan olib tashlaymiz.
       *
       * @abbos123
       *     ↓
       * abbos123
       *     ↓
       * abbos123@users.learnflow.local
       */
      const technicalUsername = username.slice(1);

      const technicalEmail =
        `${technicalUsername}@users.learnflow.local`;

      /*
       * ==========================================
       * REGISTER
       * ==========================================
       */
      if (isRegister) {
        if (!fullName) {
          throw new Error(
            'Ism va familiyangizni kiriting.'
          );
        }

        if (password.length < 8) {
          throw new Error(
            'Parol kamida 8 ta belgidan iborat bo‘lishi kerak.'
          );
        }

        if (password !== confirmPassword) {
          throw new Error(
            'Parollar bir-biriga mos kelmadi.'
          );
        }

        /*
         * Supabase Auth orqali foydalanuvchi yaratamiz.
         *
         * Email foydalanuvchidan olinmaydi.
         * Faqat Supabase ichida texnik email ishlatiladi.
         */
        const {
          data,
          error: signUpError,
        } = await supabase.auth.signUp({
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
          const message =
            signUpError.message.toLowerCase();

          if (
            message.includes('already registered') ||
            message.includes('already been registered') ||
            message.includes('user already exists') ||
            message.includes('already exists')
          ) {
            throw new Error(
              'Bu foydalanuvchi nomi band.'
            );
          }

          throw signUpError;
        }

        /*
         * Agar Supabase session yaratgan bo‘lsa,
         * to‘g‘ridan-to‘g‘ri dashboardga o'tamiz.
         */
        if (data.session) {
          router.push(next || '/dashboard');
          router.refresh();
          return;
        }

        /*
         * Agar session kelmagan bo‘lsa, ehtimol
         * Supabase Email Confirmation yoqilgan.
         */
        setInfo(
          'Hisob yaratildi. Endi tizimga kirishingiz mumkin.'
        );

        return;
      }

      /*
       * ==========================================
       * LOGIN
       * ==========================================
       */

      if (!password) {
        throw new Error(
          'Parolingizni kiriting.'
        );
      }

      /*
       * Username asosida Supabase texnik emaili.
       *
       * @abbos123
       *     ↓
       * abbos123@users.learnflow.local
       */
      const {
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: technicalEmail,
        password,
      });

      if (loginError) {
        throw new Error(
          'Foydalanuvchi nomi yoki parol noto‘g‘ri.'
        );
      }

      /*
       * Login muvaffaqiyatli.
       */
      router.push(next || '/dashboard');
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : '';

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
      {error && (
        <Alert tone="error">
          {error}
        </Alert>
      )}

      {info && (
        <Alert tone="success">
          {info}
        </Alert>
      )}

      {/* USERNAME */}
      <div>
        <label
          htmlFor="username"
          className="label"
        >
          Foydalanuvchi nomi
        </label>

        <input
          id="username"
          name="username"
          type="text"
          className="input"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
<<<<<<< HEAD
=======
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
>>>>>>> 681524c (gre)
        />

        <p className="mt-1 text-xs text-slate-500">
          3–30 ta belgi: harflar, raqamlar va
          pastki chiziq (_).
        </p>
      </div>

      {/* FULL NAME - FAQAT REGISTERDA */}
      {isRegister && (
        <div>
          <label
            htmlFor="full_name"
            className="label"
          >
            Ism va familiya
          </label>

          <input
            id="full_name"
            name="full_name"
            type="text"
            className="input"
            autoComplete="name"
            required
            maxLength={120}
          />
        </div>
      )}

      {/* PASSWORD */}
      <div>
        <label
          htmlFor="password"
          className="label"
        >
          Parol
        </label>

        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete={
            isRegister
              ? 'new-password'
              : 'current-password'
          }
          required
          minLength={8}
          placeholder="••••••••"
        />

        {isRegister && (
          <p className="mt-1 text-xs text-slate-500">
            Parol kamida 8 ta belgidan iborat bo‘lishi
            kerak.
          </p>
        )}
      </div>

      {/* CONFIRM PASSWORD */}
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

      {/* SUBMIT */}
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {isRegister
          ? 'Ro‘yxatdan o‘tish'
          : 'Tizimga kirish'}
      </button>

      {/* LINK */}
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

