'use client';

import { QRCodeCanvas } from 'qrcode.react';

export interface CertificateData {
  certificateNo: string;
  issuedAt: string;
  studentName: string;
  courseTitle: string;
  courseLevel: string;
}

const GOLD = '#c9a13b';
const GOLD_DARK = '#9c7a24';
const INK = '#1a1a1c';
const RED = '#8f1229';

function GoldLineDiamond({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="h-px w-10 sm:w-16" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
      <span className="h-1.5 w-1.5 rotate-45" style={{ background: GOLD }} />
      <span className="h-px w-10 sm:w-16" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
    </div>
  );
}

function CornerFlourish({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const rotation = { tl: 0, tr: 90, bl: 270, br: 180 }[position];
  const pos = {
    tl: 'top-2 left-2 sm:top-3 sm:left-3',
    tr: 'top-2 right-2 sm:top-3 sm:right-3',
    bl: 'bottom-2 left-2 sm:bottom-3 sm:left-3',
    br: 'bottom-2 right-2 sm:bottom-3 sm:right-3'
  }[position];

  return (
    <svg
      viewBox="0 0 120 120"
      className={`pointer-events-none absolute ${pos} h-14 w-14 sm:h-24 sm:w-24`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <g fill="none" stroke={GOLD} strokeWidth="1.4">
        <path d="M4 4 L46 4" />
        <path d="M4 4 L4 46" />
        <path d="M4 16 Q4 4 16 4" strokeWidth="1" />
        <path d="M14 4 C 40 4, 50 10, 56 30 C 60 44, 70 54, 90 56" strokeLinecap="round" />
        <path d="M4 14 C 4 40, 10 50, 30 56 C 44 60, 54 70, 56 90" strokeLinecap="round" />
        <circle cx="56" cy="30" r="2.4" fill={GOLD} stroke="none" />
        <circle cx="30" cy="56" r="2.4" fill={GOLD} stroke="none" />
        <circle cx="90" cy="56" r="2" fill={GOLD} stroke="none" />
        <circle cx="56" cy="90" r="2" fill={GOLD} stroke="none" />
        <path d="M20 20 Q30 8 46 12" strokeWidth="0.8" opacity="0.7" />
      </g>
    </svg>
  );
}

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center sm:h-11 sm:w-11">
        <div className="absolute inset-0 rotate-45 rounded-md" style={{ background: INK }} />
        <div
          className="absolute bottom-0 right-0 h-5 w-5 translate-x-1 translate-y-1 rotate-45 rounded-sm sm:h-6 sm:w-6"
          style={{ background: RED }}
        />
        <span className="relative font-display text-xs font-bold text-white sm:text-sm">CF</span>
      </div>
      <div className="text-left leading-none">
        <div className="font-display text-sm font-extrabold tracking-tight sm:text-lg">
          <span style={{ color: INK }}>CODE</span>
          <span style={{ color: RED }}>FORGE</span>
        </div>
        <div className="mt-0.5 text-[7px] font-bold tracking-[0.35em] sm:text-[9px]" style={{ color: INK }}>
          ACADEMY
        </div>
      </div>
    </div>
  );
}

function LaurelWreath() {
  const leaves = (side: 1 | -1) =>
    Array.from({ length: 9 }).map((_, i) => {
      const theta = 0.15 + (i / 8) * 2.3; // radians, bottom (0) to upper-side (~132deg)
      const R = 40;
      const cx = 50 + side * Math.sin(theta) * R;
      const cy = 86 - R * (1 - Math.cos(theta));
      const rotationDeg = side * (theta * (180 / Math.PI)) * -1 + 90;
      const scale = 0.75 + (i / 8) * 0.35;
      return (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={7.5 * scale}
          ry={3.4 * scale}
          fill={GOLD}
          opacity={0.9}
          transform={`rotate(${rotationDeg} ${cx} ${cy})`}
        />
      );
    });

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <circle cx="50" cy="50" r="47" fill="none" stroke={GOLD} strokeWidth="0.8" strokeDasharray="1.5 2" opacity="0.5" />
      {leaves(-1)}
      {leaves(1)}
      <g transform="translate(50 18)">
        <path d="M-9 1.5 L0 -3.5 L9 1.5 L0 5 Z" fill={GOLD} />
        <path d="M-3.5 5 L3.5 5 L2.6 9.5 L-2.6 9.5 Z" fill={GOLD} />
        <circle cx="7" cy="1.5" r="1" fill={GOLD} />
        <path d="M7 1.5 L7 6" stroke={GOLD} strokeWidth="0.8" />
      </g>
      <text x="50" y="46" textAnchor="middle" fontSize="6.6" fontWeight="700" fill={GOLD_DARK} letterSpacing="0.4">
        COMMITMENT
      </text>
      <text x="50" y="56" textAnchor="middle" fontSize="6.6" fontWeight="700" fill={GOLD_DARK} letterSpacing="0.4">
        DISCIPLINE
      </text>
      <text x="50" y="66" textAnchor="middle" fontSize="6.6" fontWeight="700" fill={GOLD_DARK} letterSpacing="0.4">
        EXCELLENCE
      </text>
    </svg>
  );
}

