import { useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

/**
 * Friendly per-route error boundary content.
 * Used as `errorComponent` on _app/* routes so a single page failure
 * doesn't blank the whole app.
 */
export function RouteError({
  error,
  reset,
  label = "this page",
}: {
  error: Error;
  reset: () => void;
  label?: string;
}) {
  const router = useRouter();
  return (
    <div className="px-6 pt-24 pb-12 flex flex-col items-center text-center">
      <div className="size-14 rounded-full bg-danger/15 border border-danger/30 flex items-center justify-center mb-5">
        <AlertTriangle size={22} className="text-danger" />
      </div>
      <div
        className="text-text-primary"
        style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}
      >
        Couldn't load {label}
      </div>
      <p className="text-[13px] text-text-secondary mt-2 max-w-[260px] leading-relaxed">
        {error.message || "Something went wrong. Try again in a moment."}
      </p>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          router.invalidate();
          reset();
        }}
        className="mt-6 px-5 py-2.5 rounded-xl bg-text-primary text-bg-base text-[13px] font-medium"
      >
        Try again
      </motion.button>
    </div>
  );
}
