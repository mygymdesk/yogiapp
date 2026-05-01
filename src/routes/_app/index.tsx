import { createFileRoute } from "@tanstack/react-router";
import { Apple, Pill, Droplet, Footprints, Scale, Smile } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { AdherenceRing } from "@/components/AdherenceRing";
import { TrackerTile } from "@/components/TrackerTile";
import { CountUp } from "@/components/CountUp";
import { WaterSheet } from "@/components/WaterSheet";
import { MoodSheet } from "@/components/MoodSheet";
import { useTodayWater, useTodayMood, DEFAULT_WATER_TARGET_ML } from "@/lib/trackers";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Today — Daily" }] }),
  component: TodayPage,
});

const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😄"];

function useGreeting() {
  // Compute on client only to avoid SSR hydration mismatch
  const [g, setG] = useState<string | null>(null);
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setG("Good morning");
    else if (h < 17) setG("Good afternoon");
    else if (h < 21) setG("Good evening");
    else setG("Good night");
  }, []);
  return g;
}

function TodayPage() {
  const today = new Date();
  const greeting = useGreeting();
  const [waterOpen, setWaterOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);

  const { totalMl } = useTodayWater();
  const { mood } = useTodayMood();

  const waterPct = Math.min(100, (totalMl / DEFAULT_WATER_TARGET_ML) * 100);
  // Today's combined adherence — only water + mood are real for now
  const moodPct = mood ? 100 : 0;
  const adherence = Math.round((waterPct + moodPct) / 2);

  return (
    <>
      <div className="px-5 pt-12">
        <header className="mb-6">
          <div className="text-[12px] uppercase tracking-[0.18em] text-text-muted">
            {format(today, "EEEE")}
          </div>
          <h1
            className="text-text-primary mt-1 leading-tight"
            style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 500 }}
          >
            {greeting ?? "Hello"}.
          </h1>
          <div className="text-[13px] text-text-secondary mt-0.5">
            {format(today, "MMMM d, yyyy")}
          </div>
        </header>

        <section className="flex justify-center my-6">
          <AdherenceRing value={adherence} />
        </section>

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
            accent="water"
            ringValue={waterPct}
            primary={
              <span>
                <CountUp value={totalMl} />
                <span className="text-text-muted text-[14px] ml-1">
                  / {DEFAULT_WATER_TARGET_ML.toLocaleString()} ml
                </span>
              </span>
            }
            secondary={
              totalMl === 0
                ? "Tap to log a glass"
                : `${Math.round(waterPct)}% of today's goal`
            }
            onClick={() => setWaterOpen(true)}
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
            accent="mood"
            primary={
              mood ? (
                <span className="text-[28px] leading-none">{MOOD_EMOJIS[mood.mood - 1]}</span>
              ) : (
                "How are you feeling?"
              )
            }
            secondary={
              mood
                ? mood.note || (mood.tags.length ? mood.tags.join(" ") : "Logged for today")
                : "Tap an emoji to log"
            }
            onClick={() => setMoodOpen(true)}
          />
        </section>

        <div className="h-8" />
      </div>

      <WaterSheet open={waterOpen} onClose={() => setWaterOpen(false)} />
      <MoodSheet open={moodOpen} onClose={() => setMoodOpen(false)} />
    </>
  );
}
