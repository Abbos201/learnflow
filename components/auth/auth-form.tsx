'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Loader2, UserRound, ChevronDown } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { Alert } from '@/components/ui';

type LoginStudent = {
  username: string;
  full_name: string | null;
};

export function AuthForm({
  mode,
  next,
  students = [],
}: {
  mode: 'login' | 'register';
  next: string;
  students?: LoginStudent[];
}) {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState('');

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
       * LOGIN
       */
      if (!isRegister) {
        if (!username) {
          throw new Error('Avval o‘quvchini tanlang.');
        }

        if (!password) {
          throw new Error('Parolingizni kiriting.');
        }

        // Database username:
        // @username
        //
        // Auth email:
        // username@users.learnflow.local
        const technicalUsername = username.replace(/^@/, '');

        if (!technicalUsername) {
          throw new Error(
            'O‘quvchi ma’lumoti noto‘g‘ri.'
          );
        }

        const technicalEmail =
          `${technicalUsername}@users.learnflow.local`;

        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email: technicalEmail,
            password,
          });

        if (loginError) {
          console.error(
            'Login error:',
            loginError.message
          );

          throw new Error('Parol noto‘g‘ri.');
        }

        router.push(next || '/dashboard');
        router.refresh();

        return;
      }

      /*
       * REGISTER
       */

      if (username && !username.startsWith('@')) {
        username = `@${username}`;
      }

      if (!username) {
        throw new Error(
          'Foydalanuvchi nomini kiriting.'
        );
      }

      if (!/^@[a-z0-9_]{3,30}$/.test(username)) {
        throw new Error(
          'Foydalanuvchi nomi 3–30 ta belgidan iborat bo‘lishi kerak. Faqat harflar, raqamlar va _ belgisidan foydalaning.'
        );
      }

      const technicalUsername = username.slice(1);

      const technicalEmail =
        `${technicalUsername}@users.learnflow.local`;

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

      if (data.session) {
        router.push(next || '/dashboard');
        router.refresh();

        return;
      }

      setInfo(
        'Hisob yaratildi. Endi tizimga kirishingiz mumkin.'
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '';

      setError(
        message ||
          (isRegister
            ? 'Hisob yaratib bo‘lmadi.'
            : 'O‘quvchini tanlang va parolni kiriting.')
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

      {/* LOGIN — O‘QUVCHINI TANLASH */}

      {!isRegister && (
        <div>
          <label
            htmlFor="username"
            className="label"
          >
            O‘quvchini tanlang
          </label>

          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <select
              id="username"
              name="username"
              value={selectedUsername}
              onChange={(e) =>
                setSelectedUsername(e.target.value)
              }
              className="input w-full appearance-none pl-10 pr-10"
              required
              disabled={loading}
            >
              <option value="">
                O‘quvchini tanlang
              </option>

              {students.map((student) => (
                <option
                  key={student.username}
                  value={student.username}
                >
                  {student.full_name ||
                    'Ism kiritilmagan'}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {students.length === 0 && (
            <p className="mt-2 text-xs text-red-500">
              Hozircha o‘quvchilar mavjud emas.
            </p>
          )}
        </div>
      )}

      {/* REGISTER — USERNAME */}

      {isRegister && (
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
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={loading}
          />

          <p className="mt-1 text-xs text-slate-500">
            3–30 ta belgi: harflar, raqamlar va
            pastki chiziq (_).
          </p>
        </div>
      )}

      {/* FULL NAME */}

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
            disabled={loading}
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
          minLength={6}
          placeholder="••••••••"
          disabled={loading}
        />

        {isRegister && (
          <p className="mt-1 text-xs text-slate-500">
            Parol kamida 8 ta belgidan iborat
            bo‘lishi kerak.
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
            disabled={loading}
          />
        </div>
      )}

      {/* SUBMIT */}

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={
          loading ||
          (!isRegister && students.length === 0)
        }
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {isRegister
          ? 'Ro‘yxatdan o‘tish'
          : 'Tizimga kirish'}
      </button>
    </form>
  );
}