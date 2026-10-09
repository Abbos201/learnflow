
'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  getCourseTests,
  uploadCourseTest,
  deleteCourseTest,
} from '@/app/admin/actions';

type Test = {
  id: string;
  title: string;
  url: string;
};

export default function CourseTestsManager({
  courseId,
}: {
  courseId: string;
}) {
  const [tests, setTests] = useState<Test[]>([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  async function refreshTests() {
    const result = await getCourseTests(courseId);
    if (result.ok) setTests(result.tests);
  }

  useEffect(() => {
    void refreshTests();
  }, [courseId]);

  function addPdf(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!title.trim() || !file) {
      setError('PDF nomini va faylini kiriting.');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Faqat PDF fayl tanlang.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Fayl hajmi 20 MB dan oshmasin.');
      return;
    }

    const data = new FormData();
    data.set('title', title.trim());
    data.set('file', file);

    startTransition(async () => {
      const result = await uploadCourseTest(courseId, data);

      if (!result.ok) {
        setError(result.error || 'PDF qo‘shilmadi.');
        return;
      }

      setTitle('');
      setFile(null);
      event.currentTarget?.reset?.();
      await refreshTests();
    });
  }

  function removePdf(id: string, name: string) {
    if (!window.confirm(`"${name}" PDF fayli o‘chirilsinmi?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCourseTest(id);

      if (!result.ok) {
        setError(result.error || 'PDF o‘chirilmadi.');
        return;
      }

      await refreshTests();
    });
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">PDF fayllar</h2>
        <p className="text-sm text-gray-500">
          Mavzuga tegishli PDF testlarni qo‘shing.
        </p>
      </div>

      <form
        onSubmit={addPdf}
        className="space-y-3 rounded-lg border p-4"
      >
        <div>
          <label className="mb-1 block text-sm">PDF nomi</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masalan: 1-mavzu testi"
            maxLength={200}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">PDF fayl</label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-md border p-2"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-teal-700 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? 'Yuklanmoqda...' : 'PDF qo‘shish'}
        </button>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </form>

      <div className="divide-y rounded-lg border">
        {tests.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">
            Hozircha PDF fayl yo‘q.
          </p>
        ) : (
          tests.map((test) => (
            <div
              key={test.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <span className="min-w-0 break-words text-sm">
                {test.title}
              </span>

              <div className="flex shrink-0 items-center gap-3">
                <a
                  href={test.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-teal-700 underline"
                >
                  Ochish
                </a>

                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removePdf(test.id, test.title)}
                  className="text-sm text-red-600"
                >
                  O‘chirish
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
