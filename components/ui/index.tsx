'use client';

import clsx from 'clsx';
import { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Button({
  className,
  variant = 'primary',
  loading,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    primary: 'bg-cf-red text-white hover:bg-cf-redDark shadow-glow hover:shadow-none',
    gold: 'bg-gradient-to-r from-cf-gold to-cf-goldLight text-cf-black hover:shadow-goldGlow',
    outline: 'border border-cf-gold/50 text-cf-gold hover:bg-cf-gold/10',
    ghost: 'text-cf-white/80 hover:text-cf-white hover:bg-white/5',
    danger: 'bg-red-900/80 text-white hover:bg-red-800'
  };
  return (
    <button className={clsx(base, variants[variant], className)} disabled={disabled || loading} {...props}>
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'w-full rounded-md border border-white/10 bg-cf-charcoal2 px-4 py-2.5 text-sm text-cf-white placeholder:text-white/30 outline-none transition focus:border-cf-gold/60 focus:ring-1 focus:ring-cf-gold/40',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        'w-full rounded-md border border-white/10 bg-cf-charcoal2 px-4 py-2.5 text-sm text-cf-white placeholder:text-white/30 outline-none transition focus:border-cf-gold/60 focus:ring-1 focus:ring-cf-gold/40',
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={clsx('mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50', className)} {...props} />;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx('glass rounded-xl p-6', className)}>{children}</div>;
}

export function Badge({
  children,
  tone = 'gold'
}: {
  children: React.ReactNode;
  tone?: 'gold' | 'red' | 'green' | 'gray';
}) {
  const tones: Record<string, string> = {
    gold: 'bg-cf-gold/15 text-cf-gold border-cf-gold/30',
    red: 'bg-cf-red/15 text-cf-red border-cf-red/30',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    gray: 'bg-white/10 text-white/60 border-white/20'
  };
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={clsx('inline-block h-6 w-6 animate-spin rounded-full border-2 border-cf-gold/30 border-t-cf-gold', className)} />;
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-cf-red">{children}</p>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cf-red to-cf-gold transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
