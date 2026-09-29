import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-600">The course, lesson or page you are looking for does not exist or is not available to you.</p>
      <Link href="/dashboard" className="btn btn-primary mt-6">Go to dashboard</Link>
    </div>
  );
}
