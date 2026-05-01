import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogOut, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToastStore, haptic } from "@/lib/feedback";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Daily" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const showToast = useToastStore((s) => s.show);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const phone = user?.phone ? `+${user.phone}` : "—";

  const changePassword = async () => {
    if (next.length < 6) return showToast("Password must be 6+ chars");
    if (next !== confirm) return showToast("Passwords don't match");
    setLoading(true);
    haptic();
    if (user?.email) {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (signErr) {
        setLoading(false);
        return showToast("Current password is wrong");
      }
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setLoading(false);
    if (error) return showToast(error.message);
    showToast("Password updated");
    setCurrent(""); setNext(""); setConfirm(""); setOpen(false);
  };

  return (
    <div className="px-5 pt-12 pb-32">
      <div className="text-[12px] uppercase tracking-[0.18em] text-text-muted">Preferences</div>
      <h1
        className="text-text-primary mt-1"
        style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 500 }}
      >
        Settings
      </h1>

      {/* Profile card */}
      <div className="mt-6 rounded-2xl bg-bg-elevated border border-border p-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted">Profile</div>
        <div className="mt-2 text-[18px] text-text-primary" style={{ fontFamily: "Geist Mono, monospace" }}>
          {phone}
        </div>
      </div>

      {/* Security */}
      <div className="mt-4 rounded-2xl bg-bg-elevated border border-border overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <KeyRound size={18} className="text-text-secondary" />
            <span className="text-[15px] text-text-primary">Change password</span>
          </div>
          <span className="text-[12px] text-text-muted">{open ? "Close" : "Open"}</span>
        </button>

        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-5 pb-5 space-y-3"
          >
            {[
              { label: "Current password", value: current, set: setCurrent },
              { label: "New password", value: next, set: setNext },
              { label: "Confirm new password", value: confirm, set: setConfirm },
            ].map((f) => (
              <div key={f.label}>
                <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
                  {f.label}
                </div>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    className="w-full bg-bg-base border border-border rounded-xl px-4 py-3 pr-12 text-[15px] text-text-primary outline-none focus:border-border-hover/40"
                    style={{ fontFamily: "Geist Mono, monospace" }}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setShow((s) => !s)}
              className="text-[12px] text-text-muted flex items-center gap-1"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
              {show ? "Hide" : "Show"} passwords
            </button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={changePassword}
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-text-primary text-bg-base font-medium text-[14px] disabled:opacity-30"
            >
              {loading ? "…" : "Update password"}
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={async () => { await signOut(); }}
        className="mt-4 w-full rounded-2xl bg-bg-elevated border border-border px-5 py-4 flex items-center gap-3 text-left text-danger/90"
      >
        <LogOut size={18} />
        <span className="text-[15px]">Sign out</span>
      </button>
    </div>
  );
}
