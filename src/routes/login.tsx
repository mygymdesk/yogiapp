import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PhoneFrame } from "@/components/PhoneFrame";
import { useToastStore, haptic } from "@/lib/feedback";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Daily" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: LoginPage,
});

const COUNTRY_CODES = [
  { code: "+91", name: "India" },
  { code: "+1", name: "USA / Canada" },
  { code: "+44", name: "United Kingdom" },
  { code: "+971", name: "UAE" },
  { code: "+65", name: "Singapore" },
  { code: "+61", name: "Australia" },
  { code: "+49", name: "Germany" },
  { code: "+33", name: "France" },
];

function formatPhone(d: string) {
  // Group as `XXXXX XXXXX XX` for readability — display only, doesn't affect digits.
  const a = d.slice(0, 5);
  const b = d.slice(5, 10);
  const c = d.slice(10, 12);
  return [a, b, c].filter(Boolean).join(" ");
}

function LoginPage() {
  const [country, setCountry] = useState("+91");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const showToast = useToastStore((s) => s.show);
  const navigate = useNavigate();

  const localDigits = phone.replace(/\D/g, "");
  const syntheticEmail = `${localDigits}@daily.local`;

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const submit = async () => {
    if (loading || success) return;
    if (localDigits.length < 6) {
      triggerShake();
      showToast("Enter a valid phone number");
      return;
    }
    if (password.length < 6) {
      triggerShake();
      showToast("Enter your password");
      return;
    }
    setLoading(true);
    haptic();
    const { error } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    });
    if (error) {
      setLoading(false);
      triggerShake();
      showToast(error.message || "Invalid credentials");
      return;
    }
    // Show success state briefly so the transition isn't abrupt.
    setLoading(false);
    setSuccess(true);
    haptic();
    // Wait one paint + a beat before navigating, so the user sees the check.
    requestAnimationFrame(() => {
      setTimeout(() => navigate({ to: "/" }), 280);
    });
  };

  return (
    <PhoneFrame>
      <motion.div
        className={`absolute inset-0 flex flex-col px-6 pt-16 pb-10 ${shake ? "shake" : ""}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="h-10" />

        <div className="mt-4">
          <div className="text-[12px] uppercase tracking-[0.18em] text-text-muted">
            Sign in
          </div>
          <h1
            className="text-text-primary mt-2"
            style={{ fontFamily: "Fraunces, serif", fontSize: 36, fontWeight: 500, lineHeight: 1.1 }}
          >
            Welcome to <span className="italic">Daily</span>.
          </h1>
          <p className="text-[14px] text-text-secondary mt-3 leading-relaxed">
            Sign in with your phone and password.
          </p>
        </div>

        <div className="mt-10 flex-1">
          <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
            Phone number
          </div>
          <div className="flex items-stretch gap-2">
            <button
              onClick={() => setPickerOpen((o) => !o)}
              className="flex items-center gap-1 px-3 bg-bg-elevated border border-border rounded-2xl text-text-primary text-[16px]"
            >
              {country}
              <ChevronDown size={14} className="text-text-muted" />
            </button>
            <input
              autoFocus
              type="tel"
              inputMode="numeric"
              value={formatPhone(phone)}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="98765 43210"
              className="flex-1 bg-bg-elevated border border-border rounded-2xl px-4 py-3.5 text-[18px] text-text-primary placeholder:text-text-muted outline-none focus:border-border-hover/40"
              style={{ fontFamily: "Geist Mono, monospace" }}
            />
          </div>

          <AnimatePresence>
            {pickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                className="mt-2 overflow-hidden rounded-2xl bg-bg-elevated border border-border"
              >
                <div className="max-h-56 overflow-y-auto no-scrollbar">
                  {COUNTRY_CODES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCountry(c.code);
                        setPickerOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 text-[14px] text-text-primary border-b border-border last:border-0 hover:bg-bg-surface"
                    >
                      <span>{c.name}</span>
                      <span className="text-text-muted">{c.code}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2 mt-6">
            Password
          </div>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••••"
              className="w-full bg-bg-elevated border border-border rounded-2xl px-4 py-3.5 pr-12 text-[18px] text-text-primary placeholder:text-text-muted outline-none focus:border-border-hover/40"
              style={{ fontFamily: "Geist Mono, monospace" }}
            />
            <button
              aria-label={showPw ? "Hide password" : "Show password"}
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-9 flex items-center justify-center text-text-muted"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={submit}
          disabled={loading || success}
          animate={success ? { backgroundColor: "#6EE7B7" } : { backgroundColor: "#FAFAFA" }}
          transition={{ duration: 0.25 }}
          className="w-full py-4 rounded-2xl text-bg-base font-medium text-[15px] disabled:opacity-90 flex items-center justify-center gap-2"
        >
          <AnimatePresence mode="wait" initial={false}>
            {success ? (
              <motion.span
                key="ok"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Check size={18} strokeWidth={2.5} />
                Signed in
              </motion.span>
            ) : loading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 size={18} className="animate-spin" />
                Signing in
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Sign in
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <p className="text-[11px] text-text-muted text-center mt-4 leading-relaxed">
          Personal use only.
        </p>
      </motion.div>
    </PhoneFrame>
  );
}
