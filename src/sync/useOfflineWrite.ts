import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/api/client';
import { syncEngine } from './SyncEngine';
import { useSyncStore } from './useSyncStore';

interface OfflineMutationOptions<TPayload, TResponse> {
  /** API endpoint path (e.g., '/api/clients/{id}/interactions') */
  endpoint: string | ((payload: TPayload) => string);
  /** HTTP method */
  method: 'POST' | 'PATCH' | 'DELETE';
  /** Entity type for the sync queue (e.g., 'interaction', 'session') */
  entityType: string;
  /** Extract entity ID from the payload for queue tracking */
  getEntityId: (payload: TPayload) => string;
  /** Priority in the sync queue */
  priority?: 'low' | 'normal' | 'high';
  /** Query keys to invalidate on success */
  invalidateKeys?: string[][];
  /** Called on successful online mutation */
  onSuccess?: (data: TResponse, payload: TPayload) => void;
  /** Called when mutation is queued offline */
  onQueued?: (payload: TPayload) => void;
  /** Called on error */
  onError?: (error: unknown, payload: TPayload) => void;
}

/**
 * Hook for mutations that gracefully degrade offline.
 *
 * When online: calls API directly via TanStack mutation.
 * When offline: enqueues to WatermelonDB sync_queue for later processing.
 *
 * Usage:
 * ```typescript
 * const addInteraction = useOfflineMutation({
 *   endpoint: (payload) => `/api/clients/${payload.clientId}/interactions`,
 *   method: 'POST',
 *   entityType: 'interaction',
 *   getEntityId: (payload) => payload.id,
 *   invalidateKeys: [['clients']],
 * });
 *
 * addInteraction.mutate({ clientId: '123', type: 'note', content: '...' });
 * ```
 */
export function useOfflineMutation<TPayload extends object, TResponse = unknown>(
  options: OfflineMutationOptions<TPayload, TResponse>
): UseMutationResult<TResponse | { queued: true }, Error, TPayload> {
  const queryClient = useQueryClient();
  const { isOnline } = useSyncStore();

  return useMutation({
    mutationFn: async (payload: TPayload): Promise<TResponse | { queued: true }> => {
      const endpoint = typeof options.endpoint === 'function'
        ? options.endpoint(payload)
        : options.endpoint;

      if (isOnline) {
        // Online: call API directly
        const result = await (options.method === 'POST'
          ? api.post<TResponse>(endpoint, payload)
          : options.method === 'PATCH'
          ? api.patch<TResponse>(endpoint, payload)
          : api.delete<TResponse>(endpoint));

        return result;
      } else {
        // Offline: enqueue for later
        const entityId = options.getEntityId(payload);
        const operation = options.method === 'POST' ? 'create'
          : options.method === 'PATCH' ? 'update'
          : 'delete';

        await syncEngine.enqueue(
          operation,
          options.entityType,
          entityId,
          endpoint,
          options.method,
          payload,
          options.priority || 'normal'
        );

        options.onQueued?.(payload);
        return { queued: true } as { queued: true };
      }
    },
    onSuccess: (data, payload) => {
      // Invalidate related queries
      if (options.invalidateKeys) {
        for (const key of options.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }

      if (data && (typeof data !== 'object' || !('queued' in data))) {
        options.onSuccess?.(data as TResponse, payload);
      }
    },
    onError: (error, payload) => {
      options.onError?.(error, payload);
    },
  });
}
