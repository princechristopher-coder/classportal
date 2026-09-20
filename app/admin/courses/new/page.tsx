import { Card } from '@/components/ui/index';
import CourseForm from '@/components/courses/CourseForm';

export default function NewCoursePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">New Course</h1>
        <p className="text-sm text-white/50">Create a course, then add lessons once it&apos;s saved.</p>
      </div>
      <Card>
        <CourseForm mode="create" />
      </Card>
    </div>
  );
}
