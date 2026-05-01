/**
 * Browser-side push subscription helpers.
 * Only registers the SW in non-preview, non-iframe contexts.
 */
import { supabase } from "@/integrations/supabase/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported() {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("PushManager" in window)) return false;
  return true;
}

function isPreviewOrIframe() {
  if (typeof window === "undefined") return true;
  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }
  const host = window.location.hostname;
  const isPreview = host.includes("id-preview--") || host.includes("lovableproject.com");
  return inIframe || isPreview;
}

export async function registerPushSW(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  if (isPreviewOrIframe()) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return reg;
  } catch (e) {
    console.error("SW register failed", e);
    return null;
  }
}

export async function getPushPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  return Notification.requestPermission();
}

export async function subscribeToPush(vapidPublicKey: string) {
  const reg = await registerPushSW();
  if (!reg) throw new Error("Push not supported in this context");
  const perm = await requestPushPermission();
  if (perm !== "granted") throw new Error("Notification permission denied");

  const existing = await reg.pushManager.getSubscription();
  if (existing) await existing.unsubscribe().catch(() => {});

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const json = sub.toJSON();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // Upsert by endpoint
  await supabase.from("push_subscriptions").delete().eq("endpoint", json.endpoint!);
  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: user.id,
    endpoint: json.endpoint!,
    p256dh: json.keys!.p256dh!,
    auth: json.keys!.auth!,
    user_agent: navigator.userAgent,
  });
  if (error) throw error;
  return sub;
}

export async function unsubscribeFromPush() {
  if (!isPushSupported() || isPreviewOrIframe()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => {});
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  }
}

export async function getCurrentSubscription() {
  if (!isPushSupported() || isPreviewOrIframe()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}
