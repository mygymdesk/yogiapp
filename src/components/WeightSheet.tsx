import { useState } from "react";
import { motion } from "framer-motion";
import { BottomSheet } from "./BottomSheet";
import { useWeightLogs } from "@/lib/trackers";
import { haptic, useToastStore } from "@/lib/feedback";
import { Minus, Plus } from "lucide-react";

export function WeightSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { latest, save } = useWeightLogs(7);
  // start near user's last value if available
  const [whole, setWhole] = useState<number>(() =>
    latest ? Math.floor(latest.weight_kg) : 70
  );
  const [decimal, setDecimal] = useState<number>(() =>
    latest ? Math.round((latest.weight_kg - Math.floor(latest.weight_kg)) * 10) : 0
  );
  const [showOptional, setShowOptional] = useState(false);
  const [bf, setBf] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [saving, setSaving] = useState(false);
  const showToast = useToastStore((s) => s.show);

  const value = whole + decimal / 10;

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    haptic();
    const { error } = await save({
      weight_kg: value,
      body_fat_pct: bf ? Number(bf) : null,
      waist_cm: waist ? Number(waist) : null,
      chest_cm: chest ? Number(chest) : null,
    });
    setSaving(false);
    if (error) {
      showToast(error.message);
      return;
    }
    showToast("Weight logged");
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Log weight">
      <div className="flex flex-col items-center">
        {/* Stepper hero */}
        <div className="w-full bg-bg-elevated border border-border rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted text-center mb-3">
            Weight
          </div>
          <div className="flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                haptic();
                setWhole((w) => Math.max(20, w - 1));
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
                {whole}
              </span>
              <span
                className="text-text-secondary tabular-nums"
                style={{ fontFamily: "Fraunces, serif", fontSize: 32 }}
              >
                .{decimal}
              </span>
              <span className="text-[14px] text-text-muted ml-1">kg</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                haptic();
                setWhole((w) => Math.min(300, w + 1));
              }}
              className="size-12 rounded-full border border-border flex items-center justify-center text-text-secondary"
            >
              <Plus size={18} />
            </motion.button>
          </div>

          {/* Decimal scrubber */}
          <div className="mt-5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted mb-2 text-center">
              Decimal
            </div>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    haptic();
                    setDecimal(i);
                  }}
                  className={`py-2 rounded-lg text-[12px] tabular-nums ${
                    decimal === i
                      ? "bg-acc-weight/15 text-acc-weight border border-acc-weight/40"
                      : "bg-bg-surface text-text-muted border border-border"
                  }`}
                >
                  .{i}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Optional */}
        <button
          onClick={() => setShowOptional((v) => !v)}
          className="mt-4 text-[12px] text-text-muted uppercase tracking-[0.14em]"
        >
          {showOptional ? "− Hide" : "+ Body metrics"} <span className="normal-case tracking-normal text-text-muted/60">— optional</span>
        </button>

        {showOptional && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-3 grid grid-cols-3 gap-2"
          >
            {[
              { label: "Body fat", suffix: "%", value: bf, set: setBf },
              { label: "Waist", suffix: "cm", value: waist, set: setWaist },
              { label: "Chest", suffix: "cm", value: chest, set: setChest },
            ].map((f) => (
              <div key={f.label} className="bg-bg-elevated border border-border rounded-2xl p-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-text-muted mb-1">
                  {f.label}
                </div>
                <div className="flex items-baseline">
                  <input
                    inputMode="decimal"
                    value={f.value}
                    onChange={(e) => f.set(e.target.value.replace(/[^\d.]/g, "").slice(0, 5))}
                    placeholder="—"
                    className="w-full bg-transparent text-text-primary text-[18px] outline-none tabular-nums"
                    style={{ fontFamily: "Fraunces, serif" }}
                  />
                  <span className="text-[10px] text-text-muted ml-1">{f.suffix}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={submit}
          disabled={saving}
          className="mt-6 w-full py-3.5 rounded-2xl bg-text-primary text-bg-base font-medium text-[14px] disabled:opacity-30"
        >
          {saving ? "…" : "Log weight"}
        </motion.button>
      </div>
    </BottomSheet>
  );
}
