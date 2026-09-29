'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-slate-600">We could not load this page. Please try again.</p>
      <button onClick={reset} className="btn btn-primary mt-6">Try again</button>
    </div>
  );
}
