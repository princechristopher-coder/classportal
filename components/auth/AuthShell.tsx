import Link from 'next/link';
import { SITE_NAME_PRIMARY, SITE_NAME_ACCENT, SITE_MONOGRAM } from '@/lib/site-config';

export default function AuthShell({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cf-radial px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-display text-xl font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cf-red to-cf-redDark text-sm text-white">
            {SITE_MONOGRAM}
          </span>
          {SITE_NAME_PRIMARY} <span className="text-gradient-gold">{SITE_NAME_ACCENT}</span>
        </Link>
        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-white/50">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <div className="mt-6 text-center text-sm text-white/50">{footer}</div>
      </div>
    </div>
  );
}
