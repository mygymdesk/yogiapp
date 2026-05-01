import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";

export type DayPoint = { date: string; label: string; value: number };

export function useInsights(days: number = 7) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [water, setWater] = useState<DayPoint[]>([]);
  const [walk, setWalk] = useState<DayPoint[]>([]);
  const [weight, setWeight] = useState<DayPoint[]>([]);
  const [kcal, setKcal] = useState<DayPoint[]>([]);
  const [medAdh, setMedAdh] = useState<DayPoint[]>([]);
  const [streak, setStreak] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const end = startOfDay(new Date());
    const start = subDays(end, days - 1);
    const startStr = format(start, "yyyy-MM-dd");
    const startISO = start.toISOString();

    const days_arr = eachDayOfInterval({ start, end });
    const skel = days_arr.map((d) => ({
      date: format(d, "yyyy-MM-dd"),
      label: format(d, days <= 7 ? "EEE" : "d MMM"),
      value: 0,
    }));
    const byDate = (key: string) => skel.findIndex((s) => s.date === key);

    const [waterRes, walkRes, weightRes, mealRes, foodRes, medRes, medLogRes] =
      await Promise.all([
        supabase.from("water_logs").select("amount_ml,logged_at").gte("logged_at", startISO),
        supabase.from("walk_logs").select("date,duration_min").gte("date", startStr),
        supabase
          .from("weight_logs")
          .select("date,weight_kg,logged_at")
          .gte("date", startStr)
          .order("logged_at", { ascending: true }),
        supabase.from("meal_logs").select("id,date").gte("date", startStr),
        supabase.from("food_log_items").select("kcal,meal_log_id"),
        supabase.from("medicines").select("id,schedule_times,schedule_days,active,start_date,end_date"),
        supabase.from("medicine_logs").select("date,status,medicine_id").gte("date", startStr),
      ]);

    // Water by day
    const waterArr = skel.map((s) => ({ ...s }));
    (waterRes.data ?? []).forEach((r: any) => {
      const d = format(new Date(r.logged_at), "yyyy-MM-dd");
      const i = byDate(d);
      if (i >= 0) waterArr[i].value += r.amount_ml ?? 0;
    });
    setWater(waterArr);

    // Walk by day
    const walkArr = skel.map((s) => ({ ...s }));
    (walkRes.data ?? []).forEach((r: any) => {
      const i = byDate(r.date);
      if (i >= 0) walkArr[i].value += r.duration_min ?? 0;
    });
    setWalk(walkArr);

    // Weight - take latest entry per day, carry forward
    const weightArr = skel.map((s) => ({ ...s, value: 0 as number }));
    const wByDay = new Map<string, number>();
    (weightRes.data ?? []).forEach((r: any) => wByDay.set(r.date, r.weight_kg));
    let last = 0;
    weightArr.forEach((p, i) => {
      if (wByDay.has(p.date)) last = wByDay.get(p.date)!;
      weightArr[i].value = last;
    });
    setWeight(weightArr);

    // Diet kcal — sum food_log_items per meal then per day
    const mealDate = new Map<string, string>();
    (mealRes.data ?? []).forEach((m: any) => mealDate.set(m.id, m.date));
    const kcalArr = skel.map((s) => ({ ...s }));
    (foodRes.data ?? []).forEach((it: any) => {
      const d = mealDate.get(it.meal_log_id);
      if (!d) return;
      const i = byDate(d);
      if (i >= 0) kcalArr[i].value += Number(it.kcal) || 0;
    });
    setKcal(kcalArr);

    // Medicine adherence per day = taken / scheduled (for active meds where day-of-week matches)
    const meds = (medRes.data ?? []) as any[];
    const logs = (medLogRes.data ?? []) as any[];
    const medArr = skel.map((s) => ({ ...s }));
    skel.forEach((s, i) => {
      const dayObj = new Date(s.date + "T00:00:00");
      const dow = dayObj.getDay();
      let scheduled = 0;
      meds.forEach((m) => {
        if (!m.active) return;
        if (m.start_date && s.date < m.start_date) return;
        if (m.end_date && s.date > m.end_date) return;
        const days: number[] = m.schedule_days ?? [];
        if (days.length && !days.includes(dow)) return;
        scheduled += (m.schedule_times ?? []).length;
      });
      const taken = logs.filter((l) => l.date === s.date && l.status === "taken").length;
      medArr[i].value = scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0;
    });
    setMedAdh(medArr);

    // Streak: consecutive days (from today backwards) where any activity logged
    let s = 0;
    for (let i = skel.length - 1; i >= 0; i--) {
      const has =
        waterArr[i].value > 0 ||
        walkArr[i].value > 0 ||
        kcalArr[i].value > 0 ||
        weightArr[i].value > 0 ||
        medArr[i].value > 0;
      if (has) s++;
      else break;
    }
    setStreak(s);

    setLoading(false);
  }, [user, days]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { loading, water, walk, weight, kcal, medAdh, streak, refresh: fetchAll };
}
