import { useState } from 'react';
import { api } from '@/src/api/client';
import { database, getCollections } from '@/src/db';
import { DeviceConfig } from '@/src/db/models/DeviceConfig.model';
import { useSyncStore } from './useSyncStore';

export interface InitialSyncState {
  progress: number;
  status: 'idle' | 'syncing' | 'complete' | 'error';
  message: string;
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

interface Settings {
  [key: string]: unknown;
}

export function useInitialSync() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<InitialSyncState['status']>('idle');
  const [message, setMessage] = useState('');
  const { setLastFullSyncAt } = useSyncStore();

  const startSync = async (): Promise<void> => {
    setStatus('syncing');
    setProgress(0);
    
    try {
      const collections = getCollections();
      const now = Date.now();
      
      // Step 1: Download and persist products
      setMessage('Downloading products...');
      setProgress(10);
      
      const productsResponse = await api.get<Product[]>('/api/storefront/products', { 
        params: { limit: '500' } 
      });
      
      setProgress(25);
      setMessage('Saving products...');
      
      // Batch create/update products
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
      
      setProgress(50);
      
      // Step 2: Download and persist appointments
      setMessage('Downloading appointments...');
      
      const today = new Date().toISOString().split('T')[0] ?? '';
      const appointmentsResponse = await api.get<Appointment[]>('/api/scheduling', { 
        params: { date: today } 
      });
      
      setProgress(65);
      setMessage('Saving appointments...');
      
      // Batch create/update appointments
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
      
      setProgress(80);
      
      // Step 3: Download and persist settings
      setMessage('Downloading settings...');
      
      const settingsResponse = await api.get<Settings>('/api/storefront/settings');
      
      setProgress(90);
      setMessage('Saving settings...');
      
      // Save settings to device_config — mark sync complete
      await database.write(async () => {
        // Get or create the singleton device config
        const existingConfigs = await collections.deviceConfig
          .query()
          .fetch();
        
        if (existingConfigs.length > 0) {
          // Update existing — mark full sync complete
          const updateRecord = existingConfigs[0]!.prepareUpdate((record: DeviceConfig) => {
            record.lastFullSyncAt = new Date();
            record.lastIncrementalSyncAt = new Date();
          });
          await database.batch([updateRecord]);
        } else {
          // Create new config record
          const configRecord = collections.deviceConfig.prepareCreate((record: DeviceConfig) => {
            record.locationId = '';
            record.staffId = '';
            record.appVersion = '0.1.0';
            record.uploadOnCellular = false;
            record.privacyMode = 'staff';
          });
          await database.batch([configRecord]);
        }
      });
      
      setProgress(100);
      setMessage('Sync complete!');
      
      // Update sync store
      setLastFullSyncAt(now);
      
      // Brief pause for user feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      setStatus('complete');
      
    } catch (error) {
      console.error('Initial sync failed:', error);
      setStatus('error');
      setMessage('Sync failed. Check connection and try again.');
    }
  };

  const reset = (): void => {
    setProgress(0);
    setStatus('idle');
    setMessage('');
  };

  return { 
    progress, 
    status, 
    message, 
    startSync,
    reset
  };
}