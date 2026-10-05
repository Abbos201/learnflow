import Link from 'next/link';
import {
  BookOpen,
  LogOut,
  Settings,
} from 'lucide-react';

import type { Profile } from '@/types';

export function StudentHeader({
  profile,
}: {
  profile: Profile;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm transition group-hover:scale-105">
            <BookOpen className="h-5 w-5" />
          </div>

          <div className="hidden sm:block">
            <div className="text-sm font-bold leading-none text-slate-950">
              Jaloliddin
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="ml-2 flex items-center gap-1">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-teal-50 hover:text-teal-700"
          >
            Bosh sahifa
          </Link>

          <Link
            href="/courses"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-teal-50 hover:text-teal-700"
          >
            Kurslar
          </Link>

          {profile.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-teal-50 hover:text-teal-700"
            >
              Admin paneli
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/admin/settings"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            title="Sozlamalar"
          >
            <Settings className="h-5 w-5" />
          </Link>

          <div className="hidden h-8 w-px bg-slate-200 sm:block" />

          <div className="hidden max-w-40 truncate text-right sm:block">
            <div className="truncate text-sm font-semibold text-slate-800">
              {profile.full_name || 'O‘quvchi'}
            </div>
{/* 
            <div className="truncate text-xs text-slate-400">
              {profile.username || ''}
            </div> */}
          </div>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />

              <span className="hidden sm:inline">
                Chiqish
              </span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}