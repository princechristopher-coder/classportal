'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Spinner } from '@/components/ui/index';
import CourseForm, { CourseFormValues } from '@/components/courses/CourseForm';
import LessonManager, { AdminLesson } from '@/components/courses/LessonManager';

interface CourseDetail extends CourseFormValues {
  id: string;
  lessons: AdminLesson[];
}

export default function AdminCourseEditPage() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${slug}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load course.');
        return res.json();
      })
      .then((data) =>
        setCourse({
          id: data.course.id,
          title: data.course.title,
          slug: data.course.slug,
          description: data.course.description,
          thumbnail: data.course.thumbnail || '',
          price: data.course.price,
          level: data.course.level,
          published: data.course.published,
          lessons: data.course.lessons
        })
      )
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <p className="text-cf-red">{error}</p>;
  if (!course) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">{course.title}</h1>
        <p className="text-sm text-white/50">Edit course details and manage its lessons.</p>
      </div>

      <Card>
        <CourseForm mode="edit" initial={course} />
      </Card>

      <Card>
        <LessonManager courseId={course.id} initialLessons={course.lessons} />
      </Card>
    </div>
  );
}
