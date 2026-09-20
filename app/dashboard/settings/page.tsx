'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, Input, Label, Button, ErrorText } from '@/components/ui/index';

export default function SettingsPage() {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password.');
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-xl">
        <h2 className="font-display text-xl font-semibold">Change Password</h2>
        <p className="mt-1 text-sm text-white/50">Use a strong password you don&apos;t use elsewhere.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <ErrorText>{error}</ErrorText>
          {success && <p className="text-xs text-emerald-400">Password updated successfully.</p>}
          <Button type="submit" variant="gold" loading={loading}>
            Update Password
          </Button>
        </form>
      </Card>

      <Card className="max-w-xl">
        <h2 className="font-display text-xl font-semibold">Account</h2>
        <p className="mt-1 text-sm text-white/50">Sign out of ClassPortal on this device.</p>
        <Button variant="danger" className="mt-4" onClick={logout}>
          Log Out
        </Button>
      </Card>
    </div>
  );
}
