import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { migrations } from './migrations';
import {
  Product,
  Client,
  Appointment,
  Session,
  SyncQueue,
  PhotoUpload,
  DeviceConfig,
} from './models';

// Create the SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true, // Enable JSI for better performance on newer React Native versions
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  },
});

// Create database instance
const database = new Database({
  adapter,
  modelClasses: [
    Product,
    Client,
    Appointment,
    Session,
    SyncQueue,
    PhotoUpload,
    DeviceConfig,
  ],
});

// Singleton instance
let databaseInstance: Database | null = null;

/**
 * Get the database instance (singleton pattern)
 */
export function getDatabase(): Database {
  if (!databaseInstance) {
    databaseInstance = database;
  }
  return databaseInstance;
}

/**
 * Reset the database (for development/testing only)
 * WARNING: This will delete ALL data
 */
export async function resetDatabase(): Promise<void> {
  if (__DEV__) {
    const db = getDatabase();
    await db.write(async () => {
      await db.unsafeResetDatabase();
    });
    console.log('Database reset complete');
  } else {
    console.warn('Database reset is only available in development mode');
  }
}

/**
 * Get database collections with type safety
 */
export function getCollections() {
  const db = getDatabase();
  return {
    products: db.collections.get<Product>('products'),
    clients: db.collections.get<Client>('clients'),
    appointments: db.collections.get<Appointment>('appointments'),
    sessions: db.collections.get<Session>('local_sessions'),
    syncQueue: db.collections.get<SyncQueue>('sync_queue'),
    photoUploads: db.collections.get<PhotoUpload>('photo_uploads'),
    deviceConfig: db.collections.get<DeviceConfig>('device_config'),
  };
}

/**
 * Database health check
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const collections = getCollections();
    
    // Try to count records in each collection
    const counts = await Promise.all([
      collections.products.query().fetchCount(),
      collections.clients.query().fetchCount(),
      collections.appointments.query().fetchCount(),
      collections.sessions.query().fetchCount(),
      collections.syncQueue.query().fetchCount(),
      collections.photoUploads.query().fetchCount(),
      collections.deviceConfig.query().fetchCount(),
    ]);
    
    console.log('Database health check passed:', {
      products: counts[0],
      clients: counts[1],
      appointments: counts[2],
      sessions: counts[3],
      syncQueue: counts[4],
      photoUploads: counts[5],
      deviceConfig: counts[6],
    });
    
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get database statistics for debugging
 */
export async function getDatabaseStats(): Promise<Record<string, number>> {
  const collections = getCollections();
  
  const [
    productCount,
    clientCount,
    appointmentCount,
    sessionCount,
    syncQueueCount,
    photoUploadCount,
    deviceConfigCount,
  ] = await Promise.all([
    collections.products.query().fetchCount(),
    collections.clients.query().fetchCount(),
    collections.appointments.query().fetchCount(),
    collections.sessions.query().fetchCount(),
    collections.syncQueue.query().fetchCount(),
    collections.photoUploads.query().fetchCount(),
    collections.deviceConfig.query().fetchCount(),
  ]);

  return {
    products: productCount,
    clients: clientCount,
    appointments: appointmentCount,
    sessions: sessionCount,
    pendingSyncItems: syncQueueCount,
    pendingPhotoUploads: photoUploadCount,
    deviceConfigs: deviceConfigCount,
  };
}

// Export the database instance as default
export { database };
export default database;