import { create } from "zustand";

type Toast = { id: number; text: string };

interface ToastStore {
  toasts: Toast[];
  show: (text: string) => void;
  dismiss: (id: number) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  show: (text) => {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts, { id, text }] });
    setTimeout(() => get().dismiss(id), 1500);
  },
  dismiss: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(8);
  }
}
