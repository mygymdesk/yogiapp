import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";

/**
 * Bottom banner shown while the device reports being offline.
 * Local writes still queue (Supabase optimistic updates), and we surface that
 * gracefully so the user knows their changes are local until reconnect.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed left-1/2 -translate-x-1/2 bottom-[88px] z-[120] pointer-events-none"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-full bg-bg-elevated/95 backdrop-blur-md border border-warning/40 text-[12px] text-warning shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <WifiOff size={13} />
            <span>You're offline — changes will sync later</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
