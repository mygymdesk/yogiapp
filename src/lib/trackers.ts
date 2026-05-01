import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { format } from "date-fns";

export const DEFAULT_WATER_TARGET_ML = 2500;
export const DEFAULT_WALK_TARGET_MIN = 30;

export type WeightLog = {
  id: string;
  date: string;
  weight_kg: number;
  body_fat_pct: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  logged_at: string;
};

export type WalkLog = {
  id: string;
  date: string;
  duration_min: number;
  distance_km: number | null;
  notes: string | null;
  logged_at: string;
};

const todayStr = () => format(new Date(), "yyyy-MM-dd");

// ============================================================
// WATER
// ============================================================
export function useTodayWater() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = todayStr();
  const key = ["water", "today", user?.id, today] as const;

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("water_logs")
        .select("amount_ml")
        .gte("logged_at", start.toISOString());
      if (error) throw error;
      return (data ?? []).reduce((s, r) => s + (r.amount_ml ?? 0), 0);
    },
  });

  const totalMl = query.data ?? 0;

  const addWater = useCallback(
    async (amount_ml: number) => {
      if (!user) return { error: new Error("not signed in") };
      // Optimistic update
      qc.setQueryData<number>(key, (prev) => (prev ?? 0) + amount_ml);
      const { error } = await supabase
        .from("water_logs")
        .insert({ amount_ml, user_id: user.id });
      if (error) {
        qc.setQueryData<number>(key, (prev) => (prev ?? 0) - amount_ml);
        return { error };
      }
      qc.invalidateQueries({ queryKey: key });
      return { error: null };
    },
    [user, qc, key]
  );

  return {
    totalMl,
    loading: query.isLoading,
    addWater,
    refresh: () => qc.invalidateQueries({ queryKey: key }),
  };
}

// ============================================================
// MOOD
// ============================================================
export function useTodayMood() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = todayStr();
  const key = ["mood", "today", user?.id, today] as const;

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("mood_logs")
        .select("mood,note,tags")
        .eq("date", today)
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data
        ? { mood: data.mood, note: data.note, tags: data.tags ?? [] }
        : null;
    },
  });

  const save = useCallback(
    async (m: number, note: string, tags: string[]) => {
      if (!user) return { error: new Error("not signed in") };
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, { mood: m, note: note || null, tags });
      const { error } = await supabase.from("mood_logs").insert({
        user_id: user.id,
        date: today,
        mood: m,
        note: note || null,
        tags,
      });
      if (error) {
        qc.setQueryData(key, prev);
        return { error };
      }
      qc.invalidateQueries({ queryKey: key });
      return { error: null };
    },
    [user, today, qc, key]
  );

  return { mood: query.data ?? null, loading: query.isLoading, save };
}

// ============================================================
// WEIGHT
// ============================================================
export function useWeightLogs(days: number = 90) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["weight", user?.id, days] as const;

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await supabase
        .from("weight_logs")
        .select("id,date,weight_kg,body_fat_pct,waist_cm,chest_cm,logged_at")
        .gte("date", format(since, "yyyy-MM-dd"))
        .order("logged_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as WeightLog[];
    },
  });

  const logs = query.data ?? [];

  const latestPerDay = (() => {
    const map = new Map<string, WeightLog>();
    for (const l of logs) map.set(l.date, l);
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  })();

  const latest = latestPerDay[latestPerDay.length - 1] ?? null;
  const previous = latestPerDay[latestPerDay.length - 2] ?? null;
  const delta = latest && previous ? latest.weight_kg - previous.weight_kg : null;

  const save = useCallback(
    async (input: {
      weight_kg: number;
      body_fat_pct?: number | null;
      waist_cm?: number | null;
      chest_cm?: number | null;
      date?: string;
    }) => {
      if (!user) return { error: new Error("not signed in") };
      const { error } = await supabase.from("weight_logs").insert({
        user_id: user.id,
        date: input.date ?? todayStr(),
        weight_kg: input.weight_kg,
        body_fat_pct: input.body_fat_pct ?? null,
        waist_cm: input.waist_cm ?? null,
        chest_cm: input.chest_cm ?? null,
      });
      if (error) return { error };
      await qc.invalidateQueries({ queryKey: ["weight", user.id] });
      return { error: null };
    },
    [user, qc]
  );

  return {
    logs: latestPerDay,
    allLogs: logs,
    latest,
    delta,
    loading: query.isLoading,
    save,
    refresh: () => qc.invalidateQueries({ queryKey: ["weight", user?.id] }),
  };
}

// ============================================================
// WALKING
// ============================================================
export function useWalkLogs(days: number = 7) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["walk", user?.id, days] as const;
  const today = todayStr();

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await supabase
        .from("walk_logs")
        .select("id,date,duration_min,distance_km,notes,logged_at")
        .gte("date", format(since, "yyyy-MM-dd"))
        .order("logged_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WalkLog[];
    },
  });

  const logs = query.data ?? [];
  const todayLogs = logs.filter((l) => l.date === today);
  const todayMinutes = todayLogs.reduce((s, l) => s + l.duration_min, 0);
  const todayKm = todayLogs.reduce((s, l) => s + (l.distance_km ?? 0), 0);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["walk", user?.id] });

  const save = useCallback(
    async (input: {
      duration_min: number;
      distance_km?: number | null;
      notes?: string | null;
    }) => {
      if (!user) return { error: new Error("not signed in") };
      const { error } = await supabase.from("walk_logs").insert({
        user_id: user.id,
        date: today,
        duration_min: input.duration_min,
        distance_km: input.distance_km ?? null,
        notes: input.notes?.trim() || null,
      });
      if (error) return { error };
      await invalidate();
      return { error: null };
    },
    [user, today]
  );

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("walk_logs").delete().eq("id", id);
    if (!error) await invalidate();
    return { error };
  }, []);

  return {
    logs,
    todayLogs,
    todayMinutes,
    todayKm,
    loading: query.isLoading,
    save,
    remove,
    refresh: invalidate,
  };
}

// ============================================================
// PROFILE
// ============================================================
export type Profile = {
  user_id: string;
  display_name: string | null;
  daily_water_target_ml: number;
  walking_target_min: number;
  weight_unit: string;
  height_cm: number | null;
  goal_weight_kg: number | null;
  timezone: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
};

export function useProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
    staleTime: 5 * 60_000, // profile changes are rare; cache 5 min
  });

  const update = useCallback(
    async (patch: Partial<Profile>) => {
      if (!user) return { error: new Error("not signed in") };
      const { error } = await supabase.from("profiles").update(patch).eq("user_id", user.id);
      if (!error) await qc.invalidateQueries({ queryKey: ["profile", user.id] });
      return { error };
    },
    [user, qc]
  );

  return {
    profile: query.data ?? null,
    loading: query.isLoading,
    update,
    refresh: () => qc.invalidateQueries({ queryKey: ["profile", user?.id] }),
  };
}
