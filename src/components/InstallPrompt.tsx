import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, Plus, X } from "lucide-react";
import {
  detectPlatform,
  isStandalone,
  isPreviewOrIframe,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa";
import { haptic } from "@/lib/feedback";

const DISMISS_KEY = "yogi.install.dismissedAt";
const DISMISS_DAYS = 7;

function dismissedRecently() {
  if (typeof localStorage === "undefined") return false;
  const v = localStorage.getItem(DISMISS_KEY);
  if (!v) return false;
  const at = Number(v);
  if (!at) return false;
  return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Install nudge.
 * - Android/Chromium: captures `beforeinstallprompt`, fires native dialog.
 * - iOS Safari: shows manual "Share → Add to Home Screen" hint (no API exists).
 * - Hidden when already installed, in iframe/preview, or recently dismissed.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [iosOpen, setIosOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [platform] = useState(() => detectPlatform());

  useEffect(() => {
    if (isPreviewOrIframe()) return;
    if (isStandalone()) return;
    if (dismissedRecently()) return;

    if (platform === "ios") {
      // Show iOS hint after a brief delay so it doesn't slam on first paint.
      const t = window.setTimeout(() => setShow(true), 1500);
      return () => window.clearTimeout(t);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const onInstalled = () => {
      setShow(false);
      setDeferred(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [platform]);

  const dismiss = () => {
    haptic();
    setShow(false);
    setIosOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  const install = async () => {
    haptic();
    if (platform === "ios") {
      setIosOpen(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setShow(false);
    } else {
      dismiss();
    }
    setDeferred(null);
  };

  if (!show) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="mx-4 mt-3 mb-2 rounded-2xl border border-border bg-bg-elevated px-4 py-3 flex items-center gap-3"
      >
        <div className="size-9 rounded-xl bg-acc-water/15 text-acc-water flex items-center justify-center shrink-0">
          <Download size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-text-primary font-medium">
            Install Yogi
          </div>
          <div className="text-[11px] text-text-muted truncate">
            {platform === "ios"
              ? "Add to Home Screen for reminders"
              : "One tap to put Yogi on your home screen"}
          </div>
        </div>
        <button
          onClick={install}
          className="px-3 py-1.5 rounded-lg bg-text-primary text-bg-base text-[12px] font-medium"
        >
          Install
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="size-8 rounded-lg text-text-muted flex items-center justify-center"
        >
          <X size={16} />
        </button>
      </motion.div>

      <AnimatePresence>
        {iosOpen && (
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
              className="fixed left-0 right-0 bottom-0 z-[61] bg-bg-surface border-t border-border rounded-t-[28px] px-5 pt-5 pb-8"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
            >
              <div className="h-1 w-10 rounded-full bg-text-muted/50 mx-auto mb-4" />
              <div
                className="text-text-primary text-center"
                style={{ fontFamily: "Fraunces, serif", fontSize: 22 }}
              >
                Add Yogi to your Home Screen
              </div>
              <div className="text-[12px] text-text-muted text-center mt-1">
                Required on iOS to receive reminders
              </div>

              <ol className="mt-6 space-y-4">
                <li className="flex items-center gap-3">
                  <span className="size-7 rounded-full bg-bg-elevated border border-border text-text-secondary text-[12px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span className="text-[14px] text-text-primary flex items-center gap-2">
                    Tap the
                    <Share size={16} className="text-acc-water" />
                    Share button in Safari
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="size-7 rounded-full bg-bg-elevated border border-border text-text-secondary text-[12px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="text-[14px] text-text-primary flex items-center gap-2">
                    Choose
                    <Plus size={16} className="text-acc-water" />
                    "Add to Home Screen"
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="size-7 rounded-full bg-bg-elevated border border-border text-text-secondary text-[12px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span className="text-[14px] text-text-primary">
                    Open Yogi from your home screen and enable notifications
                  </span>
                </li>
              </ol>

              <button
                onClick={dismiss}
                className="mt-6 w-full py-3 rounded-xl bg-text-primary text-bg-base text-[14px] font-medium"
              >
                Got it
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
