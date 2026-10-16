import { View, Text } from 'react-native';
import { useClientPreferences, useClientWishlist, useClientSegments } from '@/src/api/useClients';
import { useInsuranceProfile, useMultiPairQuestionnaire } from '@/src/api/useMultiPair';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { Badge, Button, KeyValue, Section, StatusDot, formatDate, formatDollars, formatPhone } from '@/src/ui/kit';
import type { ClientProfile, WishlistItem } from '@/src/api/clients.types';

export type ProfileSheet = 'insurance' | 'lifestyle' | 'multipair' | 'preferences' | 'contact' | 'notes' | 'tags';

export interface OverviewTabProps {
  clientId: string;
  client: ClientProfile;
  onOpenSheet: (sheet: ProfileSheet) => void;
}

/** Quiet one-line empty state inside a Section. */
function Empty({ children }: { children: string }) {
  return <Text className="text-body-sm text-text-tertiary">{children}</Text>;
}

function BadgeGroup({ label, values, tone = 'outline' }: { label: string; values: string[]; tone?: 'outline' | 'danger' }) {
  if (values.length === 0) return null;
  return (
    <View className="gap-[8px]">
      <Text className="text-body-sm text-text-tertiary">{label}</Text>
      <View className="flex-row flex-wrap gap-[6px]">
        {values.map((v) => <Badge key={v} tone={tone}>{v}</Badge>)}
      </View>
    </View>
  );
}

