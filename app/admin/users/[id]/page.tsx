'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Spinner, Badge } from '@/components/ui/index';

interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  enrollments: { id: string; progress: number; completed: boolean; course: { title: string; slug: string } }[];
  certificates: { id: string; certificateNo: string; course: { title: string } }[];
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load user.');
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="text-cf-red">{error}</p>;
  if (!user) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{user.fullName}</h1>
        <p className="text-sm text-white/50">{user.email}</p>
        <Badge tone={user.role === 'ADMIN' ? 'gold' : 'gray'}>{user.role}</Badge>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cf-gold">Enrollments</h2>
        {user.enrollments.length === 0 ? (
          <p className="text-sm text-white/40">No enrollments yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {user.enrollments.map((e) => (
              <li key={e.id} className="flex items-center justify-between border-b border-white/5 py-2 last:border-0">
                <span>{e.course.title}</span>
                <span className="text-white/50">{Math.round(e.progress)}% {e.completed && '· Completed'}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cf-gold">Certificates</h2>
        {user.certificates.length === 0 ? (
          <p className="text-sm text-white/40">No certificates yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {user.certificates.map((c) => (
              <li key={c.id} className="flex items-center justify-between border-b border-white/5 py-2 last:border-0">
                <span>{c.course.title}</span>
                <span className="font-mono text-xs text-white/50">{c.certificateNo}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
