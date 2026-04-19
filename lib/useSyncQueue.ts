import { useEffect, useRef } from 'react';
import { useAppStore } from './store';
import { useApi } from './api';

export function useSyncQueue() {
  const { syncQueue, removeFromSyncQueue, isOnline } = useAppStore();
  const { request } = useApi();
  const draining = useRef(false);

  useEffect(() => {
    if (!isOnline || syncQueue.length === 0 || draining.current) return;
    drain();
  }, [isOnline, syncQueue.length]);

  const drain = async () => {
    draining.current = true;
    const queue = [...syncQueue];
    for (const item of queue) {
      try {
        const method = item.operation === 'create' ? 'POST' : item.operation === 'update' ? 'PATCH' : 'DELETE';
        await request(item.payload.path, { method, body: item.payload.body });
        removeFromSyncQueue(item.id);
      } catch {
        // Stop on first failure, retry later
        break;
      }
    }
    draining.current = false;
  };
}
