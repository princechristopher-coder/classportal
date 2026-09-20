'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Spinner, Badge } from '@/components/ui/index';

interface VerifyResult {
  valid: boolean;
  certificate?: {
    certificateNo: string;
    issuedAt: string;
    studentName: string;
    courseTitle: string;
    courseLevel: string;
  };
}

export default function VerifyCertificatePage() {
  const { certificateNo } = useParams<{ certificateNo: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/verify/${certificateNo}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Verification failed.');
        return res.json();
      })
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [certificateNo]);

  return (
    <>
      <Navbar />
      <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        {error && <p className="text-cf-red">{error}</p>}

        {!error && !result && <Spinner />}

        {!error && result && result.valid && result.certificate && (
          <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-400">
              ✓
            </div>
            <h1 className="font-display text-2xl font-bold text-emerald-400">VALID CERTIFICATE</h1>
            <p className="mt-2 text-sm text-white/50">Issued and verified by ClassPortal</p>

            <div className="mt-8 space-y-3 rounded-xl border border-white/10 bg-cf-charcoal2 p-6 text-left">
              <Row label="Student Name" value={result.certificate.studentName} />
              <Row label="Course" value={result.certificate.courseTitle} />
              <Row label="Level" value={<Badge tone="gold">{result.certificate.courseLevel}</Badge>} />
              <Row label="Certificate No." value={result.certificate.certificateNo} />
              <Row
                label="Issued"
                value={new Date(result.certificate.issuedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              />
            </div>
          </div>
        )}

        {!error && result && !result.valid && (
          <div className="w-full rounded-2xl border border-cf-red/30 bg-cf-red/5 p-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cf-red/20 text-2xl text-cf-red">
              ✕
            </div>
            <h1 className="font-display text-2xl font-bold text-cf-red">INVALID CERTIFICATE</h1>
            <p className="mt-3 text-sm text-white/50">
              We could not find a certificate matching <span className="font-mono text-white/70">{certificateNo}</span>.
              Double-check the certificate number and try again.
            </p>
          </div>
        )}

        <Link href="/verify" className="mt-8 text-sm text-cf-gold hover:underline">
          Verify a different certificate
        </Link>
      </section>
      <Footer />
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <span className="text-xs uppercase tracking-wider text-white/40">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
