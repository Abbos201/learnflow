'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { setLessonPublished } from '@/app/admin/actions';

export function PublishToggle({ lessonId, published }: { lessonId: string; published: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await setLessonPublished(lessonId, !published);
      if (!res.ok) return toast('error', res.error ?? 'Could not update the lesson.');
      toast('success', published ? 'Lesson unpublished.' : 'Lesson published.');
      router.refresh();
    } catch {
      toast('error', 'Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={toggle} disabled={busy} className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${published ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`} title="Click to change">
      {published ? 'Published' : 'Draft'}
    </button>
  );
}
