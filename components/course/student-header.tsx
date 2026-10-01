
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import type { Profile } from '@/types';

export function StudentHeader({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link
          href="/dashboard"
          className="text-lg font-bold text-teal-800"
        >
          Jaloliddin
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
          <Link href="/dashboard" className="hover:text-teal-700">
            Bosh sahifa
          </Link>

          <Link href="/courses" className="hover:text-teal-700">
            Mavzular
          </Link>

          {profile.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="hover:text-teal-700"
            >
              Admin paneli
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">
            {profile.full_name || profile.email}
          </span>

          <form action="/api/auth/logout" method="post">
            <button className="btn btn-secondary px-3 py-1.5">
              <LogOut className="h-4 w-4" />
              Tizimdan chiqish
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

