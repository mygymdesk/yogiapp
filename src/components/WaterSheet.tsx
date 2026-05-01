import { useState } from "react";
import { motion } from "framer-motion";
import { BottomSheet } from "./BottomSheet";
import { CountUp } from "./CountUp";
import { useTodayWater, DEFAULT_WATER_TARGET_ML } from "@/lib/trackers";
import { haptic, useToastStore } from "@/lib/feedback";
import { Plus, Minus } from "lucide-react";

const QUICK_ADDS = [250, 500, 1000];

export function WaterSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { totalMl, addWater } = useTodayWater();
  const target = DEFAULT_WATER_TARGET_ML;
  const pct = Math.min(100, (totalMl / target) * 100);
  const [custom, setCustom] = useState(300);
  const showToast = useToastStore((s) => s.show);

  const log = async (amt: number) => {
    haptic();
    const { error } = await addWater(amt);
    if (!error) showToast(`+${amt} ml logged`);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Water">
      <div className="flex flex-col items-center">
        {/* Liquid fill visual */}
        <div
          className="relative overflow-hidden rounded-[28px] border border-border bg-bg-elevated"
          style={{ width: 160, height: 240 }}
        >
          <motion.div
            className="absolute left-0 right-0 bottom-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(125,211,252,0.85) 0%, rgba(125,211,252,0.55) 100%)",
            }}
            initial={false}
            animate={{ height: `${pct}%` }}
            transition={{ type: "spring", stiffness: 220, damping: 26, mass: 1 }}
          />
          {/* shimmer line at top of liquid */}
          <motion.div
            className="absolute left-0 right-0 h-[2px] bg-acc-water/80"
            initial={false}
            animate={{ bottom: `${pct}%` }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <CountUp
              value={totalMl}
              className="text-text-primary leading-none"
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: 44,
                fontWeight: 500,
                textShadow: "0 1px 12px rgba(0,0,0,0.4)",
              }}
            />
            <div className="text-[11px] uppercase tracking-[0.16em] text-text-secondary mt-1">
              of {target.toLocaleString()} ml
            </div>
          </div>
        </div>

        {/* Quick adds */}
        <div className="grid grid-cols-3 gap-2 mt-6 w-full">
          {QUICK_ADDS.map((amt) => (
            <motion.button
              key={amt}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              onClick={() => log(amt)}
              className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-bg-elevated border border-border hover:border-border-hover/30 active:bg-acc-water/10"
            >
              <span
                className="text-text-primary"
                style={{ fontFamily: "Fraunces, serif", fontSize: 22 }}
              >
                {amt < 1000 ? amt : `${amt / 1000}L`}
              </span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
                {amt < 1000 ? "ml" : "bottle"}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="w-full mt-3 rounded-2xl bg-bg-elevated border border-border p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-3">
            Custom amount
          </div>
          <div className="flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setCustom((c) => Math.max(50, c - 50))}
              className="size-10 rounded-full border border-border flex items-center justify-center text-text-secondary"
            >
              <Minus size={16} />
            </motion.button>
            <div className="flex items-baseline gap-1">
              <span
                className="text-text-primary"
                style={{ fontFamily: "Fraunces, serif", fontSize: 32 }}
              >
                {custom}
              </span>
              <span className="text-[12px] text-text-muted">ml</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setCustom((c) => Math.min(2000, c + 50))}
              className="size-10 rounded-full border border-border flex items-center justify-center text-text-secondary"
            >
              <Plus size={16} />
            </motion.button>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => log(custom)}
            className="mt-3 w-full py-3 rounded-xl bg-acc-water text-bg-base font-medium text-[14px]"
          >
            Add {custom} ml
          </motion.button>
        </div>
      </div>
    </BottomSheet>
  );
}
