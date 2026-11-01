import type { Metadata } from 'next';
import { Unbounded, Manrope, Dancing_Script, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/site-config';

const playfair = Unbounded({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display'
});

const inter = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans'
});

const playfairCert = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-cert'
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-script'
});

export const metadata: Metadata = {
  title: `${SITE_NAME} — Class Lessons & Quizzes`,
  description: SITE_DESCRIPTION
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${dancingScript.variable} ${playfairCert.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
