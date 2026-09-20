'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/index';
import { SITE_NAME_PRIMARY, SITE_NAME_ACCENT, SITE_MONOGRAM } from '@/lib/site-config';

const links = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Classes' },
  { href: '/verify', label: 'Verify Certificate' }
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-cf-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-wide">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cf-red to-cf-redDark text-sm text-white shadow-glow">
            {SITE_MONOGRAM}
          </span>
          <span>
            {SITE_NAME_PRIMARY} <span className="text-gradient-gold">{SITE_NAME_ACCENT}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition ${
                pathname === l.href ? 'text-cf-gold' : 'text-white/70 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {loading ? null : user ? (
            <>
              <Link href={user.role === 'ADMIN' ? '/admin' : '/dashboard'}>
                <Button variant="outline" className="!px-4 !py-2">
                  {user.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}
                </Button>
              </Link>
              <Button variant="ghost" className="!px-4 !py-2" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="!px-4 !py-2">
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="gold" className="!px-4 !py-2">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="text-white md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-cf-black px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-white/80" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-white/10" />
            {user ? (
              <>
                <Link href={user.role === 'ADMIN' ? '/admin' : '/dashboard'} className="text-sm font-medium text-cf-gold">
                  {user.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}
                </Link>
                <button onClick={logout} className="text-left text-sm font-medium text-white/60">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-white/80">
                  Log In
                </Link>
                <Link href="/signup" className="text-sm font-medium text-cf-gold">
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
