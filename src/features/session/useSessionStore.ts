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
  /** When the `tried_on` interaction reached Foundry. Unset = still to send. */
  syncedAt?: number;
}

export interface StartSessionOptions {
  /** Links the visit to the appointment it came from. */
  appointmentId?: string;
}

export interface SessionState {
  // Core state
  activeClientId: string | null;
  activeClientName: string | null;
  mode: WorkContext;
  /** Local `ses_` placeholder until SessionServerBridge swaps in Foundry's id. */
  sessionId: string | null;
  appointmentId: string | null;
  sessionStartedAt: number | null;
  framesTried: FrameTried[];
  sessionNotes: string;
  notesLastSavedAt: number | null;
}

interface SessionActions {
  // Lifecycle
  startSession: (clientId: string, clientName: string, options?: StartSessionOptions) => void;
  setSessionId: (id: string) => void;
  /** Swap a local placeholder for the server id, only if that session is still the active one. */
  replaceLocalSessionId: (localId: string, serverId: string) => void;
  endSession: () => void;
  startFitting: () => void;
  endFitting: () => void;

  // During session
  addFrameTried: (frame: FrameTried) => void;
  removeFrameTried: (id: string) => void;
  updateFrameVerdict: (id: string, verdict: FrameTried['verdict']) => void;
  markFrameSynced: (id: string) => void;
  setSessionNotes: (notes: string) => void;
  markNotesSaved: () => void;

  // Legacy compat
  setClient: (id: string | null, options?: StartSessionOptions) => void;
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
  appointmentId: null,
  sessionStartedAt: null,
  framesTried: [],
  sessionNotes: '',
  notesLastSavedAt: null,
};

export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      startSession: (clientId: string, clientName: string, options?: StartSessionOptions) => {
        const current = get();
        // Prevent starting a new session if one is already active
        if (current.mode !== 'idle') return;

        set({
          activeClientId: clientId,
          activeClientName: clientName,
          mode: 'session',
          sessionId: generateSessionId(), // local placeholder — replaced by server ID
          appointmentId: options?.appointmentId ?? null,
          sessionStartedAt: Date.now(),
          framesTried: [],
          sessionNotes: '',
          notesLastSavedAt: null,
        });
      },

      setSessionId: (id: string) => {
        set({ sessionId: id });
      },

      replaceLocalSessionId: (localId: string, serverId: string) => {
        if (get().sessionId !== localId) return;
        set({ sessionId: serverId });
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

      markFrameSynced: (id: string) => {
        set((state) => ({
          framesTried: state.framesTried.map((f) =>
            f.id === id ? { ...f, syncedAt: Date.now() } : f
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
      setClient: (id: string | null, options?: StartSessionOptions) => {
        if (id) {
          // startSession should be preferred, but this maintains backward compat
          set({
            activeClientId: id,
            mode: 'session',
            sessionId: generateSessionId(),
            appointmentId: options?.appointmentId ?? null,
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
        appointmentId: state.appointmentId,
        sessionStartedAt: state.sessionStartedAt,
        framesTried: state.framesTried,
        sessionNotes: state.sessionNotes,
        notesLastSavedAt: state.notesLastSavedAt,
      }),
    }
  )
);
