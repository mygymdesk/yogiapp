import { Link, useLocation } from "@tanstack/react-router";
import { Home, CalendarDays, BarChart3, Settings } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { to: "/", label: "Today", icon: Home },
  { to: "/plan", label: "Plan", icon: CalendarDays },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomTabBar() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="absolute bottom-0 left-0 right-0 border-t border-border bg-bg-surface/95 backdrop-blur-xl"
      style={{ height: 64, paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4 h-16">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to} className="flex">
              <Link
                to={to}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="relative flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px]"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  animate={{ scale: active ? 1.06 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.25 : 1.75}
                    className={active ? "text-text-primary" : "text-text-muted"}
                  />
                  <span
                    className={`text-[10px] tracking-wide ${
                      active ? "text-text-primary font-medium" : "text-text-muted"
                    }`}
                  >
                    {label}
                  </span>
                </motion.div>
                {active && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute top-0 h-[2px] w-8 rounded-full bg-text-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
