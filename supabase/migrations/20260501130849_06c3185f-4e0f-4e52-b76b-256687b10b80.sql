-- Push subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subs_select_own" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "push_subs_insert_own" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_subs_update_own" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "push_subs_delete_own" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_push_subs_user ON public.push_subscriptions(user_id);

-- Notification preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_water boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_water_interval_min integer NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS notify_medicine boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_daily_summary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_daily_summary_time time NOT NULL DEFAULT '21:00:00';