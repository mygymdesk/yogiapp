import { AnimatePresence, motion } from "framer-motion";
import { useToastStore } from "@/lib/feedback";

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none absolute top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-5">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ y: -32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="pointer-events-auto bg-bg-elevated border border-border-hover/30 rounded-full px-4 py-2 text-[13px] text-text-primary shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
            style={{ borderColor: "rgba(255,255,255,0.10)" }}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
