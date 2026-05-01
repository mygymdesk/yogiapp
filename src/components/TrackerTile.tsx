import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { MiniRing } from "./MiniRing";

type AccentKey = "diet" | "med" | "water" | "walk" | "weight" | "mood";

const accentVar: Record<AccentKey, string> = {
  diet: "var(--acc-diet)",
  med: "var(--acc-med)",
  water: "var(--acc-water)",
  walk: "var(--acc-walk)",
  weight: "var(--acc-weight)",
  mood: "var(--acc-mood)",
};

export function TrackerTile({
  icon: Icon,
  label,
  primary,
  secondary,
  accent,
  onClick,
  ringValue,
  trailing,
}: {
  icon: LucideIcon;
  label: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  accent: AccentKey;
  onClick?: () => void;
  ringValue?: number; // 0..100, shows mini ring instead of icon background
  trailing?: React.ReactNode;
}) {
  const color = accentVar[accent];
  return (
    <motion.button
      onClick={onClick}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
      className="w-full text-left bg-bg-surface border border-border rounded-[20px] p-4 active:border-border-hover/30"
    >
      <div className="flex items-center gap-4">
        {ringValue !== undefined ? (
          <div className="size-11 relative flex items-center justify-center">
            <MiniRing value={ringValue} color={color} size={44} stroke={3} />
            <Icon
              size={16}
              strokeWidth={2}
              className="absolute"
              style={{ color }}
            />
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
            <div className="text-[12px] text-text-secondary mt-0.5 truncate">
              {secondary}
            </div>
          )}
        </div>
        {trailing}
      </div>
    </motion.button>
  );
}
