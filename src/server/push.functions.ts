import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendWebPush, type PushSubscriptionRow } from "./webpush.server";

/**
 * Returns the public VAPID key so the browser can build a subscription.
 */
export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { publicKey: process.env.VAPID_PUBLIC_KEY ?? "" };
});

/**
 * Sends a test notification to all of the current user's subscribed devices.
 */
export const sendTestPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth")
      .eq("user_id", userId);
    if (error) throw error;

    const results = [] as Array<{ endpoint: string; ok: boolean; status: number }>;
    for (const s of (subs ?? []) as PushSubscriptionRow[]) {
      const r = await sendWebPush(s, {
        title: "Daily — Test",
        body: "Push notifications are working ✓",
        url: "/",
        tag: "test",
      });
      results.push({ endpoint: r.endpoint, ok: r.ok, status: r.status });
      if (r.expired) {
        await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", r.endpoint);
      }
    }
    return { sent: results.length, results };
  });

/**
 * Send a push to a specific user (used by cron / scheduled reminders).
 */
const PushPayload = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(120),
  body: z.string().max(500).optional(),
  url: z.string().max(500).optional(),
  tag: z.string().max(60).optional(),
});

export async function sendPushToUser(input: z.infer<typeof PushPayload>) {
  const data = PushPayload.parse(input);
  const { data: subs, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth")
    .eq("user_id", data.userId);
  if (error) throw error;
  let sent = 0;
  for (const s of (subs ?? []) as PushSubscriptionRow[]) {
    const r = await sendWebPush(s, {
      title: data.title,
      body: data.body,
      url: data.url,
      tag: data.tag,
    });
    if (r.ok) sent++;
    if (r.expired) {
      await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", r.endpoint);
    }
  }
  return { sent };
}
