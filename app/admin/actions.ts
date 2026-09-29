'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile } from '@/lib/auth';
import { VIDEO_BUCKET } from '@/lib/utils';
import type { ActionResult } from '@/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VIDEO_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/video\.(mp4|webm|mov)$/i;
const DENIED: ActionResult = { ok: false, error: 'You are not authorized to do this.' };
const GENERIC: ActionResult = { ok: false, error: 'Something went wrong. Please try again.' };

/** Trim, strip control characters (keeps newlines/tabs) and cap the length. React escapes output on render. */
function text(value: unknown, max: number) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max);
}
async function adminOrNull() {
  const p = await getCurrentProfile();
  return p?.role === 'admin' ? p : null;
}
function refresh() {
  revalidatePath('/', 'layout');
}

export async function saveCourse(input: { id?: string; title: string; description: string; thumbnail_url: string | null; published: boolean }): Promise<ActionResult> {
  if (!(await adminOrNull())) return DENIED;
  const title = text(input.title, 200);
  if (!title) return { ok: false, error: 'Course title is required.' };
  const thumb = input.thumbnail_url ? text(input.thumbnail_url, 1000) : null;
  if (thumb && !thumb.startsWith('https://')) return { ok: false, error: 'Invalid thumbnail URL.' };
  const row = { title, description: text(input.description, 5000), thumbnail_url: thumb, published: !!input.published };
  const supabase = createClient();

  if (input.id) {
    if (!UUID.test(input.id)) return { ok: false, error: 'Course not found.' };
    const { error } = await supabase.from('courses').update(row).eq('id', input.id);
    if (error) return (console.error(error.message), GENERIC);
    refresh();
    return { ok: true, id: input.id };
  }
  const { data, error } = await supabase.from('courses').insert(row).select('id').single();
  if (error || !data) return (console.error(error?.message), GENERIC);
  refresh();
  return { ok: true, id: data.id };
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  if (!(await adminOrNull())) return DENIED;
  if (!UUID.test(id)) return { ok: false, error: 'Course not found.' };
  const supabase = createClient();
  const { data: lessons } = await supabase.from('lessons').select('video_path').eq('course_id', id);
  const paths = (lessons ?? []).map((l: { video_path: string }) => l.video_path).filter(Boolean);
  if (paths.length) await supabase.storage.from(VIDEO_BUCKET).remove(paths);
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) return (console.error(error.message), GENERIC);
  refresh();
  return { ok: true };
}

type LessonInput = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  lesson_order: number;
  published: boolean;
  video_path?: string | null;
  duration?: number | null;
};

function lessonFields(input: LessonInput) {
  const order = Math.max(0, Math.min(100000, Math.floor(Number(input.lesson_order) || 0)));
  return { title: text(input.title, 200), description: text(input.description, 5000), lesson_order: order, published: !!input.published };
}
function cleanDuration(d: unknown) {
  const n = Number(d);
  return n > 0 && isFinite(n) ? Math.round(n * 100) / 100 : null;
}
async function videoExists(supabase: ReturnType<typeof createClient>, courseId: string, lessonId: string, path: string) {
  const { data } = await supabase.storage.from(VIDEO_BUCKET).list(`${courseId}/${lessonId}`);
  return !!data?.some((f) => `${courseId}/${lessonId}/${f.name}` === path);
}

export async function createLesson(input: LessonInput): Promise<ActionResult> {
  if (!(await adminOrNull())) return DENIED;
  if (!UUID.test(input.id) || !UUID.test(input.course_id)) return { ok: false, error: 'Invalid lesson.' };
  const fields = lessonFields(input);
  if (!fields.title) return { ok: false, error: 'Lesson title is required.' };
  const path = String(input.video_path ?? '');
  if (!VIDEO_PATH.test(path) || !path.startsWith(`${input.course_id}/${input.id}/`)) return { ok: false, error: 'Invalid video path.' };

  const supabase = createClient();
  if (!(await videoExists(supabase, input.course_id, input.id, path))) return { ok: false, error: 'The video was not found in storage. Please upload it again.' };

  const { error } = await supabase.from('lessons').insert({ id: input.id, course_id: input.course_id, ...fields, video_path: path, duration: cleanDuration(input.duration) });
  if (error) return (console.error(error.message), GENERIC);
  refresh();
  return { ok: true, id: input.id };
}

