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
    <header className="sticky top-0 z-50 px-3 pt-3 md:px-0 md:pt-0 md:border-b md:border-white/10 md:bg-cf-black/60 md:backdrop-blur-xl">
      <div className="mx-auto hidden max-w-7xl items-center justify-between px-6 py-4 md:flex">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-wide">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[#6ceaee] to-[#8f7bff] text-sm font-bold text-[#061029] shadow-glow">
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

      </div>

      {/* Phones: dynamic island */}
      <div className="mx-auto w-full max-w-[420px] md:hidden">
        <div className="island" data-open={open}>
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <Link href="/" className="flex min-w-0 items-center gap-2 font-display text-sm font-bold" onClick={() => setOpen(false)}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6ceaee] to-[#8f7bff] text-xs font-bold text-[#061029]">
                {SITE_MONOGRAM}
              </span>
              <span className="truncate">
                {SITE_NAME_PRIMARY} <span className="text-gradient-gold">{SITE_NAME_ACCENT}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-300 ${open ? 'rotate-90' : ''}`}>
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
          <div className="island-body">
            <div>
              <nav className="flex flex-col gap-1 px-3 pb-3 pt-1">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                      pathname === l.href ? 'bg-cf-gold/15 text-cf-gold' : 'text-white/80 active:bg-white/10'
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="my-1 h-px bg-white/10" />
                {user ? (
                  <>
                    <Link href={user.role === 'ADMIN' ? '/admin' : '/dashboard'} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-semibold text-cf-gold active:bg-white/10">
                      {user.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}
                    </Link>
                    <button onClick={logout} className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-white/60 active:bg-white/10">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-semibold text-white/80 active:bg-white/10">
                      Log In
                    </Link>
                    <Link href="/signup" onClick={() => setOpen(false)} className="rounded-2xl bg-gradient-to-br from-[#6ceaee] to-[#8f7bff] px-4 py-3 text-center text-sm font-bold text-[#061029]">
                      Get Started
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
