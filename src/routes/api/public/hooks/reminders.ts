import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendPushToUser } from "@/server/push.server";

/**
 * Cron endpoint — invoked every 15 minutes by pg_cron.
 * Sends due medicine reminders + spaced water reminders, respecting
 * each user's quiet hours and notification preferences.
 *
 * No auth required (public hook), but it only sends notifications to
 * push subscriptions that already exist in the DB — i.e. users who
 * opted in. Idempotency: medicine reminders use a deterministic tag
 * (medicine_id + scheduled_time + date) so repeated invocations within
 * the 15-minute window collapse to a single notification per device.
 */
export const Route = createFileRoute("/api/public/hooks/reminders")({
  server: {
    handlers: {
      POST: async () => {
        const now = new Date();
        const result = {
          medicineSent: 0,
          waterSent: 0,
          summarySent: 0,
          errors: [] as string[],
        };

        try {
          // Pull all profiles with push subscriptions
          const { data: subs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("user_id");
          const userIds = Array.from(new Set((subs ?? []).map((s: any) => s.user_id)));
          if (userIds.length === 0) {
            return Response.json({ ok: true, ...result, note: "no subscribers" });
          }

          const { data: profiles } = await supabaseAdmin
            .from("profiles")
            .select(
              "user_id,timezone,quiet_hours_start,quiet_hours_end,notify_water,notify_water_interval_min,notify_medicine,notify_daily_summary,notify_daily_summary_time"
            )
            .in("user_id", userIds);

          for (const p of (profiles ?? []) as any[]) {
            const tz = p.timezone || "Asia/Kolkata";
            // Convert "now" to user's local time
            const local = new Date(now.toLocaleString("en-US", { timeZone: tz }));
            const hh = String(local.getHours()).padStart(2, "0");
            const mm = String(local.getMinutes()).padStart(2, "0");
            const dow = local.getDay();
            const localDate = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;

            // Quiet hours check
            const qStart = (p.quiet_hours_start || "23:00:00").slice(0, 5);
            const qEnd = (p.quiet_hours_end || "07:00:00").slice(0, 5);
            const cur = `${hh}:${mm}`;
            const inQuiet =
              qStart <= qEnd
                ? cur >= qStart && cur < qEnd
                : cur >= qStart || cur < qEnd;
            if (inQuiet) continue;

            // Medicine reminders
            if (p.notify_medicine) {
              const { data: meds } = await supabaseAdmin
                .from("medicines")
                .select("id,name,dosage,schedule_times,schedule_days,active,start_date,end_date")
                .eq("user_id", p.user_id)
                .eq("active", true);

              for (const m of (meds ?? []) as any[]) {
                if (m.start_date && localDate < m.start_date) continue;
                if (m.end_date && localDate > m.end_date) continue;
                const days: number[] = m.schedule_days ?? [];
                if (days.length && !days.includes(dow)) continue;

                for (const t of (m.schedule_times ?? []) as string[]) {
                  const hhmm = t.slice(0, 5);
                  // Trigger if scheduled time falls within the last 15 minutes
                  // (matches the cron cadence). Compare as minutes-of-day.
                  const [th, tm] = hhmm.split(":").map(Number);
                  const tMin = th * 60 + tm;
                  const nowMin = local.getHours() * 60 + local.getMinutes();
                  if (tMin > nowMin || tMin < nowMin - 15) continue;

                  // Skip if already taken/skipped today
                  const { data: existing } = await supabaseAdmin
                    .from("medicine_logs")
                    .select("id")
                    .eq("medicine_id", m.id)
                    .eq("date", localDate)
                    .eq("scheduled_time", hhmm)
                    .limit(1);
                  if (existing && existing.length > 0) continue;

                  await sendPushToUser({
                    userId: p.user_id,
                    title: `💊 ${m.name}`,
                    body: m.dosage ? `${m.dosage} · ${hhmm}` : `Time for your ${hhmm} dose`,
                    url: "/",
                    tag: `med-${m.id}-${localDate}-${hhmm}`,
                  });
                  result.medicineSent++;
                }
              }
            }

            // Water reminders — fire at top of every interval window during waking hours
            if (p.notify_water) {
              const interval = Math.max(30, Number(p.notify_water_interval_min) || 120);
              const nowMin = local.getHours() * 60 + local.getMinutes();
              if (nowMin % interval < 15) {
                // Only nudge if user hasn't logged water in the last interval
                const since = new Date(now.getTime() - interval * 60 * 1000).toISOString();
                const { data: recent } = await supabaseAdmin
                  .from("water_logs")
                  .select("id")
                  .eq("user_id", p.user_id)
                  .gte("logged_at", since)
                  .limit(1);
                if (!recent || recent.length === 0) {
                  await sendPushToUser({
                    userId: p.user_id,
                    title: "💧 Time to hydrate",
                    body: "Tap to log a glass of water.",
                    url: "/",
                    tag: `water-${localDate}-${Math.floor(nowMin / interval)}`,
                  });
                  result.waterSent++;
                }
              }
            }

            // Daily summary — fire once per day within 15 min of configured time
            if (p.notify_daily_summary) {
              const summary = (p.notify_daily_summary_time || "21:00:00").slice(0, 5);
              const [sh, sm] = summary.split(":").map(Number);
              const sMin = sh * 60 + sm;
              const nowMin2 = local.getHours() * 60 + local.getMinutes();
              if (sMin <= nowMin2 && nowMin2 - sMin < 15) {
                await sendPushToUser({
                  userId: p.user_id,
                  title: "🌙 Daily wrap-up",
                  body: "Open Daily to see today's progress.",
                  url: "/insights",
                  tag: `summary-${p.user_id}-${localDate}`,
                });
                result.summarySent++;
              }
            }
          }
        } catch (e: any) {
          console.error("reminders error", e);
          result.errors.push(String(e?.message ?? e));
        }

        return Response.json({ ok: true, ...result });
      },
    },
  },
});
