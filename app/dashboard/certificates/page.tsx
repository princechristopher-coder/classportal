'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Spinner, Button, Badge } from '@/components/ui/index';

interface CertificateItem {
  id: string;
  certificateNo: string;
  issuedAt: string;
  course: { title: string; level: string };
}

export default function DashboardCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/certificates', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load certificates.');
        return res.json();
      })
      .then((data) => setCertificates(data.certificates))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-cf-red">{error}</p>;
  if (!certificates) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-cf-charcoal2 p-12 text-center">
        <p className="text-white/50">Complete a course to earn your first certificate.</p>
        <Link href="/courses">
          <Button variant="gold" className="mt-4 !px-6 !py-2.5">
            Browse Courses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {certificates.map((cert) => (
        <Card key={cert.id}>
          <div className="flex items-start justify-between">
            <div>
              <Badge tone="gold">{cert.course.level}</Badge>
              <h3 className="mt-3 font-display text-lg font-semibold">{cert.course.title}</h3>
              <p className="mt-1 text-xs text-white/40">{cert.certificateNo}</p>
              <p className="mt-1 text-xs text-white/40">
                Issued {new Date(cert.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cf-gold/40 font-display text-lg text-cf-gold">
              🏆
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <Link href={`/certificates/${cert.id}`} className="flex-1">
              <Button variant="gold" className="w-full !py-2 text-xs">
                View Certificate
              </Button>
            </Link>
            <Link href={`/verify/${cert.certificateNo}`} className="flex-1">
              <Button variant="outline" className="w-full !py-2 text-xs">
                Verify
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
