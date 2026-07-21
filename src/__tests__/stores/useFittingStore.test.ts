import { describe, it, expect, beforeEach } from 'vitest';
import { useFittingStore } from '@/src/features/fitting/useFittingStore';
import type { SessionPhoto } from '@/src/features/fitting/fitting.types';

const mockPhoto = (id: string): SessionPhoto => ({
  id,
  localUri: `file://photo_${id}`,
  thumbnailUri: `file://thumb_${id}`,
  r2Key: null,
  productId: null,
  productName: null,
  verdict: null,
  notes: '',
  clientVisible: true,
  capturedAt: Date.now(),
  uploadStatus: 'pending',
  isShortlisted: false,
});

describe('useFittingStore', () => {
  beforeEach(() => {
    useFittingStore.getState().reset();
  });

  it('starts inactive with pending consent', () => {
    const state = useFittingStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.consentStatus).toBe('pending');
    expect(state.photos).toHaveLength(0);
  });

  it('startFitting sets isActive', () => {
    useFittingStore.getState().startFitting();
    expect(useFittingStore.getState().isActive).toBe(true);
  });

  it('setConsent updates consent status', () => {
    useFittingStore.getState().setConsent(true);
    expect(useFittingStore.getState().consentStatus).toBe('granted');
    expect(useFittingStore.getState().consentCapturedAt).toBeGreaterThan(0);
  });

  it('addPhoto appends up to max 20', () => {
    for (let i = 0; i < 21; i++) {
      useFittingStore.getState().addPhoto(mockPhoto(`p${i}`));
    }
    expect(useFittingStore.getState().photos).toHaveLength(20);
  });

  it('removePhoto removes and deselects', () => {
    useFittingStore.getState().addPhoto(mockPhoto('p1'));
    useFittingStore.getState().toggleSelectForCompare('p1');
    useFittingStore.getState().removePhoto('p1');
    expect(useFittingStore.getState().photos).toHaveLength(0);
    expect(useFittingStore.getState().selectedPhotoIds).not.toContain('p1');
  });

  it('toggleSelectForCompare limits to 4 selections', () => {
    for (let i = 0; i < 6; i++) {
      useFittingStore.getState().addPhoto(mockPhoto(`p${i}`));
      useFittingStore.getState().toggleSelectForCompare(`p${i}`);
    }
    expect(useFittingStore.getState().selectedPhotoIds).toHaveLength(4);
  });

  it('setVerdict updates photo verdict', () => {
    useFittingStore.getState().addPhoto(mockPhoto('p1'));
    useFittingStore.getState().setVerdict('p1', 'loved');
    expect(useFittingStore.getState().photos[0]!.verdict).toBe('loved');
  });

  it('reset clears all state', () => {
    useFittingStore.getState().startFitting();
    useFittingStore.getState().addPhoto(mockPhoto('p1'));
    useFittingStore.getState().reset();
    const state = useFittingStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.photos).toHaveLength(0);
  });
});
