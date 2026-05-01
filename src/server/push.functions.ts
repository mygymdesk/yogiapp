import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendWebPush, type PushSubscriptionRow } from "./webpush.server";
import { deleteExpiredSubscription } from "./push.server";

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
        await deleteExpiredSubscription(r.endpoint);
      }
    }
    return { sent: results.length, results };
  });
