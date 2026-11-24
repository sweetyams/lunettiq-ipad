import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useMemo, useState } from 'react';
import { useFollowUps } from '@/src/api/useHotLeads';
import { DUE_LABELS, type FollowUp, type FollowUpDue } from '@/src/api/hotLeadsMapping';
import { Avatar } from '@/src/ui/Avatar';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { Badge, ListRow, PageHeader, Section, formatPhone, type BadgeTone } from '@/src/ui/kit';
import { FollowUpSheet } from '@/src/features/follow-ups/FollowUpSheet';
import { useLangStore } from '@/src/i18n';

const DUE_TONE: Record<FollowUpDue, BadgeTone> = {
  last_chance: 'danger',
  call_now: 'warning',
  email_sent: 'neutral',
  new: 'outline',
};
const PRIORITY_LABEL = {
  en: { hot: 'Very interested', warm: 'Interested', cold: 'Gentle nudge' },
  fr: { hot: 'Très intéressé', warm: 'Intéressé', cold: 'À relancer doucement' },
} as const;
const DUE_FR: Record<FollowUpDue, string> = { call_now: 'À appeler', last_chance: 'Dernière relance', email_sent: 'Courriel envoyé', new: 'Nouveau' };

function FollowUpRow({ item, first, onPress }: { item: FollowUp; first: boolean; onPress: () => void }) {
  const lang = useLangStore((s) => s.uiLang);
  const [firstName, ...rest] = item.clientName.split(' ');
  // No discount shown: the store no longer discounts (gap checklist, Nov 2026).
  const detail = [
    item.signalsLabel ?? (item.due === 'email_sent' ? (lang === 'fr' ? 'Pas encore ouvert' : 'No email opens yet') : null),
    PRIORITY_LABEL[lang][item.priority],
  ].filter(Boolean).join(' · ');
  const dueLabel = lang === 'fr' ? DUE_FR[item.due] : DUE_LABELS[item.due];
  return (
    <ListRow
      divider={!first}
      onPress={onPress}
      accessibilityLabel={`${item.clientName}, ${item.frame ?? 'frames tried'}, ${DUE_LABELS[item.due]}, day ${item.day}`}
      leading={<Avatar firstName={firstName ?? ''} lastName={rest.join(' ')} size="md" />}
      title={
        <Text className="text-body-lg font-medium text-text-primary" numberOfLines={1}>
          {item.clientName}
          {item.frame ? <Text className="font-normal text-text-tertiary">{`  ${item.frame}`}</Text> : null}
        </Text>
      }
      subtitle={detail}
      trailing={
        <View className="items-end gap-[6px]">
          <Badge tone={DUE_TONE[item.due]} dot>{dueLabel}</Badge>
          <Text className="text-body-sm text-text-tertiary" style={{ fontVariant: ['tabular-nums'] }}>
            {lang === 'fr' ? 'Jour' : 'Day'} {item.day}{item.phone ? ` · ${formatPhone(item.phone)}` : ''}
          </Text>
        </View>
      }
    />
  );
}

export default function FollowUpsScreen() {
  const fr = useLangStore((s) => s.uiLang) === 'fr';
  const [openItem, setOpenItem] = useState<FollowUp | null>(null);
  const { data, isLoading, error, refetch, isRefetching } = useFollowUps();
  const items = data ?? [];
  const today = useMemo(() => items.filter((i) => i.due === 'call_now' || i.due === 'last_chance'), [items]);
  const later = useMemo(() => items.filter((i) => i.due === 'email_sent' || i.due === 'new'), [items]);
  const open = (i: FollowUp) => setOpenItem(i);

  return (
    <View className="flex-1 bg-bg-page">
      <PageHeader
        title={fr ? 'Suivis' : 'Follow-ups'}
        subtitle={fr ? `${today.length} à contacter aujourd’hui · clients qui ont essayé sans acheter` : `${today.length} to contact today · clients who tried frames and didn’t buy`}
      />
      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={refetch} /> : items.length === 0 ? (
        <EmptyState message={fr ? 'Aucun suivi. Les clients qui essaient sans acheter apparaissent ici.' : 'No follow-ups. Clients who try frames and leave without buying appear here.'} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 32, paddingBottom: 140, gap: 24 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {today.length ? (
            <Section title={fr ? 'Aujourd’hui' : 'Today'} count={today.length} padded={false}>
              {today.map((i, idx) => <FollowUpRow key={i.id} item={i} first={idx === 0} onPress={() => open(i)} />)}
            </Section>
          ) : null}
          {later.length ? (
            <Section title={fr ? 'Plus tard' : 'Later'} count={later.length} padded={false}>
              {later.map((i, idx) => <FollowUpRow key={i.id} item={i} first={idx === 0} onPress={() => open(i)} />)}
            </Section>
          ) : null}
        </ScrollView>
      )}
      {openItem ? <FollowUpSheet item={openItem} onClose={() => setOpenItem(null)} /> : null}
    </View>
  );
}
