'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Input, Button, Card } from '@/components/ui/index';

export default function VerifyIndexPage() {
  const router = useRouter();
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    router.push(`/verify/${encodeURIComponent(value.trim())}`);
  };

  return (
    <>
      <Navbar />
      <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-display text-3xl font-bold">
          Verify a <span className="text-gradient-gold">Certificate</span>
        </h1>
        <p className="mt-3 text-white/55">
          Enter a ClassPortal certificate number to confirm its authenticity — no account needed.
        </p>
        <Card className="mt-8 w-full">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="CFA-2026-000001"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="gold" className="!px-6">
              Verify
            </Button>
          </form>
        </Card>
      </section>
      <Footer />
    </>
  );
}
