import type { SupabaseClient } from '@supabase/supabase-js';
import { IMAGE_EXT, MAX_THUMB_BYTES, MAX_VIDEO_BYTES, VIDEO_BUCKET, VIDEO_EXT, formatBytes } from '@/lib/utils';

export function validateVideo(file: File): string | null {
  if (!VIDEO_EXT[file.type]) return 'Invalid video format. Use MP4, WebM or MOV.';
  if (file.size > MAX_VIDEO_BYTES) {
    return `File too large (${formatBytes(file.size)}). The limit is ${formatBytes(MAX_VIDEO_BYTES)}.`;
  }
  if (file.size === 0) return 'The selected file is empty.';
  return null;
}

export function validateImage(file: File): string | null {
  if (!IMAGE_EXT[file.type]) return 'Invalid image format. Use JPG, PNG or WebP.';
  if (file.size > MAX_THUMB_BYTES) return `Image too large. The limit is ${formatBytes(MAX_THUMB_BYTES)}.`;
  return null;
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      isFinite(video.duration) && video.duration > 0 ? resolve(video.duration) : reject(new Error('bad duration'));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unreadable'));
    };
    video.src = url;
  });
}

/**
 * Uploads directly from the browser to Supabase Storage (the file never touches the Next.js server).
 * Uses a signed upload URL so we can report real upload progress. Requires an admin session (storage RLS).
 */
export async function uploadVideo(
  supabase: SupabaseClient,
  path: string,
  file: File,
  upsert: boolean,
  onProgress: (percent: number) => void
): Promise<void> {
  const { data, error } = await supabase.storage.from(VIDEO_BUCKET).createSignedUploadUrl(path, { upsert });
  if (error || !data) throw new Error('Could not start the upload. Please check that you are logged in as an admin.');

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', data.signedUrl);
    xhr.setRequestHeader('x-upsert', String(upsert));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      if (xhr.status === 413) return reject(new Error('File too large for this storage bucket.'));
      if (xhr.status === 415 || xhr.status === 400) return reject(new Error('The server rejected this file type or size.'));
      reject(new Error('Video upload failed. Please try again.'));
    };
    xhr.onerror = () => reject(new Error('Network error during upload. Please check your connection and try again.'));
    xhr.onabort = () => reject(new Error('Upload cancelled.'));
    const body = new FormData();
    body.append('cacheControl', '3600');
    body.append('', file);
    xhr.send(body);
  });
}
