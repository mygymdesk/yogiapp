import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Daily" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="px-5 pt-12">
      <div className="text-[12px] uppercase tracking-[0.18em] text-text-muted">Preferences</div>
      <h1
        className="text-text-primary mt-1"
        style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 500 }}
      >
        Settings
      </h1>
      <p className="text-text-secondary text-[13px] mt-3">
        Profile, notifications, quiet hours, and data export will live here.
      </p>
    </div>
  );
}
