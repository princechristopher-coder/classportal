'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Badge, Button, Card, Spinner } from '@/components/ui/index';
import { Ring } from '@/components/ui/Ring';

interface TestInfo {
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
  isFull: boolean;
  inProgressAttemptId: string | null;
  attempts: { id: string }[];
  attemptsLeft: number;
  canStart: boolean;
}

interface Question {
  id: string;
  topic: string | null;
  text: string;
  options: string[];
}

interface Session {
  attemptId: string;
  title: string;
  endsAtMs: number;
  clockOffsetMs: number; // server time minus this device's time
  questions: Question[];
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TakeTestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [info, setInfo] = useState<TestInfo | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'offline'>('idle');

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittingRef = useRef(false);
  const submitRef = useRef<(auto?: boolean) => void>();
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const dirtyRef = useRef(false);

  // Load intro info
  useEffect(() => {
    fetch(`/api/tests/${id}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load test.');
        return res.json();
      })
      .then((data) => setInfo(data.test))
      .catch((err) => setError(err.message));
  }, [id]);

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tests/${id}/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start the test.');

      setAnswers(data.answers || {});
      setCurrent(0);
      setSession({
        attemptId: data.attempt.id,
        title: data.test.title,
        endsAtMs: new Date(data.attempt.endsAt).getTime(),
        clockOffsetMs: new Date(data.serverNow).getTime() - Date.now(),
        questions: data.questions
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  const submit = useCallback(
    async (auto = false) => {
      if (!session || submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setError(null);
      clearTimeout(saveTimer.current);
      try {
        const res = await fetch(`/api/test-attempts/${session.attemptId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: answersRef.current, auto })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not submit your test.');
        window.onbeforeunload = null;
        router.replace(`/dashboard/tests/attempt/${session.attemptId}`);
      } catch (err: any) {
        setError(`${err.message} ${auto ? 'Retrying…' : 'Please try again.'}`);
        submittingRef.current = false;
        setSubmitting(false);
        if (auto) setTimeout(() => submitRef.current?.(true), 3000);
      }
    },
    [session, router]
  );
  submitRef.current = submit;

  // Countdown, computed from the server's deadline so refreshing can't reset the clock
  useEffect(() => {
    if (!session) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((session.endsAtMs - (Date.now() + session.clockOffsetMs)) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) submitRef.current?.(true);
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [session]);

  // Warn before closing the tab mid-test
  useEffect(() => {
    if (!session) return;
    window.onbeforeunload = () => 'Your test is still running.';
    return () => {
      window.onbeforeunload = null;
    };
  }, [session]);

  // Auto-save answers shortly after each change, so a dropped connection loses nothing
  const saveNow = useCallback(async () => {
    if (!session || submittingRef.current || !dirtyRef.current) return;
    dirtyRef.current = false;
    setSaveState('saving');
    try {
      const res = await fetch(`/api/test-attempts/${session.attemptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersRef.current })
      });
      if (!res.ok) throw new Error('save failed');
      setSaveState('saved');
    } catch {
      dirtyRef.current = true;
      setSaveState('offline');
      saveTimer.current = setTimeout(saveNow, 5000);
    }
  }, [session]);

  const choose = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    dirtyRef.current = true;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveNow, 700);
  };

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const confirmSubmit = () => {
    if (!session) return;
    const unanswered = session.questions.filter((q) => answers[q.id] === undefined).length;
    const msg =
      unanswered > 0
        ? `You have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. Submit anyway?`
        : 'Submit your test now? You cannot change your answers afterwards.';
    if (confirm(msg)) submit(false);
  };

  // ---------- Screens ----------

  if (!info && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-xl space-y-6">
          <Link href="/dashboard/tests" className="text-xs text-white/40 hover:text-cf-gold">
            ← Back to tests
          </Link>
          {info ? (
            <Card>
              <p className="text-xs uppercase tracking-widest text-cf-gold/70">Test</p>
              <h1 className="mt-1 font-display text-2xl font-bold">{info.title}</h1>
              {info.description && <p className="mt-3 whitespace-pre-line text-sm text-white/60">{info.description}</p>}

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge tone="gray">{info.questionCount} questions</Badge>
                <Badge tone="gray">{info.durationMins} minutes</Badge>
                <Badge tone="gray">Pass mark {info.passMark}%</Badge>
              </div>

              <ul className="mt-5 space-y-1.5 text-sm text-white/60">
                <li>• The timer starts the moment you press Start and keeps running if you close the page.</li>
                <li>• Your answers are saved as you go, and the test submits itself when time is up.</li>
                <li>
                  • {info.attemptsLeft} of {info.maxAttempts} attempt{info.maxAttempts === 1 ? '' : 's'} left.
                </li>
              </ul>

              {error && <p className="mt-4 text-sm text-cf-red">{error}</p>}

              <div className="mt-6">
                {info.canStart ? (
                  <Button variant="gold" className="w-full" loading={starting} onClick={start}>
                    {info.inProgressAttemptId ? 'Resume test' : 'Start test'}
                  </Button>
                ) : (
                  <p className="text-sm text-white/50">
                    {info.status === 'upcoming'
                      ? `This test opens ${info.opensAt ? new Date(info.opensAt).toLocaleString() : 'soon'}.`
                      : info.status === 'closed'
                      ? 'This test is closed.'
                      : info.isFull
                      ? 'This test is full. All places have been taken.'
                      : 'You have used all your attempts for this test.'}
                  </p>
                )}
              </div>
            </Card>
          ) : (
            <p className="text-cf-red">{error}</p>
          )}
        </div>
      </div>
    );
  }

  const q = session.questions[current];
  const answeredCount = session.questions.filter((x) => answers[x.id] !== undefined).length;
  const isLast = current === session.questions.length - 1;
  const low = secondsLeft <= 300;

  const totalSeconds = Math.max((info?.durationMins ?? 0) * 60, secondsLeft, 1);
  const timePct = (secondsLeft / totalSeconds) * 100;

  const timerRing = (size: number, stroke: number, big: boolean) => (
    <Ring value={timePct} size={size} stroke={stroke} tone={low ? 'coral' : 'aqua'}>
      <div className={clsx('font-display font-bold tabular-nums', big ? 'text-4xl' : 'text-xl', low && 'text-cf-red')}>
        {formatClock(secondsLeft)}
      </div>
      <div className="mt-1 text-xs text-white/50">minutes left</div>
    </Ring>
  );

  const questionGrid = (
    <div className="grid grid-cols-5 gap-2.5">
      {session.questions.map((x, i) => (
        <button
          key={x.id}
          onClick={() => setCurrent(i)}
          className={clsx(
            'grid h-11 place-items-center rounded-[13px] border text-sm font-bold transition',
            i === current
              ? 'border-transparent bg-gradient-to-br from-[#6ceaee] to-[#8f7bff] text-[#061029] shadow-goldGlow'
              : answers[x.id] !== undefined
              ? 'border-cf-gold/50 bg-cf-gold/15 text-cf-gold'
              : 'border-white/15 bg-white/5 text-white/55 hover:border-white/35'
          )}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="glass flex items-center justify-between gap-3 rounded-[22px] px-5 py-3.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{session.title}</p>
            <p className="text-xs text-white/50">
              Question {current + 1} of {session.questions.length} · {answeredCount} answered
            </p>
          </div>
          <span className="shrink-0 text-xs text-white/50">
            {saveState === 'saving' && 'Saving…'}
            {saveState === 'saved' && 'Answers saved'}
            {saveState === 'offline' && 'Connection problem'}
          </span>
        </div>

        {low && secondsLeft > 0 && (
          <p className="rounded-2xl border border-cf-red/40 bg-cf-red/10 px-4 py-2 text-xs text-cf-red">
            Less than 5 minutes left. Your test submits automatically at 00:00.
          </p>
        )}
        {error && <p className="rounded-2xl border border-cf-red/40 bg-cf-red/10 px-4 py-2 text-xs text-cf-red">{error}</p>}

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Timer first on phones, in the side column on desktop */}
          <div className="lg:order-2 lg:space-y-5">
            <div className="glass flex justify-center rounded-[26px] p-5 lg:p-7">
              <div className="hidden lg:block">{timerRing(200, 11, true)}</div>
              <div className="lg:hidden">{timerRing(150, 9, false)}</div>
            </div>
            <div className="glass mt-5 rounded-[26px] p-5 lg:mt-0">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold">Questions</h3>
                <span className="text-xs text-white/50">{answeredCount} answered</span>
              </div>
              {questionGrid}
            </div>
          </div>

          <Card className="!rounded-[28px] !p-6 sm:!p-9 lg:order-1">
            {q.topic && <p className="mb-2 text-xs font-semibold text-white/50">{q.topic}</p>}
            <p className="font-display text-lg font-medium leading-relaxed sm:text-2xl sm:leading-snug">{q.text}</p>

            <div className="mt-6 space-y-3">
              {q.options.map((opt, i) => {
                const selected = answers[q.id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => choose(q.id, i)}
                    className={clsx(
                      'flex w-full items-center gap-4 rounded-[18px] border px-5 py-4 text-left text-base font-semibold transition',
                      selected
                        ? 'border-cf-gold/50 bg-gradient-to-br from-cf-gold/20 to-cf-violet/20 shadow-[0_14px_40px_-16px_rgba(92,225,230,0.8)]'
                        : 'border-white/15 bg-white/5 hover:border-white/35'
                    )}
                  >
                    <span
                      className={clsx(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border font-display text-xs font-bold',
                        selected ? 'border-transparent bg-cf-gold text-[#061029]' : 'border-white/15 bg-white/10 text-white/60'
                      )}
                    >
                      {LETTERS[i]}
                    </span>
                    <span className="leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 flex items-center gap-3">
              <Button variant="ghost" className="flex-1 border border-white/15 bg-white/5" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
                Back
              </Button>
              {isLast ? (
                <Button variant="gold" className="flex-1" loading={submitting} onClick={confirmSubmit}>
                  Submit test
                </Button>
              ) : (
                <Button variant="gold" className="flex-1" onClick={() => setCurrent((c) => c + 1)}>
                  Next
                </Button>
              )}
            </div>

            {!isLast && (
              <div className="mt-4 text-right text-xs">
                <button onClick={confirmSubmit} className="text-white/45 underline hover:text-cf-gold">
                  Submit early
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
