export type Role = 'admin' | 'student';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_path: string;
  duration: number | null;
  lesson_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  watched_seconds: number;
  video_duration: number | null;
  progress_percentage: number;
  completed: boolean;
  completed_at: string | null;
  last_watched_at: string;
  created_at: string;
  updated_at: string;
}

export type ActionResult = { ok: boolean; error?: string; id?: string };
