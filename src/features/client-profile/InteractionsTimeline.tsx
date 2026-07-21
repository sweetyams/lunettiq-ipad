import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import {
  MessageCircle, Phone, Mail, MapPin, User, Calendar,
  AlertCircle, Star, Package, ThumbsUp, Plus, ChevronDown,
} from 'lucide-react-native';
import { useClientInteractions, useCreateInteraction, useUpdateInteraction } from '@/src/api/useClients';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { Card, LoadingState, Button } from '@/src/ui';
import { toast } from '@/src/ui/useToastStore';
import type { Interaction, InteractionType, CreateInteractionParams } from '@/src/api/clients.types';

interface InteractionsTimelineProps {
  clientId: string;
}

const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  note: 'Note',
  phone_call: 'Phone Call',
  email: 'Email',
  sms: 'SMS',
  in_store_visit: 'In-Store Visit',
  fitting: 'Fitting',
  purchase_assist: 'Purchase Assist',
  follow_up: 'Follow Up',
  complaint: 'Complaint',
  product_recommendation: 'Recommendation',
  preferences_updated: 'Preferences Updated',
  return_request: 'Return Request',
  appointment: 'Appointment',
  custom: 'Custom',
};

function getInteractionIcon(type: InteractionType) {
  const icons: Partial<Record<InteractionType, typeof MessageCircle>> = {
    note: MessageCircle,
    phone_call: Phone,
    email: Mail,
    in_store_visit: MapPin,
    fitting: User,
    appointment: Calendar,
    complaint: AlertCircle,
    product_recommendation: Star,
    purchase_assist: Package,
    follow_up: ThumbsUp,
  };
  return icons[type] ?? MessageCircle;
}

export function InteractionsTimeline({ clientId }: InteractionsTimelineProps) {
  const { data: interactions, isLoading } = useClientInteractions(clientId);
  const privacyMode = usePrivacyStore((s) => s.mode);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) return <Card><LoadingState /></Card>;

  // Filter internal interactions in client mode
  const filtered = (interactions ?? []).filter((i) => {
    if (privacyMode === 'client' && i.direction === 'internal') return false;
    return true;
  });

  const displayed = showAll ? filtered : filtered.slice(0, 5);

  return (
    <View>
      <View className="flex-row items-center mb-md">
        <MessageCircle color="#6B6B6B" size={20} />
        <Text className="text-headline text-text-primary font-semibold ml-sm">Timeline</Text>
        <Text className="text-caption text-text-muted ml-sm">
          {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        </Text>
        {privacyMode === 'staff' && (
          <Pressable
            onPress={() => setShowForm(true)}
            className="ml-auto min-w-[44px] min-h-[44px] items-center justify-center flex-row"
            accessibilityRole="button"
            accessibilityLabel="Add interaction"
          >
            <Plus color="#005D23" size={18} />
            <Text className="text-bodyStrong text-accent ml-xs">Add</Text>
          </Pressable>
        )}
      </View>

      {showForm && (
        <CreateInteractionForm
          clientId={clientId}
          onClose={() => setShowForm(false)}
        />
      )}

      <Card className="p-0">
        {displayed.length > 0 ? (
          <>
            {displayed.map((interaction, index) => (
              <InteractionRow
                key={interaction.id}
                interaction={interaction}
                clientId={clientId}
                isLast={index === displayed.length - 1}
              />
            ))}
            {!showAll && filtered.length > 5 && (
              <Pressable
                onPress={() => setShowAll(true)}
                className="py-md items-center border-t border-border"
                accessibilityRole="button"
                accessibilityLabel={`Show all ${filtered.length} entries`}
              >
                <View className="flex-row items-center">
                  <ChevronDown color="#005D23" size={16} />
                  <Text className="text-bodyStrong text-accent ml-xs">
                    Show all {filtered.length} entries
                  </Text>
                </View>
              </Pressable>
            )}
          </>
        ) : (
          <View className="p-lg">
            <Text className="text-body text-text-muted italic text-center">
              No interactions yet
            </Text>
          </View>
        )}
      </Card>
    </View>
  );
}

// ─── Single Interaction Row ──────────────────────────────────

