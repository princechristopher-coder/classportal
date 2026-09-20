'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Badge, Button, Card, Spinner } from '@/components/ui/index';
import TestForm, { TestSettings } from '@/components/tests/TestForm';
import QuestionManager, { AdminQuestion } from '@/components/tests/QuestionManager';

interface AdminTestDetail extends TestSettings {
  id: string;
  questions: AdminQuestion[];
  _count: { attempts: number };
}

export default function AdminTestEditPage() {
  const { id } = useParams<{ id: string }>();
  const [test, setTest] = useState<AdminTestDetail | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/tests/${id}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load test.');
        return res.json();
      })
      .then((data) => {
        setTest(data.test);
        setQuestionCount(data.test.questions.length);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const togglePublish = async () => {
    if (!test) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !test.published })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update test.');
      setTest({ ...test, published: data.test.published });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  if (!test) {
    return error ? (
      <p className="text-cf-red">{error}</p>
    ) : (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/tests" className="text-xs text-white/40 hover:text-cf-gold">
            ← All tests
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold">{test.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={test.published ? 'green' : 'gray'}>{test.published ? 'Published' : 'Draft'}</Badge>
            <span className="text-xs text-white/40">
              {questionCount} question{questionCount === 1 ? '' : 's'} · {test._count.attempts} attempt
              {test._count.attempts === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/tests/${id}/results`}>
            <Button variant="ghost" className="!px-4 !py-2 text-xs">
              View Results
            </Button>
          </Link>
          <Button variant={test.published ? 'outline' : 'gold'} className="!px-4 !py-2 text-xs" loading={publishing} onClick={togglePublish}>
            {test.published ? 'Unpublish' : 'Publish to students'}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-cf-red">{error}</p>}

      {test._count.attempts > 0 && (
        <p className="rounded-lg border border-cf-gold/30 bg-cf-gold/5 px-4 py-3 text-xs text-white/70">
          Students have already taken this test. Scores already recorded won&apos;t change, but editing or deleting questions
          changes what their answer review shows.
        </p>
      )}

      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cf-gold">Settings</h2>
        <TestForm mode="edit" initial={test} onSaved={(t) => setTest({ ...test, ...t })} />
      </Card>

      <Card>
        <QuestionManager testId={test.id} initialQuestions={test.questions} onChange={setQuestionCount} />
      </Card>
    </div>
  );
}
