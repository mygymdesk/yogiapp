import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Pill, Droplet } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { detectPlatform, isStandalone, isPreviewOrIframe } from "@/lib/pwa";
import {
  isPushSupported,
  getPushPermission,
  subscribeToPush,
  getCurrentSubscription,
} from "@/lib/push";
import { getVapidPublicKey } from "@/lib/push.functions";
import { haptic, useToastStore } from "@/lib/feedback";

const SEEN_KEY = "yogi.notifNudge.seenAt";
const SEEN_DAYS = 14;

function seenRecently() {
  if (typeof localStorage === "undefined") return false;
  const v = localStorage.getItem(SEEN_KEY);
  if (!v) return false;
  const at = Number(v);
  return at && Date.now() - at < SEEN_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * One-time bottom sheet that proactively asks the user to enable push.
 * - Skipped in iframe/preview, when permission is already decided, when
 *   already subscribed, when not supported, or when shown recently.
 * - On iOS, only shown after the app is installed to home screen
 *   (Web Push requires standalone).
 */
export function NotificationNudge() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const getVapid = useServerFn(getVapidPublicKey);
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isPreviewOrIframe()) return;
      if (!isPushSupported()) return;
      if (seenRecently()) return;

      const platform = detectPlatform();
      // iOS only supports Web Push from a home-screen install.
      if (platform === "ios" && !isStandalone()) return;

      const perm = await getPushPermission();
      if (cancelled) return;
      if (perm !== "default") return; // already granted or denied — don't nag

      const sub = await getCurrentSubscription();
      if (cancelled) return;
      if (sub) return;

      // Slight delay so the dashboard renders first.
      window.setTimeout(() => {
        if (!cancelled) setOpen(true);
      }, 1200);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const markSeen = () => {
    try {
      localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {}
  };

  const enable = async () => {
    setBusy(true);
    haptic();
    try {
      const { publicKey } = await getVapid();
      if (!publicKey) throw new Error("Push not configured");
      await subscribeToPush(publicKey);
      showToast("Reminders on", "success");
      markSeen();
      setOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not enable";
      showToast(msg, "error");
      // If denied, mark seen so we don't re-prompt.
      const perm = await getPushPermission();
      if (perm !== "default") markSeen();
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    haptic();
    markSeen();
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed left-0 right-0 bottom-0 z-[61] bg-bg-surface border-t border-border rounded-t-[28px] px-5 pt-5"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
          >
            <div className="h-1 w-10 rounded-full bg-text-muted/50 mx-auto mb-5" />
            <div className="flex justify-center mb-4">
              <div className="size-14 rounded-2xl bg-acc-water/15 text-acc-water flex items-center justify-center">
                <Bell size={26} />
              </div>
            </div>
            <div
              className="text-text-primary text-center"
              style={{ fontFamily: "Fraunces, serif", fontSize: 24 }}
            >
              Stay on track
            </div>
            <div className="text-[13px] text-text-muted text-center mt-1 max-w-[280px] mx-auto">
              Get gentle reminders for medicine and water. Quiet hours respected.
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-elevated border border-border">
                <Pill size={18} className="text-acc-water shrink-0" />
                <div className="text-[13px] text-text-primary">
                  Never miss a dose
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-elevated border border-border">
                <Droplet size={18} className="text-acc-water shrink-0" />
                <div className="text-[13px] text-text-primary">
                  Hydration nudges through the day
                </div>
              </div>
            </div>

            <button
              onClick={enable}
              disabled={busy}
              className="mt-6 w-full py-3.5 rounded-xl bg-text-primary text-bg-base text-[14px] font-medium disabled:opacity-50"
            >
              {busy ? "Enabling…" : "Enable notifications"}
            </button>
            <button
              onClick={dismiss}
              className="mt-2 w-full py-3 rounded-xl text-[13px] text-text-muted"
            >
              Not now
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
