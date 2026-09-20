'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/index';
import MobileNavMenu from '@/components/layout/MobileNavMenu';
import { SITE_NAME, SITE_MONOGRAM } from '@/lib/site-config';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: '◆' },
  { href: '/dashboard/tests', label: 'Tests', icon: '✎' },
  { href: '/dashboard/certificates', label: 'Certificates', icon: '★' },
  { href: '/dashboard/profile', label: 'Profile', icon: '●' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙' }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect=${pathname}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
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
          <Link href="/" className="mb-8 flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cf-red to-cf-redDark text-xs text-white">
              {SITE_MONOGRAM}
            </span>
            {SITE_NAME}
          </Link>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) ? 'bg-cf-gold/10 text-cf-gold' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-xs">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <Link href="/courses" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white">
              <span className="text-xs">▸</span>
              Browse Courses
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <MobileNavMenu
            rootHref="/dashboard"
            heading="Student Dashboard"
            items={[...navItems, { href: '/courses', label: 'Browse Courses', icon: '▸' }]}
          />
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-white/40">Welcome back</p>
              <h1 className="font-display text-2xl font-bold">{user.fullName}</h1>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cf-red/20 font-display text-lg font-bold text-cf-gold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
