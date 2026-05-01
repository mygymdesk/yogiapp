import { createFileRoute } from "@tanstack/react-router";
import { Apple, Pill, Droplet, Footprints, Scale, Smile } from "lucide-react";
import { format } from "date-fns";
import { AdherenceRing } from "../components/AdherenceRing";
import { TrackerTile } from "../components/TrackerTile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Daily" },
      { name: "description", content: "Your day at a glance." },
    ],
  }),
  component: TodayPage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function TodayPage() {
  const today = new Date();
  return (
    <div className="px-5 pt-12">
      {/* Greeting */}
      <header className="mb-6">
        <div className="text-[12px] uppercase tracking-[0.18em] text-text-muted">
          {format(today, "EEEE")}
        </div>
        <h1
          className="text-text-primary mt-1 leading-tight"
          style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 500 }}
        >
          {greeting()}.
        </h1>
        <div className="text-[13px] text-text-secondary mt-0.5">
          {format(today, "MMMM d, yyyy")}
        </div>
      </header>

      {/* Hero ring */}
      <section className="flex justify-center my-6">
        <AdherenceRing value={0} />
      </section>

      {/* Tracker tiles */}
      <section className="flex flex-col gap-3 mt-4">
        <TrackerTile
          icon={Apple}
          label="Diet"
          primary="0 / 0 kcal"
          secondary="No active plan"
          accent="diet"
        />
        <TrackerTile
          icon={Pill}
          label="Medicine"
          primary="No doses scheduled"
          secondary="Add medicines in Plan"
          accent="med"
        />
        <TrackerTile
          icon={Droplet}
          label="Water"
          primary="0 / 2,500 ml"
          secondary="Tap to log a glass"
          accent="water"
        />
        <TrackerTile
          icon={Footprints}
          label="Walk"
          primary="0 min"
          secondary="Goal 30 min"
          accent="walk"
        />
        <TrackerTile
          icon={Scale}
          label="Weight"
          primary="— kg"
          secondary="Log to start tracking"
          accent="weight"
        />
        <TrackerTile
          icon={Smile}
          label="Mood"
          primary="How are you feeling?"
          secondary="Tap an emoji to log"
          accent="mood"
        />
      </section>

      <div className="h-8" />
    </div>
  );
}
