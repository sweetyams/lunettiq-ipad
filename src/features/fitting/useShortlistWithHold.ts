import { useCreateProtection } from '@/src/api/useInventory';
import { toast } from '@/src/ui/useToastStore';
import { useSyncStore } from '@/src/sync/useSyncStore';

interface UseShortlistWithHoldParams {
  onSuccess?: (holdId: string, expiresAt: string) => void;
  onError?: (error: unknown) => void;
}

export function useShortlistWithHold({ onSuccess, onError }: UseShortlistWithHoldParams = {}) {
  const createProtection = useCreateProtection();
  const isOnline = useSyncStore((s) => s.isOnline);

  const shortlistWithHold = async (params: {
    productId: string;
    clientId?: string;
    sessionId?: string;
  }) => {
    const { productId, clientId, sessionId } = params;

    if (!isOnline) {
      // Offline fallback - show toast with offline message
      toast.warning('Added to Shortlist', 'Will create hold when back online');
      onSuccess?.('offline-placeholder', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString());
      return;
    }

    try {
      // Create 48-hour hold
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      
      const protection = await createProtection.mutateAsync({
        productId,
        reason: 'try_on_hold',
        clientId,
        sessionId,
        expiresAt,
      });

      // Format expiry date for toast
      const holdUntil = new Date(protection.expiresAt);
      const formattedDate = holdUntil.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      toast.success('Added to Shortlist', `Held until ${formattedDate}`);
      onSuccess?.(protection.id, protection.expiresAt);

    } catch (error) {
      console.error('Failed to create hold:', error);
      toast.error('Failed to create hold', 'Added to shortlist locally');
      
      // Fallback to optimistic local shortlist
      const fallbackExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      onSuccess?.('local-fallback', fallbackExpiry);
      onError?.(error);
    }
  };

  return {
    shortlistWithHold,
    isLoading: createProtection.isPending,
  };
}