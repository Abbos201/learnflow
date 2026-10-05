'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { saveCourse } from '@/app/admin/actions';

import { useToast } from '@/components/ui/toast';
import { Alert } from '@/components/ui';

import {
  IMAGE_EXT,
  THUMB_BUCKET,
} from '@/lib/utils';

import {
  validateImage,
} from '@/lib/utils/upload';

import type { Course } from '@/types';

export function CourseForm({
  course,
}: {
  course?: Course;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [title, setTitle] =
    useState(
      course?.title ?? ''
    );

  const [description, setDescription] =
    useState(
      course?.description ?? ''
    );

  const [thumb, setThumb] =
    useState<File | null>(null);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function onSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    setError(null);

    if (!title.trim()) {
      setError(
        'Mavzu nomini kiriting.'
      );
      return;
    }

    if (thumb) {
      const msg =
        validateImage(thumb);

      if (msg) {
        setError(msg);
        return;
      }
    }

    setBusy(true);

    try {
      let thumbnailUrl =
        course?.thumbnail_url ??
        null;

      /*
       * Yangi rasm yuklash
       */
      if (thumb) {
        const path =
          `${crypto.randomUUID()}.${IMAGE_EXT[thumb.type]}`;

        const {
          error: upErr,
        } = await supabase.storage
          .from(THUMB_BUCKET)
          .upload(
            path,
            thumb,
            {
              contentType:
                thumb.type,
            }
          );

        if (upErr) {
          throw new Error(
            'Rasmni yuklashda xatolik. Qayta urinib ko‘ring.'
          );
        }

        thumbnailUrl =
          supabase.storage
            .from(THUMB_BUCKET)
            .getPublicUrl(
              path
            )
            .data.publicUrl;
      }

      /*
       * MUHIM:
       *
       * published DOIM true.
       *
       * Mavzu yaratilganda
       * avtomatik o'quvchilarga
       * ko'rinadi.
       */
      const res =
        await saveCourse({
          id: course?.id,

          title: title.trim(),

          description,

          thumbnail_url:
            thumbnailUrl,

          published: true,
        });

      if (!res.ok) {
        throw new Error(
          res.error ??
            'Mavzuni saqlab bo‘lmadi.'
        );
      }

      toast(
        'success',
        course
          ? 'Mavzu yangilandi.'
          : 'Mavzu yaratildi.'
      );

      /*
       * Yangi mavzu yaratilganda
       * uning ichiga o'tamiz.
       */
      if (!course) {
        router.push(
          `/admin/courses/${res.id}`
        );
      }

      router.refresh();

      setThumb(null);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Tarmoq xatoligi. Qayta urinib ko‘ring.';

      setError(msg);

      toast(
        'error',
        msg
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="card space-y-4 p-5"
    >
      {error && (
        <Alert tone="error">
          {error}
        </Alert>
      )}

      {/* Mavzu nomi */}
      <div>
        <label
          htmlFor="c-title"
          className="label"
        >
          Mavzu nomi
        </label>

        <input
          id="c-title"
          className="input"
          value={title}
          onChange={(e) =>
            setTitle(
              e.target.value
            )
          }
          maxLength={200}
          required
          disabled={busy}
        />
      </div>

      {/* Mavzu haqida */}
      <div>
        <label
          htmlFor="c-desc"
          className="label"
        >
          Mavzu haqida
        </label>

        <textarea
          id="c-desc"
          className="input min-h-[100px]"
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
          maxLength={5000}
          disabled={busy}
          placeholder="Mavzu haqida qisqacha ma’lumot..."
        />
      </div>

      {/* Muqova rasmi */}
      <div>
        <label
          htmlFor="c-thumb"
          className="label"
        >
          Muqova rasmi (JPG,
          PNG yoki WebP,
          maksimum 5 MB)
        </label>

        <input
          id="c-thumb"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="input"
          onChange={(e) =>
            setThumb(
              e.target.files?.[0] ??
                null
            )
          }
          disabled={busy}
        />

        {course?.thumbnail_url &&
          !thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                course.thumbnail_url
              }
              alt="Joriy muqova rasmi"
              className="mt-2 h-20 rounded-lg object-cover"
            />
          )}
      </div>

      {/*
       * STATUS SELECT BU YERDA HAM OLIB TASHLANDI.
       *
       * Mavzu avtomatik:
       *
       * published = true
       *
       * bo'ladi.
       */}

      {/* Saqlash */}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={busy}
      >
        {busy && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {course
          ? 'O‘zgarishlarni saqlash'
          : 'Mavzu yaratish'}
      </button>
    </form>
  );
}