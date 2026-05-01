import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendWebPush, type PushSubscriptionRow } from "./webpush.server";

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

export async function deleteExpiredSubscription(endpoint: string) {
  await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
