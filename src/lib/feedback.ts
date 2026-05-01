import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error";
type Toast = { id: number; text: string; variant: ToastVariant };

interface ToastStore {
  toasts: Toast[];
  show: (text: string, variant?: ToastVariant) => void;
  dismiss: (id: number) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  show: (text, variant = "default") => {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts, { id, text, variant }] });
    setTimeout(() => get().dismiss(id), 2000);
  },
  dismiss: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(8);
  }
}
