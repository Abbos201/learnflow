'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createLesson, updateLesson } from '@/app/admin/actions';
import { useToast } from '@/components/ui/toast';
import { Alert, ProgressBar } from '@/components/ui';
import { MAX_VIDEO_BYTES, VIDEO_BUCKET, VIDEO_EXT, formatBytes } from '@/lib/utils';
import { getVideoDuration, uploadVideo, validateVideo } from '@/lib/utils/upload';

type LessonData = { id: string; title: string; description: string | null; lesson_order: number; published: boolean };

export function LessonForm({ courseId, lesson, nextOrder }: { courseId: string; lesson?: LessonData; nextOrder: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const isEdit = !!lesson;

  const [title, setTitle] = useState(lesson?.title ?? '');
  const [description, setDescription] = useState(lesson?.description ?? '');
  const [order, setOrder] = useState(lesson?.lesson_order ?? nextOrder);
  const [published, setPublished] = useState(lesson?.published ?? false);
  const [file, setFile] = useState<File | null>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFile(f: File | null) {
    setError(null);
    if (f) {
      const msg = validateVideo(f);
      if (msg) {
        setFile(null);
        return setError(msg);
      }
    }
    setFile(f);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError('Lesson title is required.');
    if (!isEdit && !file) return setError('Please select a video file.');

    setBusy(true);
    const id = lesson?.id ?? crypto.randomUUID();
    let videoPath: string | undefined;
    let uploadedNew = false;
    try {
      let duration: number | undefined;
      if (file) {
        try {
          duration = await getVideoDuration(file);
        } catch {
          throw new Error('This video could not be read by the browser. Please export it as MP4 (H.264/AAC) and try again.');
        }
        videoPath = `${courseId}/${id}/video.${VIDEO_EXT[file.type]}`;
        setPercent(0);
        await uploadVideo(supabase, videoPath, file, isEdit, setPercent);
        uploadedNew = !isEdit;
      }

      const payload = { id, course_id: courseId, title, description, lesson_order: Number(order), published, video_path: videoPath, duration };
      const res = isEdit ? await updateLesson(payload) : await createLesson(payload);
      if (!res.ok) {
        if (uploadedNew && videoPath) await supabase.storage.from(VIDEO_BUCKET).remove([videoPath]); // no orphaned files
        throw new Error(res.error ?? 'Could not save the lesson.');
      }
      toast('success', isEdit ? 'Lesson updated successfully.' : 'Lesson uploaded successfully.');
      router.push(`/admin/courses/${courseId}`);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(msg);
      toast('error', msg);
      setBusy(false);
      setPercent(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      {error && <Alert tone="error">{error}</Alert>}
      <div>
        <label htmlFor="l-title" className="label">Lesson title</label>
        <input id="l-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required disabled={busy} />
      </div>
      <div>
        <label htmlFor="l-desc" className="label">Description</label>
        <textarea id="l-desc" className="input min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} disabled={busy} />
      </div>
      <div>
        <label htmlFor="l-file" className="label">{isEdit ? 'Replace video (optional)' : 'Video file'}</label>
        <input id="l-file" type="file" accept="video/mp4,video/webm,video/quicktime" className="input" onChange={(e) => onFile(e.target.files?.[0] ?? null)} disabled={busy} />
        <p className="mt-1 text-xs text-slate-500">MP4, WebM or MOV, up to {formatBytes(MAX_VIDEO_BYTES)}. {file && `Selected: ${file.name} (${formatBytes(file.size)})`}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="l-order" className="label">Lesson order</label>
          <input id="l-order" type="number" min={0} step={1} className="input" value={order} onChange={(e) => setOrder(Number(e.target.value))} required disabled={busy} />
          <p className="mt-1 text-xs text-slate-500">Lessons are shown by ascending order. Use a number between two lessons to insert one.</p>
        </div>
        <div>
          <label htmlFor="l-status" className="label">Status</label>
          <select id="l-status" className="input" value={published ? 'published' : 'draft'} onChange={(e) => setPublished(e.target.value === 'published')} disabled={busy}>
            <option value="draft">Draft (hidden from students)</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {percent !== null && (
        <div>
          <div className="mb-1 flex justify-between text-sm text-slate-700">
            <span>{percent < 100 ? 'Uploading video…' : 'Finalizing…'}</span>
            <span className="tabular-nums">{percent}%</span>
          </div>
          <ProgressBar value={percent} />
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
        {isEdit ? 'Save changes' : 'Upload lesson'}
      </button>
    </form>
  );
}
