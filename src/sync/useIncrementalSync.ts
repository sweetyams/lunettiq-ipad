import { useState, useEffect, useRef } from 'react';
import { api } from '@/src/api/client';
import { database, getCollections } from '@/src/db';
import { useSyncStore } from './useSyncStore';

interface IncrementalSyncState {
  lastSyncAt: number | null;
  isOnline: boolean;
}

interface Appointment {
  foundryId: string;
  clientId: string;
  clientName: string;
  staffId: string;
  staffName: string;
  typeId?: string;
  typeName: string;
  locationId: string;
  startsAt: string;
  endsAt: string;
  status: string;
  notes?: string;
  intakeFormType?: string;
  reminderSentAt?: string;
}

interface Product {
  shopifyId: string;
  familyId: string;
  familyCode: string;
  title: string;
  vendor: string;
  handle: string;
  type: string;
  material?: string;
  shape?: string;
  colour?: string;
  colourHex?: string;
  barcode?: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  images: string[];
  dimensions: {
    width: number;
    bridge: number;
    temple: number;
    lensHeight: number;
    lensWidth: number;
  };
  tags: string[];
  status: string;
  stockLevel: number;
  locationStock: Record<string, number>;
  sortOrder: number;
}

export function useIncrementalSync() {
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const { setLastSyncAt: setStoreSyncAt, setOnline, setSyncStatus } = useSyncStore();
  
  // Use refs to store interval IDs for cleanup
  const appointmentsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inventoryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const productsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const syncAppointments = async (): Promise<void> => {
    try {
      const collections = getCollections();
      const today = new Date().toISOString().split('T')[0] ?? '';
      
      setSyncStatus('syncing');
      const appointmentsResponse = await api.get<Appointment[]>('/api/scheduling', {
        params: { date: today }
      });
      
      // Persist appointments to WatermelonDB
      await database.write(async () => {
        const appointmentRecords = appointmentsResponse.map((appointment) =>
          collections.appointments.prepareCreate((record) => {
            record.foundryId = appointment.foundryId;
            record.clientId = appointment.clientId;
            record.clientName = appointment.clientName;
            record.staffId = appointment.staffId;
            record.staffName = appointment.staffName;
            record.typeId = appointment.typeId;
            record.typeName = appointment.typeName;
            record.locationId = appointment.locationId;
            record.startsAt = new Date(appointment.startsAt);
            record.endsAt = new Date(appointment.endsAt);
            record.status = appointment.status as any;
            record.notes = appointment.notes;
            record.intakeFormType = appointment.intakeFormType;
            record.reminderSentAt = appointment.reminderSentAt ? new Date(appointment.reminderSentAt) : undefined;
            record.syncedAt = new Date();
          })
        );
        
        // Clear existing appointments for today first
        const existingAppointments = await collections.appointments
          .query()
          .fetch();
        const deleteRecords = existingAppointments.map(a => a.prepareDestroyPermanently());
        
        await database.batch([...deleteRecords, ...appointmentRecords]);
      });
      
      const now = Date.now();
      setLastSyncAt(now);
      setStoreSyncAt(now);
      setIsOnline(true);
      setOnline(true);
      setSyncStatus('idle');
    } catch (error) {
      console.warn('Appointments sync failed:', error);
      setIsOnline(false);
      setOnline(false);
      setSyncStatus('error');
    }
  };

  const syncInventory = async (): Promise<void> => {
    try {
      setSyncStatus('syncing');
      // Stub for now - will implement with inventory tracking
      // Just check if we can reach the endpoint
      await api.get('/api/inventory/summary', {
        params: { locationId: 'default' }
      });
      
      const now = Date.now();
      setLastSyncAt(now);
      setStoreSyncAt(now);
      setIsOnline(true);
      setOnline(true);
      setSyncStatus('idle');
    } catch (error) {
      console.warn('Inventory sync failed:', error);
      setIsOnline(false);
      setOnline(false);
      setSyncStatus('error');
    }
  };

  const syncProducts = async (): Promise<void> => {
    try {
      const collections = getCollections();
      
      setSyncStatus('syncing');
      const productsResponse = await api.get<Product[]>('/api/storefront/products', {
        params: { limit: '500' }
      });
      
      // Persist products to WatermelonDB
      await database.write(async () => {
        const productRecords = productsResponse.map((product) =>
          collections.products.prepareCreate((record) => {
            record.shopifyId = product.shopifyId;
            record.familyId = product.familyId;
            record.familyCode = product.familyCode;
            record.title = product.title;
            record.vendor = product.vendor;
            record.handle = product.handle;
            record.type = product.type;
            record.material = product.material;
            record.shape = product.shape;
            record.colour = product.colour;
            record.colourHex = product.colourHex;
            record.barcode = product.barcode;
            record.price = product.price;
            record.compareAtPrice = product.compareAtPrice;
            record.imageUrl = product.imageUrl;
            record.images = product.images;
            record.dimensions = product.dimensions;
            record.tags = product.tags;
            record.status = product.status;
            record.stockLevel = product.stockLevel;
            record.locationStock = product.locationStock;
            record.sortOrder = product.sortOrder;
            record.syncedAt = new Date();
          })
        );
        
        // Clear existing products first
        const existingProducts = await collections.products.query().fetch();
        const deleteRecords = existingProducts.map(p => p.prepareDestroyPermanently());
        
        await database.batch([...deleteRecords, ...productRecords]);
      });
      
      const now = Date.now();
      setLastSyncAt(now);
      setStoreSyncAt(now);
      setIsOnline(true);
      setOnline(true);
      setSyncStatus('idle');
    } catch (error) {
      console.warn('Products sync failed:', error);
      setIsOnline(false);
      setOnline(false);
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    // Start intervals for background sync
    appointmentsIntervalRef.current = setInterval(syncAppointments, 5 * 60 * 1000); // 5 minutes
    inventoryIntervalRef.current = setInterval(syncInventory, 15 * 60 * 1000); // 15 minutes  
    productsIntervalRef.current = setInterval(syncProducts, 24 * 60 * 60 * 1000); // 24 hours

    // Initial sync on mount
    syncAppointments();

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