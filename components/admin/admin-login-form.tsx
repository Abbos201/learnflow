'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, LogIn } from 'lucide-react';

export function AdminLoginForm() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');

    if (!password) {
      setError('Parolni kiriting.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(result.error || 'Parol noto‘g‘ri.');
        setPassword('');
        return;
      }

      window.location.href = '/admin/dashboard';
    } catch {
      setError('Kirishda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <Lock className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Administrator
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Davom etish uchun parolni kiriting.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Parol
            </label>

            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolni kiriting"
                autoComplete="current-password"
                disabled={loading}
                className="h-12 w-full rounded-xl border border-slate-300 px-4 pr-12 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}