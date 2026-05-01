import { useEffect, useRef, useState } from "react";

/** Animated number count-up over 600ms with ease-out cubic. */
export function CountUp({
  value,
  className,
  style,
  format = (v) => Math.round(v).toLocaleString(),
}: {
  value: number;
  className?: string;
  style?: React.CSSProperties;
  format?: (v: number) => string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    startRef.current = null;
    const duration = 600;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const t = Math.min(1, (ts - startRef.current) / duration);
      const v = from + (to - from) * ease(t);
      setDisplay(v);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = display;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={className} style={style}>
      {format(display)}
    </span>
  );
}
