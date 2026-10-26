'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Badge, Button, Input, Label, Textarea, ErrorText, Spinner } from '@/components/ui/index';

type Audience = 'PUBLIC' | 'ASSIGNED';

interface Assigned {
  userId: string;
  fullName: string;
  email: string;
  started: boolean;
}

interface Student {
  id: string;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
}

export default function AudiencePanel({
  testId,
  initialAudience,
  initialMax,
  published,
  onSaved
}: {
  testId: string;
  initialAudience: Audience;
  initialMax: number | null;
  published: boolean;
  onSaved?: (audience: Audience, max: number | null) => void;
}) {
  const [savedAudience, setSavedAudience] = useState<Audience>(initialAudience);
  const [audience, setAudience] = useState<Audience>(initialAudience);
  const [max, setMax] = useState(initialMax ? String(initialMax) : '');
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  const [assigned, setAssigned] = useState<Assigned[] | null>(null);
  const [students, setStudents] = useState<Student[] | null>(null);
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [emailText, setEmailText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadAssigned = useCallback(async () => {
    const res = await fetch(`/api/admin/tests/${testId}/assignments`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load assigned students.');
    setAssigned(data.assignments);
  }, [testId]);

  useEffect(() => {
    loadAssigned().catch((e) => setError(e.message));
  }, [loadAssigned]);

  // The student list is only needed once the admin is choosing who to assign.
  useEffect(() => {
    if (audience !== 'ASSIGNED' || students) return;
    fetch('/api/admin/users', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load students.');
        return res.json();
      })
      .then((data) => setStudents(data.users))
      .catch((e) => setError(e.message));
  }, [audience, students]);

  const assignedIds = useMemo(() => new Set((assigned ?? []).map((a) => a.userId)), [assigned]);

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (students ?? [])
      .filter((u) => u.role === 'STUDENT' && !assignedIds.has(u.id))
      .filter((u) => !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [students, assignedIds, search]);

  const dirty = audience !== savedAudience || (audience === 'PUBLIC' && (max.trim() || '') !== (initialMax ? String(initialMax) : ''));

  const saveAudience = async () => {
    setError(null);
    setNotice(null);
    setSavedNote(false);

    let maxParticipants: number | null = null;
    if (audience === 'PUBLIC' && max.trim()) {
      maxParticipants = parseInt(max, 10);
      if (!Number.isInteger(maxParticipants) || maxParticipants < 1) {
        setError('The student limit must be a whole number of 1 or more, or left empty for no limit.');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience, maxParticipants })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save.');
      setSavedAudience(audience);
      if (audience === 'ASSIGNED') setMax('');
      setSavedNote(true);
      onSaved?.(audience, maxParticipants);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const assign = async (payload: { userIds?: string[]; emails?: string[] }) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign students.');

      const parts = [`Assigned ${data.added} student${data.added === 1 ? '' : 's'}.`];
      if (data.alreadyAssigned > 0) parts.push(`${data.alreadyAssigned} already had it.`);
      if (data.notFound?.length > 0) parts.push(`No account found for: ${data.notFound.join(', ')}.`);
      setNotice(parts.join(' '));
      setPicked(new Set());
      if (payload.emails) setEmailText(data.notFound?.join('\n') ?? '');
      await loadAssigned();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const unassign = async (a: Assigned) => {
    if (
      a.started &&
      !confirm(`${a.fullName} has already started this test. Removing them stops them opening it again, but keeps their scores. Continue?`)
    ) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/assignments?userId=${encodeURIComponent(a.userId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove student.');
      setAssigned((prev) => (prev ?? []).filter((x) => x.userId !== a.userId));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const unassignAll = async () => {
    if (!confirm('Remove every student from this test? Their scores are kept.')) return;
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/assignments?all=true`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove students.');
      setAssigned([]);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const togglePick = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const emails = emailText
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);

  const option = (value: Audience, title: string, text: string) => (
    <button
      type="button"
      onClick={() => {
        setAudience(value);
        setSavedNote(false);
      }}
      className={clsx(
        'flex-1 rounded-lg border p-4 text-left transition',
        audience === value ? 'border-cf-gold bg-cf-gold/10' : 'border-white/10 bg-cf-charcoal2 hover:border-white/30'
      )}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span
          className={clsx(
            'flex h-4 w-4 items-center justify-center rounded-full border',
            audience === value ? 'border-cf-gold' : 'border-white/30'
          )}
        >
          {audience === value && <span className="h-2 w-2 rounded-full bg-cf-gold" />}
        </span>
        {title}
      </span>
      <span className="mt-1 block text-xs text-white/50">{text}</span>
    </button>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-cf-gold">Who can take this test</h2>
        <p className="mt-1 text-xs text-white/40">Only published tests appear for students.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {option('PUBLIC', 'Public', 'Every student on the site can see and take it.')}
        {option('ASSIGNED', 'Assigned', 'Only the students you pick below can see and take it.')}
      </div>

      {audience === 'PUBLIC' && (
        <div className="max-w-xs">
          <Label htmlFor="aud-max">Limit to the first … students (optional)</Label>
          <Input
            id="aud-max"
            type="number"
            min={1}
            value={max}
            onChange={(e) => {
              setMax(e.target.value);
              setSavedNote(false);
            }}
            placeholder="No limit"
          />
          <p className="mt-1 text-xs text-white/40">
            Once this many different students have started the test, new students see it as full. Students who already
            started keep their place and any retakes they are allowed.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button variant="gold" className="!px-4 !py-2 text-xs" loading={saving} disabled={!dirty} onClick={saveAudience}>
          Save who can take it
        </Button>
        {savedNote && !dirty && <span className="text-xs text-emerald-400">Saved.</span>}
        {dirty && <span className="text-xs text-cf-gold">Unsaved change</span>}
      </div>

      {error && <ErrorText>{error}</ErrorText>}
      {notice && <p className="text-xs text-emerald-400">{notice}</p>}

      {audience === 'ASSIGNED' && (
        <div className="space-y-5 border-t border-white/10 pt-5">
          {savedAudience !== 'ASSIGNED' && (
            <p className="rounded-lg border border-cf-gold/30 bg-cf-gold/5 px-4 py-3 text-xs text-white/70">
              Click <strong>Save who can take it</strong> above to switch this test to Assigned. Until then it stays public.
            </p>
          )}
          {published && savedAudience === 'ASSIGNED' && assigned && assigned.length === 0 && (
            <p className="rounded-lg border border-cf-red/40 bg-cf-red/10 px-4 py-3 text-xs text-cf-red">
              This test is published but no students are assigned yet, so nobody can see it.
            </p>
          )}

          {/* Assigned list */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Assigned students {assigned ? `(${assigned.length})` : ''}
              </h3>
              {assigned && assigned.length > 0 && (
                <button onClick={unassignAll} className="text-xs text-white/40 hover:text-cf-red">
                  Remove all
                </button>
              )}
            </div>
            {!assigned ? (
              <Spinner />
            ) : assigned.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-cf-charcoal2 p-4 text-center text-xs text-white/40">
                No students assigned yet.
              </p>
            ) : (
              <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {assigned.map((a) => (
                  <li
                    key={a.userId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-cf-charcoal2 px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{a.fullName}</span>
                      <span className="block truncate text-xs text-white/40">{a.email}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {a.started && <Badge tone="green">Started</Badge>}
                      <button onClick={() => unassign(a)} className="px-1 text-white/40 hover:text-cf-red" aria-label={`Remove ${a.fullName}`}>
                        ✕
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pick from list */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">Add students from the class</h3>
            <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {!students ? (
              <Spinner />
            ) : candidates.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-cf-charcoal2 p-4 text-center text-xs text-white/40">
                {search ? 'No matching students.' : 'Every student is already assigned.'}
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() =>
                      setPicked((prev) => (prev.size === candidates.length ? new Set() : new Set(candidates.map((c) => c.id))))
                    }
                    className="text-cf-gold hover:underline"
                  >
                    {picked.size === candidates.length ? 'Clear selection' : `Select all ${candidates.length} shown`}
                  </button>
                  <span className="text-white/40">{picked.size} selected</span>
                </div>
                <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
                  {candidates.map((u) => (
                    <li key={u.id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-cf-charcoal2 px-3 py-2 hover:border-white/30">
                        <input type="checkbox" checked={picked.has(u.id)} onChange={() => togglePick(u.id)} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm">{u.fullName}</span>
                          <span className="block truncate text-xs text-white/40">{u.email}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="!px-4 !py-2 text-xs"
                  loading={busy}
                  disabled={picked.size === 0}
                  onClick={() => assign({ userIds: Array.from(picked) })}
                >
                  Assign {picked.size || ''} selected
                </Button>
              </>
            )}
          </div>

          {/* Paste emails */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">Or paste a list of emails</h3>
            <Textarea
              rows={4}
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="one@example.com, two@example.com (separate with commas, spaces or new lines)"
              className="!text-xs"
            />
            <Button
              variant="outline"
              className="!px-4 !py-2 text-xs"
              loading={busy}
              disabled={emails.length === 0}
              onClick={() => assign({ emails })}
            >
              Assign {emails.length || ''} email{emails.length === 1 ? '' : 's'}
            </Button>
            <p className="text-xs text-white/40">
              Students must already have signed up. Emails with no account are listed back so you can fix them.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
