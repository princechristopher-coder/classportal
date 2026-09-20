'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Label, Textarea, Button, ErrorText } from '@/components/ui/index';
import FileUpload from '@/components/ui/FileUpload';

export interface CourseFormValues {
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  price: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  published: boolean;
}

const defaultValues: CourseFormValues = {
  title: '',
  slug: '',
  description: '',
  thumbnail: '',
  price: 0,
  level: 'BEGINNER',
  published: false
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function CourseForm({
  initial,
  mode
}: {
  initial?: Partial<CourseFormValues>;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [values, setValues] = useState<CourseFormValues>({ ...defaultValues, ...initial });
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (patch: Partial<CourseFormValues>) => setValues((v) => ({ ...v, ...patch }));

  const handleTitleChange = (title: string) => {
    update({ title, slug: slugTouched ? values.slug : slugify(title) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...values,
        price: Number(values.price),
        thumbnail: values.thumbnail || null
      };

      const res = await fetch(mode === 'create' ? '/api/courses' : `/api/courses/${initial?.slug}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save course.');

      router.push(`/admin/courses/${data.course.slug}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" required value={values.title} onChange={(e) => handleTitleChange(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          required
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            update({ slug: slugify(e.target.value) });
          }}
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" required rows={4} value={values.description} onChange={(e) => update({ description: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="thumbnail">Thumbnail URL</Label>
        <Input id="thumbnail" value={values.thumbnail} onChange={(e) => update({ thumbnail: e.target.value })} placeholder="https://…" />
        <div className="mt-2">
          <FileUpload
            kind="image"
            accept="image/png,image/jpeg,image/webp,image/gif"
            label="Upload thumbnail image instead"
            onUploaded={(url) => update({ thumbnail: url })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            id="price"
            type="number"
            min={0}
            step="0.01"
            value={values.price}
            onChange={(e) => update({ price: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="level">Level</Label>
          <select
            id="level"
            value={values.level}
            onChange={(e) => update({ level: e.target.value as CourseFormValues['level'] })}
            className="w-full rounded-md border border-white/10 bg-cf-charcoal2 px-4 py-2.5 text-sm text-cf-white outline-none focus:border-cf-gold/60"
          >
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" checked={values.published} onChange={(e) => update({ published: e.target.checked })} />
        Published (visible to students)
      </label>

      <ErrorText>{error}</ErrorText>
      <Button type="submit" variant="gold" loading={loading}>
        {mode === 'create' ? 'Create Course' : 'Save Changes'}
      </Button>
    </form>
  );
}
