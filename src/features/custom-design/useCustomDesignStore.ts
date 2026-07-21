import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { CustomDesignIntake, CustomDesignState, ReferencePhoto } from './custom-design.types';

interface CustomDesignStore extends CustomDesignState {
  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  
  // Reference Photos (Step 1)
  addReferencePhoto: (photo: ReferencePhoto) => void;
  removeReferencePhoto: (index: number) => void;
  updatePhotoCaption: (index: number, caption: string) => void;
  
  // Design Brief (Step 2)
  setDesignBrief: (brief: string) => void;
  setModifications: (modifications: string) => void;
  setMaterialPreference: (material: string) => void;
  setColourPreference: (colour: string) => void;
  
  // Measurements (Step 3)
  setMeasurements: (measurements: Partial<CustomDesignIntake['measurements']>) => void;
  copyFromCurrentFrames: (measurements: CustomDesignIntake['measurements']) => void;
  
  // Quote Details (Step 4)
  setBudgetRange: (range: string) => void;
  setTargetDate: (date: string) => void;
  setNotes: (notes: string) => void;
  
  // Submission
  setSubmitting: (submitting: boolean) => void;
  submit: () => void;
  
  // Flow management
  initializeIntake: (clientId: string, clientName: string) => void;
  reset: () => void;
}

const initialState: CustomDesignState = {
  currentStep: 1,
  intake: {},
  isSubmitting: false,
};

export const useCustomDesignStore = create<CustomDesignStore>((set, get) => ({
  ...initialState,
  
  // Navigation
  nextStep: () => set((state) => ({ 
    currentStep: Math.min(state.currentStep + 1, 5) 
  })),
  
  prevStep: () => set((state) => ({ 
    currentStep: Math.max(state.currentStep - 1, 1) 
  })),
  
  goToStep: (step) => set({ currentStep: step }),
  
  // Reference Photos (Step 1)
  addReferencePhoto: (photo) => set((state) => ({
    intake: {
      ...state.intake,
      referencePhotos: [...(state.intake.referencePhotos || []), photo],
    },
  })),
  
  removeReferencePhoto: (index) => set((state) => ({
    intake: {
      ...state.intake,
      referencePhotos: state.intake.referencePhotos?.filter((_, i) => i !== index) || [],
    },
  })),
  
  updatePhotoCaption: (index, caption) => set((state) => {
    const photos = [...(state.intake.referencePhotos || [])];
    if (photos[index]) {
      photos[index] = { ...photos[index], caption };
    }
    return {
      intake: {
        ...state.intake,
        referencePhotos: photos,
      },
    };
  }),
  
  // Design Brief (Step 2)
  setDesignBrief: (designBrief) => set((state) => ({
    intake: { ...state.intake, designBrief },
  })),
  
  setModifications: (modifications) => set((state) => ({
    intake: { ...state.intake, modifications },
  })),
  
  setMaterialPreference: (materialPreference) => set((state) => ({
    intake: { ...state.intake, materialPreference },
  })),
  
  setColourPreference: (colourPreference) => set((state) => ({
    intake: { ...state.intake, colourPreference },
  })),
  
  // Measurements (Step 3)
  setMeasurements: (measurements) => set((state) => ({
    intake: {
      ...state.intake,
      measurements: { ...state.intake.measurements, ...measurements },
    },
  })),
  
  copyFromCurrentFrames: (measurements) => set((state) => ({
    intake: {
      ...state.intake,
      measurements,
    },
  })),
  
  // Quote Details (Step 4)
  setBudgetRange: (budgetRange) => set((state) => ({
    intake: { ...state.intake, budgetRange },
  })),
  
  setTargetDate: (targetDate) => set((state) => ({
    intake: { ...state.intake, targetDate },
  })),
  
  setNotes: (notes) => set((state) => ({
    intake: { ...state.intake, notes },
  })),
  
  // Submission
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  
  submit: () => {
    const state = get();
    set({ isSubmitting: true });
    
    // The actual submission will be handled by the component using the mutation hook
    // This just marks the submission state
    
    const submittedIntake: CustomDesignIntake = {
      ...state.intake as CustomDesignIntake,
      submittedAt: Date.now(),
    };
    
    set({
      intake: submittedIntake,
      isSubmitting: false,
    });
  },
  
  // Flow management
  initializeIntake: (clientId, clientName) => set({
    currentStep: 1,
    intake: {
      id: nanoid(),
      clientId,
      clientName,
      status: 'intake',
      referencePhotos: [],
      designBrief: '',
      modifications: '',
      measurements: {},
      notes: '',
      createdAt: Date.now(),
      submittedAt: null,
    },
    isSubmitting: false,
  }),
  
  reset: () => set(initialState),
}));