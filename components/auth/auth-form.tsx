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

    const username = String(form.get('username') ?? '')
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
      if (isRegister) {
        if (!username) {
          throw new Error('Please enter a username.');
        }

        if (!/^@[a-zA-Z0-9_]{3,30}$/.test(username)) {
          throw new Error(
            'Username must be 3–30 characters and contain only letters, numbers, and _.'
          );
        }

        if (!fullName) {
          throw new Error('Please enter your full name.');
        }

        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters.');
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        /*
         * Supabase Password Auth normally requires an email.
         * We generate a private technical email from the username.
         * The user never needs to enter or see this email.
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
            throw new Error('This username is already taken.');
          }

          throw signUpError;
        }

        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setInfo('Account created. You can now log in.');
        }
      } else {
        if (!username) {
          throw new Error('Please enter your username.');
        }

        if (!password) {
          throw new Error('Please enter your password.');
        }

        /*
         * Resolve username -> technical email on the server.
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
          throw new Error('Invalid username or password.');
        }

        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email: result.email,
            password,
          });

        if (loginError) {
          throw new Error('Invalid username or password.');
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
            ? 'Could not create your account.'
            : 'Invalid username or password.')
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
          Username
        </label>

        <input
          id="username"
          name="username"
          className="input"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          pattern="@[a-zA-Z0-9_]{3,30}"
          placeholder="abbos123"
        />

        <p className="mt-1 text-xs text-slate-500">
          3–30 characters: letters, numbers and underscore.
        </p>
      </div>

      {isRegister && (
        <div>
          <label htmlFor="full_name" className="label">
            Full name
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
          Password
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
            Confirm password
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

        {isRegister ? 'Create account' : 'Log in'}
      </button>

      <p className="text-center text-sm text-slate-600">
        {isRegister ? (
          <>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-teal-700 hover:underline"
            >
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link
              href="/register"
              className="font-medium text-teal-700 hover:underline"
            >
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}