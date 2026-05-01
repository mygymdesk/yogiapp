import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";

type AccentKey = "diet" | "med" | "water" | "walk" | "weight" | "mood";

const accentClass: Record<AccentKey, string> = {
  diet: "text-acc-diet",
  med: "text-acc-med",
  water: "text-acc-water",
  walk: "text-acc-walk",
  weight: "text-acc-weight",
  mood: "text-acc-mood",
};

const accentBgClass: Record<AccentKey, string> = {
  diet: "bg-acc-diet/10",
  med: "bg-acc-med/10",
  water: "bg-acc-water/10",
  walk: "bg-acc-walk/10",
  weight: "bg-acc-weight/10",
  mood: "bg-acc-mood/10",
};

export function TrackerTile({
  icon: Icon,
  label,
  primary,
  secondary,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  primary: string;
  secondary?: string;
  accent: AccentKey;
}) {
  return (
    <Card onClick={() => {}}>
      <div className="flex items-center gap-4">
        <div
          className={`size-11 rounded-2xl flex items-center justify-center ${accentBgClass[accent]}`}
        >
          <Icon size={20} className={accentClass[accent]} strokeWidth={2} />
        </div>
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
      </div>
    </Card>
  );
}
