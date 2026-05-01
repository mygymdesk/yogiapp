import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, X, Check, Pencil } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { useFoodSearch, useTodayMeals, addCustomFood, SLOT_LABELS, type Food } from "@/lib/diet";
import { useAuth } from "@/lib/auth";
import { useToastStore, haptic } from "@/lib/feedback";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultSlot?: string;
}

type DraftItem = { food: Food; serving_g: number };

export function MealSheet({ open, onClose, defaultSlot = "snack" }: Props) {
  const [slot, setSlot] = useState(defaultSlot);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [picking, setPicking] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { logMeal } = useTodayMeals();
  const showToast = useToastStore((s) => s.show);

  const totals = useMemo(() => {
    let kcal = 0, p = 0, c = 0, f = 0;
    for (const it of items) {
      const k = it.serving_g / 100;
      kcal += it.food.kcal_per_100g * k;
      p += it.food.protein_per_100g * k;
      c += it.food.carbs_per_100g * k;
      f += it.food.fat_per_100g * k;
    }
    return { kcal, p, c, f };
  }, [items]);

  const reset = () => {
    setItems([]);
    setSlot(defaultSlot);
  };

  const submit = async () => {
    if (items.length === 0) return showToast("Add at least one food");
    setSaving(true);
    haptic();
    const { error } = await logMeal(slot, items);
    setSaving(false);
    if (error) return showToast(error.message);
    showToast("Logged");
    reset();
    onClose();
  };

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title="Log meal">
        <div className="px-5 pb-6 space-y-4">
          {/* Slot picker */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {Object.entries(SLOT_LABELS).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setSlot(k)}
                className={`px-3 py-1.5 rounded-full text-[12px] border whitespace-nowrap ${
                  slot === k
                    ? "bg-text-primary text-bg-base border-text-primary"
                    : "bg-bg-elevated border-border text-text-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Items */}
          <div className="space-y-2">
            {items.map((it, i) => {
              const factor = it.serving_g / 100;
              const k = Math.round(it.food.kcal_per_100g * factor);
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-elevated border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-text-primary truncate">{it.food.name}</div>
                    <div className="text-[11px] text-text-muted">
                      {it.serving_g}g · {k} kcal
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingIdx(i)}
                    className="size-8 flex items-center justify-center text-text-muted"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}
                    className="size-8 flex items-center justify-center text-text-muted"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setPicking(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-border text-text-secondary text-[14px]"
            >
              <Plus size={16} /> Add food
            </motion.button>
          </div>

          {/* Totals */}
          {items.length > 0 && (
            <div className="grid grid-cols-4 gap-2 pt-2">
              {[
                { l: "kcal", v: Math.round(totals.kcal) },
                { l: "P", v: totals.p.toFixed(0) + "g" },
                { l: "C", v: totals.c.toFixed(0) + "g" },
                { l: "F", v: totals.f.toFixed(0) + "g" },
              ].map((m) => (
                <div
                  key={m.l}
                  className="rounded-xl bg-bg-elevated/60 border border-border px-2 py-2.5 text-center"
                >
                  <div className="text-[10px] uppercase text-text-muted tracking-wider">{m.l}</div>
                  <div className="text-[15px] text-text-primary mt-0.5 tabular-nums">{m.v}</div>
                </div>
              ))}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={submit}
            disabled={saving || items.length === 0}
            className="w-full py-3.5 rounded-xl bg-text-primary text-bg-base font-medium text-[14px] disabled:opacity-30"
          >
            {saving ? "…" : "Log meal"}
          </motion.button>
        </div>
      </BottomSheet>

      <FoodPickerSheet
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(f) => {
          setItems((arr) => [...arr, { food: f, serving_g: f.default_serving_g }]);
          setPicking(false);
        }}
        onCreate={() => {
          setPicking(false);
          setCreating(true);
        }}
      />

      <ServingEditor
        item={editingIdx !== null ? items[editingIdx] : null}
        onClose={() => setEditingIdx(null)}
        onChange={(g) => {
          if (editingIdx === null) return;
          setItems((arr) => arr.map((it, i) => (i === editingIdx ? { ...it, serving_g: g } : it)));
        }}
      />

      <CustomFoodSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(f) => {
          setItems((arr) => [...arr, { food: f, serving_g: f.default_serving_g }]);
          setCreating(false);
        }}
      />
    </>
  );
}

function FoodPickerSheet({
  open,
  onClose,
  onPick,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (f: Food) => void;
  onCreate: () => void;
}) {
  const [q, setQ] = useState("");
  const { results, loading } = useFoodSearch(q);

  return (
    <BottomSheet open={open} onClose={onClose} title="Find food">
      <div className="px-5 pb-6">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search 540+ Indian foods…"
            className="w-full bg-bg-elevated border border-border rounded-xl pl-10 pr-4 py-3 text-[14px] text-text-primary outline-none focus:border-border-hover/40"
          />
        </div>

        <div className="mt-3 max-h-[50vh] overflow-y-auto no-scrollbar space-y-1.5">
          {loading && results.length === 0 ? (
            <div className="text-center text-text-muted text-[12px] py-6">Loading…</div>
          ) : results.length === 0 ? (
            <div className="text-center text-text-muted text-[12px] py-6">
              No matches. Add a custom food below.
            </div>
          ) : (
            results.map((f) => (
              <button
                key={f.id}
                onClick={() => onPick(f)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-elevated/60 border border-border hover:border-border-hover/40 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-text-primary truncate">{f.name}</div>
                  <div className="text-[11px] text-text-muted truncate">
                    {f.food_group ?? "Food"} · {Math.round(f.kcal_per_100g)} kcal/100g
                  </div>
                </div>
                <div className="text-text-muted">
                  <Plus size={16} />
                </div>
              </button>
            ))
          )}
        </div>

        <button
          onClick={onCreate}
          className="mt-3 w-full text-center text-[12px] text-text-secondary border-t border-border pt-3"
        >
          Can't find it? <span className="text-text-primary">Add custom food</span>
        </button>
      </div>
    </BottomSheet>
  );
}

function ServingEditor({
  item,
  onClose,
  onChange,
}: {
  item: DraftItem | null;
  onClose: () => void;
  onChange: (g: number) => void;
}) {
  const [g, setG] = useState(item?.serving_g ?? 100);
  const lastId = item?.food.id;
  const [seenId, setSeenId] = useState<string | undefined>(lastId);
  if (lastId !== seenId) {
    setSeenId(lastId);
    setG(item?.serving_g ?? 100);
  }

  const presets = [25, 50, 100, 150, 200, 250];

  return (
    <BottomSheet open={!!item} onClose={onClose} title={item?.food.name ?? "Serving"}>
      <div className="px-5 pb-6 space-y-4">
        <div className="text-center">
          <div
            className="text-text-primary tabular-nums"
            style={{ fontFamily: "Fraunces, serif", fontSize: 56, fontWeight: 500 }}
          >
            {g}
            <span className="text-text-muted text-[20px] ml-1">g</span>
          </div>
          {item && (
            <div className="text-text-muted text-[12px] mt-1">
              {Math.round((item.food.kcal_per_100g * g) / 100)} kcal ·{" "}
              {((item.food.protein_per_100g * g) / 100).toFixed(1)}g P
            </div>
          )}
        </div>
        <input
          type="range"
          min={5}
          max={500}
          step={5}
          value={g}
          onChange={(e) => setG(Number(e.target.value))}
          className="w-full accent-text-primary"
        />
        <div className="grid grid-cols-6 gap-1.5">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setG(p)}
              className={`py-2 rounded-lg text-[12px] border ${
                g === p
                  ? "bg-text-primary text-bg-base border-text-primary"
                  : "bg-bg-elevated border-border text-text-secondary"
              }`}
            >
              {p}g
            </button>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            onChange(g);
            onClose();
          }}
          className="w-full py-3.5 rounded-xl bg-text-primary text-bg-base font-medium text-[14px]"
        >
          <Check size={16} className="inline mr-1" /> Done
        </motion.button>
      </div>
    </BottomSheet>
  );
}

function CustomFoodSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (f: Food) => void;
}) {
  const { user } = useAuth();
  const showToast = useToastStore((s) => s.show);
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!name.trim()) return showToast("Name required");
    setSaving(true);
    haptic();
    const { data, error } = await addCustomFood(user.id, {
      name: name.trim(),
      kcal_per_100g: Number(kcal) || 0,
      protein_per_100g: Number(p) || 0,
      carbs_per_100g: Number(c) || 0,
      fat_per_100g: Number(f) || 0,
    });
    setSaving(false);
    if (error || !data) return showToast(error?.message ?? "Failed");
    showToast("Added");
    setName(""); setKcal(""); setP(""); setC(""); setF("");
    onCreated(data as Food);
  };

  const inputCls =
    "w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-[15px] text-text-primary outline-none focus:border-border-hover/40";

  return (
    <BottomSheet open={open} onClose={onClose} title="Add custom food">
      <div className="px-5 pb-6 space-y-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">Name</div>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted">
          Per 100g
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { l: "kcal", v: kcal, set: setKcal },
            { l: "Protein (g)", v: p, set: setP },
            { l: "Carbs (g)", v: c, set: setC },
            { l: "Fat (g)", v: f, set: setF },
          ].map((x) => (
            <div key={x.l}>
              <div className="text-[11px] text-text-muted mb-1">{x.l}</div>
              <input
                type="number"
                inputMode="decimal"
                value={x.v}
                onChange={(e) => x.set(e.target.value)}
                className={inputCls}
              />
            </div>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={submit}
          disabled={saving}
          className="w-full mt-2 py-3.5 rounded-xl bg-text-primary text-bg-base font-medium text-[14px] disabled:opacity-30"
        >
          {saving ? "…" : "Add to library"}
        </motion.button>
      </div>
    </BottomSheet>
  );
}
