'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Label, Textarea, Button, ErrorText } from '@/components/ui/index';

export interface TestSettings {
  id?: string;
  title: string;
  description: string | null;
  durationMins: number;
  maxAttempts: number;
  passMark: number;
  showReview: boolean;
  published: boolean;
  opensAt: string | null;
  closesAt: string | null;
}

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in the admin's local time.
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

export default function TestForm({
  mode,
  initial,
  onSaved
}: {
  mode: 'create' | 'edit';
  initial?: TestSettings;
  onSaved?: (t: TestSettings) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [duration, setDuration] = useState(String(initial?.durationMins ?? 30));
  const [attempts, setAttempts] = useState(String(initial?.maxAttempts ?? 1));
  const [passMark, setPassMark] = useState(String(initial?.passMark ?? 50));
  const [showReview, setShowReview] = useState(initial?.showReview ?? true);
  const [opensAt, setOpensAt] = useState(toLocalInput(initial?.opensAt ?? null));
  const [closesAt, setClosesAt] = useState(toLocalInput(initial?.closesAt ?? null));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const payload = {
        title,
        description: description || null,
        durationMins: parseInt(duration, 10),
        maxAttempts: parseInt(attempts, 10),
        passMark: parseInt(passMark, 10),
        showReview,
        opensAt: fromLocalInput(opensAt),
        closesAt: fromLocalInput(closesAt)
      };
      if ([payload.durationMins, payload.maxAttempts, payload.passMark].some((n) => Number.isNaN(n))) {
        throw new Error('Duration, attempts and pass mark must be numbers.');
      }

      const res = await fetch(mode === 'create' ? '/api/admin/tests' : `/api/admin/tests/${initial?.id}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save test.');

      if (mode === 'create') {
        router.push(`/admin/tests/${data.test.id}`);
      } else {
        setSaved(true);
        onSaved?.({
          ...data.test,
          opensAt: data.test.opensAt,
          closesAt: data.test.closesAt
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="t-title">Title</Label>
        <Input id="t-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Physics — Density & Upthrust" />
      </div>
      <div>
        <Label htmlFor="t-desc">Instructions for students (optional)</Label>
        <Textarea
          id="t-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Shown on the start screen before the test begins."
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="t-duration">Time (minutes)</Label>
          <Input id="t-duration" type="number" min={1} max={600} required value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="t-attempts">Attempts allowed</Label>
          <Input id="t-attempts" type="number" min={1} max={20} required value={attempts} onChange={(e) => setAttempts(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="t-pass">Pass mark (%)</Label>
          <Input id="t-pass" type="number" min={0} max={100} required value={passMark} onChange={(e) => setPassMark(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="t-opens">Opens (optional)</Label>
          <Input id="t-opens" type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="t-closes">Closes (optional)</Label>
          <Input id="t-closes" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
        </div>
      </div>
      <p className="-mt-2 text-xs text-white/40">
        Leave both empty to keep the test open until you unpublish it. A student who has already started can finish even after the closing time.
      </p>
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" checked={showReview} onChange={(e) => setShowReview(e.target.checked)} />
        Let students see the correct answers after they submit
      </label>

      <ErrorText>{error}</ErrorText>
      {saved && <p className="text-xs text-emerald-400">Saved.</p>}
      <Button type="submit" variant="gold" loading={loading}>
        {mode === 'create' ? 'Create Test' : 'Save Settings'}
      </Button>
    </form>
  );
}
