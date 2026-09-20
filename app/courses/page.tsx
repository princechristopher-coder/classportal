'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CourseGrid from '@/components/courses/CourseGrid';
import { Input } from '@/components/ui/index';

export default function CoursesPage() {
  const [search, setSearch] = useState('');

  return (
    <>
      <Navbar />
      <section className="border-b border-white/10 bg-cf-radial">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Explore <span className="text-gradient-gold">Courses</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/55">
            Beginner to advanced tracks, each with real lessons, saved progress, and a verifiable certificate on completion.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <Input
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <CourseGrid search={search} />
      </section>
      <Footer />
    </>
  );
}
