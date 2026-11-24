import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { HandedToClientView } from '@/src/features/fitting/HandedToClientView';
import { SessionBar } from '@/src/ui/SessionBar';
import { SessionServerBridge } from '@/src/features/session/SessionServerBridge';
import { VisitOutboxWorker } from '@/src/features/session/VisitOutboxWorker';
import { FloatingTabBar } from '@/src/ui/FloatingTabBar';
import { useRxApprovalSummary } from '@/src/api/useRxApprovals';
import { useRxPipelineCounts } from '@/src/api/useRxPipeline';
import { useFollowUps } from '@/src/api/useHotLeads';
import { useTodayAppointments } from '@/src/api/useAppointments';
import { usePermissions } from '@/src/features/auth/usePermissions';
import { useEffect, useRef } from 'react';
import { QuickClientSheet } from '@/src/features/clients/QuickClientSheet';
import { useQuickClient } from '@/src/features/clients/useQuickClient';
import { useWalkInCounter, dayKey } from '@/src/features/floor/useWalkInCounter';
import { resolveEffectiveLocationId } from '@/src/features/tenant/useDeviceLocationStore';

/** The one New client sheet, opened from the tab bar, Floor, walk-in or anywhere else. */
function GlobalQuickClient() {
  const { open, startVisit, anonymous, hide } = useQuickClient();
  if (!open) return null;
  return <QuickClientSheet visible startVisit={startVisit} anonymous={anonymous} onClose={hide} />;
}

/** Counts "helped" on the store traffic counter each time a visit starts. */
function HelpedCounterBridge() {
  const startedAt = useSessionStore((s) => s.sessionStartedAt);
  const last = useRef(startedAt);
  useEffect(() => {
    if (startedAt && startedAt !== last.current) useWalkInCounter.getState().markHelped(dayKey(resolveEffectiveLocationId()));
    last.current = startedAt;
  }, [startedAt]);
  return null;
}

export default function AppLayout() {
  const mode = useSessionStore((s) => s.mode);
  const handedToClient = usePrivacyStore((s) => s.handedToClient);

  // Badge counts for notification dots
  const { data: rxSummary } = useRxApprovalSummary();
  const { data: rxCounts } = useRxPipelineCounts();
  const { data: followUps } = useFollowUps();
  const { data: todayAppointments } = useTodayAppointments();
  const { hasAny } = usePermissions();
  // Review is the licensed optician's inbox (OOAQ): hidden for everyone else.
  const canReview = hasAny('org:rx:verify', 'org:rx:sign_off');

  // Hide TabBar in fitting and handed modes
  const hideTabBar = mode === 'fitting' || handedToClient;

  // HANDED mode: full-screen takeover — client cannot navigate away
  if (handedToClient) {
    return <HandedToClientView />;
  }

  // Compute badge counts
  const badges: Record<string, number> = {};
  // Show count of upcoming (non-completed) appointments as badge
  const upcomingCount = todayAppointments?.filter(
    (a: { status: string }) => a.status === 'scheduled' || a.status === 'confirmed'
  ).length ?? 0;
  if (upcomingCount > 0) badges.home = upcomingCount;
  if (rxCounts?.ready) badges.orders = rxCounts.ready;
  const callsDue = followUps?.filter((f) => f.due === 'call_now' || f.due === 'last_chance').length ?? 0;
  if (callsDue > 0) badges['follow-ups'] = callsDue;
  if (canReview && rxSummary?.submitted) badges.review = rxSummary.submitted;

  return (
    <View className="flex-1">
      {/* Persistent session bar — shows when session is active, across all tabs */}
      <SessionBar />
      {/* Keeps the active visit in step with Foundry (session + try-ons) */}
      <SessionServerBridge />
      <VisitOutboxWorker />
      <HelpedCounterBridge />
      <GlobalQuickClient />

      <Tabs
        tabBar={(props) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hideTabBar ? null : <FloatingTabBar {...(props as any)} badges={badges} hidden={canReview ? [] : ['review']} />
        }
        screenOptions={{
          headerShown: false,
          // Transparent tab bar background since we render our own floating bar
          tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
        }}
      >
        {/* V2 tabs (plan §4): Floor · Clients · Frames · Orders · Follow-ups · Review · Profile */}
        <Tabs.Screen name="home" options={{ title: 'Floor' }} />
        <Tabs.Screen name="clients" options={{ title: 'Clients' }} />
        <Tabs.Screen name="products" options={{ title: 'Frames' }} />
        <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
        <Tabs.Screen name="follow-ups" options={{ title: 'Follow-ups' }} />
        <Tabs.Screen name="review" options={{ title: 'Approvals' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        {/* Not tabs: Schedule is reached from Floor; tools from Profile */}
        <Tabs.Screen name="appointments" options={{ href: null }} />
        <Tabs.Screen name="more" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
