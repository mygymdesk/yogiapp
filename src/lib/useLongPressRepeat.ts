import { useCallback, useRef } from "react";

/**
 * Returns press handlers that fire `onTick` once on press, then repeatedly
 * while held. Acceleration: starts at 240 ms, ramps to 60 ms.
 *
 * Usage:
 *   const press = useLongPressRepeat(() => setVal(v => v + 1));
 *   <button {...press}>+</button>
 */
export function useLongPressRepeat(onTick: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (interval.current) clearInterval(interval.current);
    timer.current = null;
    interval.current = null;
  }, []);

  const start = useCallback(() => {
    tickRef.current();
    let delay = 240;
    const schedule = () => {
      timer.current = setTimeout(() => {
        tickRef.current();
        delay = Math.max(60, delay - 30);
        schedule();
      }, delay);
    };
    schedule();
  }, []);

  return {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      start();
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
  };
}
