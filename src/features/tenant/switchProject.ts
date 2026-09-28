import { queryClient } from '@/src/api/client';
import { getDatabaseFor } from '@/src/db';
import { syncEngine } from '@/src/sync/SyncEngine';
import { photoUploadWorker } from '@/src/sync/PhotoUploadWorker';
import { useOperatorStore } from '@/src/features/auth/useOperatorStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { useTenantStore, type Project } from './useTenantStore';

/**
 * Switch the app to a different project (tenant).
 *
 * This is the single orchestration point for changing the active project. It:
 *  1. Stops the sync + photo workers so nothing drains against the old host mid-switch.
 *  2. Sets the new active project (repoints the API base URL + the DB proxy).
 *  3. Pre-opens the target project's isolated SQLite store.
 *  4. Clears server-cache and per-project session state so data never bleeds across
 *     projects.
 *
 * The caller (UI) is responsible for warning about unsynced changes *before* calling
 * this, and for kicking off the initial sync + navigation afterwards.
 *
 * See docs/multi-project/01-ipad-plan.md (Step 5).
 */
export async function switchProject(target: Project): Promise<void> {
  const current = useTenantStore.getState().activeProject;
  if (current?.slug === target.slug) return;

  // 1. Halt background workers bound to the current project's host/DB.
  syncEngine.stop();
  photoUploadWorker.stop();

  // 2. Repoint: base URL (via resolveBaseUrl) and the DB proxy both key off this.
  useTenantStore.getState().setActiveProject(target);

  // 3. Ensure the target project's isolated store is open before anyone reads it.
  getDatabaseFor(target.slug);

  // 4. Drop stale server cache + per-project identity/privacy state.
  queryClient.clear();
  useOperatorStore.getState().clearOperator();
  // Reset privacy to the safe default (staff) on any project change.
  usePrivacyStore.setState({ mode: 'staff', handedToClient: false });
}
