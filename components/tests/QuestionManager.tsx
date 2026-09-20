'use client';

import { useState } from 'react';
import { Button, Input, Label, Textarea, ErrorText, Badge } from '@/components/ui/index';

export interface AdminQuestion {
  id: string;
  order: number;
  topic: string | null;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const emptyForm = { topic: '', text: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' };

const importExample = `[
  {
    "topic": "Density",
    "question": "The density of a solid is defined as the",
    "options": ["weight per unit volume", "mass per unit volume", "volume per unit mass"],
    "answer": "B",
    "explanation": "Density = mass / volume."
  }
]`;

export default function QuestionManager({
  testId,
  initialQuestions,
  onChange
}: {
  testId: string;
  initialQuestions: AdminQuestion[];
  onChange?: (count: number) => void;
}) {
  const [questions, setQuestions] = useState<AdminQuestion[]>(initialQuestions);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [replaceAll, setReplaceAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setAndReport = (next: AdminQuestion[]) => {
    setQuestions(next);
    onChange?.(next.length);
  };

  const reload = async () => {
    const res = await fetch(`/api/admin/tests/${testId}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reload questions.');
    setAndReport(data.test.questions);
  };

  const startCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setShowImport(false);
    setError(null);
    setNotice(null);
  };

  const startEdit = (q: AdminQuestion) => {
    setForm({
      topic: q.topic || '',
      text: q.text,
      options: q.options.length >= 2 ? q.options : ['', ''],
      correctIndex: q.correctIndex,
      explanation: q.explanation || ''
    });
    setEditingId(q.id);
    setShowForm(true);
    setShowImport(false);
    setError(null);
    setNotice(null);
  };

  const setOption = (i: number, value: string) =>
    setForm((f) => ({ ...f, options: f.options.map((o, idx) => (idx === i ? value : o)) }));

  const addOption = () => setForm((f) => (f.options.length >= 6 ? f : { ...f, options: [...f.options, ''] }));

  const removeOption = (i: number) =>
    setForm((f) => {
      if (f.options.length <= 2) return f;
      const options = f.options.filter((_, idx) => idx !== i);
      let correctIndex = f.correctIndex;
      if (i === correctIndex) correctIndex = 0;
      else if (i < correctIndex) correctIndex -= 1;
      return { ...f, options, correctIndex };
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const payload = {
        topic: form.topic || null,
        text: form.text,
        options: form.options,
        correctIndex: form.correctIndex,
        explanation: form.explanation || null
      };
      const res = await fetch(
        editingId ? `/api/admin/tests/${testId}/questions/${editingId}` : `/api/admin/tests/${testId}/questions`,
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save question.');

      if (editingId) {
        setAndReport(questions.map((q) => (q.id === editingId ? data.question : q)));
        setShowForm(false);
        setEditingId(null);
      } else {
        setAndReport([...questions, data.question]);
        setForm({ ...emptyForm, topic: form.topic }); // keep the topic, ready for the next question
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (q: AdminQuestion) => {
    if (!confirm('Delete this question?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/questions/${q.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete question.');
      setAndReport(questions.filter((x) => x.id !== q.id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setImportText(await file.text());
  };

  const handleImport = async () => {
    setError(null);
    setNotice(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch {
      setError('That is not valid JSON. Paste the whole list, starting with [ and ending with ].');
      return;
    }
    if (replaceAll && !confirm('Replace ALL existing questions in this test with the imported ones?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tests/${testId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ import: parsed, replace: replaceAll })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed.');
      await reload();
      setNotice(`Imported ${data.imported} question${data.imported === 1 ? '' : 's'}.`);
      setImportText('');
      setShowImport(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-cf-gold">Questions ({questions.length})</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="!px-4 !py-2 text-xs"
            onClick={() => {
              setShowImport((s) => !s);
              setShowForm(false);
              setError(null);
              setNotice(null);
            }}
          >
            Import from JSON
          </Button>
          <Button variant="outline" className="!px-4 !py-2 text-xs" onClick={startCreate}>
            + Add Question
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-cf-red">{error}</p>}
      {notice && <p className="text-xs text-emerald-400">{notice}</p>}

      {showImport && (
        <div className="space-y-3 rounded-lg border border-cf-gold/30 bg-cf-charcoal2 p-4">
          <p className="text-xs text-white/60">
            Paste a JSON list, or choose a .json file. Each question needs <code className="text-cf-gold">question</code>,{' '}
            <code className="text-cf-gold">options</code> (2–6) and <code className="text-cf-gold">answer</code> (the correct
            letter, A–F). <code className="text-cf-gold">topic</code> and <code className="text-cf-gold">explanation</code> are optional.
          </p>
          <pre className="overflow-x-auto rounded-md bg-black/40 p-3 text-[11px] leading-relaxed text-white/60">{importExample}</pre>
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="block text-xs text-white/60 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-white"
          />
          <Textarea
            rows={8}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="[ { &quot;question&quot;: &quot;…&quot;, &quot;options&quot;: [ … ], &quot;answer&quot;: &quot;A&quot; } ]"
            className="font-mono !text-xs"
          />
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input type="checkbox" checked={replaceAll} onChange={(e) => setReplaceAll(e.target.checked)} />
            Replace all existing questions (otherwise the imported ones are added to the end)
          </label>
          <div className="flex gap-2">
            <Button variant="gold" className="!px-4 !py-2 text-xs" loading={loading} disabled={!importText.trim()} onClick={handleImport}>
              Import
            </Button>
            <Button variant="ghost" className="!px-4 !py-2 text-xs" onClick={() => setShowImport(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-cf-gold/30 bg-cf-charcoal2 p-4">
          <h3 className="text-sm font-semibold">{editingId ? 'Edit question' : 'New question'}</h3>
          <div>
            <Label htmlFor="q-topic">Topic (optional)</Label>
            <Input id="q-topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Upthrust" />
          </div>
          <div>
            <Label htmlFor="q-text">Question</Label>
            <Textarea id="q-text" required rows={3} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
          </div>
          <div>
            <Label>Options — select the correct one</Label>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    aria-label={`Option ${LETTERS[i]} is correct`}
                    checked={form.correctIndex === i}
                    onChange={() => setForm({ ...form, correctIndex: i })}
                  />
                  <span className="w-5 text-xs font-semibold text-white/50">{LETTERS[i]}</span>
                  <Input value={opt} onChange={(e) => setOption(i, e.target.value)} placeholder={`Option ${LETTERS[i]}`} />
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    disabled={form.options.length <= 2}
                    className="px-2 text-white/40 hover:text-cf-red disabled:opacity-30"
                    aria-label={`Remove option ${LETTERS[i]}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {form.options.length < 6 && (
              <button type="button" onClick={addOption} className="mt-2 text-xs text-cf-gold hover:underline">
                + Add option
              </button>
            )}
          </div>
          <div>
            <Label htmlFor="q-expl">Explanation (optional, shown in the answer review)</Label>
            <Textarea id="q-expl" rows={2} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="gold" className="!px-4 !py-2 text-xs" loading={loading}>
              {editingId ? 'Save Question' : 'Add Question'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="!px-4 !py-2 text-xs"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              {editingId ? 'Cancel' : 'Done'}
            </Button>
          </div>
        </form>
      )}

      {questions.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-cf-charcoal2 p-6 text-center text-sm text-white/40">
          No questions yet. Add one, or import a whole list.
        </p>
      ) : (
        <ul className="space-y-2">
          {questions.map((q, i) => (
            <li key={q.id} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-cf-charcoal2 px-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-white/40">#{i + 1}</span>
                  {q.topic && <Badge tone="gray">{q.topic}</Badge>}
                  <Badge tone="green">Answer: {LETTERS[q.correctIndex]}</Badge>
                </div>
                <p className="mt-1 text-sm">{q.text}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => startEdit(q)}>
                  Edit
                </Button>
                <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => deleteQuestion(q)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