export function OverviewTab({ clientId, client, onOpenSheet }: OverviewTabProps) {
  const staff = usePrivacyStore((s) => s.mode) === 'staff';
  const { data: preferences } = useClientPreferences(clientId);
  const { data: wishlistRaw } = useClientWishlist(clientId);
  const { data: segments } = useClientSegments(clientId);
  const { data: insurance } = useInsuranceProfile(clientId);
  const { data: questionnaires } = useMultiPairQuestionnaire(clientId);

  // The API may return an array or { items }.
  const wishlist: WishlistItem[] = Array.isArray(wishlistRaw)
    ? wishlistRaw
    : Array.isArray((wishlistRaw as { items?: WishlistItem[] } | undefined)?.items)
      ? (wishlistRaw as unknown as { items: WishlistItem[] }).items
      : [];

  const stated = preferences?.stated;
  const shapes = stated?.shapes ?? [];
  const colours = stated?.colours ?? [];
  const materials = stated?.materials ?? [];
  const avoid = stated?.avoid ?? [];
  const hasPreferences = shapes.length + colours.length + materials.length + avoid.length > 0;

  // Tier lives in the header; show the rest once each.
  const tags = [...new Set((client.tags ?? []).filter((t) => !t.startsWith('member-')))];
  const hasInsurance = !!insurance?.provider;
  const lastQuestionnaire = Array.isArray(questionnaires) ? questionnaires[0] : undefined;
  const hasLifestyle = !!lastQuestionnaire;
  const lifestyleDate = lastQuestionnaire ? formatDate(lastQuestionnaire.completedAt ?? lastQuestionnaire.updatedAt) : null;

  const readiness = [
    { label: 'Lifestyle questionnaire', done: hasLifestyle, sheet: 'lifestyle' as const },
    { label: 'Insurance', done: hasInsurance, sheet: 'insurance' as const },
    { label: 'Frame preferences', done: hasPreferences, sheet: 'preferences' as const },
  ];
  const ready = readiness.every((r) => r.done);

  const address = client.defaultAddress
    ? [client.defaultAddress.city, client.defaultAddress.province].filter(Boolean).join(', ')
    : null;

  return (
    <View className="flex-row gap-[20px] items-start">
      {/* Left column: who they are */}
      <View className="flex-1 gap-[20px]">
        <Section title="Contact" action={staff ? { label: 'Edit', onPress: () => onOpenSheet('contact') } : undefined}>
          <KeyValue
            rows={[
              { label: 'Email', value: client.email },
              { label: 'Phone', value: formatPhone(client.phone) },
              { label: 'City', value: address },
              { label: 'Marketing', value: client.acceptsMarketing == null ? null : client.acceptsMarketing ? 'Subscribed' : 'Not subscribed' },
            ]}
          />
        </Section>

        <Section title="Frame preferences" action={{ label: hasPreferences ? 'Edit' : 'Add', onPress: () => onOpenSheet('preferences') }}>
          {hasPreferences ? (
            <View className="gap-[16px]">
              <BadgeGroup label="Shapes" values={shapes} />
              <BadgeGroup label="Colours" values={colours} />
              <BadgeGroup label="Materials" values={materials} />
              <BadgeGroup label="Avoid" values={avoid} tone="danger" />
            </View>
          ) : (
            <Empty>No preferences yet. Ask what they like during the visit.</Empty>
          )}
        </Section>

        <Section title="Wishlist" count={wishlist.length} padded={wishlist.length === 0}>
          {wishlist.length === 0 ? (
            <Empty>Nothing saved yet.</Empty>
          ) : (
            wishlist.slice(0, 6).map((item, i) => (
              <View key={item.id} className={`flex-row items-center justify-between px-[20px] min-h-[52px] ${i > 0 ? 'border-t border-border' : ''}`}>
                <Text className="text-body-md text-text-primary flex-1" numberOfLines={1}>{item.product?.title ?? 'Frame'}</Text>
                {item.product?.price != null ? (
                  <Text className="text-body-sm text-text-tertiary" style={{ fontVariant: ['tabular-nums'] }}>{formatDollars(item.product.price)}</Text>
                ) : null}
              </View>
            ))
          )}
        </Section>

        {staff ? (
          <Section title="Tags and segments" action={{ label: 'Manage', onPress: () => onOpenSheet('tags') }}>
            {tags.length === 0 && !segments?.length ? (
              <Empty>No tags or segments.</Empty>
            ) : (
              <View className="gap-[16px]">
                {tags.length ? (
                  <View className="flex-row flex-wrap gap-[6px]">
                    {tags.map((t) => <Badge key={t}>{t}</Badge>)}
                  </View>
                ) : null}
                {segments?.length ? <BadgeGroup label="Segments" values={[...new Set(segments.map((s) => s.name.en))]} /> : null}
              </View>
            )}
          </Section>
        ) : null}
      </View>

      {/* Right column: what we can do for them */}
      <View className="flex-1 gap-[20px]">
        <Section title="Multi-pair">
          <Text className="text-body-md text-text-secondary">
            {ready
              ? 'Everything is in. Suggest pairs for work, sun and screens.'
              : 'Suggestions for a second pair need three things on file.'}
          </Text>
          <View className="mt-[12px]">
            {readiness.map((r, i) => (
              <View key={r.label} className={`flex-row items-center gap-[10px] min-h-[44px] ${i > 0 ? 'border-t border-border' : ''}`}>
                <StatusDot tone={r.done ? 'success' : 'muted'} />
                <Text className={`flex-1 text-body-md ${r.done ? 'text-text-primary' : 'text-text-tertiary'}`}>{r.label}</Text>
                {r.done ? null : <Button label="Add" size="sm" variant="ghost" onPress={() => onOpenSheet(r.sheet)} />}
              </View>
            ))}
          </View>
          <View className="mt-[12px]">
            <Button label="Suggest pairs" size="sm" disabled={!ready} onPress={() => onOpenSheet('multipair')} />
          </View>
        </Section>

        <Section title="Insurance" action={{ label: hasInsurance ? 'Edit' : 'Add', onPress: () => onOpenSheet('insurance') }}>
          {hasInsurance ? (
            <KeyValue
              mono
              rows={[
                { label: 'Provider', value: insurance!.provider },
                { label: 'Pairs left', value: `${Math.max(0, insurance!.pairsAllowed - insurance!.pairsUsed)} of ${insurance!.pairsAllowed}` },
                { label: 'Coverage', value: insurance!.coverageAmount != null ? formatDollars(insurance!.coverageAmount) : null },
                { label: 'Renews', value: formatDate(insurance!.renewalDate) },
              ]}
            />
          ) : (
            <Empty>No insurance on file.</Empty>
          )}
        </Section>

        <Section title="Lifestyle" action={{ label: hasLifestyle ? 'Update' : 'Fill in · 2 min', onPress: () => onOpenSheet('lifestyle') }}>
          <Empty>{hasLifestyle ? `Completed${lifestyleDate ? ` ${lifestyleDate}` : ''}.` : 'Screens, driving, sport and sun: helps suggest the right lenses.'}</Empty>
        </Section>

        {staff ? (
          <Section title="Internal notes" action={{ label: client.enrichment?.internalNotes ? 'Edit' : 'Add', onPress: () => onOpenSheet('notes') }}>
            {client.enrichment?.internalNotes ? (
              <Text className="text-body-md text-text-primary">{client.enrichment.internalNotes}</Text>
            ) : (
              <Empty>Staff only. Never shown to the client.</Empty>
            )}
          </Section>
        ) : null}
      </View>
    </View>
  );
}
