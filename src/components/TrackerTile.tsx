import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { MiniRing } from "./MiniRing";
import { haptic } from "@/lib/feedback";

type AccentKey = "diet" | "med" | "water" | "walk" | "weight" | "mood";

const accentVar: Record<AccentKey, string> = {
  diet: "var(--acc-diet)",
  med: "var(--acc-med)",
  water: "var(--acc-water)",
  walk: "var(--acc-walk)",
  weight: "var(--acc-weight)",
  mood: "var(--acc-mood)",
};

type Props = {
  icon: LucideIcon;
  label: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  accent: AccentKey;
  onClick?: () => void;
  to?: string; // navigate to detail route
  ringValue?: number;
  trailing?: React.ReactNode;
};

export function TrackerTile(props: Props) {
  const { icon: Icon, label, primary, secondary, accent, onClick, to, ringValue, trailing } = props;
  const color = accentVar[accent];

  const inner = (
    <div className="flex items-center gap-4">
      {ringValue !== undefined ? (
        <div className="size-11 relative flex items-center justify-center">
          <MiniRing value={ringValue} color={color} size={44} stroke={3} />
          <Icon size={16} strokeWidth={2} className="absolute" style={{ color }} />
        </div>
      ) : (
        <div
          className="size-11 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${color}1a` }}
        >
          <Icon size={20} strokeWidth={2} style={{ color }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-[0.12em] text-text-muted font-medium">
          {label}
        </div>
        <div
          className="text-text-primary text-[20px] leading-tight mt-0.5 truncate"
          style={{ fontFamily: "Fraunces, ui-serif, Georgia, serif" }}
        >
          {primary}
        </div>
        {secondary && (
          <div className="text-[12px] text-text-secondary mt-0.5 truncate">{secondary}</div>
        )}
      </div>
      {trailing}
    </div>
  );

  const className =
    "w-full text-left bg-bg-surface border border-border rounded-[20px] p-4 active:border-border-hover/40 active:bg-bg-elevated/40 block transition-colors";

  if (to) {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.7 }}
      >
        <Link
          to={to}
          onClick={() => haptic()}
          aria-label={label}
          className={className}
        >
          {inner}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={() => {
        if (onClick) {
          haptic();
          onClick();
        }
      }}
      aria-label={label}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.7 }}
      className={className}
    >
      {inner}
    </motion.button>
  );
}
