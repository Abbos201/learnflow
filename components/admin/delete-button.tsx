'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { deleteCourse, deleteLesson, deleteStudent } from '@/app/admin/actions';

const CONFIG = {
course: {
fn: deleteCourse,
title: 'Mavzuni o‘chirasizmi?',
text: (n: string) => `"${n}" mavzusi, uning barcha darslari, videolari va o‘quvchilar natijalari butunlay o‘chiriladi.`,
done: 'Mavzu o‘chirildi.',
},
lesson: {
fn: deleteLesson,
title: 'Videoni o‘chirasizmi?',
text: (n: string) => `"${n}" videosi va unga tegishli barcha o‘quvchilar natijalari butunlay o‘chiriladi.`,
done: 'Video o‘chirildi.',
},
student: {
fn: deleteStudent,
title: 'O‘quvchini o‘chirasizmi?',
text: (n: string) => `${n} akkaunti va uning barcha o‘qish natijalari butunlay o‘chiriladi.`,
done: 'O‘quvchi o‘chirildi.',
},
} as const;

export function DeleteButton({
kind,
id,
name,
redirectTo,
iconOnly = false,
}: {
kind: keyof typeof CONFIG;
id: string;
name: string;
redirectTo?: string;
iconOnly?: boolean;
}) {
const router = useRouter();
const { toast } = useToast();
const [open, setOpen] = useState(false);
const [loading, setLoading] = useState(false);
const cfg = CONFIG[kind];

async function confirm() {
setLoading(true);


try {
  const res = await cfg.fn(id);

  if (!res.ok) {
    return toast('error', res.error ?? 'O‘chirib bo‘lmadi.');
  }

  toast('success', cfg.done);
  setOpen(false);

  if (redirectTo) router.push(redirectTo);

  router.refresh();
} catch {
  toast('error', 'Tarmoq xatoligi. Qayta urinib ko‘ring.');
} finally {
  setLoading(false);
}


}

return (
<>
<button
onClick={() => setOpen(true)}
className={
iconOnly
? 'rounded-lg p-2 text-red-600 hover:bg-red-50'
: 'btn btn-secondary text-red-700'
}
aria-label={`${name}ni o‘chirish`}
> <Trash2 className="h-4 w-4" />
{!iconOnly && 'O‘chirish'} </button>


  <ConfirmDialog
    open={open}
    title={cfg.title}
    message={cfg.text(name)}
    loading={loading}
    onConfirm={confirm}
    onCancel={() => setOpen(false)}
  />
</>

);
}
