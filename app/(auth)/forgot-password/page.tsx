'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import { Button, Input, Label, ErrorText, Spinner } from '@/components/ui/index';

function RequestResetForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [devNote, setDevNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setDevNote(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setMessage(data.message || "If an account exists with that email, we've sent a reset link.");
      if (data.devNote) setDevNote(data.devNote);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (message) {
    return (
      <div className="space-y-3 text-sm text-white/70">
        <p>{message}</p>
        {devNote && <p className="rounded-lg border border-cf-gold/30 bg-cf-gold/10 p-3 text-xs text-cf-gold">{devNote}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" variant="gold" className="w-full !py-3" loading={loading}>
        Send Reset Link
      </Button>
    </form>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-sm text-white/70">
        <p>Your password has been reset successfully.</p>
        <Link href="/login">
          <Button variant="gold" className="w-full !py-3">
            Go to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="password">New Password</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
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
      <Button type="submit" variant="gold" className="w-full !py-3" loading={loading}>
        Reset Password
      </Button>
    </form>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Spinner /></div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <AuthShell
      title={token ? 'Reset Your Password' : 'Forgot Password'}
      subtitle={token ? 'Choose a new password for your account.' : "We'll send you a link to reset your password."}
      footer={
        <>
          Remembered it?{' '}
          <Link href="/login" className="font-medium text-cf-gold hover:underline">
            Back to login
          </Link>
        </>
      }
    >
      {token ? <ResetPasswordForm token={token} /> : <RequestResetForm />}
    </AuthShell>
  );
}
