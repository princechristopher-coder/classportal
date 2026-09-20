'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button, Card, Spinner, Badge } from '@/components/ui/index';
import { useAuth } from '@/context/AuthContext';

interface CourseInfo {
  id: string;
  title: string;
  price: number;
  level: string;
  thumbnail: string | null;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Spinner /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const { user, loading: authLoading } = useAuth();

  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState<{ reference: string; checkoutUrl: string | null; providerConfigured: boolean } | null>(
    null
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=/checkout?courseId=${courseId}`);
    }
  }, [authLoading, user, router, courseId]);

  useEffect(() => {
    if (!courseId) return;
    // Course detail API is slug-keyed; fetch all published courses and find by id
    // (kept simple — checkout is always reached from a course page that has the id).
    fetch('/api/courses', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        const found = data.courses.find((c: any) => c.id === courseId);
        if (found) setCourse(found);
        else setError('Course not found.');
      })
      .catch(() => setError('Failed to load course.'));
  }, [courseId]);

  const startCheckout = async () => {
    if (!course) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout.');
      setCheckoutInfo({
        reference: data.payment.reference,
        checkoutUrl: data.checkoutUrl,
        providerConfigured: data.providerConfigured
      });

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const simulatePayment = async () => {
    if (!checkoutInfo) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/payment/mock-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: checkoutInfo.reference })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment simulation is not available.');
      router.push(`/payment/success?reference=${checkoutInfo.reference}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!courseId) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center text-white/60">No course selected for checkout.</div>
        <Footer />
      </>
    );
  }

  if (authLoading || !user) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center py-32">
          <Spinner />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold">Checkout</h1>
        <p className="mt-2 text-white/55">Review your order before proceeding to payment.</p>

        {error && <p className="mt-4 text-sm text-cf-red">{error}</p>}

        {!course ? (
          <div className="mt-10 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-[2fr_1fr]">
            <Card>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cf-gold">Order Summary</h2>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="font-medium">{course.title}</p>
                  <Badge tone="gold">{course.level}</Badge>
                </div>
                <p className="font-display text-lg font-bold">${course.price.toFixed(2)}</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-white/50">
                <span>Billed to</span>
                <span>{user.email}</span>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="font-semibold">Total</span>
                <span className="font-display text-xl font-bold text-cf-gold">${course.price.toFixed(2)}</span>
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cf-gold">Payment</h2>
              {!checkoutInfo ? (
                <Button variant="gold" className="w-full !py-3" loading={processing} onClick={startCheckout}>
                  Proceed to Payment
                </Button>
              ) : checkoutInfo.providerConfigured ? (
                <p className="text-sm text-white/60">Redirecting to payment provider…</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-white/50">
                    No live payment provider is configured on this server yet. Reference{' '}
                    <span className="font-mono text-cf-gold">{checkoutInfo.reference}</span> was created and is pending.
                  </p>
                  <Button variant="outline" className="w-full !py-3" loading={processing} onClick={simulatePayment}>
                    Simulate Successful Payment (Dev Only)
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
