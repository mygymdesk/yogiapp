import { useState } from "react";
import { motion } from "framer-motion";
import { BottomSheet } from "./BottomSheet";
import { useWalkLogs } from "@/lib/trackers";
import { haptic, useToastStore } from "@/lib/feedback";
import { Minus, Plus } from "lucide-react";

const QUICK = [10, 20, 30, 45];

export function WalkSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { save } = useWalkLogs(1);
  const [minutes, setMinutes] = useState(30);
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const showToast = useToastStore((s) => s.show);

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    haptic();
    const { error } = await save({
      duration_min: minutes,
      distance_km: distance ? Number(distance) : null,
      notes: notes || null,
    });
    setSaving(false);
    if (error) {
      showToast(error.message);
      return;
    }
    showToast(`+${minutes} min walk logged`);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Log a walk">
      <div className="flex flex-col">
        {/* Minutes hero */}
        <div className="w-full bg-bg-elevated border border-border rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted text-center mb-3">
            Duration
          </div>
          <div className="flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                haptic();
                setMinutes((m) => Math.max(1, m - 5));
              }}
              className="size-12 rounded-full border border-border flex items-center justify-center text-text-secondary"
            >
              <Minus size={18} />
            </motion.button>
            <div className="flex items-baseline gap-1">
              <span
                className="text-text-primary tabular-nums"
                style={{ fontFamily: "Fraunces, serif", fontSize: 56, fontWeight: 500, lineHeight: 1 }}
              >
                {minutes}
              </span>
              <span className="text-[14px] text-text-muted ml-1">min</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                haptic();
                setMinutes((m) => Math.min(720, m + 5));
              }}
              className="size-12 rounded-full border border-border flex items-center justify-center text-text-secondary"
            >
              <Plus size={18} />
            </motion.button>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4">
            {QUICK.map((m) => (
              <motion.button
                key={m}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  haptic();
                  setMinutes(m);
                }}
                className={`py-2 rounded-lg text-[12px] tabular-nums border ${
                  minutes === m
                    ? "bg-acc-walk/15 text-acc-walk border-acc-walk/40"
                    : "bg-bg-surface text-text-muted border-border"
                }`}
              >
                {m}m
              </motion.button>
            ))}
          </div>
        </div>

        {/* Distance + notes */}
        <div className="mt-3 grid grid-cols-1 gap-3">
          <div className="bg-bg-elevated border border-border rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
              Distance <span className="text-text-muted/60 normal-case tracking-normal">— optional</span>
            </div>
            <div className="flex items-baseline gap-2">
              <input
                inputMode="decimal"
                value={distance}
                onChange={(e) => setDistance(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))}
                placeholder="0.0"
                className="flex-1 bg-transparent text-text-primary text-[22px] outline-none tabular-nums"
                style={{ fontFamily: "Fraunces, serif" }}
              />
              <span className="text-[12px] text-text-muted">km</span>
            </div>
          </div>

          <div className="bg-bg-elevated border border-border rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
              Notes <span className="text-text-muted/60 normal-case tracking-normal">— optional</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 280))}
              placeholder="Park loop, with Riya…"
              rows={2}
              className="w-full bg-transparent text-[14px] text-text-primary placeholder:text-text-muted resize-none outline-none"
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={submit}
          disabled={saving}
          className="mt-6 w-full py-3.5 rounded-2xl bg-text-primary text-bg-base font-medium text-[14px] disabled:opacity-30"
        >
          {saving ? "…" : "Log walk"}
        </motion.button>
      </div>
    </BottomSheet>
  );
}
