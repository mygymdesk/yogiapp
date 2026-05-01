import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function Card({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Comp: any = onClick ? motion.button : motion.div;
  return (
    <Comp
      onClick={onClick}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
      className={`w-full text-left bg-bg-surface border border-border rounded-[20px] p-4 ${className}`}
    >
      {children}
    </Comp>
  );
}
