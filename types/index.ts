export type Role = 'admin' | 'student';

export interface Profile {
  id: string;
  email: string;
  username: string | null;
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
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  lesson_order: number;
  video_path: string;
  duration: number | null;
  published: boolean;
  created_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  lesson_id: string;
  watched_seconds: number;
  progress_percentage: number;
  completed: boolean;
  updated_at: string;
}

export interface CourseProgress {
  course_id: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  last_activity: string | null;
}

export type ActionResult =
  | {
      ok: true;
      id?: string;
      count?: number;
    }
  | {
      ok: false;
      error: string;
    };