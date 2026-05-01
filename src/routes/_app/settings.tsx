import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogOut, KeyRound, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToastStore, haptic } from "@/lib/feedback";
import { useProfile } from "@/lib/trackers";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Daily" }] }),
  component: SettingsPage,
});

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2 px-1">
        {title}
      </div>
      <div className="rounded-2xl bg-bg-elevated border border-border overflow-hidden divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="px-5 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[14px] text-text-primary">{label}</div>
        <div className="flex-1 max-w-[60%]">{children}</div>
      </div>
      {hint && <div className="text-[11px] text-text-muted mt-1">{hint}</div>}
    </div>
  );
}

const inputCls =
  "w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-[14px] text-text-primary outline-none focus:border-border-hover/40 text-right";

function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, update } = useProfile();
  const showToast = useToastStore((s) => s.show);

  // Profile draft
  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState("");
  const [heightCm, setHeightCm] = useState<string>("");
  // Targets
  const [waterTarget, setWaterTarget] = useState<string>("");
  const [walkTarget, setWalkTarget] = useState<string>("");
  const [goalWeight, setGoalWeight] = useState<string>("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");
  // Time settings
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [quietStart, setQuietStart] = useState("23:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setDob((profile as any).dob ?? "");
    setHeightCm(profile.height_cm?.toString() ?? "");
    setWaterTarget(profile.daily_water_target_ml?.toString() ?? "");
    setWalkTarget(profile.walking_target_min?.toString() ?? "");
    setGoalWeight(profile.goal_weight_kg?.toString() ?? "");
    setWeightUnit((profile.weight_unit as "kg" | "lb") ?? "kg");
    setTimezone(profile.timezone ?? "Asia/Kolkata");
    setQuietStart((profile.quiet_hours_start ?? "23:00:00").slice(0, 5));
    setQuietEnd((profile.quiet_hours_end ?? "07:00:00").slice(0, 5));
  }, [profile]);

  const phone = user?.phone ? `+${user.phone}` : "—";

  const saveAll = async () => {
    setSavingProfile(true);
    haptic();
    const { error } = await update({
      display_name: displayName.trim() || null,
      dob: dob || null,
      height_cm: heightCm ? Number(heightCm) : null,
      daily_water_target_ml: waterTarget ? Number(waterTarget) : 2500,
      walking_target_min: walkTarget ? Number(walkTarget) : 30,
      goal_weight_kg: goalWeight ? Number(goalWeight) : null,
      weight_unit: weightUnit,
      timezone,
      quiet_hours_start: `${quietStart}:00`,
      quiet_hours_end: `${quietEnd}:00`,
    } as any);
    setSavingProfile(false);
    if (error) return showToast(error.message);
    showToast("Saved");
  };

  // Password change
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);

  const changePassword = async () => {
    if (next.length < 6) return showToast("Password must be 6+ chars");
    if (next !== confirm) return showToast("Passwords don't match");
    setLoadingPw(true);
    haptic();
    if (user?.email) {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (signErr) {
        setLoadingPw(false);
        return showToast("Current password is wrong");
      }
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setLoadingPw(false);
    if (error) return showToast(error.message);
    showToast("Password updated");
    setCurrent(""); setNext(""); setConfirm(""); setOpen(false);
  };

  return (
    <div className="px-4 pt-12 pb-32">
      <div className="px-1 text-[12px] uppercase tracking-[0.18em] text-text-muted">
        Preferences
      </div>
      <h1
        className="text-text-primary mt-1 px-1"
        style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 500 }}
      >
        Settings
      </h1>

      <Section title="Profile">
        <Field label="Phone">
          <div
            className="text-right text-text-secondary text-[14px]"
            style={{ fontFamily: "Geist Mono, monospace" }}
          >
            {phone}
          </div>
        </Field>
        <Field label="Display name">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="—"
            className={inputCls}
          />
        </Field>
        <Field label="Date of birth">
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Height (cm)">
          <input
            type="number"
            inputMode="numeric"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="—"
            className={inputCls}
          />
        </Field>
      </Section>

      <Section title="Daily targets">
        <Field label="Water (ml)">
          <input
            type="number"
            inputMode="numeric"
            value={waterTarget}
            onChange={(e) => setWaterTarget(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Walking (min)">
          <input
            type="number"
            inputMode="numeric"
            value={walkTarget}
            onChange={(e) => setWalkTarget(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Goal weight (kg)">
          <input
            type="number"
            inputMode="decimal"
            value={goalWeight}
            onChange={(e) => setGoalWeight(e.target.value)}
            placeholder="—"
            className={inputCls}
          />
        </Field>
        <Field label="Weight unit">
          <div className="flex gap-1 justify-end">
            {(["kg", "lb"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setWeightUnit(u)}
                className={`px-3 py-1.5 rounded-lg text-[13px] border ${
                  weightUnit === u
                    ? "bg-text-primary text-bg-base border-text-primary"
                    : "bg-bg-base border-border text-text-secondary"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Time & notifications">
        <Field label="Timezone">
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={inputCls}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quiet hours start" hint="No nudges during this window">
          <input
            type="time"
            value={quietStart}
            onChange={(e) => setQuietStart(e.target.value)}
            className={inputCls}
            style={{ fontFamily: "Geist Mono, monospace" }}
          />
        </Field>
        <Field label="Quiet hours end">
          <input
            type="time"
            value={quietEnd}
            onChange={(e) => setQuietEnd(e.target.value)}
            className={inputCls}
            style={{ fontFamily: "Geist Mono, monospace" }}
          />
        </Field>
      </Section>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={saveAll}
        disabled={savingProfile}
        className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-text-primary text-bg-base font-medium text-[14px] disabled:opacity-30"
      >
        <Save size={15} />
        {savingProfile ? "Saving…" : "Save changes"}
      </motion.button>

      {/* Security */}
      <Section title="Security">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <KeyRound size={16} className="text-text-secondary" />
            <span className="text-[14px] text-text-primary">Change password</span>
          </div>
          <span className="text-[12px] text-text-muted">{open ? "Close" : "Open"}</span>
        </button>
        {open && (
          <div className="px-5 pb-5 space-y-3">
            {[
              { label: "Current password", value: current, set: setCurrent },
              { label: "New password", value: next, set: setNext },
              { label: "Confirm new password", value: confirm, set: setConfirm },
            ].map((f) => (
              <div key={f.label}>
                <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
                  {f.label}
                </div>
                <input
                  type={show ? "text" : "password"}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className="w-full bg-bg-base border border-border rounded-xl px-4 py-3 text-[15px] text-text-primary outline-none focus:border-border-hover/40"
                  style={{ fontFamily: "Geist Mono, monospace" }}
                />
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
              disabled={loadingPw}
              className="w-full mt-2 py-3.5 rounded-xl bg-text-primary text-bg-base font-medium text-[14px] disabled:opacity-30"
            >
              {loadingPw ? "…" : "Update password"}
            </motion.button>
          </div>
        )}
      </Section>

      <button
        onClick={async () => { await signOut(); }}
        className="mt-4 w-full rounded-2xl bg-bg-elevated border border-border px-5 py-4 flex items-center gap-3 text-left text-danger/90"
      >
        <LogOut size={16} />
        <span className="text-[14px]">Sign out</span>
      </button>
    </div>
  );
}
