import { useState, useEffect, useRef } from 'react';
import { api } from '@/src/api/client';

interface IncrementalSyncState {
  lastSyncAt: number | null;
  isOnline: boolean;
}

export function useIncrementalSync() {
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  
  // Use refs to store interval IDs for cleanup
  const appointmentsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inventoryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const productsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const syncAppointments = async (): Promise<void> => {
    try {
      const today = new Date().toISOString().split('T')[0] ?? '';
      await api.get('/api/scheduling', {
        params: { date: today }
      });
      setLastSyncAt(Date.now());
      setIsOnline(true);
    } catch (error) {
      console.warn('Appointments sync failed:', error);
      setIsOnline(false);
    }
  };

  const syncInventory = async (): Promise<void> => {
    try {
      // Stub for now - will implement with inventory tracking
      await api.get('/api/storefront/inventory/summary');
      setLastSyncAt(Date.now());
      setIsOnline(true);
    } catch (error) {
      console.warn('Inventory sync failed:', error);
      setIsOnline(false);
    }
  };

  const syncProducts = async (): Promise<void> => {
    try {
      await api.get('/api/storefront/products', {
        params: { limit: '500' }
      });
      setLastSyncAt(Date.now());
      setIsOnline(true);
    } catch (error) {
      console.warn('Products sync failed:', error);
      setIsOnline(false);
    }
  };

  useEffect(() => {
    // Start intervals for background sync
    appointmentsIntervalRef.current = setInterval(syncAppointments, 5 * 60 * 1000); // 5 minutes
    inventoryIntervalRef.current = setInterval(syncInventory, 15 * 60 * 1000); // 15 minutes  
    productsIntervalRef.current = setInterval(syncProducts, 24 * 60 * 60 * 1000); // 24 hours

    // Cleanup on unmount
    return () => {
      if (appointmentsIntervalRef.current) {
        clearInterval(appointmentsIntervalRef.current);
      }
      if (inventoryIntervalRef.current) {
        clearInterval(inventoryIntervalRef.current);
      }
      if (productsIntervalRef.current) {
        clearInterval(productsIntervalRef.current);
      }
    };
  }, []);

  return { 
    lastSyncAt,
    isOnline
  };
}