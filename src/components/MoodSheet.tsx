import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BottomSheet } from "./BottomSheet";
import { useTodayMood } from "@/lib/trackers";
import { haptic, useToastStore } from "@/lib/feedback";
import { X, Plus } from "lucide-react";

const EMOJIS = ["😞", "😕", "😐", "🙂", "😄"];
const DEFAULT_TAGS = ["#stressed", "#energetic", "#tired", "#great-sleep"];

export function MoodSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { mood: existing, save } = useTodayMood();
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [adding, setAdding] = useState(false);
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    if (open && existing) {
      setSelected(existing.mood);
      setNote(existing.note ?? "");
      setTags(existing.tags ?? []);
    } else if (open) {
      setSelected(null);
      setNote("");
      setTags([]);
    }
  }, [open, existing]);

  const toggleTag = (t: string) => {
    haptic();
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  };

  const submit = async () => {
    if (selected === null) return;
    haptic();
    const { error } = await save(selected, note.trim(), tags);
    if (!error) {
      showToast("Mood logged");
      onClose();
    }
  };

  const addCustomTag = () => {
    const cleaned = customTag.trim().replace(/^#?/, "#").toLowerCase();
    if (cleaned.length > 1 && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
    }
    setCustomTag("");
    setAdding(false);
  };

  const allTags = Array.from(new Set([...DEFAULT_TAGS, ...tags]));

  return (
    <BottomSheet open={open} onClose={onClose} title="How are you feeling?">
      <div className="flex flex-col">
        {/* Emoji scale */}
        <div className="flex items-center justify-between gap-2 px-1 py-2">
          {EMOJIS.map((e, i) => {
            const value = i + 1;
            const active = selected === value;
            return (
              <motion.button
                key={e}
                whileTap={{ scale: 0.85 }}
                animate={{ scale: active ? 1.15 : 1, opacity: active || selected === null ? 1 : 0.45 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                onClick={() => {
                  haptic();
                  setSelected(value);
                }}
                className={`size-14 rounded-2xl flex items-center justify-center text-[32px] ${
                  active ? "bg-acc-mood/15 border border-acc-mood/40" : "bg-bg-elevated border border-border"
                }`}
              >
                {e}
              </motion.button>
            );
          })}
        </div>

        {/* Note */}
        <div className="mt-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
            Note <span className="text-text-muted/60 normal-case tracking-normal">— optional</span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 280))}
            placeholder="One line on your day…"
            rows={2}
            className="w-full bg-bg-elevated border border-border rounded-2xl px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-border-hover/40"
          />
          <div className="text-[11px] text-text-muted text-right mt-1">{note.length}/280</div>
        </div>

        {/* Tags */}
        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">Tags</div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((t) => {
              const active = tags.includes(t);
              return (
                <motion.button
                  key={t}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => toggleTag(t)}
                  className={`px-3 py-1.5 rounded-full text-[12px] border ${
                    active
                      ? "bg-acc-mood/15 border-acc-mood/40 text-acc-mood"
                      : "bg-bg-elevated border-border text-text-secondary"
                  }`}
                >
                  {t}
                </motion.button>
              );
            })}
            {adding ? (
              <div className="flex items-center gap-1 bg-bg-elevated border border-border-hover/30 rounded-full px-3 py-1.5">
                <input
                  autoFocus
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value.slice(0, 24))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addCustomTag();
                    if (e.key === "Escape") {
                      setCustomTag("");
                      setAdding(false);
                    }
                  }}
                  onBlur={addCustomTag}
                  placeholder="custom"
                  className="bg-transparent outline-none text-[12px] text-text-primary w-20"
                />
                <X size={12} className="text-text-muted" onClick={() => { setCustomTag(""); setAdding(false); }} />
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setAdding(true)}
                className="px-3 py-1.5 rounded-full text-[12px] border border-dashed border-border text-text-muted flex items-center gap-1"
              >
                <Plus size={12} /> Add
              </motion.button>
            )}
          </div>
        </div>

        {/* Save */}
        <motion.button
          whileTap={selected !== null ? { scale: 0.98 } : undefined}
          onClick={submit}
          disabled={selected === null}
          className="mt-6 w-full py-3.5 rounded-2xl bg-text-primary text-bg-base font-medium text-[14px] disabled:opacity-30 disabled:bg-bg-elevated disabled:text-text-muted"
        >
          {existing ? "Update mood" : "Log mood"}
        </motion.button>
      </div>
    </BottomSheet>
  );
}
