'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/index';
import MobileNavMenu from '@/components/layout/MobileNavMenu';
import { SITE_NAME, SITE_MONOGRAM } from '@/lib/site-config';

const navItems = [
  { href: '/admin', label: 'Analytics', icon: '◆' },
  { href: '/admin/users', label: 'Users', icon: '☺' },
  { href: '/admin/courses', label: 'Courses', icon: '▤' },
  { href: '/admin/tests', label: 'Tests', icon: '✎' },
  { href: '/admin/results', label: 'Scores', icon: '★' },
  { href: '/admin/payments', label: 'Payments', icon: '$' }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?redirect=${pathname}`);
    } else if (user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [loading, user, pathname, router]);

  if (loading || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cf-black">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cf-black">
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-10">
        <aside className="hidden w-56 shrink-0 md:block">
          <Link href="/" className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cf-red to-cf-redDark text-xs text-white">
              {SITE_MONOGRAM}
            </span>
            {SITE_NAME}
          </Link>
          <p className="mb-6 text-xs uppercase tracking-widest text-cf-gold/70">Admin Panel</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  (pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))) ? 'bg-cf-gold/10 text-cf-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-xs">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white">
              <span className="text-xs">▸</span>
              Student Dashboard
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <MobileNavMenu
            rootHref="/admin"
            heading="Admin Panel"
            items={[...navItems, { href: '/dashboard', label: 'Student Dashboard', icon: '▸' }]}
          />
          {children}
        </main>
      </div>
    </div>
  );
}
