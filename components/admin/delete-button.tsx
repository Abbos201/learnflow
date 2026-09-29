'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { deleteCourse, deleteLesson, deleteStudent } from '@/app/admin/actions';

const CONFIG = {
  course: { fn: deleteCourse, title: 'Delete course?', text: (n: string) => `"${n}", all of its lessons, videos and student progress will be permanently deleted.`, done: 'Course deleted.' },
  lesson: { fn: deleteLesson, title: 'Delete lesson?', text: (n: string) => `"${n}", its video and all student progress for it will be permanently deleted.`, done: 'Lesson deleted.' },
  student: { fn: deleteStudent, title: 'Delete student?', text: (n: string) => `The account of ${n} and all of their progress will be permanently deleted.`, done: 'Student deleted.' },
} as const;

export function DeleteButton({ kind, id, name, redirectTo, iconOnly = false }: { kind: keyof typeof CONFIG; id: string; name: string; redirectTo?: string; iconOnly?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const cfg = CONFIG[kind];

  async function confirm() {
    setLoading(true);
    try {
      const res = await cfg.fn(id);
      if (!res.ok) return toast('error', res.error ?? 'Could not delete.');
      toast('success', cfg.done);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch {
      toast('error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={iconOnly ? 'rounded-lg p-2 text-red-600 hover:bg-red-50' : 'btn btn-secondary text-red-700'} aria-label={`Delete ${name}`}>
        <Trash2 className="h-4 w-4" /> {!iconOnly && 'Delete'}
      </button>
      <ConfirmDialog open={open} title={cfg.title} message={cfg.text(name)} loading={loading} onConfirm={confirm} onCancel={() => setOpen(false)} />
    </>
  );
}
