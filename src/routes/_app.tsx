import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomTabBar } from "@/components/BottomTabBar";
import { ToastViewport } from "@/components/ToastViewport";

// Cache the session check across navigations so tab switches don't re-await
// Supabase storage. We only re-validate on the very first hit per page load.
let _sessionChecked = false;
let _hasSession = false;

async function ensureSession() {
  if (_sessionChecked) return _hasSession;
  const { data } = await supabase.auth.getSession();
  _hasSession = !!data.session;
  _sessionChecked = true;
  // Keep the cache in sync if user signs out / token refreshes from another tab.
  supabase.auth.onAuthStateChange((_e, s) => {
    _hasSession = !!s;
  });
  return _hasSession;
}

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const ok = await ensureSession();
    if (!ok) throw redirect({ to: "/login" });
  },
  component: AppShell,
});

function AppShell() {
  const { pathname } = useLocation();
  return (
    <PhoneFrame>
      <div className="absolute inset-0 flex flex-col">
        <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomTabBar />
        <ToastViewport />
      </div>
    </PhoneFrame>
  );
}
