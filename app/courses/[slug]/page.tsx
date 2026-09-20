'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import VideoPlayer from '@/components/courses/VideoPlayer';
import LessonList, { LessonProgressMap } from '@/components/courses/LessonList';
import { Badge, Button, Spinner } from '@/components/ui/index';
import { useAuth } from '@/context/AuthContext';

interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  description: string | null;
  duration: number;
  isFree: boolean;
  notes: string | null;
  quizUrl: string | null;
  order: number;
}

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  price: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  lessons: Lesson[];
  _count: { enrollments: number };
}

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [enrollment, setEnrollment] = useState<{ progress: number; completed: boolean } | null>(null);
  const [progressByLesson, setProgressByLesson] = useState<LessonProgressMap>({});
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [certificateId, setCertificateId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/courses/${slug}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load course.');
      setCourse(data.course);
      setEnrollment(data.enrollment);
      setProgressByLesson(data.progressByLesson || {});
      setActiveLessonId((prev) => prev ?? data.course.lessons[0]?.id ?? null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEnroll = async () => {
    if (!user) {
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }
    if (!course) return;

    if (course.price > 0) {
      router.push(`/checkout?courseId=${course.id}`);
      return;
    }

    setEnrolling(true);
    setEnrollError(null);
    try {
      const res = await fetch('/api/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enroll.');
      await load();
    } catch (err: any) {
      setEnrollError(err.message);
    } finally {
      setEnrolling(false);
    }
  };

  useEffect(() => {
    // Fetch the certificate id once the course is complete, so we can link to it.
    if (enrollment?.completed && course) {
      fetch('/api/certificates', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          const cert = d.certificates?.find((c: any) => c.courseId === course.id);
          if (cert) setCertificateId(cert.id);
        })
        .catch(() => {});
    }
  }, [enrollment?.completed, course]);

  if (error) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center text-cf-red">{error}</div>
        <Footer />
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center py-32">
          <Spinner />
        </div>
        <Footer />
      </>
    );
  }

  const hasAccess = !!enrollment;
  const activeLesson = course.lessons.find((l) => l.id === activeLessonId) || course.lessons[0];
  const canWatchActive = activeLesson && (hasAccess || activeLesson.isFree);

  return (
    <>
      <Navbar />
      <section className="border-b border-white/10 bg-cf-radial">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <Badge tone={course.level === 'ADVANCED' ? 'red' : course.level === 'INTERMEDIATE' ? 'gold' : 'green'}>
            {course.level}
          </Badge>
          <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">{course.title}</h1>
          <p className="mt-3 max-w-2xl text-white/60">{course.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/50">
            <span>{course.lessons.length} lessons</span>
            <span>{course._count.enrollments} students enrolled</span>
            <span className="font-semibold text-cf-gold">{course.price > 0 ? `$${course.price.toFixed(2)}` : 'Free'}</span>
          </div>

          {!hasAccess && (
            <div className="mt-8">
              <Button variant="gold" className="!px-8 !py-3" loading={enrolling} onClick={handleEnroll}>
                {course.price > 0 ? `Enroll — $${course.price.toFixed(2)}` : 'Enroll for Free'}
              </Button>
              {enrollError && <p className="mt-2 text-sm text-cf-red">{enrollError}</p>}
            </div>
          )}

          {enrollment?.completed && (
            <div className="mt-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
              🎉 Course Completed!{' '}
              {certificateId ? (
                <Link href={`/certificates/${certificateId}`} className="font-semibold underline">
                  View your certificate →
                </Link>
              ) : (
                'Your certificate is being prepared.'
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {activeLesson && canWatchActive && (
            <VideoPlayer
              key={activeLesson.id}
              lessonId={activeLesson.id}
              videoUrl={activeLesson.videoUrl}
              initialCurrentTime={progressByLesson[activeLesson.id]?.currentTime || 0}
              initialCompleted={progressByLesson[activeLesson.id]?.completed || false}
              onCompleted={load}
            />
          )}
          {activeLesson && !canWatchActive && (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-white/10 bg-cf-charcoal2 text-center">
              <div>
                <p className="text-white/60">🔒 Enroll in this course to watch this lesson.</p>
                <Button variant="outline" className="mt-4 !px-6 !py-2" onClick={handleEnroll}>
                  {course.price > 0 ? 'Go to Checkout' : 'Enroll Free'}
                </Button>
              </div>
            </div>
          )}

          {activeLesson && (
            <div className="rounded-xl border border-white/10 bg-cf-charcoal2 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold">{activeLesson.title}</h2>
                {activeLesson.quizUrl && canWatchActive && (
                  <a href={activeLesson.quizUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="gold" className="!px-5 !py-2 text-sm">
                      Take Quiz →
                    </Button>
                  </a>
                )}
              </div>
              {activeLesson.description && <p className="mt-2 text-sm text-white/60">{activeLesson.description}</p>}
              {activeLesson.notes && (
                <div className="mt-4 rounded-lg border border-white/10 bg-cf-black/40 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cf-gold">Notes</h3>
                  <p className="whitespace-pre-wrap text-sm text-white/60">{activeLesson.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <LessonList
            lessons={course.lessons}
            activeLessonId={activeLesson?.id ?? null}
            progressByLesson={progressByLesson}
            hasAccess={hasAccess}
            onSelect={setActiveLessonId}
          />
        </div>
      </section>
      <Footer />
    </>
  );
}
