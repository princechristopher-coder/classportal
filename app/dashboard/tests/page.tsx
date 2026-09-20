'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, Spinner } from '@/components/ui/index';

interface StudentTest {
  id: string;
  title: string;
  description: string | null;
  durationMins: number;
  maxAttempts: number;
  passMark: number;
  opensAt: string | null;
  closesAt: string | null;
  questionCount: number;
  status: 'upcoming' | 'open' | 'closed';
  inProgressAttemptId: string | null;
  attempts: { id: string; score: number; total: number; submittedAt: string; timedOut: boolean }[];
  attemptsLeft: number;
  canStart: boolean;
}

const fmt = (s: string) => new Date(s).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function StudentTestsPage() {
  const [tests, setTests] = useState<StudentTest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tests', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load tests.');
        return res.json();
      })
      .then((data) => setTests(data.tests))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-cf-red">{error}</p>;
  if (!tests) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Tests</h2>
        <p className="text-sm text-white/50">Timed tests set for the class. Once you start, the clock keeps running.</p>
      </div>

      {tests.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-cf-charcoal2 p-12 text-center text-white/50">
          No tests available right now.
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((t) => {
            let action = 'Start test';
            if (t.inProgressAttemptId) action = 'Resume test';
            else if (t.attempts.length > 0) action = 'Retake test';

            return (
              <Card key={t.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold">{t.title}</h3>
                    {t.description && <p className="mt-1 text-sm text-white/50">{t.description}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone="gray">{t.questionCount} questions</Badge>
                      <Badge tone="gray">{t.durationMins} min</Badge>
                      <Badge tone="gray">Pass {t.passMark}%</Badge>
                      {t.inProgressAttemptId && <Badge tone="gold">In progress</Badge>}
                      {t.status === 'upcoming' && t.opensAt && <Badge tone="gold">Opens {fmt(t.opensAt)}</Badge>}
                      {t.status === 'closed' && <Badge tone="red">Closed</Badge>}
                      {t.status === 'open' && t.closesAt && <Badge tone="gold">Closes {fmt(t.closesAt)}</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    {t.canStart ? (
                      <Link href={`/take-test/${t.id}`}>
                        <Button variant="gold" className="!px-5 !py-2.5">
                          {action}
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-xs text-white/40">
                        {t.status === 'upcoming'
                          ? 'Not open yet'
                          : t.status === 'closed'
                          ? 'Closed'
                          : 'No attempts left'}
                      </span>
                    )}
                    <p className="mt-2 text-xs text-white/40">
                      {t.attemptsLeft} of {t.maxAttempts} attempt{t.maxAttempts === 1 ? '' : 's'} left
                    </p>
                  </div>
                </div>

                {t.attempts.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="mb-2 text-xs uppercase tracking-wider text-white/40">Your results</p>
                    <ul className="space-y-1.5">
                      {t.attempts.map((a) => {
                        const percent = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
                        return (
                          <li key={a.id} className="flex items-center justify-between text-sm">
                            <span className="text-white/70">
                              {a.score}/{a.total} ({percent}%){' '}
                              <Badge tone={percent >= t.passMark ? 'green' : 'red'}>
                                {percent >= t.passMark ? 'Pass' : 'Fail'}
                              </Badge>{' '}
                              <span className="text-xs text-white/40">{fmt(a.submittedAt)}</span>
                            </span>
                            <Link href={`/dashboard/tests/attempt/${a.id}`} className="text-xs text-cf-gold hover:underline">
                              View →
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