function InteractionRow({
  interaction,
  clientId,
  isLast,
}: {
  interaction: Interaction;
  clientId: string;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(interaction.body ?? '');
  const updateInteraction = useUpdateInteraction();
  const privacyMode = usePrivacyStore((s) => s.mode);

  const Icon = getInteractionIcon(interaction.type);

  const handleSaveEdit = useCallback(() => {
    updateInteraction.mutate(
      { clientId, interactionId: interaction.id, data: { body: editBody } },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success('Updated');
        },
        onError: () => toast.error('Failed to update'),
      }
    );
  }, [clientId, interaction.id, editBody, updateInteraction]);

  return (
    <View className={`flex-row p-md ${!isLast ? 'border-b border-border' : ''}`}>
      <View className="mr-md mt-xs">
        <Icon size={18} color="#6B6B6B" />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center mb-xs">
          <Text className="text-captionStrong text-text-primary">
            {INTERACTION_TYPE_LABELS[interaction.type] ?? interaction.type}
          </Text>
          {interaction.direction !== 'internal' && (
            <View className="ml-sm bg-bg-page px-sm py-xs rounded-md">
              <Text className="text-caption text-text-muted">{interaction.direction}</Text>
            </View>
          )}
          <Text className="text-caption text-text-muted ml-auto">
            {formatRelativeDate(interaction.occurredAt)}
          </Text>
        </View>
        {interaction.subject && (
          <Text className="text-bodyStrong text-text-primary mb-xs">{interaction.subject}</Text>
        )}
        {editing ? (
          <View>
            <TextInput
              value={editBody}
              onChangeText={setEditBody}
              multiline
              className="text-body text-text-primary border border-border rounded-md px-md py-sm min-h-[44px] mb-sm"
              textAlignVertical="top"
            />
            <View className="flex-row gap-sm">
              <Pressable
                onPress={handleSaveEdit}
                className="min-h-[36px] px-md bg-accent rounded-md items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Save edit"
              >
                <Text className="text-caption text-text-inverse font-medium">Save</Text>
              </Pressable>
              <Pressable
                onPress={() => { setEditing(false); setEditBody(interaction.body ?? ''); }}
                className="min-h-[36px] px-md items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Cancel edit"
              >
                <Text className="text-caption text-text-muted">Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={privacyMode === 'staff' ? () => { setEditBody(interaction.body ?? ''); setEditing(true); } : undefined}
            accessibilityRole={privacyMode === 'staff' ? 'button' : 'text'}
            accessibilityLabel={privacyMode === 'staff' ? 'Tap to edit' : undefined}
          >
            <Text className="text-body text-text-primary">
              {interaction.body || interaction.subject || 'No details'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Create Interaction Form ─────────────────────────────────

function CreateInteractionForm({
  clientId,
  onClose,
}: {
  clientId: string;
  onClose: () => void;
}) {
  const createInteraction = useCreateInteraction();
  const [type, setType] = useState<InteractionType>('note');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');

  const quickTypes: InteractionType[] = [
    'note', 'phone_call', 'email', 'in_store_visit', 'follow_up', 'fitting',
  ];

  const handleSubmit = useCallback(() => {
    if (!body.trim() && !subject.trim()) {
      toast.error('Add a subject or body');
      return;
    }
    const data: CreateInteractionParams = {
      type,
      direction: 'internal',
      subject: subject.trim() || null,
      body: body.trim() || null,
    };
    createInteraction.mutate(
      { clientId, data },
      {
        onSuccess: () => {
          toast.success('Interaction logged');
          onClose();
        },
        onError: () => toast.error('Failed to log interaction'),
      }
    );
  }, [clientId, type, subject, body, createInteraction, onClose]);

  return (
    <Card className="mb-md">
      <Text className="text-bodyStrong text-text-primary mb-md">Log Interaction</Text>

      {/* Type selector */}
      <View className="flex-row flex-wrap gap-xs mb-md">
        {quickTypes.map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            className={`px-md py-sm rounded-md min-h-[36px] items-center justify-center ${
              type === t ? 'bg-brand' : 'bg-bg-page border border-border'
            }`}
            accessibilityRole="button"
            accessibilityLabel={`Type: ${INTERACTION_TYPE_LABELS[t]}`}
            accessibilityState={{ selected: type === t }}
          >
            <Text className={`text-caption font-medium ${type === t ? 'text-text-inverse' : 'text-text-primary'}`}>
              {INTERACTION_TYPE_LABELS[t]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Subject */}
      <TextInput
        value={subject}
        onChangeText={setSubject}
        placeholder="Subject (optional)"
        className="text-body text-text-primary border border-border rounded-md px-md py-sm mb-sm"
        placeholderTextColor="#6B6B6B"
      />

      {/* Body */}
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="What happened?"
        multiline
        numberOfLines={3}
        className="text-body text-text-primary border border-border rounded-md px-md py-sm mb-md min-h-[66px]"
        placeholderTextColor="#6B6B6B"
        textAlignVertical="top"
      />

      {/* Actions */}
      <View className="flex-row justify-end gap-sm">
        <Pressable
          onPress={onClose}
          className="min-h-[44px] px-lg items-center justify-center border border-border rounded-md"
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text className="text-bodyStrong text-text-primary">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={createInteraction.isPending}
          className={`min-h-[44px] px-lg items-center justify-center rounded-md ${
            createInteraction.isPending ? 'bg-accent/40' : 'bg-accent'
          }`}
          accessibilityRole="button"
          accessibilityLabel="Log interaction"
        >
          <Text className="text-bodyStrong text-text-inverse">
            {createInteraction.isPending ? 'Logging...' : 'Log'}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
