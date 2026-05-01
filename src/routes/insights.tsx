import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/insights")({
  head: () => ({ meta: [{ title: "Insights — Daily" }] }),
  component: InsightsPage,
});

function InsightsPage() {
  return (
    <div className="px-5 pt-12">
      <div className="text-[12px] uppercase tracking-[0.18em] text-text-muted">Trends & streaks</div>
      <h1
        className="text-text-primary mt-1"
        style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 500 }}
      >
        Insights
      </h1>
      <p className="text-text-secondary text-[13px] mt-3">
        Charts and weekly summaries will appear here.
      </p>
    </div>
  );
}
