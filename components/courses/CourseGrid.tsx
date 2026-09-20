'use client';

import { useEffect, useState } from 'react';
import CourseCard from '@/components/courses/CourseCard';
import { Spinner } from '@/components/ui/index';

export interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  price: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  published: boolean;
  _count: { lessons: number; enrollments: number };
}

export default function CourseGrid({ limit, search }: { limit?: number; search?: string }) {
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCourses(null);
    setError(null);

    fetch('/api/courses', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load courses.');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setCourses(data.courses);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="text-sm text-cf-red">{error}</p>;
  }

  if (!courses) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  let filtered = courses;
  if (search) {
    const q = search.toLowerCase();
    filtered = courses.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }
  if (limit) filtered = filtered.slice(0, limit);

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-cf-charcoal2 p-12 text-center text-white/50">
        No courses found.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
    </div>
  );
}
