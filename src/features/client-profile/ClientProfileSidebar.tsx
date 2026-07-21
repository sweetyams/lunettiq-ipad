/**
 * ClientProfileSidebar — right-column overview panels.
 *
 * Renders: Quick Stats, Client P&L, Tags (add/remove), Insurance, Lifestyle, Multi-Pair.
 * All data from existing API hooks. NaN-safe calculations.
 */
import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Plus, X, TrendingUp } from 'lucide-react-native';
import {
  useUpdateClient,
  useClientPrescriptions,
} from '@/src/api/useClients';
import { useAppointments } from '@/src/api/useAppointments';
import { useInsuranceProfile, useMultiPairQuestionnaire } from '@/src/api/useMultiPair';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { Card } from '@/src/ui';
import { toast } from '@/src/ui/useToastStore';
import type { ClientProfile } from '@/src/api/clients.types';

// ─── Quick Stats ─────────────────────────────────────────────

interface QuickStatsProps {
  client: ClientProfile;
}

export function QuickStats({ client }: QuickStatsProps) {
  const orders = client.orderCount ?? 0;
  const totalSpent = client.totalSpent ?? 0;
  const memberSince = client.createdAt
    ? new Date(client.createdAt).toLocaleDateString('en-CA', { month: 'numeric', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <View className="mb-lg">
      <Text className="text-bodyStrong text-text-primary mb-sm">Quick Stats</Text>
      <Card className="p-md">
        <StatRow label="Orders" value={String(orders)} />
        <StatRow label="Total Spent" value={formatCurrency(totalSpent)} />
        <StatRow label="Member Since" value={memberSince} isLast />
      </Card>
    </View>
  );
}

// ─── Client P&L ──────────────────────────────────────────────

interface ClientPLProps {
  client: ClientProfile;
}

export function ClientPL({ client }: ClientPLProps) {
  const privacyMode = usePrivacyStore((s) => s.mode);
  if (privacyMode !== 'staff') return null;

  const totalSpent = client.totalSpent ?? 0;
  const orders = client.orderCount ?? 0;
  const aov = orders > 0 ? totalSpent / orders : 0;

  // Estimated margin (optical industry ~60-70% gross margin)
  const estimatedMargin = 0.65;
  const revenue = totalSpent;
  const grossProfit = revenue * estimatedMargin;

  // Frequency: orders per year since member
  const memberSinceDate = client.createdAt ? new Date(client.createdAt) : null;
  const yearsSinceMember = memberSinceDate
    ? Math.max(0.1, (Date.now() - memberSinceDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 1;
  const frequency = orders > 0 ? (orders / yearsSinceMember).toFixed(1) : '—';

  // Simple profitability classification
  const label = revenue === 0 ? 'New' : grossProfit > 500 ? 'Profitable' : grossProfit > 100 ? 'Break-even' : 'Unprofitable';
  const labelColor = revenue === 0 ? 'text-text-muted' : grossProfit > 500 ? 'text-success' : grossProfit > 100 ? 'text-warning' : 'text-error';

  return (
    <View className="mb-lg">
      <Text className="text-bodyStrong text-text-primary mb-sm">Client P&L</Text>
      <Card className="p-md">
        <View className="flex-row items-center mb-md">
          <TrendingUp size={16} color="#6B6B6B" />
          <Text className={`text-bodyStrong ml-sm ${labelColor}`}>{label}</Text>
        </View>
        <StatRow label="Revenue" value={formatCurrency(revenue)} />
        <StatRow label="Net profit" value={formatCurrency(grossProfit)} />
        <StatRow label="Orders" value={String(orders)} />
        <StatRow label="AOV" value={orders > 0 ? formatCurrency(aov) : '—'} />
        <StatRow label="Margin" value={orders > 0 ? `${Math.round(estimatedMargin * 100)}%` : '—'} />
        <StatRow label="Freq." value={typeof frequency === 'string' ? frequency : `${frequency}/yr`} isLast />
      </Card>
    </View>
  );
}

// ─── Identity Fields ─────────────────────────────────────────

interface IdentityFieldsProps {
  client: ClientProfile;
}

export function IdentityFields({ client }: IdentityFieldsProps) {
  const memberSince = client.createdAt
    ? new Date(client.createdAt).toLocaleDateString('en-CA', { month: 'numeric', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <View className="mb-lg">
      <Text className="text-bodyStrong text-text-primary mb-sm">Identity</Text>
      <Card className="p-md">
        <StatRow label="First Name" value={client.firstName ?? '—'} />
        <StatRow label="Last Name" value={client.lastName ?? '—'} />
        <StatRow label="Email" value={client.email ?? '—'} />
        <StatRow label="Phone" value={client.phone ?? '—'} />
        <StatRow label="Status" value={capitalize(client.status)} />
        <StatRow label="Lifecycle Stage" value="Customer" />
        <StatRow label="Acquisition Source" value="—" />
        <StatRow label="Member Since" value={memberSince} isLast />
      </Card>
    </View>
  );
}

// ─── Tag Management ──────────────────────────────────────────

interface TagManagementProps {
  client: ClientProfile;
}

export function TagManagement({ client }: TagManagementProps) {
  const privacyMode = usePrivacyStore((s) => s.mode);
  const updateClient = useUpdateClient();
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (privacyMode !== 'staff') return null;

  const handleAddTag = useCallback(() => {
    const tag = newTag.trim();
    if (!tag) return;
    if ((client.tags ?? []).includes(tag)) {
      toast.error('Tag already exists');
      return;
    }

    const updatedTags = [...(client.tags ?? []), tag];
    updateClient.mutate(
      { id: client.id, data: { tags: updatedTags } },
      {
        onSuccess: () => {
          setNewTag('');
          setIsAdding(false);
          toast.success('Tag added');
        },
        onError: () => toast.error('Failed to add tag'),
      }
    );
  }, [client.id, client.tags, newTag, updateClient]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const updatedTags = (client.tags ?? []).filter((t) => t !== tagToRemove);
    updateClient.mutate(
      { id: client.id, data: { tags: updatedTags } },
      {
        onSuccess: () => toast.success('Tag removed'),
        onError: () => toast.error('Failed to remove tag'),
      }
    );
  }, [client.id, client.tags, updateClient]);

  return (
    <View className="mb-lg">
      <View className="flex-row items-center justify-between mb-sm">
        <Text className="text-bodyStrong text-text-primary">Tags</Text>
        <Text className="text-caption text-text-muted">{(client.tags ?? []).length}</Text>
      </View>
      <Card className="p-md">
        {(client.tags ?? []).length > 0 ? (
          <View className="flex-row flex-wrap gap-sm mb-sm">
            {(client.tags ?? []).map((tag) => (
              <View key={tag} className="flex-row items-center bg-bg-muted rounded-md px-sm py-xs">
                <Text className="text-caption text-text-primary mr-xs">{tag}</Text>
                <Pressable
                  onPress={() => handleRemoveTag(tag)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove tag ${tag}`}
                  className="min-w-[20px] min-h-[20px] items-center justify-center"
                >
                  <X size={12} color="#737373" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-body text-text-muted italic mb-sm">No tags</Text>
        )}

        {isAdding ? (
          <View className="flex-row items-center gap-sm">
            <TextInput
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Tag name..."
              autoFocus
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
              className="flex-1 border border-border rounded-md px-sm py-xs text-body text-text-primary min-h-[36px]"
            />
            <Pressable
              onPress={handleAddTag}
              className="bg-brand rounded-md px-sm py-xs min-w-[44px] min-h-[36px] items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Confirm add tag"
            >
              <Plus size={16} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => { setIsAdding(false); setNewTag(''); }}
              className="min-w-[36px] min-h-[36px] items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Cancel add tag"
            >
              <X size={16} color="#737373" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setIsAdding(true)}
            className="flex-row items-center min-h-[36px]"
            accessibilityRole="button"
            accessibilityLabel="Add tag"
          >
            <Plus size={14} color="#737373" />
            <Text className="text-body text-text-muted ml-xs">Add tag…</Text>
          </Pressable>
        )}
      </Card>
    </View>
  );
}

// ─── Rx Status ───────────────────────────────────────────────

interface RxStatusProps {
  clientId: string;
}

export function RxStatus({ clientId }: RxStatusProps) {
  const { data: prescriptions } = useClientPrescriptions(clientId);

  let statusText = 'None on file';
  let statusColor = 'text-text-muted';

  if (prescriptions && prescriptions.length > 0) {
    // Find the most recent active/valid prescription
    const sorted = [...prescriptions].sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );
    const current = sorted[0]!;

    if (current.isValid) {
      const expiresAt = new Date(current.expiresAt);
      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry > 90) {
        statusText = `Valid until ${expiresAt.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' })}`;
        statusColor = 'text-success';
      } else if (daysUntilExpiry > 0) {
        statusText = `Expiring in ${daysUntilExpiry} days`;
        statusColor = 'text-warning';
      } else {
        statusText = 'Expired';
        statusColor = 'text-error';
      }
    } else {
      statusText = capitalize(current.status);
      statusColor = current.status === 'expired' ? 'text-error' : 'text-text-muted';
    }
  }

  return (
    <View className="flex-row justify-between items-center py-xs">
      <Text className="text-body text-text-muted">Rx Status</Text>
      <Text className={`text-body font-medium ${statusColor}`}>{statusText}</Text>
    </View>
  );
}

// ─── Next Appointment ────────────────────────────────────────

interface NextAppointmentProps {
  clientId: string;
}

export function NextAppointment({ clientId }: NextAppointmentProps) {
  // Query today's appointments and look for this client
  const today = new Date().toISOString().split('T')[0]!;
  const { data: appointments } = useAppointments({ date: today });

  // Find the next upcoming appointment for this client
  const now = Date.now();
  const clientAppointments = (appointments ?? [])
    .filter((a) => a.clientId === clientId && new Date(a.startsAt).getTime() > now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const next = clientAppointments[0];

  let displayText = '—';
  if (next) {
    const date = new Date(next.startsAt);
    displayText = date.toLocaleDateString('en-CA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <View className="flex-row justify-between items-center py-xs">
      <Text className="text-body text-text-muted">Next Appointment</Text>
      <Text className="text-body text-text-primary font-medium">{displayText}</Text>
    </View>
  );
}

// ─── Insurance Summary ───────────────────────────────────────

interface InsuranceSummaryProps {
  clientId: string;
  onEdit?: () => void;
}

export function InsuranceSummary({ clientId, onEdit }: InsuranceSummaryProps) {
  const { data: insurance } = useInsuranceProfile(clientId);

  if (!insurance) {
    return (
      <View className="mb-lg">
        <Text className="text-bodyStrong text-text-primary mb-sm">Insurance</Text>
        <Card className="p-md">
          <Text className="text-body text-text-muted italic mb-md">No insurance profile on file.</Text>
          {onEdit && (
            <Pressable
              onPress={onEdit}
              className="flex-row items-center min-h-[36px]"
              accessibilityRole="button"
              accessibilityLabel="Add insurance profile"
            >
              <Plus size={14} color="#023891" />
              <Text className="text-body text-accent ml-xs">Add insurance</Text>
            </Pressable>
          )}
        </Card>
      </View>
    );
  }

  return (
    <View className="mb-lg">
      <View className="flex-row items-center justify-between mb-sm">
        <Text className="text-bodyStrong text-text-primary">Insurance</Text>
        {onEdit && (
          <Pressable
            onPress={onEdit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Edit insurance profile"
            className="min-w-[44px] min-h-[28px] items-center justify-center"
          >
            <Text className="text-caption text-accent">Edit</Text>
          </Pressable>
        )}
      </View>
      <Card className="p-md">
        <StatRow label="Provider" value={insurance.provider} />
        <StatRow label="Pairs Allowed" value={String(insurance.pairsAllowed)} />
        <StatRow label="Pairs Used" value={String(insurance.pairsUsed)} />
        {insurance.renewalDate && (
          <StatRow label="Renewal" value={new Date(insurance.renewalDate).toLocaleDateString('en-CA')} />
        )}
        {insurance.coverageAmount != null && (
          <StatRow label="Coverage" value={formatCurrency(insurance.coverageAmount)} isLast />
        )}
      </Card>
    </View>
  );
}

// ─── Lifestyle Summary ───────────────────────────────────────

interface LifestyleSummaryProps {
  clientId: string;
  onFill?: () => void;
}

export function LifestyleSummary({ clientId, onFill }: LifestyleSummaryProps) {
  const { data: questionnaires } = useMultiPairQuestionnaire(clientId);
  const questionnaire = Array.isArray(questionnaires) ? questionnaires[0] : questionnaires;

  if (!questionnaire || !questionnaire.completedAt) {
    return (
      <View className="mb-lg">
        <Text className="text-bodyStrong text-text-primary mb-sm">Lifestyle</Text>
        <Card className="p-md">
          <Text className="text-body text-text-muted italic mb-md">
            No lifestyle questionnaire filled yet. Fill it to unlock better multi-pair recommendations.
          </Text>
          {onFill && (
            <Pressable
              onPress={onFill}
              className="flex-row items-center min-h-[36px]"
              accessibilityRole="button"
              accessibilityLabel="Fill lifestyle questionnaire"
            >
              <Plus size={14} color="#023891" />
              <Text className="text-body text-accent ml-xs">Fill questionnaire</Text>
            </Pressable>
          )}
        </Card>
      </View>
    );
  }

  return (
    <View className="mb-lg">
      <View className="flex-row items-center justify-between mb-sm">
        <Text className="text-bodyStrong text-text-primary">Lifestyle</Text>
        {onFill && (
          <Pressable
            onPress={onFill}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Edit lifestyle questionnaire"
            className="min-w-[44px] min-h-[28px] items-center justify-center"
          >
            <Text className="text-caption text-accent">Edit</Text>
          </Pressable>
        )}
      </View>
      <Card className="p-md">
        {questionnaire.answers.slice(0, 5).map((a) => (
          <StatRow
            key={a.questionId}
            label={a.questionText}
            value={Array.isArray(a.answer) ? a.answer.join(', ') : String(a.answer)}
          />
        ))}
        {questionnaire.answers.length > 5 && (
          <Text className="text-caption text-text-muted mt-sm">
            +{questionnaire.answers.length - 5} more answers
          </Text>
        )}
      </Card>
    </View>
  );
}

// ─── Multi-Pair Suggestion CTA ───────────────────────────────

interface MultiPairCTAProps {
  clientId: string;
  onGenerate?: () => void;
}

export function MultiPairCTA({ clientId, onGenerate }: MultiPairCTAProps) {
  return (
    <View className="mb-lg">
      <Text className="text-bodyStrong text-text-primary mb-sm">Multi-Pair Suggestions</Text>
      <Card className="p-md">
        <Text className="text-body text-text-muted mb-md">
          Generate personalized second/third pair recommendations based on this client's lifestyle, Rx, and insurance.
        </Text>
        <Pressable
          onPress={onGenerate}
          className="bg-accent rounded-md px-lg py-sm min-h-[44px] items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Generate multi-pair recommendations"
        >
          <Text className="text-accent-text text-bodyStrong">Generate Recommendations</Text>
        </Pressable>
      </Card>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function StatRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View className={`flex-row justify-between items-center py-xs ${isLast ? '' : 'border-b border-border'}`}>
      <Text className="text-body text-text-muted">{label}</Text>
      <Text className="text-body text-text-primary font-medium">{value}</Text>
    </View>
  );
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '—';
  if (amount === 0) return '$0.00';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
