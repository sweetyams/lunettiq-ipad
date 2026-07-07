import { create } from 'zustand';

interface FrameTried {
  id: string;
  productId: string;
  variantId?: string;
  verdict?: 'loved' | 'liked' | 'unsure' | 'rejected';
  notes?: string;
  photoIds: string[];
  triedAt: number;
}

interface SessionState {
  activeClientId: string | null;
  mode: 'discovery' | 'session' | 'fitting';
  sessionId: string | null;
  framesTried: FrameTried[];
  setClient: (id: string | null) => void;
  setMode: (mode: SessionState['mode']) => void;
  addFrameTried: (frame: FrameTried) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeClientId: null,
  mode: 'discovery',
  sessionId: null,
  framesTried: [],
  
  setClient: (id) => 
    set({ 
      activeClientId: id, 
      mode: id ? 'session' : 'discovery' 
    }),
  
  setMode: (mode) => set({ mode }),
  
  addFrameTried: (frame) => 
    set((state) => ({ 
      framesTried: [...state.framesTried, frame] 
    })),
  
  reset: () => 
    set({ 
      activeClientId: null, 
      mode: 'discovery', 
      sessionId: null, 
      framesTried: [] 
    }),
}));