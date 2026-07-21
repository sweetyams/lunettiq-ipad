export type SecondSightStatus = 'new' | 'submitted' | 'graded' | 'credit_issued' | 'rejected';
export type FrameGrade = 'A' | 'B' | 'C';

export interface SecondSightIntake {
  id: string;
  clientId: string;
  clientName: string;
  status: SecondSightStatus;
  frameDescription: string;
  brand?: string;
  model?: string;
  condition?: string;
  photoUrls: string[];
  localPhotoUris: string[];
  grade: FrameGrade | null;
  creditAmount: number | null; // cents
  gradedBy?: string;
  notes: string;
  createdAt: number;
  submittedAt: number | null;
}

export const GRADE_CREDIT_MAP = {
  A: 7500, // $75
  B: 5000, // $50  
  C: 2500, // $25
} as const;

export const TIER_MULTIPLIERS = {
  essential: 1.0,
  cult: 1.15,
  vault: 1.25,
} as const;

export const PHOTO_SLOTS = [
  { id: 'front', label: 'Front View' },
  { id: 'left', label: 'Left Side' },
  { id: 'right', label: 'Right Side' },
  { id: 'lenses', label: 'Lenses' },
] as const;

export const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent', description: 'Like new, no visible wear' },
  { value: 'good', label: 'Good', description: 'Minor signs of use' },
  { value: 'fair', label: 'Fair', description: 'Visible wear but functional' },
] as const;

export const GRADE_DESCRIPTIONS = {
  A: { title: 'Mint Condition', description: 'Like new, no visible wear', color: 'green' },
  B: { title: 'Good Condition', description: 'Minor wear, good shape', color: 'blue' },
  C: { title: 'Fair Condition', description: 'Visible wear but functional', color: 'warning' },
} as const;