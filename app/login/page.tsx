import Link from 'next/link';
import { AuthForm } from '@/components/auth/auth-form';
import { safeNext } from '@/lib/utils';

export default function Page({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-6 text-xl font-bold text-teal-800">LearnFlow</Link>
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mb-5 mt-1 text-sm text-slate-600">Log in to continue your lessons.</p>
        <AuthForm mode="login" next={safeNext(searchParams.next)} />
      </div>
    </div>
  );
}
