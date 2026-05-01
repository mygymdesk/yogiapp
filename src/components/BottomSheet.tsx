import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

/**
 * Premium bottom sheet. Drag-to-dismiss with rubber-band, slide+fade entrance.
 * Reusable across every tracker.
 */
export function BottomSheet({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  const y = useMotionValue(0);
  const overlayOpacity = useTransform(y, [0, 400], [1, 0]);

  useEffect(() => {
    if (open) y.set(0);
  }, [open, y]);

  // Lock body scroll + close on Escape + simple focus trap.
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    // Focus first focusable inside sheet
    const focusables = sheetRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && sheetRef.current) {
        const items = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastFocused.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — opacity tied to drag for rubber-band feel */}
          <motion.div
            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ opacity: overlayOpacity }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? "Sheet"}
            className="absolute left-0 right-0 bottom-0 z-50 bg-bg-surface border-t border-border"
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              y,
              paddingBottom: "env(safe-area-inset-bottom)",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.6)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.6 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            {/* Drag handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-text-muted/50" />
            </div>
            {title && (
              <div className="px-5 pt-2 pb-3 text-[13px] uppercase tracking-[0.16em] text-text-muted text-center">
                {title}
              </div>
            )}
            <div className="px-5 pb-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
