import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/plan")({
  head: () => ({ meta: [{ title: "Plan — Yogi" }] }),
  component: PlanPage,
});

function PlanPage() {
  return (
    <div className="px-5 pt-12">
      <div className="text-[12px] uppercase tracking-[0.18em] text-text-muted">Your routines</div>
      <h1
        className="text-text-primary mt-1"
        style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 500 }}
      >
        Plan
      </h1>
      <p className="text-text-secondary text-[13px] mt-3">
        Diet plan, medicines and goals will live here.
      </p>
    </div>
  );
}
