import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroScene from '@/components/three/HeroScene';
import { Button, Card, Badge } from '@/components/ui/index';
import CourseGrid from '@/components/courses/CourseGrid';
import { SITE_NAME_PRIMARY, SITE_NAME_ACCENT } from '@/lib/site-config';

const features = [
  {
    title: 'Lessons & Notes',
    desc: 'Each class is a sequence of video lessons with notes attached — everything in one place instead of scattered links.'
  },
  {
    title: 'Resume Where You Left Off',
    desc: 'Video progress is saved to your account continuously, so you can pick up mid-lesson on any device.'
  },
  {
    title: 'Quizzes Per Lesson',
    desc: 'Lessons can carry a linked quiz to self-check understanding right after watching.'
  },
  {
    title: 'Certificates on Completion',
    desc: 'Finish a class and get a numbered, QR-verifiable certificate — shareable, no login required to check.'
  }
];

const stats = [
  { label: 'Class Levels', value: 'Beginner → Advanced' },
  { label: 'Certificate Verification', value: 'Public & Instant' },
  { label: 'Progress Tracking', value: 'Per-Lesson, Persisted' },
  { label: 'Quizzes', value: 'Linked Per Lesson' }
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <section className="relative overflow-hidden">
        <HeroScene />
        <div className="relative mx-auto grid min-h-[80vh] max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="text-center lg:text-left">
            <Badge tone="gold">Class Site</Badge>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] md:text-7xl">
              {SITE_NAME_PRIMARY} <span className="text-gradient-gold">{SITE_NAME_ACCENT}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/65 lg:mx-0">
              Lessons, notes, and quizzes for the class — with progress tracked per lesson and a
              certificate once a class is complete.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Link href="/signup">
                <Button variant="gold" className="!rounded-2xl !px-8 !py-4 text-base">
                  Join the Class
                </Button>
              </Link>
              <Link href="/courses">
                <Button variant="outline" className="!rounded-2xl !px-8 !py-4 text-base">
                  Browse Classes
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:block" aria-hidden />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-[22px] p-5">
              <div className="font-display text-base font-bold text-cf-gold md:text-lg">{s.value}</div>
              <div className="mt-1 text-xs text-white/55">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            What's <span className="text-gradient-gold">included</span>
          </h2>
          <p className="mt-4 text-white/60">
            Everything needed to watch a lesson, check your notes, take the quiz, and track progress.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Card
              key={f.title}
              className={`hover:border-cf-gold/40 ${i === 1 ? '!rounded-bl-[64px]' : ''}`}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-cf-gold/35 bg-cf-gold/10 text-cf-gold">
                ●
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-white/60">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold">Featured Courses</h2>
            <p className="mt-2 text-white/55">Start with a published course — enroll instantly for free courses.</p>
          </div>
          <Link href="/courses" className="hidden text-sm font-medium text-cf-gold hover:underline md:block">
            View all →
          </Link>
        </div>
        <CourseGrid limit={3} />
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="glass rounded-[32px] px-6 py-16 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Ready to earn your first <span className="text-gradient-gold">certificate</span>?
          </h2>
          <p className="mt-4 text-white/60">
            Create your free account, enroll in a course, and start tracking real progress today.
          </p>
          <Link href="/signup">
            <Button variant="gold" className="mt-8 !px-8 !py-3.5 text-base">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
