-- profiles
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  dob date,
  daily_water_target_ml int not null default 2500,
  walking_target_min int not null default 30,
  weight_unit text not null default 'kg',
  height_cm numeric,
  timezone text not null default 'Asia/Kolkata',
  quiet_hours_start time not null default '23:00',
  quiet_hours_end time not null default '07:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- water_logs
create table public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_ml int not null check (amount_ml > 0 and amount_ml <= 5000),
  logged_at timestamptz not null default now()
);

create index water_logs_user_logged_at_idx on public.water_logs (user_id, logged_at desc);

alter table public.water_logs enable row level security;

create policy "water_logs_select_own" on public.water_logs for select using (auth.uid() = user_id);
create policy "water_logs_insert_own" on public.water_logs for insert with check (auth.uid() = user_id);
create policy "water_logs_update_own" on public.water_logs for update using (auth.uid() = user_id);
create policy "water_logs_delete_own" on public.water_logs for delete using (auth.uid() = user_id);

-- mood_logs
create table public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  mood int not null check (mood between 1 and 5),
  note text check (char_length(note) <= 280),
  tags text[] not null default '{}',
  logged_at timestamptz not null default now()
);

create index mood_logs_user_date_idx on public.mood_logs (user_id, date desc);

alter table public.mood_logs enable row level security;

create policy "mood_logs_select_own" on public.mood_logs for select using (auth.uid() = user_id);
create policy "mood_logs_insert_own" on public.mood_logs for insert with check (auth.uid() = user_id);
create policy "mood_logs_update_own" on public.mood_logs for update using (auth.uid() = user_id);
create policy "mood_logs_delete_own" on public.mood_logs for delete using (auth.uid() = user_id);
