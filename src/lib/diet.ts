import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { format } from "date-fns";

export type Food = {
  id: string;
  name: string;
  food_group: string | null;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  default_serving_g: number;
  tags: string[];
  is_system: boolean;
};

export type FoodLogItem = {
  id: string;
  meal_log_id: string;
  food_id: string | null;
  food_name: string;
  serving_g: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type MealLog = {
  id: string;
  date: string;
  slot: string;
  logged_at: string;
  note: string | null;
  items?: FoodLogItem[];
};

export type MealSlot = { key: string; label: string; kcal: number };

export const SLOT_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
  dinner: "Dinner",
};

// Search foods by name (system + user) — debounced via React Query keyed cache
export function useFoodSearch(query: string) {
  const trimmed = query.trim();
  const q = useQuery({
    queryKey: ["foods", "search", trimmed],
    queryFn: async () => {
      let req = supabase
        .from("foods")
        .select("*")
        .order("is_system", { ascending: true })
        .order("name", { ascending: true })
        .limit(40);
      if (trimmed.length > 0) req = req.ilike("name", `%${trimmed}%`);
      const { data, error } = await req;
      if (error) throw error;
      return (data ?? []) as Food[];
    },
    staleTime: 60_000,
  });

  return { results: q.data ?? [], loading: q.isLoading };
}

// Today's meals + macros
export function useTodayMeals() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const key = ["meals", "today", user?.id, today] as const;

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data: ml } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("date", today)
        .order("logged_at", { ascending: true });
      if (!ml || ml.length === 0) return [] as MealLog[];
      const ids = ml.map((m) => m.id);
      const { data: items } = await supabase
        .from("food_log_items")
        .select("*")
        .in("meal_log_id", ids);
      const grouped = new Map<string, FoodLogItem[]>();
      for (const it of (items ?? []) as FoodLogItem[]) {
        const arr = grouped.get(it.meal_log_id) ?? [];
        arr.push(it);
        grouped.set(it.meal_log_id, arr);
      }
      return ml.map((m) => ({
        ...(m as MealLog),
        items: grouped.get(m.id) ?? [],
      }));
    },
  });

  const meals = query.data ?? [];

  const totals = useMemo(() => {
    let kcal = 0,
      protein = 0,
      carbs = 0,
      fat = 0,
      fiber = 0;
    for (const m of meals)
      for (const it of m.items ?? []) {
        kcal += Number(it.kcal);
        protein += Number(it.protein);
        carbs += Number(it.carbs);
        fat += Number(it.fat);
        fiber += Number(it.fiber);
      }
    return { kcal, protein, carbs, fat, fiber };
  }, [meals]);

  const totalsBySlot = useMemo(() => {
    const m: Record<string, number> = {};
    for (const meal of meals) {
      const sum = (meal.items ?? []).reduce(
        (s, it) => s + Number(it.kcal),
        0
      );
      m[meal.slot] = (m[meal.slot] ?? 0) + sum;
    }
    return m;
  }, [meals]);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["meals", "today", user?.id] });

  const logMeal = useCallback(
    async (
      slot: string,
      items: { food: Food; serving_g: number }[],
      note?: string
    ) => {
      if (!user || items.length === 0)
        return { error: new Error("nothing to log") };
      const { data: meal, error: mErr } = await supabase
        .from("meal_logs")
        .insert({ user_id: user.id, slot, date: today, note: note || null })
        .select()
        .single();
      if (mErr || !meal) return { error: mErr };
      const rows = items.map((it) => {
        const f = it.food;
        const factor = it.serving_g / 100;
        return {
          meal_log_id: meal.id,
          user_id: user.id,
          food_id: f.id,
          food_name: f.name,
          serving_g: it.serving_g,
          kcal: +(f.kcal_per_100g * factor).toFixed(1),
          protein: +(f.protein_per_100g * factor).toFixed(2),
          carbs: +(f.carbs_per_100g * factor).toFixed(2),
          fat: +(f.fat_per_100g * factor).toFixed(2),
          fiber: +(f.fiber_per_100g * factor).toFixed(2),
        };
      });
      const { error } = await supabase.from("food_log_items").insert(rows);
      if (!error) await invalidate();
      return { error };
    },
    [user, today]
  );

  const removeMeal = useCallback(async (id: string) => {
    const { error } = await supabase.from("meal_logs").delete().eq("id", id);
    if (!error) await invalidate();
    return { error };
  }, []);

  return {
    meals,
    totals,
    totalsBySlot,
    loading: query.isLoading,
    logMeal,
    removeMeal,
    refresh: invalidate,
  };
}

// Add custom food
export async function addCustomFood(
  user_id: string,
  input: {
    name: string;
    kcal_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
    fiber_per_100g?: number;
    default_serving_g?: number;
  }
) {
  const { data, error } = await supabase
    .from("foods")
    .insert({
      user_id,
      is_system: false,
      source: "custom",
      name: input.name,
      kcal_per_100g: input.kcal_per_100g,
      protein_per_100g: input.protein_per_100g,
      carbs_per_100g: input.carbs_per_100g,
      fat_per_100g: input.fat_per_100g,
      fiber_per_100g: input.fiber_per_100g ?? 0,
      default_serving_g: input.default_serving_g ?? 100,
    })
    .select()
    .single();
  return { data, error };
}
