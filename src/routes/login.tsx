import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowLeft } from "lucide-react";
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

function LoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [country, setCountry] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const showToast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const otpInputRef = useRef<HTMLInputElement>(null);

  const fullPhone = `${country}${phone.replace(/\D/g, "")}`;

  const sendOtp = async () => {
    if (phone.replace(/\D/g, "").length < 6) {
      showToast("Enter a valid phone number");
      return;
    }
    setLoading(true);
    haptic();
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    setLoading(false);
    if (error) {
      showToast(error.message);
      return;
    }
    setStep("otp");
    setTimeout(() => otpInputRef.current?.focus(), 320);
  };

  const verifyOtp = async (code: string) => {
    setLoading(true);
    haptic();
    const { error } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: code,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      showToast("Invalid code");
      setOtp("");
      return;
    }
    showToast("Welcome");
    navigate({ to: "/" });
  };

  return (
    <PhoneFrame>
      <div className="absolute inset-0 flex flex-col px-6 pt-16 pb-10">
        {/* Top bar with back when on otp */}
        <div className="h-10 flex items-center">
          <AnimatePresence>
            {step === "otp" && (
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                }}
                className="size-10 -ml-2 flex items-center justify-center text-text-secondary"
              >
                <ArrowLeft size={20} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Heading */}
        <div className="mt-4">
          <div className="text-[12px] uppercase tracking-[0.18em] text-text-muted">
            {step === "phone" ? "Sign in" : "Verification"}
          </div>
          <h1
            className="text-text-primary mt-2"
            style={{ fontFamily: "Fraunces, serif", fontSize: 36, fontWeight: 500, lineHeight: 1.1 }}
          >
            {step === "phone" ? (
              <>
                Welcome to <span className="italic">Daily</span>.
              </>
            ) : (
              <>Enter the code we sent.</>
            )}
          </h1>
          <p className="text-[14px] text-text-secondary mt-3 leading-relaxed">
            {step === "phone"
              ? "We'll text you a one-time code. No password to remember."
              : `Sent to ${fullPhone}`}
          </p>
        </div>

        {/* Form */}
        <div className="mt-10 flex-1">
          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.div
                key="phone"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
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
                    value={phone}
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
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
                  6-digit code
                </div>
                <input
                  ref={otpInputRef}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtp(v);
                    if (v.length === 6) verifyOtp(v);
                  }}
                  placeholder="••••••"
                  className="w-full bg-bg-elevated border border-border rounded-2xl px-4 py-4 text-[28px] text-text-primary placeholder:text-text-muted outline-none focus:border-border-hover/40 text-center tracking-[0.5em]"
                  style={{ fontFamily: "Geist Mono, monospace" }}
                />
                <button
                  onClick={sendOtp}
                  className="mt-3 text-[12px] text-text-muted hover:text-text-secondary"
                >
                  Didn't get it? Resend
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => (step === "phone" ? sendOtp() : verifyOtp(otp))}
          disabled={loading || (step === "otp" && otp.length < 6)}
          className="w-full py-4 rounded-2xl bg-text-primary text-bg-base font-medium text-[15px] disabled:opacity-30"
        >
          {loading ? "…" : step === "phone" ? "Send code" : "Verify"}
        </motion.button>

        <p className="text-[11px] text-text-muted text-center mt-4 leading-relaxed">
          By continuing you agree to receive an SMS from us.
        </p>
      </div>
    </PhoneFrame>
  );
}
