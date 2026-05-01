import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Pencil, Check, Trash2, Clock } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { useMedicines, type Medicine } from "@/lib/medicines";
import { useToastStore, haptic } from "@/lib/feedback";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MedicineSheet({ open, onClose }: Props) {
  const { doses, markTaken, undoDose, medicines } = useMedicines();
  const showToast = useToastStore((s) => s.show);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);

  const onToggle = async (medicine_id: string, scheduled_time: string, taken: boolean, log_id?: string | null) => {
    haptic();
    if (taken && log_id) {
      const { error } = await undoDose(log_id);
      if (error) showToast(error.message);
    } else {
      const { error } = await markTaken(medicine_id, scheduled_time, "taken");
      if (error) showToast(error.message);
      else showToast("Logged");
    }
  };

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title="Medicine">
        <div className="px-5 pb-6">
          {doses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-text-muted text-[14px]">No doses scheduled for today.</p>
              <p className="text-text-muted text-[12px] mt-1">Add a medicine to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {doses.map((d) => {
                const taken = d.log?.status === "taken";
                return (
                  <motion.button
                    key={`${d.medicine.id}-${d.scheduled_time}`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onToggle(d.medicine.id, d.scheduled_time, taken, d.log?.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition ${
                      taken
                        ? "bg-success/10 border-success/30"
                        : "bg-bg-elevated border-border hover:border-border-hover/40"
                    }`}
                  >
                    <div
                      className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                        taken ? "bg-success text-bg-base" : "bg-bg-surface border border-border text-text-muted"
                      }`}
                    >
                      {taken ? <Check size={18} /> : <Clock size={16} />}
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`text-[15px] ${taken ? "text-text-secondary line-through" : "text-text-primary"}`}>
                        {d.medicine.name}
                      </div>
                      <div className="text-[12px] text-text-muted">
                        {d.scheduled_time}
                        {d.medicine.dosage ? ` · ${d.medicine.dosage}` : ""}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          <div className="mt-6">
            <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-3">
              All medicines
            </div>
            <div className="space-y-2">
              {medicines.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-elevated/60 border border-border"
                >
                  <div className="flex-1">
                    <div className="text-[14px] text-text-primary">{m.name}</div>
                    <div className="text-[11px] text-text-muted">
                      {m.schedule_times.join(", ") || "No times"}
                      {m.dosage ? ` · ${m.dosage}` : ""}
                      {!m.active ? " · paused" : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditing(m);
                      setEditorOpen(true);
                    }}
                    className="size-8 flex items-center justify-center text-text-muted hover:text-text-primary"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-dashed border-border text-text-secondary text-[14px]"
            >
              <Plus size={16} />
              Add medicine
            </motion.button>
          </div>
        </div>
      </BottomSheet>

      <MedicineEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        medicine={editing}
      />
    </>
  );
}

function MedicineEditor({
  open,
  onClose,
  medicine,
}: {
  open: boolean;
  onClose: () => void;
  medicine: Medicine | null;
}) {
  const { saveMedicine, deleteMedicine } = useMedicines();
  const showToast = useToastStore((s) => s.show);
  const [name, setName] = useState(medicine?.name ?? "");
  const [dosage, setDosage] = useState(medicine?.dosage ?? "");
  const [times, setTimes] = useState<string[]>(medicine?.schedule_times ?? ["08:00"]);
  const [active, setActive] = useState(medicine?.active ?? true);
  const [saving, setSaving] = useState(false);

  // Reset form when medicine changes / sheet opens
  const key = medicine?.id ?? "new";
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setName(medicine?.name ?? "");
    setDosage(medicine?.dosage ?? "");
    setTimes(medicine?.schedule_times ?? ["08:00"]);
    setActive(medicine?.active ?? true);
  }

  const addTime = () => setTimes((t) => [...t, "20:00"]);
  const updateTime = (i: number, v: string) =>
    setTimes((t) => t.map((x, idx) => (idx === i ? v : x)));
  const removeTime = (i: number) => setTimes((t) => t.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!name.trim()) return showToast("Name is required");
    if (times.length === 0) return showToast("Add at least one time");
    setSaving(true);
    haptic();
    const { error } = await saveMedicine(
      {
        name: name.trim(),
        dosage: dosage.trim() || null,
        schedule_times: times,
        active,
      },
      medicine?.id
    );
    setSaving(false);
    if (error) return showToast(error.message);
    showToast(medicine ? "Updated" : "Added");
    onClose();
  };

  const onDelete = async () => {
    if (!medicine) return;
    haptic();
    const { error } = await deleteMedicine(medicine.id);
    if (error) return showToast(error.message);
    showToast("Removed");
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={medicine ? "Edit medicine" : "Add medicine"}
    >
      <div className="px-5 pb-6 space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">Name</div>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vitamin D"
            className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-[15px] text-text-primary outline-none focus:border-border-hover/40"
          />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
            Dosage (optional)
          </div>
          <input
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g. 1 tablet, 500mg"
            className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-[15px] text-text-primary outline-none focus:border-border-hover/40"
          />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">Times</div>
          <div className="space-y-2">
            {times.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  value={t}
                  onChange={(e) => updateTime(i, e.target.value)}
                  className="flex-1 bg-bg-elevated border border-border rounded-xl px-4 py-3 text-[15px] text-text-primary outline-none focus:border-border-hover/40"
                  style={{ fontFamily: "Geist Mono, monospace" }}
                />
                {times.length > 1 && (
                  <button
                    onClick={() => removeTime(i)}
                    className="size-11 flex items-center justify-center rounded-xl border border-border text-text-muted"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addTime}
            className="mt-2 text-[13px] text-text-secondary flex items-center gap-1"
          >
            <Plus size={14} /> Add another time
          </button>
        </div>
        <button
          onClick={() => setActive((a) => !a)}
          className="w-full flex items-center justify-between py-3"
        >
          <span className="text-[14px] text-text-primary">Active</span>
          <span
            className={`w-11 h-6 rounded-full relative transition ${
              active ? "bg-success" : "bg-bg-surface border border-border"
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-text-primary transition-all ${
                active ? "left-[22px]" : "left-0.5"
              }`}
            />
          </span>
        </button>

        <div className="flex gap-2 pt-2">
          {medicine && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onDelete}
              className="size-12 shrink-0 flex items-center justify-center rounded-xl border border-danger/30 text-danger"
            >
              <Trash2 size={16} />
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={submit}
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl bg-text-primary text-bg-base font-medium text-[14px] disabled:opacity-30"
          >
            {saving ? "…" : medicine ? "Save changes" : "Add medicine"}
          </motion.button>
        </div>
      </div>
    </BottomSheet>
  );
}
