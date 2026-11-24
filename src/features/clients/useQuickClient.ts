import { create } from 'zustand';

/** Opens the one app-wide New client sheet (rendered in the app layout) from any screen. */
interface QuickClientState {
  open: boolean;
  startVisit: boolean;
  anonymous: boolean;
  show: (opts?: { startVisit?: boolean; anonymous?: boolean }) => void;
  hide: () => void;
}

export const useQuickClient = create<QuickClientState>((set) => ({
  open: false,
  startVisit: false,
  anonymous: false,
  show: (opts) => set({ open: true, startVisit: !!opts?.startVisit, anonymous: !!opts?.anonymous }),
  hide: () => set({ open: false }),
}));
