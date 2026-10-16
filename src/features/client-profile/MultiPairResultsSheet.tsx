import { View, Text } from 'react-native';
import { useMultiPairRecommendations, useAcceptRecommendation, useInsuranceProfile } from '@/src/api/useMultiPair';
import { useClientPreferences } from '@/src/api/useClients';
import { Sheet, Section, Badge, Button } from '@/src/ui/kit';
import { toast } from '@/src/ui/useToastStore';
import type { MultiPairRecommendation } from '@/src/api/multi-pair.types';

interface MultiPairResultsSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

const USE_LABEL: Record<MultiPairRecommendation['category'], string> = {
  everyday: 'Everyday',
  computer: 'Office and screens',
  sun: 'Driving and sun',
  sport: 'Active and sport',
  reading: 'Reading and close work',
};

export function MultiPairResultsSheet({ clientId, visible, onClose }: MultiPairResultsSheetProps) {
  const { data: recs, isLoading, error } = useMultiPairRecommendations(clientId);
  const { data: insurance } = useInsuranceProfile(clientId);
  const { data: preferences } = useClientPreferences(clientId);
  const accept = useAcceptRecommendation();

  const pairsLeft = insurance?.provider ? Math.max(0, insurance.pairsAllowed - insurance.pairsUsed) : null;
  const list = (recs ?? []).slice().sort((a, b) => a.priority - b.priority);
  const avoid = preferences?.stated?.avoid ?? [];

  const doAccept = async (rec: MultiPairRecommendation) => {
    try {
      await accept.mutateAsync({ recommendationId: rec.id, productIds: rec.products.map((p) => p.productId) });
      toast.success('Saved', `${USE_LABEL[rec.category]} pair marked as chosen.`);
    } catch {
      toast.error('Couldn’t save', 'Check the connection and try again.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      wide
      title="Second-pair suggestions"
      subtitle={pairsLeft == null ? 'No insurance on file.' : `Insurance covers ${pairsLeft} more ${pairsLeft === 1 ? 'pair' : 'pairs'} this period.`}
      footer={<View className="flex-1 flex-row justify-end"><Button label="Done" variant="primary" onPress={onClose} /></View>}
    >
      {isLoading ? (
        <Text className="text-body-md text-text-tertiary">Working out suggestions…</Text>
      ) : error || list.length === 0 ? (
        <Text className="text-body-md text-text-tertiary">No suggestions yet. Make sure lifestyle, insurance and preferences are filled in, then try again.</Text>
      ) : (
        <View className="gap-[16px]">
          {list.map((rec, i) => (
            <Section key={rec.id} title={`Pair ${i + 2} · ${USE_LABEL[rec.category] ?? rec.category}`}>
              <Text className="text-body-md text-text-secondary">{rec.rationale}</Text>
              {rec.products.length ? (
                <View className="mt-[12px] gap-[6px]">
                  {rec.products.map((p) => (
                    <View key={p.productId} className="flex-row items-center justify-between gap-[12px]">
                      <Text className="text-body-md font-medium text-text-primary flex-1" numberOfLines={1}>{p.productName}</Text>
                      {p.fitScore != null ? <Badge>{`Fit ${Math.round(p.fitScore <= 1 ? p.fitScore * 100 : p.fitScore)}%`}</Badge> : null}
                    </View>
                  ))}
                </View>
              ) : null}
              <View className="flex-row items-center gap-[12px] mt-[16px]">
                {pairsLeft != null ? (
                  <Badge tone={i < pairsLeft ? 'success' : 'neutral'} dot={i < pairsLeft}>{i < pairsLeft ? 'Covered by insurance' : 'Out of pocket'}</Badge>
                ) : null}
                <View className="flex-1" />
                {rec.accepted ? (
                  <Badge tone="success" dot>Chosen</Badge>
                ) : (
                  <Button label="Client wants this" size="sm" onPress={() => doAccept(rec)} disabled={accept.isPending} />
                )}
              </View>
            </Section>
          ))}
          {avoid.length ? (
            <Text className="text-body-sm text-text-tertiary">Left out because they said to avoid: {avoid.join(', ')}.</Text>
          ) : null}
        </View>
      )}
    </Sheet>
  );
}
