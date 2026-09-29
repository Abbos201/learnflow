import { CourseForm } from '@/components/admin/course-form';
import { PageHeader } from '@/components/ui';

export default function NewCourse() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add Course" />
      <CourseForm />
    </div>
  );
}
