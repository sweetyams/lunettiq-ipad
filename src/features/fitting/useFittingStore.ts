import { create } from 'zustand';
import type { FittingState, FittingActions, SessionPhoto, Verdict } from './fitting.types';

const MAX_PHOTOS = 20;

interface FittingStore extends FittingState, FittingActions {}

export const useFittingStore = create<FittingStore>((set, get) => ({
  // State
  isActive: false,
  consentStatus: 'pending',
  consentCapturedAt: null,
  photos: [],
  selectedPhotoIds: [],
  maxPhotos: MAX_PHOTOS,

  // Actions
  startFitting: () => {
    set({ 
      isActive: true,
      consentStatus: 'pending',
      photos: [],
      selectedPhotoIds: []
    });
  },

  endFitting: () => {
    set({ 
      isActive: false,
      selectedPhotoIds: []
    });
  },

  setConsent: (granted: boolean) => {
    set({ 
      consentStatus: granted ? 'granted' : 'declined',
      consentCapturedAt: Date.now()
    });
  },

  addPhoto: (photo: SessionPhoto) => {
    const { photos } = get();
    if (photos.length >= MAX_PHOTOS) return;
    
    set((state) => ({
      photos: [...state.photos, photo]
    }));
  },

  removePhoto: (id: string) => {
    set((state) => ({
      photos: state.photos.filter(p => p.id !== id),
      selectedPhotoIds: state.selectedPhotoIds.filter(sid => sid !== id)
    }));
  },

  updatePhoto: (id: string, updates: Partial<SessionPhoto>) => {
    set((state) => ({
      photos: state.photos.map(p => 
        p.id === id ? { ...p, ...updates } : p
      )
    }));
  },

  setVerdict: (photoId: string, verdict: Verdict) => {
    const { updatePhoto } = get();
    updatePhoto(photoId, { verdict });
  },

  linkProduct: (photoId: string, productId: string, productName: string) => {
    const { updatePhoto } = get();
    updatePhoto(photoId, { productId, productName });
  },

  toggleSelectForCompare: (photoId: string) => {
    set((state) => {
      const isSelected = state.selectedPhotoIds.includes(photoId);
      if (isSelected) {
        return {
          selectedPhotoIds: state.selectedPhotoIds.filter(id => id !== photoId)
        };
      } else {
        // Limit to 4 photos for comparison
        if (state.selectedPhotoIds.length >= 4) return state;
        return {
          selectedPhotoIds: [...state.selectedPhotoIds, photoId]
        };
      }
    });
  },

  clearSelection: () => {
    set({ selectedPhotoIds: [] });
  },

  reset: () => {
    set({
      isActive: false,
      consentStatus: 'pending',
      consentCapturedAt: null,
      photos: [],
      selectedPhotoIds: []
    });
  },
}));