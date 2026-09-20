'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, Input, Label, Button, ErrorText } from '@/components/ui/index';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, avatar: avatar || null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');
      await refresh();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl">
      <h2 className="font-display text-xl font-semibold">Profile</h2>
      <p className="mt-1 text-sm text-white/50">Manage your personal information.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email} disabled className="opacity-60" />
          <p className="mt-1 text-xs text-white/30">Email cannot be changed here.</p>
        </div>
        <div>
          <Label htmlFor="avatar">Avatar URL</Label>
          <Input id="avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
        </div>
        <ErrorText>{error}</ErrorText>
        {success && <p className="text-xs text-emerald-400">Profile updated.</p>}
        <Button type="submit" variant="gold" loading={loading}>
          Save Changes
        </Button>
      </form>
    </Card>
  );
}
