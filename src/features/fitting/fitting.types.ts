export type Verdict = 'loved' | 'liked' | 'unsure' | 'rejected';

export interface SessionPhoto {
  id: string;
  localUri: string;
  thumbnailUri: string;
  r2Key: string | null; // null until uploaded
  productId: string | null;
  productName: string | null;
  verdict: Verdict | null;
  notes: string;
  clientVisible: boolean;
  capturedAt: number;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
}

export interface FittingState {
  isActive: boolean;
  consentStatus: 'pending' | 'granted' | 'declined' | null;
  consentCapturedAt: number | null;
  photos: SessionPhoto[];
  selectedPhotoIds: string[]; // for compare view
  maxPhotos: number;
}

export interface FittingActions {
  startFitting: () => void;
  endFitting: () => void;
  setConsent: (granted: boolean) => void;
  addPhoto: (photo: SessionPhoto) => void;
  removePhoto: (id: string) => void;
  updatePhoto: (id: string, updates: Partial<SessionPhoto>) => void;
  setVerdict: (photoId: string, verdict: Verdict) => void;
  linkProduct: (photoId: string, productId: string, productName: string) => void;
  toggleSelectForCompare: (photoId: string) => void;
  clearSelection: () => void;
  reset: () => void;
}