function SealMedallion() {
  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 120 120" className="h-20 w-20 sm:h-28 sm:w-28">
        <defs>
          <radialGradient id="sealFill" cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#f6e2a0" />
            <stop offset="55%" stopColor={GOLD} />
            <stop offset="100%" stopColor={GOLD_DARK} />
          </radialGradient>
        </defs>

        {Array.from({ length: 30 }).map((_, i) => {
          const a = (i / 30) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={60 + Math.cos(a) * 54}
              cy={60 + Math.sin(a) * 54}
              r="3.2"
              fill={GOLD}
              opacity={i % 2 === 0 ? 1 : 0.55}
            />
          );
        })}

        <circle cx="60" cy="60" r="44" fill="url(#sealFill)" stroke={GOLD_DARK} strokeWidth="1.5" />
        <circle cx="60" cy="60" r="37" fill="none" stroke="#fff8e6" strokeWidth="1" opacity="0.65" />

        <text x="60" y="30" textAnchor="middle" fontSize="7.2" fontWeight="800" letterSpacing="0.6" fill="#3a2a06">
          CODEFORGE
        </text>
        <text x="60" y="38" textAnchor="middle" fontSize="7.2" fontWeight="800" letterSpacing="0.6" fill="#3a2a06">
          ACADEMY
        </text>

        <g transform="translate(60 60)">
          <path d="M-14 6 L-6 -10 L6 -10 L14 6 L6 12 L-6 12 Z" fill="none" stroke="#3a2a06" strokeWidth="1.3" opacity="0.8" />
          <text x="0" y="6" textAnchor="middle" fontSize="15" fontWeight="800" fill="#3a2a06">
            CF
          </text>
        </g>

        <text x="60" y="88" textAnchor="middle" fontSize="6.6" fontWeight="800" letterSpacing="1.2" fill="#3a2a06">
          OFFICIAL SEAL
        </text>
      </svg>

      <svg viewBox="0 0 60 46" className="-mt-2 h-9 w-11 sm:h-12 sm:w-16">
        <path d="M14 0 L30 8 L46 0 L38 30 L30 20 L22 30 Z" fill={RED} />
        <path d="M14 0 L30 8 L46 0 L44 6 L30 12 L16 6 Z" fill={GOLD} opacity="0.85" />
      </svg>
    </div>
  );
}

