import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, LogOut, KeyRound, Save, Bell, BellOff, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToastStore, haptic } from "@/lib/feedback";
import { useProfile } from "@/lib/trackers";
import { RouteError } from "@/components/RouteError";
import {
  isPushSupported,
  getPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from "@/lib/push";
import { getVapidPublicKey, sendTestPush } from "@/server/push.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Daily" }] }),
  errorComponent: ({ error, reset }) => (
    <RouteError error={error} reset={reset} label="settings" />
  ),
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
  const [kcalT, setKcalT] = useState<string>("");
  const [proteinT, setProteinT] = useState<string>("");
  const [carbsT, setCarbsT] = useState<string>("");
  const [fatT, setFatT] = useState<string>("");
  // Time settings
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [quietStart, setQuietStart] = useState("23:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  // Notifications
  const [notifyMed, setNotifyMed] = useState(true);
  const [notifyWater, setNotifyWater] = useState(false);
  const [notifyWaterInterval, setNotifyWaterInterval] = useState("120");
  const [notifyDaily, setNotifyDaily] = useState(false);
  const [notifyDailyTime, setNotifyDailyTime] = useState("21:00");
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPerm, setPushPerm] = useState<NotificationPermission>("default");
  const [pushBusy, setPushBusy] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [tab, setTab] = useState<"profile" | "targets" | "notifications" | "security">("profile");
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");

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
    setKcalT((profile as any).daily_kcal_target?.toString() ?? "2000");
    setProteinT((profile as any).daily_protein_g_target?.toString() ?? "100");
    setCarbsT((profile as any).daily_carbs_g_target?.toString() ?? "250");
    setFatT((profile as any).daily_fat_g_target?.toString() ?? "65");
    setNotifyMed((profile as any).notify_medicine ?? true);
    setNotifyWater((profile as any).notify_water ?? false);
    setNotifyWaterInterval(((profile as any).notify_water_interval_min ?? 120).toString());
    setNotifyDaily((profile as any).notify_daily_summary ?? false);
    setNotifyDailyTime(((profile as any).notify_daily_summary_time ?? "21:00:00").slice(0, 5));
    // Snapshot for dirty detection — taken right after seed.
    setInitialSnapshot(JSON.stringify([
      profile.display_name ?? "",
      (profile as any).dob ?? "",
      profile.height_cm?.toString() ?? "",
      profile.daily_water_target_ml?.toString() ?? "",
      profile.walking_target_min?.toString() ?? "",
      profile.goal_weight_kg?.toString() ?? "",
      profile.weight_unit ?? "kg",
      profile.timezone ?? "Asia/Kolkata",
      (profile.quiet_hours_start ?? "23:00:00").slice(0, 5),
      (profile.quiet_hours_end ?? "07:00:00").slice(0, 5),
      (profile as any).daily_kcal_target?.toString() ?? "2000",
      (profile as any).daily_protein_g_target?.toString() ?? "100",
      (profile as any).daily_carbs_g_target?.toString() ?? "250",
      (profile as any).daily_fat_g_target?.toString() ?? "65",
      (profile as any).notify_medicine ?? true,
      (profile as any).notify_water ?? false,
      ((profile as any).notify_water_interval_min ?? 120).toString(),
      (profile as any).notify_daily_summary ?? false,
      ((profile as any).notify_daily_summary_time ?? "21:00:00").slice(0, 5),
    ]));
  }, [profile]);

  const currentSnapshot = useMemo(
    () => JSON.stringify([
      displayName, dob, heightCm, waterTarget, walkTarget, goalWeight, weightUnit,
      timezone, quietStart, quietEnd, kcalT, proteinT, carbsT, fatT,
      notifyMed, notifyWater, notifyWaterInterval, notifyDaily, notifyDailyTime,
    ]),
    [displayName, dob, heightCm, waterTarget, walkTarget, goalWeight, weightUnit,
     timezone, quietStart, quietEnd, kcalT, proteinT, carbsT, fatT,
     notifyMed, notifyWater, notifyWaterInterval, notifyDaily, notifyDailyTime]
  );
  const isDirty = initialSnapshot !== "" && currentSnapshot !== initialSnapshot;

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
      daily_kcal_target: Number(kcalT) || 2000,
      daily_protein_g_target: Number(proteinT) || 100,
      daily_carbs_g_target: Number(carbsT) || 250,
      daily_fat_g_target: Number(fatT) || 65,
      notify_medicine: notifyMed,
      notify_water: notifyWater,
      notify_water_interval_min: Math.max(30, Number(notifyWaterInterval) || 120),
      notify_daily_summary: notifyDaily,
      notify_daily_summary_time: `${notifyDailyTime}:00`,
    } as any);
    setSavingProfile(false);
    if (error) return showToast(error.message, "error");
    setInitialSnapshot(currentSnapshot); // form is now clean
    showToast("Saved", "success");
  };

  // Push subscription state
  const getVapid = useServerFn(getVapidPublicKey);
  const sendTest = useServerFn(sendTestPush);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isPushSupported()) return;
      const perm = await getPushPermission();
      if (cancelled) return;
      setPushPerm(perm);
      const sub = await getCurrentSubscription();
      if (cancelled) return;
      setPushSubscribed(!!sub);
    })();
    return () => { cancelled = true; };
  }, []);

  const enablePush = async () => {
    setPushBusy(true);
    haptic();
    try {
      const { publicKey } = await getVapid();
      if (!publicKey) throw new Error("Push not configured (missing VAPID key)");
      await subscribeToPush(publicKey);
      setPushSubscribed(true);
      setPushPerm("granted");
      showToast("Notifications enabled");
    } catch (e: any) {
      showToast(e?.message ?? "Could not enable");
    } finally {
      setPushBusy(false);
    }
  };

  const disablePush = async () => {
    setPushBusy(true);
    try {
      await unsubscribeFromPush();
      setPushSubscribed(false);
      showToast("Notifications disabled");
    } catch (e: any) {
      showToast(e?.message ?? "Could not disable");
    } finally {
      setPushBusy(false);
    }
  };

  const sendTestNotification = async () => {
    setPushBusy(true);
    try {
      const r = await sendTest();
      showToast(r.sent > 0 ? `Sent to ${r.sent} device${r.sent === 1 ? "" : "s"}` : "No devices subscribed");
    } catch (e: any) {
      showToast(e?.message ?? "Failed");
    } finally {
      setPushBusy(false);
    }
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

  const tabs = [
    { k: "profile", label: "Profile" },
    { k: "targets", label: "Targets" },
    { k: "notifications", label: "Alerts" },
    { k: "security", label: "Security" },
  ] as const;

  return (
    <div className="px-4 pt-12 pb-32 relative">
      <div className="px-1 text-[12px] uppercase tracking-[0.18em] text-text-muted">
        Preferences
      </div>
      <h1
        className="text-text-primary mt-1 px-1"
        style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 500 }}
      >
        Settings
      </h1>

      {/* Section switcher — keeps the page focused, no giant scroll. */}
      <div className="mt-5 flex gap-1 bg-bg-elevated border border-border rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as typeof tab)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-[12px] transition-colors ${
              tab === t.k
                ? "bg-text-primary text-bg-base"
                : "text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (<>

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

      <Section title="Macro targets">
        {[
          { l: "Calories (kcal)", v: kcalT, set: setKcalT },
          { l: "Protein (g)", v: proteinT, set: setProteinT },
          { l: "Carbs (g)", v: carbsT, set: setCarbsT },
          { l: "Fat (g)", v: fatT, set: setFatT },
        ].map((x) => (
          <Field key={x.l} label={x.l}>
            <input
              type="number"
              inputMode="numeric"
              value={x.v}
              onChange={(e) => x.set(e.target.value)}
              className={inputCls}
            />
          </Field>
        ))}
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

      <Section title="Notifications">
        <div className="px-5 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[14px] text-text-primary">Push on this device</div>
              <div className="text-[11px] text-text-muted mt-0.5">
                {!isPushSupported()
                  ? "Not supported in this browser"
                  : pushSubscribed
                  ? "Subscribed"
                  : pushPerm === "denied"
                  ? "Blocked — enable in browser settings"
                  : "Off"}
              </div>
            </div>
            <div className="flex gap-2">
              {pushSubscribed ? (
                <>
                  <button
                    onClick={sendTestNotification}
                    disabled={pushBusy}
                    className="px-3 py-1.5 rounded-lg text-[12px] bg-bg-base border border-border text-text-secondary flex items-center gap-1 disabled:opacity-40"
                  >
                    <Send size={12} /> Test
                  </button>
                  <button
                    onClick={disablePush}
                    disabled={pushBusy}
                    className="px-3 py-1.5 rounded-lg text-[12px] bg-bg-base border border-border text-danger flex items-center gap-1 disabled:opacity-40"
                  >
                    <BellOff size={12} /> Off
                  </button>
                </>
              ) : (
                <button
                  onClick={enablePush}
                  disabled={pushBusy || !isPushSupported() || pushPerm === "denied"}
                  className="px-3 py-1.5 rounded-lg text-[12px] bg-text-primary text-bg-base flex items-center gap-1 disabled:opacity-40"
                >
                  <Bell size={12} /> Enable
                </button>
              )}
            </div>
          </div>
        </div>
        <Field label="Medicine reminders" hint="Notify when a dose is due">
          <div className="flex justify-end">
            <button
              onClick={() => setNotifyMed((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                notifyMed ? "bg-text-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-bg-base transition-transform ${
                  notifyMed ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </Field>
        <Field label="Water reminders">
          <div className="flex justify-end">
            <button
              onClick={() => setNotifyWater((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                notifyWater ? "bg-text-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-bg-base transition-transform ${
                  notifyWater ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </Field>
        {notifyWater && (
          <Field label="Water interval (min)" hint="Only nudges if you haven't logged">
            <input
              type="number"
              inputMode="numeric"
              min={30}
              value={notifyWaterInterval}
              onChange={(e) => setNotifyWaterInterval(e.target.value)}
              className={inputCls}
            />
          </Field>
        )}
        <Field label="Daily summary" hint="A nudge with today's progress">
          <div className="flex justify-end">
            <button
              onClick={() => setNotifyDaily((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                notifyDaily ? "bg-text-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-bg-base transition-transform ${
                  notifyDaily ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </Field>
        {notifyDaily && (
          <Field label="Summary time">
            <input
              type="time"
              value={notifyDailyTime}
              onChange={(e) => setNotifyDailyTime(e.target.value)}
              className={inputCls}
              style={{ fontFamily: "Geist Mono, monospace" }}
            />
          </Field>
        )}
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
