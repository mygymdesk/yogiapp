import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ChevronLeft, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useTodayMeals, SLOT_LABELS, type MealSlot } from "@/lib/diet";
import { useProfile } from "@/lib/trackers";
import { MealSheet } from "@/components/MealSheet";
import { CountUp } from "@/components/CountUp";
import { useToastStore, haptic } from "@/lib/feedback";

export const Route = createFileRoute("/_app/diet")({
  head: () => ({ meta: [{ title: "Diet — Daily" }] }),
  component: DietPage,
});

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[12px]">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-muted tabular-nums">
          <span className="text-text-primary">{Math.round(value)}</span> / {target}g
        </span>
      </div>
      <div className="h-1.5 mt-1.5 rounded-full bg-bg-elevated overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function DietPage() {
  const { profile } = useProfile();
  const { meals, totals, totalsBySlot, removeMeal } = useTodayMeals();
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState("snack");
  const showToast = useToastStore((s) => s.show);

  const kcalTarget = (profile as any)?.daily_kcal_target ?? 2000;
  const pTarget = (profile as any)?.daily_protein_g_target ?? 100;
  const cTarget = (profile as any)?.daily_carbs_g_target ?? 250;
  const fTarget = (profile as any)?.daily_fat_g_target ?? 65;
  const slots: MealSlot[] = (profile as any)?.meal_slots ?? [];

  const kcalPct = Math.min(100, (totals.kcal / kcalTarget) * 100);

  return (
    <>
      <div className="px-5 pt-12 pb-32">
        <Link
          to="/"
          className="inline-flex items-center text-[12px] text-text-muted -ml-1 mb-2"
        >
          <ChevronLeft size={14} /> Today
        </Link>
        <div className="text-[12px] uppercase tracking-[0.18em] text-text-muted">
          {format(new Date(), "EEEE")}
        </div>
        <h1
          className="text-text-primary mt-1"
          style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 500 }}
        >
          Diet
        </h1>

        {/* Calorie hero */}
        <div className="mt-6 rounded-2xl bg-bg-elevated border border-border p-5">
          <div className="flex items-baseline justify-between">
            <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted">Today</div>
            <div className="text-[11px] text-text-muted tabular-nums">
              {Math.round(kcalPct)}% of goal
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="text-text-primary tabular-nums"
              style={{ fontFamily: "Fraunces, serif", fontSize: 48, fontWeight: 500 }}
            >
              <CountUp value={Math.round(totals.kcal)} />
            </span>
            <span className="text-text-muted text-[14px]">/ {kcalTarget} kcal</span>
          </div>
          <div className="h-2 mt-3 rounded-full bg-bg-base overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${kcalPct}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="h-full bg-gradient-to-r from-amber-400 to-rose-400"
            />
          </div>
          <div className="mt-5 space-y-3">
            <MacroBar label="Protein" value={totals.protein} target={pTarget} color="oklch(0.7 0.15 145)" />
            <MacroBar label="Carbs" value={totals.carbs} target={cTarget} color="oklch(0.75 0.13 80)" />
            <MacroBar label="Fat" value={totals.fat} target={fTarget} color="oklch(0.7 0.15 25)" />
          </div>
        </div>

        {/* Slots */}
        <div className="mt-6 space-y-3">
          {slots.map((s) => {
            const slotMeals = meals.filter((m) => m.slot === s.key);
            const slotKcal = totalsBySlot[s.key] ?? 0;
            const slotPct = s.kcal > 0 ? Math.min(100, (slotKcal / s.kcal) * 100) : 0;
            return (
              <div
                key={s.key}
                className="rounded-2xl bg-bg-elevated border border-border overflow-hidden"
              >
                <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                  <div>
                    <div className="text-[14px] text-text-primary">{s.label}</div>
                    <div className="text-[11px] text-text-muted tabular-nums">
                      {Math.round(slotKcal)} / {s.kcal} kcal
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSlot(s.key);
                      setOpen(true);
                    }}
                    className="size-9 rounded-full bg-bg-base border border-border flex items-center justify-center text-text-secondary"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="h-1 bg-bg-base mx-5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${slotPct}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-text-primary/60"
                  />
                </div>
                {slotMeals.length === 0 ? (
                  <div className="px-5 py-3 text-[12px] text-text-muted">
                    Nothing logged
                  </div>
                ) : (
                  <div className="px-5 pb-3 pt-2 space-y-2">
                    {slotMeals.map((m) => {
                      const k = (m.items ?? []).reduce((s, it) => s + Number(it.kcal), 0);
                      return (
                        <div
                          key={m.id}
                          className="flex items-start justify-between gap-3 py-2 border-t border-border first:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] text-text-primary">
                              {(m.items ?? []).map((it) => it.food_name).join(" · ") || "Meal"}
                            </div>
                            <div className="text-[11px] text-text-muted">
                              {format(new Date(m.logged_at), "h:mm a")} · {Math.round(k)} kcal
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              haptic();
                              const { error } = await removeMeal(m.id);
                              if (error) showToast(error.message);
                              else showToast("Removed");
                            }}
                            className="size-7 flex items-center justify-center text-text-muted"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <MealSheet open={open} onClose={() => setOpen(false)} defaultSlot={slot} />
    </>
  );
}
