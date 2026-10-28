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
    <div ref={ref} className="sticky top-3 z-40 mx-auto mb-6 w-full max-w-[420px] md:hidden">
      <div className="island" data-open={open}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6ceaee] to-[#8f7bff] text-[10px] font-bold text-[#061029]">
              {SITE_MONOGRAM}
            </span>
            <span className="text-cf-gold">{current?.label ?? heading ?? 'Menu'}</span>
          </span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[9px] text-white/80 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            aria-hidden
          >
            ▼
          </span>
        </button>

        <div className="island-body">
          <div>
            <nav role="menu" className="max-h-[65vh] overflow-y-auto px-2 pb-2">
              {heading && <p className="px-3 pb-1 pt-1 text-[11px] font-semibold text-cf-gold/70">{heading}</p>}
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                    isActive(item.href) ? 'bg-cf-gold/15 text-cf-gold' : 'text-white/75 active:bg-white/10'
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
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-white/55 active:bg-white/10"
              >
                <span className="w-4 text-center text-xs">⌂</span>
                {SITE_NAME} home
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
