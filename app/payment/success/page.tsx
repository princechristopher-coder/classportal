'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button, Spinner, Badge } from '@/components/ui/index';

interface PaymentStatus {
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  course: { slug: string; title: string };
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Spinner /></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');

  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setError('Missing payment reference.');
      return;
    }
    fetch(`/api/payment/status?reference=${encodeURIComponent(reference)}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load payment status.');
        return res.json();
      })
      .then((data) => setPayment(data.payment))
      .catch((err) => setError(err.message));
  }, [reference]);

  return (
    <>
      <Navbar />
      <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
        {error && <p className="text-cf-red">{error}</p>}

        {!error && !payment && <Spinner />}

        {!error && payment && payment.status === 'SUCCESS' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-400">
              ✓
            </div>
            <h1 className="font-display text-2xl font-bold">Payment Successful</h1>
            <p className="mt-2 text-white/55">You now have full access to {payment.course.title}.</p>
            <Link href={`/courses/${payment.course.slug}`}>
              <Button variant="gold" className="mt-8 !px-8 !py-3">
                Continue Course
              </Button>
            </Link>
          </>
        )}

        {!error && payment && payment.status === 'PENDING' && (
          <>
            <Badge tone="gold">Pending</Badge>
            <h1 className="mt-4 font-display text-2xl font-bold">Payment Pending</h1>
            <p className="mt-2 text-white/55">
              We haven&apos;t received confirmation from the payment provider yet. This page will not grant access
              until the payment is confirmed.
            </p>
          </>
        )}

        {!error && payment && payment.status === 'FAILED' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cf-red/20 text-3xl text-cf-red">
              ✕
            </div>
            <h1 className="font-display text-2xl font-bold text-cf-red">Payment Failed</h1>
            <p className="mt-2 text-white/55">Your payment could not be completed. No enrollment was created.</p>
            <Link href="/courses">
              <Button variant="outline" className="mt-8 !px-8 !py-3">
                Back to Courses
              </Button>
            </Link>
          </>
        )}
      </section>
      <Footer />
    </>
  );
}
