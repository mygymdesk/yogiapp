-- FOODS LIBRARY ----------------------------------------------------
CREATE TABLE public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- null = system food (visible to all)
  is_system BOOLEAN NOT NULL DEFAULT false,
  source TEXT, -- 'ifct2017' | 'custom' | etc.
  source_code TEXT, -- e.g. IFCT code 'A001'
  name TEXT NOT NULL,
  food_group TEXT,
  kcal_per_100g NUMERIC NOT NULL DEFAULT 0,
  protein_per_100g NUMERIC NOT NULL DEFAULT 0,
  carbs_per_100g NUMERIC NOT NULL DEFAULT 0,
  fat_per_100g NUMERIC NOT NULL DEFAULT 0,
  fiber_per_100g NUMERIC NOT NULL DEFAULT 0,
  default_serving_g NUMERIC NOT NULL DEFAULT 100,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, source_code)
);

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY foods_select_system_or_own ON public.foods FOR SELECT
  USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY foods_insert_own ON public.foods FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = false);
CREATE POLICY foods_update_own ON public.foods FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false);
CREATE POLICY foods_delete_own ON public.foods FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

CREATE INDEX foods_name_search_idx ON public.foods USING gin (to_tsvector('simple', name));
CREATE INDEX foods_user_idx ON public.foods (user_id);
CREATE INDEX foods_group_idx ON public.foods (food_group);

CREATE TRIGGER foods_set_updated_at
BEFORE UPDATE ON public.foods
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- MEAL LOGS --------------------------------------------------------
CREATE TABLE public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  slot TEXT NOT NULL DEFAULT 'snack', -- breakfast | lunch | snack | dinner
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY meal_logs_select_own ON public.meal_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY meal_logs_insert_own ON public.meal_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY meal_logs_update_own ON public.meal_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY meal_logs_delete_own ON public.meal_logs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX meal_logs_user_date_idx ON public.meal_logs (user_id, date);

-- FOOD LOG ITEMS ---------------------------------------------------
CREATE TABLE public.food_log_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id UUID NOT NULL REFERENCES public.meal_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  food_name TEXT NOT NULL, -- snapshot
  serving_g NUMERIC NOT NULL DEFAULT 100,
  kcal NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  fiber NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.food_log_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY food_log_items_select_own ON public.food_log_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY food_log_items_insert_own ON public.food_log_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY food_log_items_update_own ON public.food_log_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY food_log_items_delete_own ON public.food_log_items FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX food_log_items_meal_idx ON public.food_log_items (meal_log_id);
CREATE INDEX food_log_items_user_idx ON public.food_log_items (user_id);

-- PROFILE: macro targets + meal slot config -----------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_kcal_target INTEGER NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS daily_protein_g_target INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS daily_carbs_g_target INTEGER NOT NULL DEFAULT 250,
  ADD COLUMN IF NOT EXISTS daily_fat_g_target INTEGER NOT NULL DEFAULT 65,
  ADD COLUMN IF NOT EXISTS meal_slots JSONB NOT NULL DEFAULT '[
    {"key":"breakfast","label":"Breakfast","kcal":400},
    {"key":"lunch","label":"Lunch","kcal":700},
    {"key":"snack","label":"Snack","kcal":200},
    {"key":"dinner","label":"Dinner","kcal":700}
  ]'::jsonb;