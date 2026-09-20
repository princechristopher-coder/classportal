import Link from 'next/link';
import { SITE_NAME, SITE_NAME_PRIMARY, SITE_NAME_ACCENT, SITE_MONOGRAM, SITE_TAGLINE } from '@/lib/site-config';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-cf-black">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cf-red to-cf-redDark text-xs text-white">
                {SITE_MONOGRAM}
              </span>
              {SITE_NAME_PRIMARY} <span className="text-gradient-gold">{SITE_NAME_ACCENT}</span>
            </div>
            <p className="mt-3 text-sm text-white/50">{SITE_TAGLINE}</p>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-cf-gold">Class</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/courses" className="hover:text-white">Browse Classes</Link></li>
              <li><Link href="/signup" className="hover:text-white">Create Account</Link></li>
              <li><Link href="/verify" className="hover:text-white">Verify a Certificate</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-cf-gold">Account</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/login" className="hover:text-white">Log In</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              <li><Link href="/forgot-password" className="hover:text-white">Forgot Password</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-cf-gold">{SITE_NAME}</h4>
            <p className="text-sm text-white/50">Everything for the class in one place.</p>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/40 md:flex-row">
          <span>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</span>
          <span>Built on a black · red · gold identity.</span>
        </div>
      </div>
    </footer>
  );
}
