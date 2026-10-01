'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
BarChart3,
BookOpen,
LayoutDashboard,
LogOut,
Menu,
Settings,
Users,
Video,
X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
{ href: '/admin/dashboard', label: 'Boshqaruv paneli', icon: LayoutDashboard },
{ href: '/admin/courses', label: 'Mavzular', icon: BookOpen },
{ href: '/admin/lessons', label: 'Videolar', icon: Video },
{ href: '/admin/students', label: 'O‘quvchilar', icon: Users },
{ href: '/admin/progress', label: 'O‘qish natijalari', icon: BarChart3 },
{ href: '/admin/settings', label: 'Sozlamalar', icon: Settings },
];

export function AdminSidebar({ name }: { name: string }) {
const pathname = usePathname();
const [open, setOpen] = useState(false);

return (
<> <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden"> <span className="font-bold text-teal-800">Admin paneli</span>


    <button
      onClick={() => setOpen(!open)}
      aria-label="Menyuni ochish yoki yopish"
      className="rounded-lg p-1.5 hover:bg-slate-100"
    >
      {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </button>
  </div>

  <aside
    className={cn(
      'fixed inset-x-0 bottom-0 top-[53px] z-20 flex-col bg-white p-4 lg:sticky lg:top-0 lg:z-auto lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:border-r lg:border-slate-200',
      open ? 'flex' : 'hidden'
    )}
  >
    <Link
      href="/admin/dashboard"
      className="mb-6 hidden px-2 text-xl font-bold text-teal-800 lg:block"
    >
      Jaloliddin
    </Link>

    <nav className="flex-1 space-y-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href || pathname.startsWith(href + '/');

        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
              active
                ? 'bg-teal-50 text-teal-800'
                : 'text-slate-700 hover:bg-slate-100'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>

    <div className="border-t border-slate-200 pt-3">
      <p className="mb-2 truncate px-3 text-xs text-slate-500">{name}</p>

      <Link
        href="/dashboard"
        className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
      >
        O‘quvchi sahifasiga o‘tish
      </Link>

      <form action="/api/auth/logout" method="post">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          <LogOut className="h-5 w-5" />
          Tizimdan chiqish
        </button>
      </form>
    </div>
  </aside>
</>


);
}
