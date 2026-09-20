'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Card, Spinner } from '@/components/ui/index';

interface Analytics {
  totalUsers: number;
  totalStudents: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  totalCertificates: number;
  totalPayments: number;
  revenue: number;
  revenueByMonth: { label: string; revenue: number }[];
  topCourses: { title: string; enrollments: number }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load analytics.');
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-cf-red">{error}</p>;
  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: data.totalUsers },
    { label: 'Students', value: data.totalStudents },
    { label: 'Total Courses', value: data.totalCourses },
    { label: 'Published Courses', value: data.publishedCourses },
    { label: 'Enrollments', value: data.totalEnrollments },
    { label: 'Completed Courses', value: data.completedEnrollments },
    { label: 'Certificates Issued', value: data.totalCertificates },
    { label: 'Revenue', value: `$${data.revenue.toFixed(2)}` }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Platform Analytics</h1>
        <p className="text-sm text-white/50">A real-time overview of ClassPortal.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-xs uppercase tracking-wider text-white/40">{s.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-cf-gold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cf-gold">Revenue (Last 6 Months)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#1c1c1f', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8 }}
                  labelStyle={{ color: '#f8f7f4' }}
                />
                <Bar dataKey="revenue" fill="#d4af37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cf-gold">Top Courses by Enrollment</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topCourses} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis type="category" dataKey="title" width={120} stroke="rgba(255,255,255,0.4)" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: '#1c1c1f', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8 }}
                  labelStyle={{ color: '#f8f7f4' }}
                />
                <Bar dataKey="enrollments" fill="#c81e3a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
