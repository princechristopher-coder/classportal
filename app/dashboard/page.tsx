'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Card, ProgressBar, Spinner, Button } from '@/components/ui/index';
import { Ring } from '@/components/ui/Ring';

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
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
    : 0;
  const resume =
    [...enrollments].filter((e) => !e.completed).sort((a, b) => b.progress - a.progress)[0] ?? null;
  const thumbs = [
    'from-[#59e3ea] via-[#3b6fe0] to-[#241a6b]',
    'from-[#c3a8ff] via-[#6a53e8] to-[#1c1763]',
    'from-[#ffc29a] via-[#ff7f8f] to-[#5a1a55]'
  ];

  return (
    <div className="space-y-8">
      {resume && (
        <Link
          href={`/courses/${resume.course.slug}`}
          className="glass group grid items-center gap-6 rounded-[28px] p-5 transition hover:border-cf-gold/40 sm:grid-cols-[240px_1fr] sm:p-6"
        >
          <div
            className={`relative aspect-video overflow-hidden rounded-[20px] border border-white/20 bg-gradient-to-br ${thumbs[0]}`}
          >
            {resume.course.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resume.course.thumbnail} alt="" className="h-full w-full object-cover" />
            )}
            <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-white/20 text-white backdrop-blur-md">
              ▶
            </span>
          </div>
          <div>
            <span className="inline-flex rounded-full border border-cf-gold/35 bg-cf-gold/10 px-3 py-0.5 text-xs font-semibold text-cf-gold">
              Continue learning
            </span>
            <h2 className="mt-3 font-display text-xl font-bold sm:text-2xl">{resume.course.title}</h2>
            <p className="mt-1 text-sm text-white/60">{resume.course._count.lessons} lessons</p>
            <div className="mt-4">
              <ProgressBar value={resume.progress} />
            </div>
            <span className="mt-4 inline-flex rounded-[14px] bg-gradient-to-br from-[#6ceaee] to-[#8f7bff] px-5 py-2.5 text-sm font-bold text-[#061029] shadow-goldGlow">
              Continue Learning
            </span>
          </div>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center justify-between !rounded-[22px]">
          <div>
            <p className="text-sm text-white/60">Enrolled Courses</p>
            <p className="mt-2 font-display text-3xl font-bold">{enrollments.length}</p>
          </div>
        </Card>
        <Card className="flex items-center justify-between !rounded-[22px]">
          <div>
            <p className="text-sm text-white/60">Completed Courses</p>
            <p className="mt-2 font-display text-3xl font-bold">{completedCount}</p>
          </div>
          <Ring
            value={enrollments.length ? (completedCount / enrollments.length) * 100 : 0}
            size={56}
            stroke={6}
            tone="mint"
          />
        </Card>
        <Card className="flex items-center justify-between !rounded-[22px]">
          <div>
            <p className="text-sm text-white/60">In Progress</p>
            <p className="mt-2 font-display text-3xl font-bold">{enrollments.length - completedCount}</p>
          </div>
          <Ring value={avgProgress} size={56} stroke={6}>
            <span className="text-[11px] font-bold">{avgProgress}%</span>
          </Ring>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 font-display text-xl font-semibold">Your Courses</h2>
        {enrollments.length === 0 ? (
          <div className="glass rounded-[24px] p-12 text-center">
            <p className="text-white/50">No courses enrolled yet.</p>
            <Link href="/courses">
              <Button variant="gold" className="mt-4 !px-6 !py-2.5">
                Browse Courses
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((e, idx) => (
              <Link
                key={e.id}
                href={`/courses/${e.course.slug}`}
                className="glass block rounded-[22px] p-3.5 transition hover:border-cf-gold/40"
              >
                <div
                  className={`relative mb-3 aspect-video overflow-hidden rounded-[18px] border border-white/20 bg-gradient-to-br ${thumbs[idx % 3]}`}
                >
                  {e.course.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.course.thumbnail} alt="" className="h-full w-full object-cover" />
                  )}
                  <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-white/20 text-sm text-white backdrop-blur-md">
                    ▶
                  </span>
                </div>
                <div className="flex items-center gap-2 px-1">
                  <Badge tone={levelTone[e.course.level]}>{e.course.level}</Badge>
                  {e.completed && <Badge tone="green">Completed</Badge>}
                </div>
                <h3 className="mt-2 px-1 font-display text-base font-semibold">{e.course.title}</h3>
                <p className="mt-1 px-1 text-xs text-white/50">{e.course._count.lessons} lessons</p>
                <div className="mt-3 px-1">
                  <div className="mb-1.5 flex justify-between text-xs text-white/50">
                    <span>Progress</span>
                    <span>{Math.round(e.progress)}%</span>
                  </div>
                  <ProgressBar value={e.progress} />
                </div>
                <div className="mt-3 px-1 pb-1 text-xs font-semibold text-cf-gold">
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
