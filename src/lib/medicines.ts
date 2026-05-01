import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { format } from "date-fns";

export type Medicine = {
  id: string;
  name: string;
  dosage: string | null;
  notes: string | null;
  schedule_times: string[];
  schedule_days: number[];
  active: boolean;
  start_date: string;
  end_date: string | null;
  color: string | null;
};

export type MedicineLog = {
  id: string;
  medicine_id: string;
  date: string;
  scheduled_time: string;
  status: string;
  taken_at: string;
};

export type DoseRow = {
  medicine: Medicine;
  scheduled_time: string;
  log: MedicineLog | null;
};

function isScheduledToday(m: Medicine, date: Date): boolean {
  if (!m.active) return false;
  const today = format(date, "yyyy-MM-dd");
  if (m.start_date && today < m.start_date) return false;
  if (m.end_date && today > m.end_date) return false;
  if (m.schedule_days.length === 0) return true;
  return m.schedule_days.includes(date.getDay());
}

export function useMedicines() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedicineLog[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [{ data: meds }, { data: logs }] = await Promise.all([
      supabase.from("medicines").select("*").order("created_at", { ascending: true }),
      supabase.from("medicine_logs").select("*").eq("date", today),
    ]);
    if (meds) setMedicines(meds as Medicine[]);
    if (logs) setTodayLogs(logs as MedicineLog[]);
    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Build today's dose schedule
  const now = new Date();
  const doses: DoseRow[] = [];
  for (const m of medicines) {
    if (!isScheduledToday(m, now)) continue;
    for (const t of m.schedule_times) {
      const log = todayLogs.find((l) => l.medicine_id === m.id && l.scheduled_time === t) ?? null;
      doses.push({ medicine: m, scheduled_time: t, log });
    }
  }
  doses.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));

  const takenCount = doses.filter((d) => d.log?.status === "taken").length;
  const totalCount = doses.length;

  const markTaken = useCallback(
    async (medicine_id: string, scheduled_time: string, status: "taken" | "skipped" = "taken") => {
      if (!user) return { error: new Error("not signed in") };
      const { error } = await supabase
        .from("medicine_logs")
        .upsert(
          {
            user_id: user.id,
            medicine_id,
            date: today,
            scheduled_time,
            status,
            taken_at: new Date().toISOString(),
          },
          { onConflict: "user_id,medicine_id,date,scheduled_time" }
        );
      if (!error) await fetchAll();
      return { error };
    },
    [user, today, fetchAll]
  );

  const undoDose = useCallback(
    async (log_id: string) => {
      const { error } = await supabase.from("medicine_logs").delete().eq("id", log_id);
      if (!error) await fetchAll();
      return { error };
    },
    [fetchAll]
  );

  const saveMedicine = useCallback(
    async (input: Partial<Medicine> & { name: string; schedule_times: string[] }, id?: string) => {
      if (!user) return { error: new Error("not signed in") };
      if (id) {
        const { error } = await supabase.from("medicines").update(input).eq("id", id);
        if (!error) await fetchAll();
        return { error };
      }
      const { error } = await supabase.from("medicines").insert({
        user_id: user.id,
        name: input.name,
        dosage: input.dosage ?? null,
        notes: input.notes ?? null,
        schedule_times: input.schedule_times,
        schedule_days: input.schedule_days ?? [],
        active: input.active ?? true,
        color: input.color ?? null,
        start_date: input.start_date ?? today,
        end_date: input.end_date ?? null,
      });
      if (!error) await fetchAll();
      return { error };
    },
    [user, today, fetchAll]
  );

  const deleteMedicine = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("medicines").delete().eq("id", id);
      if (!error) await fetchAll();
      return { error };
    },
    [fetchAll]
  );

  return {
    medicines,
    doses,
    takenCount,
    totalCount,
    loading,
    markTaken,
    undoDose,
    saveMedicine,
    deleteMedicine,
    refresh: fetchAll,
  };
}
