'use client';

import { useState } from 'react';
import { Button, Input, Label, Textarea, ErrorText, Badge } from '@/components/ui/index';
import FileUpload from '@/components/ui/FileUpload';

export interface AdminLesson {
  id: string;
  title: string;
  videoUrl: string;
  description: string | null;
  duration: number;
  isFree: boolean;
  notes: string | null;
  quizUrl: string | null;
  order: number;
}

const emptyLesson = { title: '', videoUrl: '', description: '', duration: 0, isFree: false, notes: '', quizUrl: '' };

export default function LessonManager({ courseId, initialLessons }: { courseId: string; initialLessons: AdminLesson[] }) {
  const [lessons, setLessons] = useState<AdminLesson[]>(initialLessons.sort((a, b) => a.order - b.order));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyLesson);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startCreate = () => {
    setForm(emptyLesson);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (lesson: AdminLesson) => {
    setForm({
      title: lesson.title,
      videoUrl: lesson.videoUrl,
      description: lesson.description || '',
      duration: lesson.duration,
      isFree: lesson.isFree,
      notes: lesson.notes || '',
      quizUrl: lesson.quizUrl || ''
    });
    setEditingId(lesson.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/lessons/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, duration: Number(form.duration) })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update lesson.');
        setLessons((prev) => prev.map((l) => (l.id === editingId ? data.lesson : l)));
      } else {
        const res = await fetch('/api/admin/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, duration: Number(form.duration), courseId, order: lessons.length })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create lesson.');
        setLessons((prev) => [...prev, data.lesson]);
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async (id: string) => {
    if (!confirm('Delete this lesson? Student progress for it will be removed too.')) return;
    try {
      const res = await fetch(`/api/admin/lessons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete lesson.');
      setLessons((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= lessons.length) return;

    const reordered = [...lessons];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const withOrder = reordered.map((l, i) => ({ ...l, order: i }));
    setLessons(withOrder);

    try {
      await fetch('/api/admin/lessons/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: withOrder.map((l) => ({ id: l.id, order: l.order })) })
      });
    } catch {
      setError('Failed to save new lesson order.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-cf-gold">Lessons</h2>
        <Button variant="outline" className="!px-4 !py-2 text-xs" onClick={startCreate}>
          + Add Lesson
        </Button>
      </div>

      {error && <p className="text-xs text-cf-red">{error}</p>}

      {lessons.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-cf-charcoal2 p-6 text-center text-sm text-white/40">
          No lessons yet. Add the first one.
        </p>
      ) : (
        <ul className="space-y-2">
          {lessons.map((lesson, i) => (
            <li key={lesson.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-cf-charcoal2 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">#{i + 1}</span>
                  <span className="truncate text-sm font-medium">{lesson.title}</span>
                  {lesson.isFree && <Badge tone="green">Free</Badge>}
                  {lesson.quizUrl && <Badge tone="gold">Quiz</Badge>}
                </div>
                <p className="mt-0.5 truncate text-xs text-white/40">{lesson.videoUrl}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-white/50 hover:bg-white/10 disabled:opacity-30">
                  ↑
                </button>
                <button onClick={() => move(i, 1)} disabled={i === lessons.length - 1} className="rounded p-1.5 text-white/50 hover:bg-white/10 disabled:opacity-30">
                  ↓
                </button>
                <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => startEdit(lesson)}>
                  Edit
                </Button>
                <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => deleteLesson(lesson.id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-cf-gold/30 bg-cf-black/40 p-5">
          <h3 className="text-sm font-semibold text-cf-gold">{editingId ? 'Edit Lesson' : 'New Lesson'}</h3>
          <div>
            <Label htmlFor="lessonTitle">Title</Label>
            <Input id="lessonTitle" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input
              id="videoUrl"
              required
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://…/lesson.mp4"
            />
            <div className="mt-2">
              <FileUpload
                kind="video"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                label="Upload video file instead"
                onUploaded={(url) => setForm((f) => ({ ...f, videoUrl: url }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="lessonDescription">Description</Label>
            <Textarea id="lessonDescription" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="quizUrl">Quiz link</Label>
            <Input
              id="quizUrl"
              value={form.quizUrl}
              onChange={(e) => setForm({ ...form, quizUrl: e.target.value })}
              placeholder="https://…/quiz.html (paste a published/hosted quiz link)"
            />
            <div className="mt-2">
              <FileUpload
                kind="quiz"
                accept="text/html,.html"
                label="Upload quiz HTML file instead"
                onUploaded={(url) => setForm((f) => ({ ...f, quizUrl: url }))}
              />
            </div>
            <p className="mt-1 text-xs text-white/40">
              Leave blank for lessons without a quiz. Students see a &quot;Take Quiz&quot; button that opens this link.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                min={0}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
              />
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked })} />
              Free preview lesson
            </label>
          </div>
          <div className="flex gap-3">
            <Button type="submit" variant="gold" className="!px-5 !py-2 text-sm" loading={loading}>
              {editingId ? 'Save Lesson' : 'Add Lesson'}
            </Button>
            <Button type="button" variant="ghost" className="!px-5 !py-2 text-sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
