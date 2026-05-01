import type { ReactNode } from "react";

/**
 * Locks the app to a 390x844 mobile viewport, centered on desktop preview.
 * On true mobile (≤430px) it fills the screen edge-to-edge.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="dark min-h-screen w-full flex items-center justify-center bg-black">
      <div
        className="relative w-full mx-auto overflow-hidden bg-bg-base"
        style={{
          maxWidth: 390,
          height: "100dvh",
          maxHeight: 844,
        }}
      >
        {children}
      </div>
    </div>
  );
}
