import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomTabBar } from "@/components/BottomTabBar";
import { ToastViewport } from "@/components/ToastViewport";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AppShell,
});

function AppShell() {
  return (
    <PhoneFrame>
      <div className="absolute inset-0 flex flex-col">
        <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
          <Outlet />
        </main>
        <BottomTabBar />
        <ToastViewport />
      </div>
    </PhoneFrame>
  );
}
