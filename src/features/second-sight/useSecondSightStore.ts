import { create } from 'zustand';
import { 
  SecondSightIntake, 
  FrameGrade, 
  GRADE_CREDIT_MAP, 
  TIER_MULTIPLIERS 
} from './second-sight.types';

interface SecondSightWizardState {
  currentStep: number;
  intake: Partial<SecondSightIntake>;
  
  // Step navigation
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  
  // Frame identification (Step 1)
  setFrameDescription: (description: string) => void;
  setBrand: (brand: string) => void;
  setModel: (model: string) => void;
  setCondition: (condition: string) => void;
  
  // Photos (Step 2)
  addPhoto: (uri: string, slot: string) => void;
  removePhoto: (slot: string) => void;
  getPhotoForSlot: (slot: string) => string | null;
  
  // Grading (Step 3)
  setGrade: (grade: FrameGrade) => void;
  
  // Credit calculation (Step 4)
  calculateCredit: (clientTier: string) => number;
  setCreditAmount: (amount: number) => void;
  
  // Notes (throughout)
  setNotes: (notes: string) => void;
  
  // Wizard control
  initializeIntake: (clientId: string, clientName: string) => void;
  reset: () => void;
  
  // Validation
  canProceedFromStep: (step: number) => boolean;
}

const initialIntakeState: Partial<SecondSightIntake> = {
  frameDescription: '',
  brand: '',
  model: '',
  condition: '',
  photoUrls: [],
  localPhotoUris: [],
  grade: null,
  creditAmount: null,
  notes: '',
  status: 'new',
};

export const useSecondSightStore = create<SecondSightWizardState>((set, get) => ({
  currentStep: 1,
  intake: initialIntakeState,
  
  nextStep: () => {
    const { currentStep, canProceedFromStep } = get();
    if (canProceedFromStep(currentStep) && currentStep < 6) {
      set({ currentStep: currentStep + 1 });
    }
  },
  
  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },
  
  setStep: (step: number) => {
    if (step >= 1 && step <= 6) {
      set({ currentStep: step });
    }
  },
  
  setFrameDescription: (description: string) => {
    set((state) => ({
      intake: { ...state.intake, frameDescription: description }
    }));
  },
  
  setBrand: (brand: string) => {
    set((state) => ({
      intake: { ...state.intake, brand }
    }));
  },
  
  setModel: (model: string) => {
    set((state) => ({
      intake: { ...state.intake, model }
    }));
  },
  
  setCondition: (condition: string) => {
    set((state) => ({
      intake: { ...state.intake, condition }
    }));
  },
  
  addPhoto: (uri: string, slot: string) => {
    set((state) => {
      const updatedUris = [...(state.intake.localPhotoUris || [])];
      const slotIndex = ['front', 'left', 'right', 'lenses'].indexOf(slot);
      if (slotIndex !== -1) {
        updatedUris[slotIndex] = uri;
      }
      return {
        intake: { ...state.intake, localPhotoUris: updatedUris }
      };
    });
  },
  
  removePhoto: (slot: string) => {
    set((state) => {
      const updatedUris = [...(state.intake.localPhotoUris || [])];
      const slotIndex = ['front', 'left', 'right', 'lenses'].indexOf(slot);
      if (slotIndex !== -1) {
        updatedUris[slotIndex] = '';
      }
      return {
        intake: { ...state.intake, localPhotoUris: updatedUris }
      };
    });
  },
  
  getPhotoForSlot: (slot: string) => {
    const { intake } = get();
    const slotIndex = ['front', 'left', 'right', 'lenses'].indexOf(slot);
    if (slotIndex !== -1 && intake.localPhotoUris?.[slotIndex]) {
      return intake.localPhotoUris[slotIndex];
    }
    return null;
  },
  
  setGrade: (grade: FrameGrade) => {
    set((state) => ({
      intake: { ...state.intake, grade }
    }));
  },
  
  calculateCredit: (clientTier: string) => {
    const { intake } = get();
    if (!intake.grade) return 0;
    
    const baseCredit = GRADE_CREDIT_MAP[intake.grade];
    const tierMultiplier = TIER_MULTIPLIERS[clientTier as keyof typeof TIER_MULTIPLIERS] || 1.0;
    return Math.round(baseCredit * tierMultiplier);
  },
  
  setCreditAmount: (amount: number) => {
    set((state) => ({
      intake: { ...state.intake, creditAmount: amount }
    }));
  },
  
  setNotes: (notes: string) => {
    set((state) => ({
      intake: { ...state.intake, notes }
    }));
  },
  
  initializeIntake: (clientId: string, clientName: string) => {
    set({
      currentStep: 1,
      intake: {
        ...initialIntakeState,
        id: `intake_${Date.now()}`,
        clientId,
        clientName,
        createdAt: Date.now(),
      }
    });
  },
  
  reset: () => {
    set({
      currentStep: 1,
      intake: initialIntakeState,
    });
  },
  
  canProceedFromStep: (step: number) => {
    const { intake } = get();
    
    switch (step) {
      case 1: // Identify
        return !!(intake.frameDescription && intake.frameDescription.trim().length > 0);
      
      case 2: // Photos
        return intake.localPhotoUris?.length === 4 && 
               intake.localPhotoUris.every(uri => uri && uri.trim().length > 0);
      
      case 3: // Grade
        return !!intake.grade;
      
      case 4: // Credit
        return intake.creditAmount !== null && intake.creditAmount !== undefined && intake.creditAmount > 0;
      
      case 5: // Decision
        return true; // Decision step doesn't have validation
      
      case 6: // Done
        return true;
      
      default:
        return false;
    }
  },
}));