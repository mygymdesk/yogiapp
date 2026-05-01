import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Flame, Droplet, Footprints, Scale, Pill, Apple, Sparkles } from "lucide-react";
import { useInsights } from "@/lib/insights";
import { useProfile, DEFAULT_WATER_TARGET_ML, DEFAULT_WALK_TARGET_MIN } from "@/lib/trackers";
import { RouteError } from "@/components/RouteError";

export const Route = createFileRoute("/_app/insights")({
  head: () => ({ meta: [{ title: "Insights — Daily" }] }),
  errorComponent: ({ error, reset }) => (
    <RouteError error={error} reset={reset} label="insights" />
  ),
  component: InsightsPage,
});

const TABS = [
  { k: 7, label: "7d" },
  { k: 30, label: "30d" },
  { k: 90, label: "90d" },
] as const;

function ChartCard({
  title,
  icon,
  unit,
  total,
  avg,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  unit: string;
  total?: string;
  avg?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-bg-elevated border border-border p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-text-primary text-[14px]">
          <span className="text-text-secondary">{icon}</span>
          <span>{title}</span>
          <span className="text-text-muted text-[11px]">{unit}</span>
        </div>
        <div className="text-right">
          {avg && <div className="text-[11px] text-text-muted">avg {avg}</div>}
          {total && <div className="text-[12px] text-text-secondary">total {total}</div>}
        </div>
      </div>
      <div style={{ width: "100%", height: 140 }}>{children}</div>
    </div>
  );
}

function InsightsPage() {
  const [days, setDays] = useState<7 | 30 | 90>(7);
  const { water, walk, weight, kcal, medAdh, streak, loading } = useInsights(days);
  const { profile } = useProfile();

  const waterTarget = profile?.daily_water_target_ml ?? DEFAULT_WATER_TARGET_ML;
  const walkTarget = profile?.walking_target_min ?? DEFAULT_WALK_TARGET_MIN;
  const kcalTarget = (profile as any)?.daily_kcal_target ?? 2000;

  const sum = (arr: { value: number }[]) => arr.reduce((s, x) => s + x.value, 0);
  const avg = (arr: { value: number }[]) => (arr.length ? Math.round(sum(arr) / arr.length) : 0);

  const tickColor = "rgba(255,255,255,0.35)";
  const gridColor = "rgba(255,255,255,0.06)";

  const xy = { stroke: tickColor, fontSize: 10 };

  return (
    <div className="px-4 pt-12 pb-32">
      <div className="px-1 text-[12px] uppercase tracking-[0.18em] text-text-muted">
        Trends & streaks
      </div>
      <h1
        className="text-text-primary mt-1 px-1"
        style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 500 }}
      >
        Insights
      </h1>

      {/* Streak banner */}
      <div className="mt-5 rounded-2xl bg-bg-elevated border border-border p-4 flex items-center gap-3">
        <div className="size-10 rounded-full bg-primary/10 grid place-items-center text-primary">
          <Flame size={18} />
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted">Streak</div>
          <div className="text-text-primary text-[16px]">
            {streak} day{streak === 1 ? "" : "s"} active
          </div>
        </div>
      </div>

      {/* Range tabs */}
      <div className="mt-5 flex gap-1 bg-bg-elevated border border-border rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setDays(t.k as 7 | 30 | 90)}
            className={`px-3 py-1.5 rounded-lg text-[12px] ${
              days === t.k
                ? "bg-text-primary text-bg-base"
                : "text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="mt-6 text-[12px] text-text-muted px-1">Loading…</div>}

      {!loading && sum(water) === 0 && sum(walk) === 0 && sum(kcal) === 0 && weight.length === 0 && (
        <div className="mt-8 rounded-2xl bg-bg-elevated border border-border p-6 flex flex-col items-center text-center">
          <div className="size-12 rounded-full bg-primary/10 grid place-items-center mb-3">
            <Sparkles size={18} className="text-text-secondary" />
          </div>
          <div
            className="text-text-primary"
            style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 500 }}
          >
            No data yet
          </div>
          <p className="text-[12px] text-text-secondary mt-1.5 max-w-[240px] leading-relaxed">
            Log a few days of water, walks, meals, or weight and trends will appear here.
          </p>
        </div>
      )}

      {/* Water */}
      <ChartCard
        title="Water"
        icon={<Droplet size={14} />}
        unit="ml/day"
        avg={`${avg(water)} ml`}
        total={`${(sum(water) / 1000).toFixed(1)} L`}
      >
        <ResponsiveContainer>
          <BarChart data={water}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" {...xy} />
            <YAxis {...xy} width={32} />
            <Tooltip
              contentStyle={{
                background: "#0F0F11",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Walking */}
      <ChartCard
        title="Walking"
        icon={<Footprints size={14} />}
        unit="min/day"
        avg={`${avg(walk)} min`}
        total={`${sum(walk)} min`}
      >
        <ResponsiveContainer>
          <BarChart data={walk}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" {...xy} />
            <YAxis {...xy} width={32} />
            <Tooltip
              contentStyle={{
                background: "#0F0F11",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill="#8FB996" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Weight */}
      <ChartCard
        title="Weight"
        icon={<Scale size={14} />}
        unit="kg"
        avg={weight.length && weight[weight.length - 1].value ? `${weight[weight.length - 1].value.toFixed(1)} kg` : "—"}
      >
        <ResponsiveContainer>
          <LineChart data={weight}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" {...xy} />
            <YAxis {...xy} width={32} domain={["dataMin - 1", "dataMax + 1"]} />
            <Tooltip
              contentStyle={{
                background: "#0F0F11",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#E0BFA0"
              strokeWidth={2}
              dot={{ r: 3, fill: "#E0BFA0" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Diet */}
      <ChartCard
        title="Calories"
        icon={<Apple size={14} />}
        unit={`/day · target ${kcalTarget}`}
        avg={`${avg(kcal)} kcal`}
      >
        <ResponsiveContainer>
          <BarChart data={kcal}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" {...xy} />
            <YAxis {...xy} width={32} />
            <Tooltip
              contentStyle={{
                background: "#0F0F11",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill="#C99B7C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Medicine adherence */}
      <ChartCard
        title="Medicine adherence"
        icon={<Pill size={14} />}
        unit="% taken"
        avg={`${avg(medAdh)}%`}
      >
        <ResponsiveContainer>
          <BarChart data={medAdh}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" {...xy} />
            <YAxis {...xy} width={32} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: "#0F0F11",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill="#A78BFA" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="text-[11px] text-text-muted text-center mt-6">
        Targets: water {waterTarget} ml · walk {walkTarget} min · kcal {kcalTarget}
      </div>
    </div>
  );
}
