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
import { useTenantStore } from '@/src/features/tenant/useTenantStore';

const MODEL_CLASSES = [
  Product,
  Client,
  Appointment,
  Session,
  SyncQueue,
  PhotoUpload,
  DeviceConfig,
];

/**
 * Per-project database isolation.
 *
 * Each project (tenant) gets its own SQLite file, named `lunettiq-<slug>`. This
 * guarantees demo and production data can never share a store — a hard requirement for
 * a two-person, multi-project device (see docs/multi-project/01-ipad-plan.md, Step 3).
 *
 * When no project is active (first boot / dev), we fall back to a `default` store so the
 * app behaves exactly as it did before multi-project support.
 */

const DEFAULT_SLUG = 'default';

/**
 * Resolve the SQLite file name for a slug.
 *
 * The `default` store (no project selected) keeps the library's original default file
 * name so existing installs — which ran before per-project isolation — keep their data
 * and don't trigger a full re-sync. Real projects get isolated `lunettiq-<slug>` files.
 */
function dbNameFor(slug: string): string {
  return slug === DEFAULT_SLUG ? 'watermelon' : `lunettiq-${slug}`;
}

/** Build a fresh Database bound to a project-specific SQLite file. */
function createDatabase(slug: string): Database {
  const adapter = new SQLiteAdapter({
    dbName: dbNameFor(slug),
    schema,
    migrations,
    jsi: true, // JSI for better performance on newer React Native versions
    onSetUpError: (error) => {
      console.error(`WatermelonDB setup error (${slug}):`, error);
    },
  });

  return new Database({
    adapter,
    modelClasses: MODEL_CLASSES,
  });
}

/** Cache of opened databases, keyed by project slug. */
const instances = new Map<string, Database>();

/** Resolve the slug of the currently active project, or the default store. */
function activeSlug(): string {
  return useTenantStore.getState().activeProject?.slug ?? DEFAULT_SLUG;
}

/**
 * Get the Database for a specific project slug (opening it if needed).
 */
export function getDatabaseFor(slug: string): Database {
  let db = instances.get(slug);
  if (!db) {
    db = createDatabase(slug);
    instances.set(slug, db);
  }
  return db;
}

/**
 * Get the Database for the currently active project.
 * Falls back to the `default` store when no project is selected.
 */
export function getDatabase(): Database {
  return getDatabaseFor(activeSlug());
}

/**
 * Live proxy that always forwards to the active project's Database.
 *
 * Modules that `import { database } from '@/src/db'` capture this proxy once at load
 * time, but every property access is resolved against the *current* active database —
 * so switching projects transparently repoints all existing consumers.
 */
export const database: Database = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const db = getDatabase();
    const value = Reflect.get(db as object, prop, receiver);
    return typeof value === 'function' ? value.bind(db) : value;
  },
}) as Database;

/**
 * Reset the active project's database (for development/testing only).
 * WARNING: This will delete ALL data for the active project.
 */
export async function resetDatabase(): Promise<void> {
  if (__DEV__) {
    const db = getDatabase();
    await db.write(async () => {
      await db.unsafeResetDatabase();
    });
    console.log(`Database reset complete (${activeSlug()})`);
  } else {
    console.warn('Database reset is only available in development mode');
  }
}

/**
 * Get database collections with type safety, for a given database
 * (defaults to the active project's database).
 */
export function getCollections(db: Database = getDatabase()) {
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
 * Database health check (active project).
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
 * Get database statistics for debugging (active project).
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

export default database;
