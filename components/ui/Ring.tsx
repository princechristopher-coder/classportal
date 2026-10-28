import clsx from 'clsx';

/** Circular progress ring with a glowing arc. `value` is 0-100. */
export function Ring({
  value,
  size = 64,
  stroke = 6,
  tone = 'aqua',
  className,
  children
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: 'aqua' | 'coral' | 'mint';
  className?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const gid = `ring-${tone}-${size}`;
  const colors = {
    aqua: ['#5ce1e6', '#8f7bff', 'rgba(92,225,230,0.7)'],
    coral: ['#ffb08a', '#ff7f8f', 'rgba(255,143,122,0.7)'],
    mint: ['#62e6a8', '#5ce1e6', 'rgba(98,230,168,0.7)']
  }[tone];
  return (
    <div className={clsx('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90 overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={colors[0]} />
            <stop offset="1" stopColor={colors[1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ filter: `drop-shadow(0 0 8px ${colors[2]})`, transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}
