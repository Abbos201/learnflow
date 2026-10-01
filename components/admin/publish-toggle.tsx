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

  if (!res.ok) {
    return toast('error', res.error ?? 'Videoni yangilab bo‘lmadi.');
  }

  toast(
    'success',
    published ? 'Video nashrdan olindi.' : 'Video o‘quvchilarga e’lon qilindi.'
  );

  router.refresh();
} catch {
  toast('error', 'Tarmoq xatoligi. Qayta urinib ko‘ring.');
} finally {
  setBusy(false);
}


}

return (
<button
onClick={toggle}
disabled={busy}
className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${
        published
          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
      }`}
title="Holatni o‘zgartirish uchun bosing"
>
{published ? 'Nashr qilingan' : 'Qoralama'} </button>
);
}
