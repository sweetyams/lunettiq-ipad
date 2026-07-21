import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { SessionTopBar } from '@/src/features/session/SessionTopBar';
import { ProductBrowserPanel } from '@/src/features/session/ProductBrowserPanel';
import { ClientContextPanel } from '@/src/features/session/ClientContextPanel';
import { EndSessionSheet } from '@/src/features/session/EndSessionSheet';
import { useClient } from '@/src/api/useClients';
import { LoadingState, ErrorState } from '@/src/ui';

export default function SessionWorkspaceScreen() {
  const { id: clientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activeClientId, activeClientName, mode, startSession, endSession } = useSessionStore();
  const [showEndSession, setShowEndSession] = useState(false);
  const [aiSearchTerm, setAiSearchTerm] = useState<string | undefined>(undefined);

  // Fetch client profile (for name fallback + data)
  const { data: client, isLoading, error } = useClient(clientId);

  // Start session on mount if not already active for this client
  useEffect(() => {
    if (!clientId) return;
    if (activeClientId === clientId && (mode === 'session' || mode === 'fitting')) return;

    // Derive client name for the chip
    if (client) {
      const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || client.email || 'Client';
      startSession(clientId, name);
    }
  }, [clientId, client, activeClientId, mode, startSession]);

  // Redirect if session ended externally or wrong client
  useEffect(() => {
    if (mode === 'idle' && !isLoading) {
      router.replace(`/clients/${clientId}`);
    }
  }, [mode, clientId, isLoading, router]);

  // Handlers
  const handleBack = useCallback(() => {
    // Going back doesn't end the session — it persists via chip
    router.back();
  }, [router]);

  const handleStartFitting = useCallback(() => {
    router.push(`/clients/${clientId}/fitting`);
  }, [router, clientId]);

  const handleEndSession = useCallback(() => {
    setShowEndSession(true);
  }, []);

  const handleEndSessionDismiss = useCallback(() => {
    // Just hide the sheet, keep session active
    setShowEndSession(false);
  }, []);

  const handleEndSessionComplete = useCallback(() => {
    // Flow completed successfully - end session and navigate
    setShowEndSession(false);
    endSession();
    router.replace(`/clients/${clientId}`);
  }, [endSession, router, clientId]);

  const handleProductPress = useCallback((productId: string) => {
    router.push(`/products/${productId}`);
  }, [router]);

  // Loading state
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => {}} />;

  const clientName = activeClientName
    ?? [client?.firstName, client?.lastName].filter(Boolean).join(' ')
    ?? 'Client';

  return (
    <View className="flex-1 bg-bg-page">
      {/* Session TopBar */}
      <SessionTopBar
        onBack={handleBack}
        onStartFitting={handleStartFitting}
        onEndSession={handleEndSession}
      />

      {/* Split view: Products (left) | Client context (right) */}
      <View className="flex-1 flex-row">
        {/* Left panel — product browser (762pt equiv / flex-[762]) */}
        <View className="flex-[762] border-r border-border">
          <ProductBrowserPanel
            clientId={clientId}
            clientName={clientName}
            onProductPress={handleProductPress}
            externalSearch={aiSearchTerm}
          />
        </View>

        {/* Right panel — client context (492pt equiv / flex-[492]) */}
        <View className="flex-[492]">
          <ClientContextPanel clientId={clientId} onAiChipPress={setAiSearchTerm} />
        </View>
      </View>

      {/* End Session Sheet */}
      <EndSessionSheet
        visible={showEndSession}
        onDismiss={handleEndSessionDismiss}
        onComplete={handleEndSessionComplete}
      />
    </View>
  );
}
