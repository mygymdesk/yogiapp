import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Footprints } from "lucide-react";
import { format, parseISO, startOfWeek, addDays } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { useWalkLogs, useProfile, DEFAULT_WALK_TARGET_MIN } from "@/lib/trackers";
import { WalkSheet } from "@/components/WalkSheet";

export const Route = createFileRoute("/_app/walk")({
  head: () => ({ meta: [{ title: "Walk — Yogi" }] }),
  component: WalkDetail,
});

function WalkDetail() {
  const [open, setOpen] = useState(false);
  const { logs, todayLogs, todayMinutes, todayKm, remove } = useWalkLogs(7);
  const { profile } = useProfile();
  const target = profile?.walking_target_min ?? DEFAULT_WALK_TARGET_MIN;

  const weekData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i);
      const key = format(day, "yyyy-MM-dd");
      const total = logs
        .filter((l) => l.date === key)
        .reduce((s, l) => s + l.duration_min, 0);
      return {
        key,
        label: format(day, "EEE"),
        minutes: total,
        isToday: key === format(new Date(), "yyyy-MM-dd"),
      };
    });
  }, [logs]);

  const totalThisWeek = weekData.reduce((s, d) => s + d.minutes, 0);
  const daysHit = weekData.filter((d) => d.minutes >= target).length;

  return (
    <>
      <div className="px-5 pt-12 pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-text-secondary text-[13px] -ml-1 mb-4"
        >
          <ArrowLeft size={16} /> Today
        </Link>

        <div className="text-[12px] uppercase tracking-[0.18em] text-text-muted">Walk</div>
        <div className="flex items-baseline gap-2 mt-1">
          <h1
            className="text-text-primary tabular-nums"
            style={{ fontFamily: "Fraunces, serif", fontSize: 48, fontWeight: 500, lineHeight: 1 }}
          >
            {todayMinutes}
          </h1>
          <span className="text-[14px] text-text-muted">min today</span>
          {todayKm > 0 && (
            <span className="text-[13px] text-text-secondary ml-2 tabular-nums">
              · {todayKm.toFixed(1)} km
            </span>
          )}
        </div>
        <div className="text-[12px] text-text-muted mt-1">
          Goal {target} min · {Math.min(100, Math.round((todayMinutes / target) * 100))}% of today
        </div>

        {/* Week chart */}
        <div className="mt-6 bg-bg-surface border border-border rounded-[20px] p-4 pl-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted">This week</div>
            <div className="text-[11px] text-text-secondary tabular-nums">
              {totalThisWeek} min · {daysHit}/7 days hit
            </div>
          </div>
          <ResponsiveContainer width="100%" height={184}>
            <BarChart data={weekData} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={28}
                allowDecimals={false}
              />
              <ReferenceLine
                y={target}
                stroke="var(--text-muted)"
                strokeDasharray="3 4"
                strokeOpacity={0.4}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--text-muted)" }}
                formatter={(v: number) => [`${v} min`, "Walked"]}
              />
              <Bar dataKey="minutes" radius={[6, 6, 2, 2]} maxBarSize={28} animationDuration={600}>
                {weekData.map((d) => (
                  <Cell
                    key={d.key}
                    fill={
                      d.minutes === 0
                        ? "rgba(255,255,255,0.06)"
                        : d.minutes >= target
                        ? "var(--acc-walk)"
                        : "rgba(149,213,178,0.45)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Today's entries */}
        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2 px-1">
            Today
          </div>
          {todayLogs.length === 0 ? (
            <div className="bg-bg-surface border border-border rounded-[20px] p-6 text-center">
              <Footprints size={20} className="text-text-muted mx-auto mb-2" />
              <div className="text-[13px] text-text-muted">No walks logged today.</div>
            </div>
          ) : (
            <div className="bg-bg-surface border border-border rounded-[20px] divide-y divide-border">
              {todayLogs.map((l) => (
                <div key={l.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-text-primary text-[18px] tabular-nums"
                        style={{ fontFamily: "Fraunces, serif" }}
                      >
                        {l.duration_min}
                      </span>
                      <span className="text-[11px] text-text-muted">min</span>
                      {l.distance_km !== null && (
                        <span className="text-[12px] text-text-secondary tabular-nums ml-1">
                          · {l.distance_km.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => remove(l.id)}
                      className="text-[11px] text-text-muted hover:text-danger px-2"
                    >
                      Delete
                    </button>
                  </div>
                  {l.notes && (
                    <div className="text-[12px] text-text-secondary mt-1">{l.notes}</div>
                  )}
                  <div className="text-[10px] text-text-muted mt-1 tabular-nums">
                    {format(parseISO(l.logged_at), "h:mm a")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-24" />
      </div>

      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(true)}
        className="absolute right-5 bottom-[88px] z-30 size-14 rounded-full bg-text-primary text-bg-base flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
      >
        <Plus size={22} strokeWidth={2.25} />
      </motion.button>

      <WalkSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