export async function updateLesson(input: LessonInput): Promise<ActionResult> {
  if (!(await adminOrNull())) return DENIED;
  if (!UUID.test(input.id)) return { ok: false, error: 'Lesson not found.' };
  const fields = lessonFields(input);
  if (!fields.title) return { ok: false, error: 'Lesson title is required.' };

  const supabase = createClient();
  const { data: existing } = await supabase.from('lessons').select('course_id, video_path').eq('id', input.id).maybeSingle();
  if (!existing) return { ok: false, error: 'Lesson not found.' };

  const update: Record<string, unknown> = { ...fields };
  if (input.video_path) {
    const path = String(input.video_path);
    if (!VIDEO_PATH.test(path) || !path.startsWith(`${existing.course_id}/${input.id}/`)) return { ok: false, error: 'Invalid video path.' };
    if (!(await videoExists(supabase, existing.course_id, input.id, path))) return { ok: false, error: 'The video was not found in storage. Please upload it again.' };
    update.video_path = path;
    update.duration = cleanDuration(input.duration);
    if (existing.video_path !== path) await supabase.storage.from(VIDEO_BUCKET).remove([existing.video_path]);
  }
  const { error } = await supabase.from('lessons').update(update).eq('id', input.id);
  if (error) return (console.error(error.message), GENERIC);
  refresh();
  return { ok: true, id: input.id };
}

export async function setLessonPublished(id: string, published: boolean): Promise<ActionResult> {
  if (!(await adminOrNull())) return DENIED;
  if (!UUID.test(id)) return { ok: false, error: 'Lesson not found.' };
  const { error } = await createClient().from('lessons').update({ published }).eq('id', id);
  if (error) return (console.error(error.message), GENERIC);
  refresh();
  return { ok: true };
}

export async function deleteLesson(id: string): Promise<ActionResult> {
  if (!(await adminOrNull())) return DENIED;
  if (!UUID.test(id)) return { ok: false, error: 'Lesson not found.' };
  const supabase = createClient();
  const { data: lesson } = await supabase.from('lessons').select('video_path').eq('id', id).maybeSingle();
  if (!lesson) return { ok: false, error: 'Lesson not found.' };
  if (lesson.video_path) await supabase.storage.from(VIDEO_BUCKET).remove([lesson.video_path]);
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) return (console.error(error.message), GENERIC);
  refresh();
  return { ok: true };
}

export async function setUserRole(userId: string, role: 'admin' | 'student'): Promise<ActionResult> {
  const me = await adminOrNull();
  if (!me) return DENIED;
  if (!UUID.test(userId) || (role !== 'admin' && role !== 'student')) return { ok: false, error: 'Invalid request.' };
  if (userId === me.id) return { ok: false, error: 'You cannot change your own role.' };
  const { error } = await createClient().from('profiles').update({ role }).eq('id', userId);
  if (error) return (console.error(error.message), GENERIC);
  refresh();
  return { ok: true };
}

/** Deleting an auth user needs the service-role key, so it happens here on the server only. */
export async function deleteStudent(userId: string): Promise<ActionResult> {
  const me = await adminOrNull();
  if (!me) return DENIED;
  if (!UUID.test(userId) || userId === me.id) return { ok: false, error: 'Invalid request.' };
  const { data: target } = await createClient().from('profiles').select('role').eq('id', userId).maybeSingle();
  if (!target) return { ok: false, error: 'Student not found.' };
  if (target.role !== 'student') return { ok: false, error: 'Demote this admin to student before deleting the account.' };
  try {
    const { error } = await createAdminClient().auth.admin.deleteUser(userId);
    if (error) return (console.error(error.message), GENERIC);
  } catch (e) {
    console.error(e);
    return { ok: false, error: 'Deleting students requires SUPABASE_SERVICE_ROLE_KEY to be configured on the server.' };
  }
  refresh();
  return { ok: true };
}
