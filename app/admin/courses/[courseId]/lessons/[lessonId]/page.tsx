import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LessonForm } from '@/components/admin/lesson-form';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function EditLesson({ params }: { params: { courseId: string; lessonId: string } }) {
  const supabase = createClient();
  const { data: lesson } = await supabase.from('lessons').select('*').eq('id', params.lessonId).eq('course_id', params.courseId).maybeSingle();
  if (!lesson) notFound();
  const { data: course } = await supabase.from('courses').select('id, title').eq('id', params.courseId).maybeSingle();

  return (
    <div className="max-w-2xl">
      <Link href={`/admin/courses/${params.courseId}`} className="text-sm font-medium text-teal-700 hover:underline">{course?.title ?? 'Course'}</Link>
      <PageHeader title="Videoni O'zgartirish" />
      <LessonForm courseId={params.courseId} lesson={lesson} nextOrder={lesson.lesson_order} />
    </div>
  );
}
