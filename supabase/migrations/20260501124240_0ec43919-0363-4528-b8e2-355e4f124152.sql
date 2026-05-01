-- weight_logs
create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  weight_kg numeric(5,2) not null check (weight_kg > 0 and weight_kg < 500),
  body_fat_pct numeric(4,2) check (body_fat_pct is null or (body_fat_pct >= 0 and body_fat_pct <= 80)),
  waist_cm numeric(5,2) check (waist_cm is null or (waist_cm > 0 and waist_cm < 300)),
  chest_cm numeric(5,2) check (chest_cm is null or (chest_cm > 0 and chest_cm < 300)),
  logged_at timestamptz not null default now()
);

create index weight_logs_user_date_idx on public.weight_logs (user_id, date desc);

alter table public.weight_logs enable row level security;

create policy "weight_logs_select_own" on public.weight_logs for select using (auth.uid() = user_id);
create policy "weight_logs_insert_own" on public.weight_logs for insert with check (auth.uid() = user_id);
create policy "weight_logs_update_own" on public.weight_logs for update using (auth.uid() = user_id);
create policy "weight_logs_delete_own" on public.weight_logs for delete using (auth.uid() = user_id);

-- walk_logs
create table public.walk_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  duration_min int not null check (duration_min > 0 and duration_min <= 1440),
  distance_km numeric(5,2) check (distance_km is null or (distance_km >= 0 and distance_km < 200)),
  notes text check (notes is null or char_length(notes) <= 280),
  logged_at timestamptz not null default now()
);

create index walk_logs_user_date_idx on public.walk_logs (user_id, date desc);

alter table public.walk_logs enable row level security;

create policy "walk_logs_select_own" on public.walk_logs for select using (auth.uid() = user_id);
create policy "walk_logs_insert_own" on public.walk_logs for insert with check (auth.uid() = user_id);
create policy "walk_logs_update_own" on public.walk_logs for update using (auth.uid() = user_id);
create policy "walk_logs_delete_own" on public.walk_logs for delete using (auth.uid() = user_id);

-- Add goal_weight_kg to profiles
alter table public.profiles
  add column if not exists goal_weight_kg numeric(5,2)
    check (goal_weight_kg is null or (goal_weight_kg > 0 and goal_weight_kg < 500));
