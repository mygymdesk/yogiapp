-- Medicines: scheduled medications
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  notes TEXT,
  -- Times of day to take, stored as HH:MM strings (e.g. ['08:00','21:00'])
  schedule_times TEXT[] NOT NULL DEFAULT '{}',
  -- Days of week (0=Sun..6=Sat). Empty = every day
  schedule_days INT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY medicines_select_own ON public.medicines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY medicines_insert_own ON public.medicines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY medicines_update_own ON public.medicines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY medicines_delete_own ON public.medicines FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER medicines_set_updated_at
BEFORE UPDATE ON public.medicines
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Medicine logs: each dose taken (or skipped)
CREATE TABLE public.medicine_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  scheduled_time TEXT NOT NULL, -- 'HH:MM' string matching the schedule
  status TEXT NOT NULL DEFAULT 'taken', -- 'taken' | 'skipped'
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE (user_id, medicine_id, date, scheduled_time)
);

ALTER TABLE public.medicine_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY medicine_logs_select_own ON public.medicine_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY medicine_logs_insert_own ON public.medicine_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY medicine_logs_update_own ON public.medicine_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY medicine_logs_delete_own ON public.medicine_logs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX medicine_logs_user_date_idx ON public.medicine_logs (user_id, date);
CREATE INDEX medicines_user_active_idx ON public.medicines (user_id, active);