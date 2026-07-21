export type CustomDesignStatus = 'intake' | 'review' | 'quote_sent' | 'deposit_paid' | 'in_production' | 'complete';

export interface CustomDesignIntake {
  id: string;
  clientId: string;
  clientName: string;
  status: CustomDesignStatus;
  referencePhotos: Array<{ 
    localUri: string; 
    r2Key?: string; 
    r2Url?: string; 
    caption?: string;
  }>;
  designBrief: string;
  modifications: string;
  measurements: {
    frameWidth?: number;
    bridgeWidth?: number;
    templeLength?: number;
    lensHeight?: number;
    lensWidth?: number;
  };
  materialPreference?: string;
  colourPreference?: string;
  budgetRange?: string;
  targetDate?: string;
  notes: string;
  createdAt: number;
  submittedAt: number | null;
}

export interface ReferencePhoto {
  localUri: string;
  r2Key?: string;
  r2Url?: string;
  caption?: string;
}

export type BudgetRange = '$500-800' | '$800-1200' | '$1200-2000' | '$2000+';
export type MaterialPreference = 'acetate' | 'titanium' | 'mixed' | 'other';

export interface CustomDesignState {
  currentStep: number;
  intake: Partial<CustomDesignIntake>;
  isSubmitting: boolean;
}