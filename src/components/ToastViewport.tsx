import { AnimatePresence, motion } from "framer-motion";
import { Check, AlertTriangle } from "lucide-react";
import { useToastStore, type ToastVariant } from "@/lib/feedback";

const tone: Record<ToastVariant, { icon: React.ReactNode; ring: string; text: string }> = {
  default: { icon: null, ring: "rgba(255,255,255,0.10)", text: "var(--text-primary)" },
  success: {
    icon: <Check size={14} strokeWidth={2.5} />,
    ring: "rgba(110, 231, 183, 0.35)",
    text: "var(--success)",
  },
  error: {
    icon: <AlertTriangle size={14} strokeWidth={2.25} />,
    ring: "rgba(248, 113, 113, 0.35)",
    text: "var(--danger)",
  },
};

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-5"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const tn = tone[t.variant];
          return (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => dismiss(t.id)}
              initial={{ y: -28, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -12, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="pointer-events-auto bg-bg-elevated/95 backdrop-blur-md border rounded-full pl-3 pr-4 py-2 text-[13px] text-text-primary shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-2"
              style={{ borderColor: tn.ring }}
            >
              {tn.icon && (
                <span style={{ color: tn.text }} className="flex items-center">
                  {tn.icon}
                </span>
              )}
              <span>{t.text}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
