import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// --- Types ---

export type WorkContext = 'idle' | 'session' | 'fitting';

export interface FrameTried {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  verdict?: 'loved' | 'liked' | 'unsure' | 'rejected';
  notes?: string;
  photoIds: string[];
  triedAt: number;
}

export interface SessionState {
  // Core state
  activeClientId: string | null;
  activeClientName: string | null;
  mode: WorkContext;
  sessionId: string | null;
  sessionStartedAt: number | null;
  framesTried: FrameTried[];
  sessionNotes: string;
  notesLastSavedAt: number | null;
}

interface SessionActions {
  // Lifecycle
  startSession: (clientId: string, clientName: string) => void;
  endSession: () => void;
  startFitting: () => void;
  endFitting: () => void;

  // During session
  addFrameTried: (frame: FrameTried) => void;
  removeFrameTried: (id: string) => void;
  updateFrameVerdict: (id: string, verdict: FrameTried['verdict']) => void;
  setSessionNotes: (notes: string) => void;
  markNotesSaved: () => void;

  // Legacy compat
  setClient: (id: string | null) => void;
  setMode: (mode: WorkContext) => void;
  reset: () => void;
}

// --- MMKV Storage ---

const storage = new MMKV({ id: 'session-store' });

const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

// --- ID generation ---

function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ses_${timestamp}_${random}`;
}

// --- Store ---

const INITIAL_STATE: SessionState = {
  activeClientId: null,
  activeClientName: null,
  mode: 'idle',
  sessionId: null,
  sessionStartedAt: null,
  framesTried: [],
  sessionNotes: '',
  notesLastSavedAt: null,
};

export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      startSession: (clientId: string, clientName: string) => {
        const current = get();
        // Prevent starting a new session if one is already active
        if (current.mode !== 'idle') return;

        set({
          activeClientId: clientId,
          activeClientName: clientName,
          mode: 'session',
          sessionId: generateSessionId(),
          sessionStartedAt: Date.now(),
          framesTried: [],
          sessionNotes: '',
          notesLastSavedAt: null,
        });
      },

      endSession: () => {
        set(INITIAL_STATE);
      },

      startFitting: () => {
        const current = get();
        // Can only start fitting from session
        if (current.mode !== 'session') return;
        set({ mode: 'fitting' });
      },

      endFitting: () => {
        const current = get();
        // Can only end fitting if currently fitting
        if (current.mode !== 'fitting') return;
        set({ mode: 'session' });
      },

      addFrameTried: (frame: FrameTried) => {
        set((state) => ({
          framesTried: [...state.framesTried, frame],
        }));
      },

      removeFrameTried: (id: string) => {
        set((state) => ({
          framesTried: state.framesTried.filter((f) => f.id !== id),
        }));
      },

      updateFrameVerdict: (id: string, verdict: FrameTried['verdict']) => {
        set((state) => ({
          framesTried: state.framesTried.map((f) =>
            f.id === id ? { ...f, verdict } : f
          ),
        }));
      },

      setSessionNotes: (notes: string) => {
        set({ sessionNotes: notes });
      },

      markNotesSaved: () => {
        set({ notesLastSavedAt: Date.now() });
      },

      // Legacy compat — used by StartSessionButton and other existing code
      setClient: (id: string | null) => {
        if (id) {
          // startSession should be preferred, but this maintains backward compat
          set({
            activeClientId: id,
            mode: 'session',
            sessionId: generateSessionId(),
            sessionStartedAt: Date.now(),
          });
        } else {
          set(INITIAL_STATE);
        }
      },

      setMode: (mode: WorkContext) => set({ mode }),

      reset: () => set(INITIAL_STATE),
    }),
    {
      name: 'session-state',
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist critical state — not UI ephemeral state
      partialize: (state) => ({
        activeClientId: state.activeClientId,
        activeClientName: state.activeClientName,
        mode: state.mode,
        sessionId: state.sessionId,
        sessionStartedAt: state.sessionStartedAt,
        framesTried: state.framesTried,
        sessionNotes: state.sessionNotes,
        notesLastSavedAt: state.notesLastSavedAt,
      }),
    }
  )
);
