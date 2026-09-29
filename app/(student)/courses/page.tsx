import { BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { CourseCard } from '@/components/course/course-card';
import { EmptyState, PageHeader } from '@/components/ui';
import type { Course } from '@/types';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const supabase = createClient();
  const { data } = await supabase.from('courses').select('*').eq('published', true).order('created_at', { ascending: true });
  const courses = (data ?? []) as Course[];
  return (
    <div>
      <PageHeader title="Courses" subtitle="All courses available to you." />
      {courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses yet" text="New courses will appear here as soon as they are published." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => <CourseCard key={c.id} course={c} href={`/courses/${c.id}`} />)}
        </div>
      )}
    </div>
  );
}
