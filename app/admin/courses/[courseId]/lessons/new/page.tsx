import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LessonForm } from '@/components/admin/lesson-form';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function NewLesson({ params }: { params: { courseId: string } }) {
  const supabase = createClient();
  const { data: course } = await supabase.from('courses').select('id, title').eq('id', params.courseId).maybeSingle();
  if (!course) notFound();
  const { data: last } = await supabase.from('lessons').select('lesson_order').eq('course_id', course.id).order('lesson_order', { ascending: false }).limit(1);
  const nextOrder = ((last?.[0]?.lesson_order as number | undefined) ?? 0) + 1;

  return (
    <div className="max-w-2xl">
      <Link href={`/admin/courses/${course.id}`} className="text-sm font-medium text-teal-700 hover:underline">{course.title}</Link>
      <PageHeader title="Video qo'shish" />
      <LessonForm courseId={course.id} nextOrder={nextOrder} />
    </div>
  );
}
