'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import clsx from 'clsx';
import { Badge, Card, Spinner } from '@/components/ui/index';

interface ReviewItem {
  id: string;
  topic: string | null;
  text: string;
  options: string[];
  correctIndex: number;
  yourIndex: number | null;
  explanation: string | null;
}

interface ResultData {
  attempt: {
    id: string;
    score: number;
    total: number;
    percent: number;
    passed: boolean;
    submittedAt: string;
    timedOut: boolean;
    student?: { fullName: string; email: string };
  };
  test: { id: string; title: string; passMark: number; showReview: boolean };
  review: ReviewItem[] | null;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function TestAttemptResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    fetch(`/api/test-attempts/${attemptId}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load result.');
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [attemptId]);

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-cf-red">{error}</p>
        <Link href="/dashboard/tests" className="text-sm text-cf-gold hover:underline">
          ← Back to tests
        </Link>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const { attempt, test, review } = data;

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/tests" className="text-xs text-white/40 hover:text-cf-gold">
        ← Back to tests
      </Link>

      <Card className="text-center">
        <p className="text-xs uppercase tracking-widest text-cf-gold/70">{test.title}</p>
        {attempt.student && (
          <p className="mt-1 text-xs text-white/40">
            {attempt.student.fullName} · {attempt.student.email}
          </p>
        )}
        <p className="mt-4 font-display text-6xl font-bold text-cf-gold">{attempt.percent}%</p>
        <p className="mt-2 text-sm text-white/60">
          {attempt.score} out of {attempt.total} correct
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Badge tone={attempt.passed ? 'green' : 'red'}>{attempt.passed ? 'Passed' : 'Not passed'}</Badge>
          <span className="text-xs text-white/40">Pass mark {test.passMark}%</span>
        </div>
        {attempt.timedOut && (
          <p className="mt-3 text-xs text-white/40">Time ran out, so your saved answers were submitted automatically.</p>
        )}
        <p className="mt-3 text-xs text-white/30">Submitted {new Date(attempt.submittedAt).toLocaleString()}</p>
      </Card>

      {review ? (
        <div className="space-y-3">
          <button onClick={() => setShowReview((s) => !s)} className="text-sm font-medium text-cf-gold hover:underline">
            {showReview ? 'Hide answer review' : 'Show answer review'}
          </button>

          {showReview &&
            review.map((q, i) => {
              const correct = q.yourIndex === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={clsx(
                    'rounded-xl border p-4 text-sm',
                    correct ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-cf-red/40 bg-cf-red/5'
                  )}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Badge tone={correct ? 'green' : 'red'}>{correct ? 'Correct' : q.yourIndex === null ? 'Not answered' : 'Wrong'}</Badge>
                    {q.topic && <span className="text-xs text-white/40">{q.topic}</span>}
                  </div>
                  <p className="font-medium leading-relaxed">
                    {i + 1}. {q.text}
                  </p>
                  <p className="mt-2 text-white/60">
                    Your answer:{' '}
                    {q.yourIndex === null ? 'No answer' : `${LETTERS[q.yourIndex]}. ${q.options[q.yourIndex] ?? ''}`}
                  </p>
                  {!correct && (
                    <p className="text-emerald-400/90">
                      Correct answer: {LETTERS[q.correctIndex]}. {q.options[q.correctIndex]}
                    </p>
                  )}
                  {q.explanation && <p className="mt-2 text-xs text-white/50">{q.explanation}</p>}
                </div>
              );
            })}
        </div>
      ) : (
        <p className="text-xs text-white/40">Your teacher has turned off the answer review for this test.</p>
      )}
    </div>
  );
}
