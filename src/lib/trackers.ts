import { useCallback, useEffect, useState } from "react";
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

export function useTodayWater() {
  const { user } = useAuth();
  const [totalMl, setTotalMl] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchToday = useCallback(async () => {
    if (!user) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from("water_logs")
      .select("amount_ml")
      .gte("logged_at", start.toISOString());
    if (!error && data) {
      setTotalMl(data.reduce((s, r) => s + (r.amount_ml ?? 0), 0));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const addWater = useCallback(
    async (amount_ml: number) => {
      if (!user) return { error: new Error("not signed in") };
      // Optimistic
      setTotalMl((t) => t + amount_ml);
      const { error } = await supabase
        .from("water_logs")
        .insert({ amount_ml, user_id: user.id });
      if (error) {
        setTotalMl((t) => t - amount_ml); // rollback
        return { error };
      }
      return { error: null };
    },
    [user]
  );

  return { totalMl, loading, addWater, refresh: fetchToday };
}

export function useTodayMood() {
  const { user } = useAuth();
  const [mood, setMood] = useState<{
    mood: number;
    note: string | null;
    tags: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("mood_logs")
      .select("mood,note,tags")
      .eq("date", today)
      .order("logged_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setMood({ mood: data.mood, note: data.note, tags: data.tags ?? [] });
    else setMood(null);
    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const save = useCallback(
    async (m: number, note: string, tags: string[]) => {
      if (!user) return { error: new Error("not signed in") };
      const prev = mood;
      setMood({ mood: m, note: note || null, tags });
      const { error } = await supabase.from("mood_logs").insert({
        user_id: user.id,
        date: today,
        mood: m,
        note: note || null,
        tags,
      });
      if (error) {
        setMood(prev);
        return { error };
      }
      return { error: null };
    },
    [user, today, mood]
  );

  return { mood, loading, save };
}

// ============================================================
// WEIGHT
// ============================================================
export function useWeightLogs(days: number = 90) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data } = await supabase
      .from("weight_logs")
      .select("id,date,weight_kg,body_fat_pct,waist_cm,chest_cm,logged_at")
      .gte("date", format(since, "yyyy-MM-dd"))
      .order("logged_at", { ascending: true });
    if (data) setLogs(data as WeightLog[]);
    setLoading(false);
  }, [user, days]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Latest entry per day (latest overwrites in display, history retained in DB)
  const latestPerDay = (() => {
    const map = new Map<string, WeightLog>();
    for (const l of logs) map.set(l.date, l); // last wins (sorted asc)
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
        date: input.date ?? format(new Date(), "yyyy-MM-dd"),
        weight_kg: input.weight_kg,
        body_fat_pct: input.body_fat_pct ?? null,
        waist_cm: input.waist_cm ?? null,
        chest_cm: input.chest_cm ?? null,
      });
      if (error) return { error };
      await fetchLogs();
      return { error: null };
    },
    [user, fetchLogs]
  );

  return { logs: latestPerDay, allLogs: logs, latest, delta, loading, save, refresh: fetchLogs };
}

// ============================================================
// WALKING
// ============================================================
export function useWalkLogs(days: number = 7) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WalkLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data } = await supabase
      .from("walk_logs")
      .select("id,date,duration_min,distance_km,notes,logged_at")
      .gte("date", format(since, "yyyy-MM-dd"))
      .order("logged_at", { ascending: false });
    if (data) setLogs(data as WalkLog[]);
    setLoading(false);
  }, [user, days]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayLogs = logs.filter((l) => l.date === today);
  const todayMinutes = todayLogs.reduce((s, l) => s + l.duration_min, 0);
  const todayKm = todayLogs.reduce((s, l) => s + (l.distance_km ?? 0), 0);

  const save = useCallback(
    async (input: { duration_min: number; distance_km?: number | null; notes?: string | null }) => {
      if (!user) return { error: new Error("not signed in") };
      const { error } = await supabase.from("walk_logs").insert({
        user_id: user.id,
        date: today,
        duration_min: input.duration_min,
        distance_km: input.distance_km ?? null,
        notes: input.notes?.trim() || null,
      });
      if (error) return { error };
      await fetchLogs();
      return { error: null };
    },
    [user, today, fetchLogs]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("walk_logs").delete().eq("id", id);
      if (!error) await fetchLogs();
      return { error };
    },
    [fetchLogs]
  );

  return { logs, todayLogs, todayMinutes, todayKm, loading, save, remove, refresh: fetchLogs };
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
