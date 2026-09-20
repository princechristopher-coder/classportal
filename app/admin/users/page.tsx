'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, Input, Spinner, Badge, Button } from '@/components/ui/index';

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  createdAt: string;
  _count: { enrollments: number; certificates: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback((q: string) => {
    const url = q ? `/api/admin/users?search=${encodeURIComponent(q)}` : '/api/admin/users';
    fetch(url, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load users.');
        return res.json();
      })
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(search), 300);
    return () => clearTimeout(timeout);
  }, [search, load]);

  const toggleRole = async (u: AdminUser) => {
    const newRole = u.role === 'ADMIN' ? 'STUDENT' : 'ADMIN';
    setUpdatingId(u.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role.');
      load(search);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Users</h1>
          <p className="text-sm text-white/50">Manage student and admin accounts.</p>
        </div>
        <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      {error && <p className="text-sm text-cf-red">{error}</p>}

      {!users ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-cf-charcoal2 p-12 text-center text-white/50">No results found.</div>
      ) : (
        <Card className="overflow-x-auto !p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Enrollments</th>
                <th className="px-5 py-3">Certificates</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <Link href={`/admin/users/${u.id}`} className="font-medium hover:text-cf-gold">
                      {u.fullName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-white/60">{u.email}</td>
                  <td className="px-5 py-3">
                    <Badge tone={u.role === 'ADMIN' ? 'gold' : 'gray'}>{u.role}</Badge>
                  </td>
                  <td className="px-5 py-3 text-white/60">{u._count.enrollments}</td>
                  <td className="px-5 py-3 text-white/60">{u._count.certificates}</td>
                  <td className="px-5 py-3 text-white/40">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <Button
                      variant="outline"
                      className="!px-3 !py-1.5 text-xs"
                      loading={updatingId === u.id}
                      onClick={() => toggleRole(u)}
                    >
                      Make {u.role === 'ADMIN' ? 'Student' : 'Admin'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
