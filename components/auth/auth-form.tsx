'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Alert } from '@/components/ui';

export function AuthForm({ mode, next }: { mode: 'login' | 'register'; next: string }) {
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
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const fullName = String(form.get('full_name') ?? '').trim().slice(0, 120);

    if (isRegister && password.length < 8) return setError('Password must be at least 8 characters.');
    if (isRegister && !fullName) return setError('Please enter your full name.');

    setLoading(true);
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) throw error;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setInfo('Account created. Check your email to confirm your address, then log in.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('fetch') || msg.includes('network')) setError('Network error. Please check your connection and try again.');
      else if (msg.includes('already registered')) setError('An account with this email already exists. Try logging in.');
      else if (isRegister) setError('Could not create your account. Please check your details and try again.');
      else if (msg.includes('confirm')) setError('Please confirm your email address first.');
      else setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6 shadow-sm">
      {error && <Alert tone="error">{error}</Alert>}
      {info && <Alert tone="success">{info}</Alert>}
      {isRegister && (
        <div>
          <label htmlFor="full_name" className="label">Full name</label>
          <input id="full_name" name="full_name" className="input" autoComplete="name" required maxLength={120} />
        </div>
      )}
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" className="input" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 8 : undefined} />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isRegister ? 'Create account' : 'Log in'}
      </button>
      <p className="text-center text-sm text-slate-600">
        {isRegister ? (
          <>Already have an account? <Link href="/login" className="font-medium text-teal-700 hover:underline">Log in</Link></>
        ) : (
          <>New here? <Link href="/register" className="font-medium text-teal-700 hover:underline">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
