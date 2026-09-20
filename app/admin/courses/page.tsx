'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Spinner, Badge, Button } from '@/components/ui/index';

interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  price: number;
  level: string;
  published: boolean;
  _count: { lessons: number; enrollments: number };
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = () => {
    fetch('/api/courses?all=true', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load courses.');
        return res.json();
      })
      .then((data) => setCourses(data.courses))
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  const togglePublish = async (c: AdminCourse) => {
    setTogglingId(c.id);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${c.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !c.published })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update course.');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const deleteCourse = async (c: AdminCourse) => {
    if (!confirm(`Delete "${c.title}"? This removes its lessons, enrollments, and certificates.`)) return;
    try {
      const res = await fetch(`/api/courses/${c.slug}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete course.');
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Courses</h1>
          <p className="text-sm text-white/50">Create, edit, publish, and manage lessons.</p>
        </div>
        <Link href="/admin/courses/new">
          <Button variant="gold" className="!px-5 !py-2.5">
            + New Course
          </Button>
        </Link>
      </div>

      {error && <p className="text-sm text-cf-red">{error}</p>}

      {!courses ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-cf-charcoal2 p-12 text-center text-white/50">
          No courses yet. Create your first course.
        </div>
      ) : (
        <Card className="overflow-x-auto !p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Lessons</th>
                <th className="px-5 py-3">Enrolled</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <Link href={`/admin/courses/${c.slug}`} className="font-medium hover:text-cf-gold">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-white/60">{c.level}</td>
                  <td className="px-5 py-3 text-white/60">{c.price > 0 ? `$${c.price.toFixed(2)}` : 'Free'}</td>
                  <td className="px-5 py-3 text-white/60">{c._count.lessons}</td>
                  <td className="px-5 py-3 text-white/60">{c._count.enrollments}</td>
                  <td className="px-5 py-3">
                    <Badge tone={c.published ? 'green' : 'gray'}>{c.published ? 'Published' : 'Draft'}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="!px-3 !py-1.5 text-xs"
                        loading={togglingId === c.id}
                        onClick={() => togglePublish(c)}
                      >
                        {c.published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => deleteCourse(c)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
