'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Spinner, Badge, Button } from '@/components/ui/index';

interface AdminTest {
  id: string;
  title: string;
  durationMins: number;
  passMark: number;
  published: boolean;
  opensAt: string | null;
  closesAt: string | null;
  _count: { questions: number; attempts: number };
}

function windowLabel(t: AdminTest): string {
  const fmt = (s: string) => new Date(s).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  if (t.opensAt && t.closesAt) return `${fmt(t.opensAt)} → ${fmt(t.closesAt)}`;
  if (t.opensAt) return `Opens ${fmt(t.opensAt)}`;
  if (t.closesAt) return `Closes ${fmt(t.closesAt)}`;
  return 'Always open';
}

export default function AdminTestsPage() {
  const [tests, setTests] = useState<AdminTest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = () => {
    fetch('/api/admin/tests', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load tests.');
        return res.json();
      })
      .then((data) => setTests(data.tests))
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  const togglePublish = async (t: AdminTest) => {
    setTogglingId(t.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tests/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !t.published })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update test.');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const deleteTest = async (t: AdminTest) => {
    if (!confirm(`Delete "${t.title}"? This also deletes its questions and every student's results.`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/tests/${t.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete test.');
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Tests</h1>
          <p className="text-sm text-white/50">Set timed tests for your students and see how they did.</p>
        </div>
        <Link href="/admin/tests/new">
          <Button variant="gold" className="!px-5 !py-2.5">
            + New Test
          </Button>
        </Link>
      </div>

      {error && <p className="text-sm text-cf-red">{error}</p>}

      {!tests ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : tests.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-cf-charcoal2 p-12 text-center text-white/50">
          No tests yet. Create your first test.
        </div>
      ) : (
        <Card className="overflow-x-auto !p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Questions</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Window</th>
                <th className="px-5 py-3">Attempts</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <Link href={`/admin/tests/${t.id}`} className="font-medium hover:text-cf-gold">
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-white/60">{t._count.questions}</td>
                  <td className="px-5 py-3 text-white/60">{t.durationMins} min</td>
                  <td className="px-5 py-3 text-xs text-white/50">{windowLabel(t)}</td>
                  <td className="px-5 py-3 text-white/60">{t._count.attempts}</td>
                  <td className="px-5 py-3">
                    <Badge tone={t.published ? 'green' : 'gray'}>{t.published ? 'Published' : 'Draft'}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/tests/${t.id}/results`}>
                        <Button variant="ghost" className="!px-3 !py-1.5 text-xs">
                          Results
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="!px-3 !py-1.5 text-xs"
                        loading={togglingId === t.id}
                        onClick={() => togglePublish(t)}
                      >
                        {t.published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => deleteTest(t)}>
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
