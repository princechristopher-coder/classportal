'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SITE_NAME, SITE_MONOGRAM } from '@/lib/site-config';

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

/**
 * Phone-sized replacement for the sidebar: a bar showing the current section
 * that drops down a list of links when tapped. Hidden on md screens and up,
 * where the normal sidebar is shown instead.
 */
export default function MobileNavMenu({
  items,
  rootHref,
  heading
}: {
  items: NavItem[];
  /** The section's home link (e.g. /admin) — it is only "active" on an exact match. */
  rootHref: string;
  heading?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => pathname === href || (href !== rootHref && pathname.startsWith(`${href}/`));
  const current = items.find((i) => isActive(i.href));

  // Close after navigating to another page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close when tapping outside or pressing Escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative mb-6 md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-cf-charcoal2 px-4 py-3 text-sm font-medium"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-cf-red to-cf-redDark text-[10px] text-white">
            {SITE_MONOGRAM}
          </span>
          <span className="text-cf-gold">{current?.label ?? heading ?? 'Menu'}</span>
        </span>
        <span className={`text-[10px] text-white/60 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden>
          ▼
        </span>
      </button>

      {open && (
        <nav
          role="menu"
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-cf-charcoal p-2 shadow-2xl"
        >
          {heading && <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-widest text-cf-gold/70">{heading}</p>}
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                isActive(item.href) ? 'bg-cf-gold/10 text-cf-gold' : 'text-white/70 active:bg-white/5'
              }`}
            >
              <span className="w-4 text-center text-xs">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-white/10" />
          <Link
            href="/"
            role="menuitem"
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white/50 active:bg-white/5"
          >
            <span className="w-4 text-center text-xs">⌂</span>
            {SITE_NAME} home
          </Link>
        </nav>
      )}
    </div>
  );
}
