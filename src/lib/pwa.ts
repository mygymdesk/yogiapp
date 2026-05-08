/**
 * PWA install + platform detection helpers.
 * SSR-safe: every check guards `window`.
 */

export type Platform = "ios" | "android" | "desktop" | "other";

export function detectPlatform(): Platform {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent || "";
  // iPadOS 13+ reports as Mac; check touch points too.
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Mac") && "ontouchend" in document);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Mobi/i.test(ua)) return "other";
  return "desktop";
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS exposes navigator.standalone; everyone else uses display-mode.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iosStandalone = (window.navigator as any).standalone === true;
  const mqStandalone =
    window.matchMedia &&
    window.matchMedia("(display-mode: standalone)").matches;
  return iosStandalone || mqStandalone;
}

export function isPreviewOrIframe(): boolean {
  if (typeof window === "undefined") return true;
  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }
  const host = window.location.hostname;
  const isPreview =
    host.includes("id-preview--") || host.includes("lovableproject.com");
  return inIframe || isPreview;
}

// BeforeInstallPromptEvent is non-standard but supported by Chromium.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
