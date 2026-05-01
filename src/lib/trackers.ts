import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { format } from "date-fns";

export const DEFAULT_WATER_TARGET_ML = 2500;

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
