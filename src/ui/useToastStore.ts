import { create } from 'zustand';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastMessage[];
  show: (toast: Omit<ToastMessage, 'id'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (toast) => {
    const id = `toast-${++toastId}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
  },
  dismiss: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
  dismissAll: () => {
    set({ toasts: [] });
  },
}));

/**
 * Convenience functions for showing toasts without needing the hook.
 * Can be called from non-component code (API client, sync engine, etc.)
 */
export const toast = {
  error: (title: string, message?: string) =>
    useToastStore.getState().show({ type: 'error', title, message }),
  success: (title: string, message?: string) =>
    useToastStore.getState().show({ type: 'success', title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().show({ type: 'warning', title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().show({ type: 'info', title, message }),
};
