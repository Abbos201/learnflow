'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import {
  createLesson,
  updateLesson,
} from '@/app/admin/actions';

import { useToast } from '@/components/ui/toast';
import {
  Alert,
  ProgressBar,
} from '@/components/ui';

import {
  MAX_VIDEO_BYTES,
  VIDEO_BUCKET,
  VIDEO_EXT,
  formatBytes,
} from '@/lib/utils';

import {
  getVideoDuration,
  uploadVideo,
  validateVideo,
} from '@/lib/utils/upload';

type LessonData = {
  id: string;
  title: string;
  description: string | null;
  lesson_order: number;
  published: boolean;
};

export function LessonForm({
  courseId,
  lesson,
  nextOrder,
}: {
  courseId: string;
  lesson?: LessonData;
  nextOrder: number;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const isEdit = !!lesson;

  const [title, setTitle] = useState(
    lesson?.title ?? ''
  );

  const [description, setDescription] =
    useState(
      lesson?.description ?? ''
    );

  const [order, setOrder] = useState(
    lesson?.lesson_order ?? nextOrder
  );

  const [file, setFile] =
    useState<File | null>(null);

  const [percent, setPercent] =
    useState<number | null>(null);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  function onFile(f: File | null) {
    setError(null);

    if (f) {
      const msg = validateVideo(f);

      if (msg) {
        setFile(null);
        setError(msg);
        return;
      }
    }

    setFile(f);
  }

  async function onSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    setError(null);

    if (!title.trim()) {
      setError('Video nomini kiriting.');
      return;
    }

    if (!isEdit && !file) {
      setError(
        'Video faylini tanlang.'
      );
      return;
    }

    setBusy(true);

    const id =
      lesson?.id ??
      crypto.randomUUID();

    let videoPath:
      | string
      | undefined;

    let uploadedNew = false;

    try {
      let duration:
        | number
        | undefined;

      /*
       * Yangi video fayli yuklansa,
       * uning davomiyligini olamiz.
       */
      if (file) {
        try {
          duration =
            await getVideoDuration(
              file
            );
        } catch {
          throw new Error(
            'Videoni o‘qib bo‘lmadi. Uni MP4 (H.264/AAC) formatida saqlab, qayta urinib ko‘ring.'
          );
        }

        videoPath =
          `${courseId}/${id}/video.${VIDEO_EXT[file.type]}`;

        setPercent(0);

        await uploadVideo(
          supabase,
          videoPath,
          file,
          isEdit,
          setPercent
        );

        uploadedNew = !isEdit;
      }

      /*
       * MUHIM:
       *
       * published DOIM true.
       *
       * Shuning uchun yangi video
       * avtomatik o'quvchilarga ko'rinadi.
       */
      const payload = {
        id,
        course_id: courseId,
        title: title.trim(),
        description,
        lesson_order: Number(order),

        published: true,

        video_path: videoPath,
        duration,
      };

      const res = isEdit
        ? await updateLesson(
            payload
          )
        : await createLesson(
            payload
          );

      if (!res.ok) {
        if (
          uploadedNew &&
          videoPath
        ) {
          await supabase.storage
            .from(VIDEO_BUCKET)
            .remove([
              videoPath,
            ]);
        }

        throw new Error(
          res.error ??
            'Videoni saqlab bo‘lmadi.'
        );
      }

      toast(
        'success',
        isEdit
          ? 'Video muvaffaqiyatli yangilandi.'
          : 'Video muvaffaqiyatli yuklandi.'
      );

      router.push(
        `/admin/courses/${courseId}`
      );

      router.refresh();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Yuklashda xatolik. Qayta urinib ko‘ring.';

      setError(msg);

      toast(
        'error',
        msg
      );

      setBusy(false);
      setPercent(null);
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

      {/* Video nomi */}
      <div>
        <label
          htmlFor="l-title"
          className="label"
        >
          Video nomi
        </label>

        <input
          id="l-title"
          className="input"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          maxLength={200}
          required
          disabled={busy}
        />
      </div>

      {/* Video haqida */}
      <div>
        <label
          htmlFor="l-desc"
          className="label"
        >
          Video haqida
        </label>

        <textarea
          id="l-desc"
          className="input min-h-[100px]"
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
          maxLength={5000}
          disabled={busy}
          placeholder="Video haqida qisqacha ma’lumot..."
        />
      </div>

      {/* Video fayli */}
      <div>
        <label
          htmlFor="l-file"
          className="label"
        >
          {isEdit
            ? 'Videoni almashtirish (ixtiyoriy)'
            : 'Video fayli'}
        </label>

        <input
          id="l-file"
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="input"
          onChange={(e) =>
            onFile(
              e.target.files?.[0] ??
                null
            )
          }
          disabled={busy}
        />

        <p className="mt-1 text-xs text-slate-500">
          MP4, WebM yoki MOV,
          maksimal hajmi:{' '}
          {formatBytes(
            MAX_VIDEO_BYTES
          )}
          .

          {file &&
            ` Tanlangan fayl: ${file.name} (${formatBytes(file.size)})`}
        </p>
      </div>

      {/* Tartib */}
      <div>
        <label
          htmlFor="l-order"
          className="label"
        >
          Video tartibi
        </label>

        <input
          id="l-order"
          type="number"
          min={1}
          className="input"
          value={order}
          onChange={(e) =>
            setOrder(
              Number(e.target.value)
            )
          }
          disabled={busy}
        />
      </div>

      {/*
       * STATUS SELECT OLIB TASHLANDI.
       *
       * Video avtomatik published=true.
       */}

      {/* Yuklash progressi */}
      {percent !== null && (
        <div>
          <div className="mb-1 flex justify-between text-sm text-slate-700">
            <span>
              {percent < 100
                ? 'Video yuklanmoqda…'
                : 'Yakunlanmoqda…'}
            </span>

            <span className="tabular-nums">
              {percent}%
            </span>
          </div>

          <ProgressBar
            value={percent}
          />
        </div>
      )}

      {/* Saqlash */}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UploadCloud className="h-4 w-4" />
        )}

        {isEdit
          ? 'O‘zgarishlarni saqlash'
          : 'Videoni yuklash'}
      </button>
    </form>
  );
}