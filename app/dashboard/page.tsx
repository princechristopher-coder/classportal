'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Card, ProgressBar, Spinner, Button } from '@/components/ui/index';

interface Enrollment {
  id: string;
  progress: number;
  completed: boolean;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    _count: { lessons: number };
  };
}

const levelTone: Record<string, 'gold' | 'red' | 'green'> = {
  BEGINNER: 'green',
  INTERMEDIATE: 'gold',
  ADVANCED: 'red'
};

export default function DashboardOverviewPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/enrollment', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load your courses.');
        return res.json();
      })
      .then((data) => setEnrollments(data.enrollments))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-cf-red">{error}</p>;
  if (!enrollments) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const completedCount = enrollments.filter((e) => e.completed).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wider text-white/40">Enrolled Courses</p>
          <p className="mt-2 font-display text-3xl font-bold text-cf-gold">{enrollments.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-white/40">Completed Courses</p>
          <p className="mt-2 font-display text-3xl font-bold text-cf-gold">{completedCount}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-white/40">In Progress</p>
          <p className="mt-2 font-display text-3xl font-bold text-cf-gold">{enrollments.length - completedCount}</p>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 font-display text-xl font-semibold">Your Courses</h2>
        {enrollments.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-cf-charcoal2 p-12 text-center">
            <p className="text-white/50">No courses enrolled yet.</p>
            <Link href="/courses">
              <Button variant="gold" className="mt-4 !px-6 !py-2.5">
                Browse Courses
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {enrollments.map((e) => (
              <Link
                key={e.id}
                href={`/courses/${e.course.slug}`}
                className="block rounded-xl border border-white/10 bg-cf-charcoal2 p-5 transition hover:border-cf-gold/40"
              >
                <div className="mb-3 flex items-center justify-between">
                  <Badge tone={levelTone[e.course.level]}>{e.course.level}</Badge>
                  {e.completed && <Badge tone="green">Completed</Badge>}
                </div>
                <h3 className="font-display text-lg font-semibold">{e.course.title}</h3>
                <p className="mt-1 text-xs text-white/40">{e.course._count.lessons} lessons</p>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs text-white/50">
                    <span>Progress</span>
                    <span>{Math.round(e.progress)}%</span>
                  </div>
                  <ProgressBar value={e.progress} />
                </div>
                <div className="mt-4 text-xs font-medium text-cf-gold">
                  {e.completed ? 'Review Course →' : 'Continue Learning →'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