export default function CertificateTemplate({ data, verifyUrl }: { data: CertificateData; verifyUrl: string }) {
  const issuedDate = new Date(data.issuedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div
      id="certificate-print-root"
      className="relative mx-auto aspect-[297/210] w-full max-w-[1100px] overflow-hidden shadow-2xl"
      style={{ background: '#fdf9ee' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(200,30,58,0.04), transparent 45%), radial-gradient(circle at 80% 85%, rgba(212,175,55,0.08), transparent 45%)'
        }}
      />

      <div className="absolute inset-[10px] border-[3px] sm:inset-4 sm:border-[5px]" style={{ borderColor: GOLD }} />
      <div className="absolute inset-[16px] border sm:inset-6" style={{ borderColor: `${GOLD}99` }} />
      <div className="absolute inset-[20px] border border-dashed opacity-40 sm:inset-7" style={{ borderColor: GOLD }} />

      <CornerFlourish position="tl" />
      <CornerFlourish position="tr" />
      <CornerFlourish position="bl" />
      <CornerFlourish position="br" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035]">
        <span className="font-display text-[16vw] font-bold tracking-widest" style={{ color: RED }}>
          CFA
        </span>
      </div>

      <div className="relative flex h-full flex-col items-center px-[9%] pb-[4%] pt-[4.5%] text-center sm:px-[10%]">
        <div className="flex w-full items-start justify-between">
          <LogoMark />
          <div className="text-right">
            <p className="text-[7px] font-bold tracking-[0.25em] sm:text-[10px]" style={{ color: RED }}>
              LEARN&nbsp;&nbsp;&bull;&nbsp;&nbsp;BUILD&nbsp;&nbsp;&bull;&nbsp;&nbsp;INNOVATE
            </p>
            <GoldLineDiamond className="mt-1.5 justify-end" />
          </div>
        </div>

        <div className="mt-[2.5%]">
          <h1
            className="font-display text-[9.5vw] font-bold leading-none tracking-wide sm:text-[84px]"
            style={{ color: INK }}
          >
            CERTIFICATE
          </h1>
          <p className="mt-1.5 text-[10px] font-bold tracking-[0.5em] sm:text-base" style={{ color: RED }}>
            OF COMPLETION
          </p>
          <GoldLineDiamond className="mx-auto mt-2.5 justify-center" />
        </div>

        <p className="mt-[3%] text-[8.5px] tracking-[0.3em] text-black/50 sm:text-sm">
          THIS CERTIFICATE IS PROUDLY PRESENTED TO
        </p>

        <h2 className="font-script mt-1.5 text-[10vw] leading-none sm:text-7xl" style={{ color: RED }}>
          {data.studentName}
        </h2>

        <GoldLineDiamond className="mx-auto mt-3 justify-center" />

        <p className="mt-[2.5%] text-[8.5px] tracking-[0.25em] text-black/50 sm:text-sm">
          FOR SUCCESSFULLY COMPLETING THE COURSE
        </p>
        <h3 className="mt-1.5 font-display text-[3.6vw] font-bold sm:text-3xl" style={{ color: INK }}>
          {data.courseTitle}
        </h3>

        <div className="mt-3 flex items-center gap-3 sm:mt-4 sm:gap-4">
          <span className="h-px w-8 sm:w-16" style={{ background: GOLD }} />
          <span
            className="px-4 py-1.5 text-[8.5px] font-bold tracking-[0.2em] text-white sm:px-7 sm:py-2 sm:text-sm"
            style={{
              background: RED,
              clipPath: 'polygon(4% 0, 96% 0, 100% 50%, 96% 100%, 4% 100%, 0 50%)'
            }}
          >
            {data.courseLevel} LEVEL
          </span>
          <span className="h-px w-8 sm:w-16" style={{ background: GOLD }} />
        </div>

        <p className="mx-auto mt-[3%] max-w-lg text-[7.5px] leading-relaxed text-black/55 sm:text-xs">
          And has demonstrated exceptional dedication, consistent effort, and a strong understanding of the
          concepts and practical skills required to excel in this domain.
        </p>

        <div className="pointer-events-none absolute left-[3%] top-[34%] h-[26%] w-[19%] sm:left-[4%]">
          <LaurelWreath />
        </div>
        <div className="absolute right-[3%] top-[36%] flex w-[14%] flex-col items-center gap-2 sm:right-[4%]">
          <div className="border bg-white/70 p-1.5" style={{ borderColor: GOLD }}>
            <QRCodeCanvas value={verifyUrl} size={64} bgColor="#ffffff" fgColor="#141416" includeMargin={false} />
          </div>
          <p className="text-[6.5px] font-bold leading-tight tracking-wide sm:text-[9px]" style={{ color: INK }}>
            SCAN TO VERIFY
            <br />
            THIS CERTIFICATE
          </p>
        </div>

        <div className="mt-auto grid w-full grid-cols-3 items-end pt-[3%]">
          <div className="text-left">
            <p className="font-script text-lg sm:text-2xl" style={{ color: INK }}>
              A. Forge
            </p>
            <div className="mt-1 h-px w-24 sm:w-32" style={{ background: `${INK}55` }} />
            <p className="mt-1 text-[7px] font-bold tracking-wider sm:text-[10px]" style={{ color: RED }}>
              FOUNDER &amp; CEO
            </p>
            <p className="text-[7px] font-bold tracking-wider sm:text-[10px]" style={{ color: INK }}>
              CODEFORGE ACADEMY
            </p>
          </div>

          <div className="flex justify-center">
            <SealMedallion />
          </div>

          <div className="text-right">
            <p className="text-[7px] font-bold tracking-wider text-black/50 sm:text-[10px]">CERTIFICATE NO.</p>
            <p className="font-display text-[10px] font-bold sm:text-sm" style={{ color: RED }}>
              {data.certificateNo}
            </p>
            <p className="mt-1.5 text-[7px] font-bold tracking-wider text-black/50 sm:text-[10px]">DATE ISSUED</p>
            <p className="text-[9px] font-semibold sm:text-xs" style={{ color: INK }}>
              {issuedDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
