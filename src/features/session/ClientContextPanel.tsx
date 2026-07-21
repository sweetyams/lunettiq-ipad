import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, ThumbsUp, HelpCircle, XCircle, FileText } from 'lucide-react-native';
import { useClient } from '@/src/api/useClients';
import { useInteractions } from '@/src/api/useInteractions';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { useSessionStore } from './useSessionStore';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { AiStylistPanel } from '@/src/ui/AiStylistPanel';
import type { FrameTried } from './useSessionStore';

// --- Constants ---

const AUTOSAVE_INTERVAL_MS = 30_000; // 30 seconds per spec

// --- Verdict display helpers ---

const VERDICT_ICONS = {
  loved: { icon: Heart, color: '#005D23', label: 'Loved' },
  liked: { icon: ThumbsUp, color: '#2D4A8A', label: 'Liked' },
  unsure: { icon: HelpCircle, color: '#D4A017', label: 'Unsure' },
  rejected: { icon: XCircle, color: '#6B6B6B', label: 'Rejected' },
} as const;

// --- Component ---

interface ClientContextPanelProps {
  clientId: string;
}

export function ClientContextPanel({ clientId }: ClientContextPanelProps) {
  const { data: client, isLoading, error, refetch } = useClient(clientId);
  const { data: interactionsData } = useInteractions(clientId);
  const mode = usePrivacyStore((s) => s.mode);
  const {
    sessionNotes,
    setSessionNotes,
    markNotesSaved,
    notesLastSavedAt,
    framesTried,
  } = useSessionStore();

  // Autosave notes every 30s
  const notesRef = useRef(sessionNotes);
  notesRef.current = sessionNotes;

  useEffect(() => {
    const interval = setInterval(() => {
      if (notesRef.current.trim()) {
        markNotesSaved();
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [markNotesSaved]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!client) return <ErrorState error={new Error('Client not found')} onRetry={() => refetch()} />;

  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || client.email || 'Unknown';
  const initials = [client.firstName?.[0], client.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  // Extract tier from tags
  const tierTag = client.tags?.find((t) => t.startsWith('member-'));
  const tier = tierTag ? tierTag.replace('member-', '').toUpperCase() : null;

  // Recent interactions (last 5)
  const recentInteractions = interactionsData?.interactions?.slice(0, 5) ?? [];

  return (
    <ScrollView className="flex-1 bg-bg-elevated p-lg" showsVerticalScrollIndicator={false}>
      {/* Identity header */}
      <View className="flex-row items-center mb-lg">
        <View className="w-14 h-14 rounded-full bg-brand items-center justify-center mr-md">
          <Text className="text-text-inverse text-headline font-bold">{initials}</Text>
        </View>

        <View className="flex-1">
          <Text className="text-text-primary text-headline font-semibold" numberOfLines={1}>
            {name}
          </Text>
          <View className="flex-row items-center mt-xs gap-sm">
            {tier && mode === 'staff' && (
              <View className="bg-brand rounded-full px-sm py-[2px]">
                <Text className="text-text-inverse text-captionStrong">{tier}</Text>
              </View>
            )}
            {mode === 'staff' && client.orderCount != null && (
              <Text className="text-text-muted text-caption">
                {client.orderCount} orders
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Fit Profile */}
      <SectionCard title="Fit Profile">
        {client.enrichment ? (
          <View className="gap-sm">
            {client.enrichment.faceShape && (
              <DataRow label="Face shape" value={client.enrichment.faceShape} />
            )}
            {client.enrichment.frameWidthMm && (
              <DataRow label="Frame width" value={`${client.enrichment.frameWidthMm}mm`} />
            )}
            {client.enrichment.bridgeWidthMm && (
              <DataRow label="Bridge width" value={`${client.enrichment.bridgeWidthMm}mm`} />
            )}
            {!client.enrichment.faceShape && !client.enrichment.frameWidthMm && !client.enrichment.bridgeWidthMm && (
              <Text className="text-text-muted text-body italic">No measurements yet</Text>
            )}
          </View>
        ) : (
          <Text className="text-text-muted text-body italic">No measurements yet</Text>
        )}
      </SectionCard>

      {/* Preferences */}
      <SectionCard title="Preferences">
        {client.enrichment?.customFields && Object.keys(client.enrichment.customFields).length > 0 ? (
          <View className="gap-sm">
            {Object.entries(client.enrichment.customFields).map(([key, value]) => (
              <DataRow key={key} label={formatLabel(key)} value={String(value)} />
            ))}
          </View>
        ) : (
          <Text className="text-text-muted text-body italic">No preferences recorded</Text>
        )}
      </SectionCard>

      {/* AI Stylist — staff only */}
      {mode === 'staff' && (
        <AiStylistPanel clientId={clientId} />
      )}

      {/* Frames Tried This Session */}
      {framesTried.length > 0 && (
        <SectionCard title={`Frames tried (${framesTried.length})`}>
          <View className="gap-sm">
            {framesTried.map((frame) => (
              <FrameTriedRow key={frame.id} frame={frame} />
            ))}
          </View>
        </SectionCard>
      )}

      {/* Session Notes (always editable, autosave) */}
      <SectionCard title="Session Notes">
        <TextInput
          value={sessionNotes}
          onChangeText={setSessionNotes}
          placeholder="Add notes about this session..."
          placeholderTextColor="#6B6B6B"
          multiline
          textAlignVertical="top"
          className="bg-bg-page border border-border rounded-lg p-md text-text-primary text-body min-h-[120px]"
          accessibilityLabel="Session notes"
          accessibilityHint="Notes are saved automatically every 30 seconds"
        />
        {notesLastSavedAt && (
          <Text className="text-text-muted text-caption mt-xs">
            Last saved {new Date(notesLastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </SectionCard>

      {/* Recent Activity — staff only */}
      {mode === 'staff' && recentInteractions.length > 0 && (
        <SectionCard title="Recent Activity">
          <View className="gap-sm">
            {recentInteractions.map((interaction) => (
              <View key={interaction.id} className="flex-row items-start">
                <FileText color="#6B6B6B" size={14} className="mt-[2px]" />
                <View className="flex-1 ml-sm">
                  <Text className="text-text-primary text-body" numberOfLines={1}>
                    {interaction.subject ?? interaction.type}
                  </Text>
                  <Text className="text-text-muted text-caption">
                    {formatRelativeTime(interaction.occurredAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </SectionCard>
      )}

      {/* Bottom spacing */}
      <View className="h-lg" />
    </ScrollView>
  );
}

// --- Sub-components ---

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-lg">
      <Text className="text-text-primary text-bodyStrong mb-sm">{title}</Text>
      <View className="bg-bg-page rounded-lg p-md border border-border">
        {children}
      </View>
    </View>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-text-muted text-body">{label}</Text>
      <Text className="text-text-primary text-body font-medium">{value}</Text>
    </View>
  );
}

function FrameTriedRow({ frame }: { frame: FrameTried }) {
  const verdictInfo = frame.verdict ? VERDICT_ICONS[frame.verdict] : null;
  const VerdictIcon = verdictInfo?.icon;

  return (
    <View className="flex-row items-center justify-between py-xs">
      <Text className="text-text-primary text-body flex-1" numberOfLines={1}>
        {frame.productName}
      </Text>
      {verdictInfo && VerdictIcon && (
        <View className="flex-row items-center ml-sm">
          <VerdictIcon color={verdictInfo.color} size={14} />
          <Text
            className="text-caption ml-xs"
            style={{ color: verdictInfo.color }}
          >
            {verdictInfo.label}
          </Text>
        </View>
      )}
    </View>
  );
}

// --- Helpers ---

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}
