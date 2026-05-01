import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Target } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { useWeightLogs, useProfile } from "@/lib/trackers";
import { WeightSheet } from "@/components/WeightSheet";

export const Route = createFileRoute("/_app/weight")({
  head: () => ({ meta: [{ title: "Weight — Yogi" }] }),
  component: WeightDetail,
});

const RANGES = [
  { key: 7, label: "7D" },
  { key: 30, label: "30D" },
  { key: 90, label: "90D" },
] as const;

function movingAvg(values: number[], window = 7): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}

function WeightDetail() {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [open, setOpen] = useState(false);
  const { logs, latest, delta } = useWeightLogs(range);
  const { profile } = useProfile();

  const chartData = useMemo(() => {
    const cutoff = subDays(new Date(), range);
    const filtered = logs.filter((l) => parseISO(l.date) >= cutoff);
    const values = filtered.map((l) => l.weight_kg);
    const avg = movingAvg(values, 7);
    return filtered.map((l, i) => ({
      date: l.date,
      label: format(parseISO(l.date), range >= 30 ? "MMM d" : "EEE"),
      value: l.weight_kg,
      avg: Number(avg[i].toFixed(2)),
    }));
  }, [logs, range]);

  const goal = profile?.goal_weight_kg ?? null;
  const startWeight = logs[0]?.weight_kg ?? null;
  const goalDelta =
    goal !== null && startWeight !== null && latest
      ? { fromStart: latest.weight_kg - startWeight, toGoal: latest.weight_kg - goal }
      : null;

  return (
    <>
      <div className="px-5 pt-12 pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-text-secondary text-[13px] -ml-1 mb-4"
        >
          <ArrowLeft size={16} /> Today
        </Link>

        <div className="text-[12px] uppercase tracking-[0.18em] text-text-muted">
          Weight
        </div>
        <div className="flex items-baseline gap-3 mt-1">
          <h1
            className="text-text-primary tabular-nums"
            style={{ fontFamily: "Fraunces, serif", fontSize: 48, fontWeight: 500, lineHeight: 1 }}
          >
            {latest ? latest.weight_kg.toFixed(1) : "—"}
          </h1>
          <span className="text-[14px] text-text-muted">kg</span>
          {delta !== null && (
            <span
              className="text-[13px] tabular-nums"
              style={{
                color:
                  delta < 0 ? "var(--success)" : delta > 0 ? "var(--danger)" : "var(--text-muted)",
              }}
            >
              {delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {Math.abs(delta).toFixed(1)} kg
            </span>
          )}
        </div>

        {/* Range toggle */}
        <div className="mt-6 flex bg-bg-elevated border border-border rounded-full p-1 w-fit">
          {RANGES.map((r) => {
            const active = range === r.key;
            return (
              <motion.button
                key={r.key}
                whileTap={{ scale: 0.94 }}
                onClick={() => setRange(r.key)}
                className={`px-4 py-1.5 text-[12px] rounded-full ${
                  active ? "bg-bg-surface text-text-primary" : "text-text-muted"
                }`}
              >
                {r.label}
              </motion.button>
            );
          })}
        </div>

        {/* Chart */}
        <div className="mt-5 bg-bg-surface border border-border rounded-[20px] p-4 pl-1">
          {chartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-[13px] text-text-muted">
              Log your weight to see the trend.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={["dataMin - 0.5", "dataMax + 0.5"]}
                  width={32}
                />
                {goal !== null && (
                  <ReferenceLine
                    y={goal}
                    stroke="var(--text-muted)"
                    strokeDasharray="3 4"
                    label={{
                      value: `Goal ${goal}`,
                      fill: "var(--text-muted)",
                      fontSize: 10,
                      position: "right",
                    }}
                  />
                )}
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--text-muted)" }}
                  formatter={(v: number, n) => [
                    `${Number(v).toFixed(1)} kg`,
                    n === "avg" ? "7-day avg" : "Daily",
                  ]}
                />
                {/* Daily dots — subtle */}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="rgba(196,181,253,0.35)"
                  strokeWidth={1}
                  dot={{ r: 2.5, fill: "var(--acc-weight)", strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: "var(--acc-weight)" }}
                  isAnimationActive={false}
                />
                {/* 7-day MA — hero */}
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="var(--acc-weight)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={false}
                  isAnimationActive
                  animationDuration={700}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Goal card */}
        {goalDelta && goal !== null && (
          <div className="mt-3 bg-bg-surface border border-border rounded-[20px] p-4">
            <div className="flex items-center gap-3">
              <div
                className="size-11 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(196,181,253,0.10)" }}
              >
                <Target size={20} style={{ color: "var(--acc-weight)" }} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] uppercase tracking-[0.12em] text-text-muted">Goal</div>
                <div
                  className="text-text-primary text-[18px]"
                  style={{ fontFamily: "Fraunces, serif" }}
                >
                  {goal} kg
                </div>
                <div className="text-[12px] text-text-secondary mt-0.5 tabular-nums">
                  {goalDelta.toGoal > 0
                    ? `${goalDelta.toGoal.toFixed(1)} kg to lose`
                    : goalDelta.toGoal < 0
                    ? `${Math.abs(goalDelta.toGoal).toFixed(1)} kg under goal`
                    : "At your goal"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent entries */}
        {logs.length > 0 && (
          <div className="mt-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2 px-1">
              Recent
            </div>
            <div className="bg-bg-surface border border-border rounded-[20px] divide-y divide-border">
              {[...logs]
                .reverse()
                .slice(0, 8)
                .map((l) => (
                  <div key={l.id} className="flex items-center justify-between px-4 py-3">
                    <div className="text-[13px] text-text-secondary">
                      {format(parseISO(l.date), "EEE, MMM d")}
                    </div>
                    <div className="flex items-baseline gap-2 tabular-nums">
                      <span
                        className="text-text-primary text-[16px]"
                        style={{ fontFamily: "Fraunces, serif" }}
                      >
                        {l.weight_kg.toFixed(1)}
                      </span>
                      <span className="text-[11px] text-text-muted">kg</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="h-24" />
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(true)}
        className="absolute right-5 bottom-[88px] z-30 size-14 rounded-full bg-text-primary text-bg-base flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
      >
        <Plus size={22} strokeWidth={2.25} />
      </motion.button>

      <WeightSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
