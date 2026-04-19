import { useEffect, useRef } from 'react';
import { useAppStore } from './store';
import { useApi } from './api';

/**
 * Processes the photo upload queue in background.
 * Uploads pending photos one at a time when online.
 */
export function usePhotoUploader() {
  const { photoQueue, updatePhotoStatus, removePhoto, isOnline } = useAppStore();
  const { request } = useApi();
  const processing = useRef(false);

  useEffect(() => {
    if (!isOnline || processing.current) return;
    const pending = photoQueue.filter((p) => p.status === 'pending');
    if (pending.length === 0) return;
    processNext(pending[0]);
  }, [isOnline, photoQueue]);

  const processNext = async (photo: typeof photoQueue[0]) => {
    processing.current = true;
    updatePhotoStatus(photo.id, 'uploading');

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('photo', {
        uri: photo.localUri,
        type: 'image/jpeg',
        name: `${photo.id}.jpg`,
      } as any);
      if (photo.variantId) formData.append('variantId', photo.variantId);
      formData.append('sessionId', photo.sessionId);

      const token = await getTokenFromClerk();
      await fetch(
        `${__DEV__ ? 'http://localhost:3000' : 'https://lunettiq.vercel.app'}/api/crm/clients/${photo.clientId}/photo`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-CRM-Surface': 'tablet',
          },
          body: formData,
        },
      );
      removePhoto(photo.id);
    } catch {
      updatePhotoStatus(photo.id, 'failed');
    }
    processing.current = false;
  };
}

// Helper to get token outside of hook context
let _getToken: (() => Promise<string | null>) | null = null;
export function setTokenGetter(fn: () => Promise<string | null>) { _getToken = fn; }
async function getTokenFromClerk(): Promise<string> {
  if (_getToken) return (await _getToken()) || '';
  return '';
}
