import { View, Text, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { Clock, Play, Square, ArrowRight, Camera, User, Sparkles } from 'lucide-react-native';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { useClient } from '@/src/api/useClients';
import { EndSessionSheet } from '@/src/features/session/EndSessionSheet';

/**
 * SessionBar — persistent top bar that shows when a session is active.
 * Renders across all tabs so the SA always knows a session is running.
 *
 * Design: elevated white surface with brand text — visually distinct from
 * ModeStrip above and content below. Shows pertinent client details
 * (tier, last visit) alongside session timer and actions.
 */
export function SessionBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeClientId, activeClientName, mode, sessionStartedAt, framesTried, endSession } = useSessionStore();
  const [duration, setDuration] = useState('0:00');
  const [showEndSession, setShowEndSession] = useState(false);

  // Fetch client data for pertinent details (tier, last visit, etc.)
  const { data: client } = useClient(activeClientId ?? '');

  // Live timer
  useEffect(() => {
    if (!sessionStartedAt) {
      setDuration('0:00');
      return;
    }

    const updateDuration = () => {
      const elapsed = Math.floor((Date.now() - sessionStartedAt) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      if (hours > 0) {
        setDuration(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [sessionStartedAt]);

  // Don't render if no active session
  if (mode === 'idle' || !activeClientId) return null;

  // Derive client details
  const tier = client?.tags?.find((tag: string) =>
    ['CULT', 'VAULT'].includes(tag.toUpperCase())
  )?.toUpperCase() || null;

  const lastVisit = client?.updatedAt
    ? formatRelativeDate(client.updatedAt)
    : null;

  const orderCount = client?.orderCount ?? 0;

  // Navigation context
  const isOnSessionScreen = pathname?.includes(`/clients/${activeClientId}/session`);
  const isOnFittingScreen = pathname?.includes(`/clients/${activeClientId}/fitting`);
  const isFitting = mode === 'fitting';

  const handleGoToSession = () => {
    if (!isOnSessionScreen) {
      router.push(`/clients/${activeClientId}/session`);
    }
  };

  const handleGoToProfile = () => {
    router.push(`/clients/${activeClientId}`);
  };

  const handleStartFitting = () => {
    if (!isOnFittingScreen) {
      router.push(`/clients/${activeClientId}/fitting`);
    }
  };

  const handleEndSession = () => {
    setShowEndSession(true);
  };

  const handleEndSessionConfirm = () => {
    setShowEndSession(false);
    endSession();
    router.replace('/(app)/home');
  };

  return (
    <>
      <View className="flex-row h-[52px] items-center px-lg bg-bg-elevated border-b border-border">
        {/* Left: Live indicator + Client info */}
        <Pressable
          onPress={handleGoToSession}
          accessibilityRole="button"
          accessibilityLabel={`Active session with ${activeClientName}. ${duration} elapsed. Tap to go to session workspace.`}
          className="flex-row items-center flex-1 min-h-[44px]"
        >
          {/* Live pulse dot */}
          <View className="w-[8px] h-[8px] rounded-full bg-success mr-sm" />

          {/* Client name */}
          <Text className="text-text-primary text-body-md font-semibold mr-sm" numberOfLines={1}>
            {activeClientName ?? 'Client'}
          </Text>

          {/* Tier badge */}
          {tier && <TierPill tier={tier} />}

          {/* Separator */}
          <View className="w-[1px] h-[20px] bg-border mx-sm" />

          {/* Timer */}
          <Clock color="#1D1F21" size={14} />
          <Text className="text-text-secondary text-body-sm ml-xs">
            {duration}
          </Text>

          {/* Client details — compact pertinent info */}
          {(orderCount > 0 || lastVisit) && (
            <>
              <View className="w-[1px] h-[20px] bg-border mx-sm" />
              {orderCount > 0 && (
                <Text className="text-text-muted text-body-sm mr-sm">
                  {orderCount} order{orderCount !== 1 ? 's' : ''}
                </Text>
              )}
              {lastVisit && (
                <Text className="text-text-muted text-body-sm">
                  Last: {lastVisit}
                </Text>
              )}
            </>
          )}

          {/* Frames tried count */}
          {framesTried.length > 0 && (
            <>
              <View className="w-[1px] h-[20px] bg-border mx-sm" />
              <Sparkles color="#023891" size={13} />
              <Text className="text-accent text-body-sm font-medium ml-xs">
                {framesTried.length} tried
              </Text>
            </>
          )}

          {/* Fitting mode indicator */}
          {isFitting && (
            <View className="ml-sm flex-row items-center px-sm py-xs rounded-full bg-accent">
              <Camera color="#FFFFFF" size={12} />
              <Text className="text-text-inverse text-caption-sm ml-xs font-medium">
                Fitting
              </Text>
            </View>
          )}

          {/* Arrow to indicate tappable */}
          {!isOnSessionScreen && !isOnFittingScreen && (
            <ArrowRight color="rgba(29,31,33,0.35)" size={14} className="ml-xs" />
          )}
        </Pressable>

        {/* Right: Actions */}
        <View className="flex-row items-center gap-sm">
          {/* View profile */}
          <Pressable
            onPress={handleGoToProfile}
            accessibilityRole="button"
            accessibilityLabel="View client profile"
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-md"
          >
            <User color="#1D1F21" size={18} />
          </Pressable>

          {/* Start fitting — only if not already fitting */}
          {!isFitting && (
            <Pressable
              onPress={handleStartFitting}
              accessibilityRole="button"
              accessibilityLabel="Start fitting"
              className="flex-row items-center min-h-[36px] px-md py-xs bg-accent rounded-md"
            >
              <Play color="#FFFFFF" size={13} />
              <Text className="text-accent-text text-body-sm font-medium ml-xs">
                Start fitting
              </Text>
            </Pressable>
          )}

          {/* End session */}
          <Pressable
            onPress={handleEndSession}
            accessibilityRole="button"
            accessibilityLabel="End session"
            className="flex-row items-center min-h-[36px] px-md py-xs rounded-md border border-border"
          >
            <Square color="#B42318" size={12} fill="#B42318" />
            <Text className="text-error text-body-sm font-medium ml-xs">
              End
            </Text>
          </Pressable>
        </View>
      </View>

      {/* End Session Sheet (modal) */}
      <EndSessionSheet
        visible={showEndSession}
        onClose={handleEndSessionConfirm}
      />
    </>
  );
}

/** Compact tier pill for the session bar */
function TierPill({ tier }: { tier: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    CULT: { bg: 'bg-brand', text: 'text-text-inverse' },
    VAULT: { bg: 'bg-accent', text: 'text-text-inverse' },
  };
  const { bg, text } = config[tier] ?? { bg: 'bg-border', text: 'text-text-primary' };

  return (
    <View className={`${bg} px-sm py-[2px] rounded-full`}>
      <Text className={`${text} text-caption-sm font-semibold`}>{tier}</Text>
    </View>
  );
}

/** Format a date string as relative (e.g. "3 days ago", "2 weeks ago") */
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}
