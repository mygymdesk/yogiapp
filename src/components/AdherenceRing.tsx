import { motion } from "framer-motion";

/** Single combined adherence ring (Apple Watch style). 0–100. */
export function AdherenceRing({ value = 0 }: { value?: number }) {
  const size = 200;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FAFAFA" />
            <stop offset="100%" stopColor="#A1A1AA" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="text-text-primary leading-none"
          style={{ fontFamily: "Fraunces, ui-serif, Georgia, serif", fontSize: 56 }}
        >
          {pct}
          <span className="text-text-muted text-[20px] align-top ml-0.5">%</span>
        </div>
        <div className="text-[11px] uppercase tracking-[0.16em] text-text-muted mt-1">
          Adherence
        </div>
      </div>
    </div>
  );
}
