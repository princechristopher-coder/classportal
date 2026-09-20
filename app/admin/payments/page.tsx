'use client';

import { useEffect, useState } from 'react';
import { Card, Spinner, Badge } from '@/components/ui/index';

interface PaymentRow {
  id: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  reference: string;
  createdAt: string;
  user: { fullName: string; email: string };
  course: { title: string };
}

const statusTone: Record<string, 'green' | 'gold' | 'red'> = {
  SUCCESS: 'green',
  PENDING: 'gold',
  FAILED: 'red'
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/payments', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load payments.');
        return res.json();
      })
      .then((data) => setPayments(data.payments))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-cf-red">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Payments</h1>
        <p className="text-sm text-white/50">All payment attempts, ready for a real provider integration.</p>
      </div>

      {!payments ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-cf-charcoal2 p-12 text-center text-white/50">No payments yet.</div>
      ) : (
        <Card className="overflow-x-auto !p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <div className="font-medium">{p.user.fullName}</div>
                    <div className="text-xs text-white/40">{p.user.email}</div>
                  </td>
                  <td className="px-5 py-3 text-white/60">{p.course.title}</td>
                  <td className="px-5 py-3 text-white/60">${p.amount.toFixed(2)}</td>
                  <td className="px-5 py-3 font-mono text-xs text-white/40">{p.reference}</td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-white/40">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
