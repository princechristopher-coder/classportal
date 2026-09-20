'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Badge, Button, Card, Spinner } from '@/components/ui/index';

interface ResultRow {
  id: string;
  fullName: string;
  email: string;
  status: 'SUBMITTED' | 'IN_PROGRESS';
  score: number | null;
  total: number | null;
  percent: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
  timedOut: boolean;
}

interface ResultsData {
  test: { id: string; title: string; passMark: number; questionCount: number };
  stats: { submitted: number; inProgress: number; averagePercent: number; passRate: number; highestPercent: number };
  attempts: ResultRow[];
}

export default function AdminTestResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ResultsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch(`/api/admin/tests/${id}/results`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load results.');
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  };

  useEffect(load, [id]);

  const resetAttempt = async (row: ResultRow) => {
    if (!confirm(`Delete ${row.fullName}'s attempt? They will get that attempt back and can take the test again.`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/tests/${id}/attempts/${row.id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to delete attempt.');
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!data) {
    return error ? (
      <p className="text-cf-red">{error}</p>
    ) : (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/admin/tests/${id}`} className="text-xs text-white/40 hover:text-cf-gold">
            ← Back to test
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold">{data.test.title}</h1>
          <p className="text-sm text-white/50">
            Results · pass mark {data.test.passMark}% · {data.test.questionCount} questions
          </p>
        </div>
        <a href={`/api/admin/tests/${id}/results?format=csv`}>
          <Button variant="outline" className="!px-4 !py-2 text-xs">
            Export CSV
          </Button>
        </a>
      </div>

      {error && <p className="text-sm text-cf-red">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wider text-white/40">Submitted</p>
          <p className="mt-2 font-display text-3xl font-bold text-cf-gold">{stats.submitted}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-white/40">Average</p>
          <p className="mt-2 font-display text-3xl font-bold text-cf-gold">{stats.averagePercent}%</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-white/40">Pass rate</p>
          <p className="mt-2 font-display text-3xl font-bold text-cf-gold">{stats.passRate}%</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wider text-white/40">Highest</p>
          <p className="mt-2 font-display text-3xl font-bold text-cf-gold">{stats.highestPercent}%</p>
        </Card>
      </div>

      {data.attempts.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-cf-charcoal2 p-12 text-center text-white/50">
          Nobody has taken this test yet.
        </div>
      ) : (
        <Card className="overflow-x-auto !p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Score</th>
                <th className="px-5 py-3">Result</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.attempts.map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <p className="font-medium">{r.fullName}</p>
                    <p className="text-xs text-white/40">{r.email}</p>
                  </td>
                  <td className="px-5 py-3 text-white/70">
                    {r.status === 'SUBMITTED' ? `${r.score}/${r.total} (${r.percent}%)` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {r.status === 'IN_PROGRESS' ? (
                      <Badge tone="gold">In progress</Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge tone={r.passed ? 'green' : 'red'}>{r.passed ? 'Pass' : 'Fail'}</Badge>
                        {r.timedOut && <span className="text-xs text-white/40">timed out</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-white/50">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : `Started ${new Date(r.startedAt).toLocaleString()}`}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      {r.status === 'SUBMITTED' && (
                        <Link href={`/dashboard/tests/attempt/${r.id}`}>
                          <Button variant="ghost" className="!px-3 !py-1.5 text-xs">
                            View
                          </Button>
                        </Link>
                      )}
                      <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => resetAttempt(r)}>
                        Reset
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
