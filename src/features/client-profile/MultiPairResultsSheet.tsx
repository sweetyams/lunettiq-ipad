import { View, Text } from 'react-native';
import { Sheet, Card, CardHead, CardBody, Tag, Chip, Button } from '@/src/ui';
import { useMultiPairRecommendations, useInsuranceProfile } from '@/src/api/useMultiPair';
import { useClientPreferences } from '@/src/api/useClients';
import type { MultiPairRecommendation } from '@/src/api/multi-pair.types';

interface MultiPairResultsSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

export function MultiPairResultsSheet({ clientId, visible, onClose }: MultiPairResultsSheetProps) {
  const { data: recommendations, isLoading } = useMultiPairRecommendations(clientId);
  const { data: insurance } = useInsuranceProfile(clientId);
  const { data: preferences } = useClientPreferences(clientId);

  const categoryLabels: Record<string, string> = {
    everyday: 'everyday wear',
    computer: 'office and screens',
    sun: 'driving and sun',
    sport: 'active and sport',
    reading: 'reading and close work',
  };

  const formatCurrency = (amount: number): string =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // Compute coverage math per pair
  const getCoverageInfo = (priority: number): { covered: number; outOfPocket: number; exhausted: boolean } => {
    if (!insurance) return { covered: 0, outOfPocket: 0, exhausted: true };
    const remaining = insurance.pairsAllowed - insurance.pairsUsed;
    const coveragePerPair = (insurance.coverageAmount ?? 0) / insurance.pairsAllowed;
    if (priority <= remaining) {
      return { covered: coveragePerPair, outOfPocket: 0, exhausted: false };
    }
    return { covered: 0, outOfPocket: coveragePerPair, exhausted: true };
  };

  // Readiness tags
  const hasLifestyle = true; // Would come from questionnaire data
  const hasRx = true; // Would come from prescriptions
  const hasInsurance = !!insurance;

  const footer = (
    <>
      <Button variant="quiet" onPress={onClose}>Close</Button>
      <View className="flex-row gap-sm">
        <Button variant="ghost" onPress={() => {}}>Regenerate</Button>
        <Button variant="primary" onPress={() => {}}>Send to client</Button>
      </View>
    </>
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Multi-pair suggestions"
      subtitle={`Generated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
      wide
      footer={footer}
    >
      {isLoading ? (
        <View className="py-xl items-center">
          <Text className="text-body-md text-text-muted">Loading recommendations...</Text>
        </View>
      ) : !recommendations || recommendations.length === 0 ? (
        <View className="py-xl items-center">
          <Text className="text-body-md text-text-muted">No recommendations generated yet.</Text>
          <Text className="text-body-sm text-text-muted mt-sm">Fill lifestyle and insurance data to generate suggestions.</Text>
        </View>
      ) : (
        <View>
          {/* Readiness Tags */}
          <View className="flex-row gap-sm mb-lg items-center">
            <Tag label="Lifestyle" variant={hasLifestyle ? 'ok' : 'warn'} />
            <Tag label="Prescription" variant={hasRx ? 'ok' : 'warn'} />
            <Tag label="Insurance" variant={hasInsurance ? 'ok' : 'warn'} />
            <Text className="text-body-sm text-text-muted ml-auto">
              {hasLifestyle && hasRx && hasInsurance ? 'All three inputs present' : 'Some inputs missing'}
            </Text>
          </View>

          {/* Recommendation Cards */}
          {recommendations.map((rec: MultiPairRecommendation, idx: number) => {
            const coverage = getCoverageInfo(rec.priority);
            const product = rec.products[0];
            return (
              <Card key={rec.id} className="mb-md">
                <CardHead>
                  <Text className="text-heading-xs font-medium text-text-primary">
                    Pair {idx + 2} — {categoryLabels[rec.category] ?? rec.category}
                  </Text>
                  <Text className="text-body-sm font-mono text-text-primary">
                    {product ? formatCurrency(250) : '—'}
                  </Text>
                </CardHead>
                <CardBody>
                  <View className="flex-row gap-md">
                    {/* Product thumbnail placeholder */}
                    <View className="w-[168px] h-[104px] bg-bg-muted rounded-sm items-center justify-center">
                      <Text className="text-caption-md text-text-muted">
                        {product?.productName ?? 'No product'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-body-sm text-text-secondary">{rec.rationale}</Text>
                      <View className="flex-row gap-sm mt-[12px] items-center">
                        <Button variant="ghost" size="sm" onPress={() => {}}>Add to wishlist</Button>
                        <Button variant="quiet" size="sm" onPress={() => {}}>Add to session</Button>
                        <Text className="text-body-sm text-text-muted ml-auto">
                          {coverage.exhausted
                            ? `Plan exhausted · out of pocket ${formatCurrency(250)}`
                            : `Insurance covers ${formatCurrency(coverage.covered)} · out of pocket ${formatCurrency(coverage.outOfPocket)}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </CardBody>
              </Card>
            );
          })}

          {/* Excluded section */}
          {preferences?.stated?.avoid && preferences.stated.avoid.length > 0 && (
            <Card className="mt-md">
              <CardHead>
                <Text className="text-heading-xs font-medium text-text-primary">Excluded</Text>
              </CardHead>
              <CardBody>
                <View className="flex-row gap-sm items-center flex-wrap">
                  {preferences.stated.avoid.map((item: string) => (
                    <Chip key={item} label={item} variant="neg" />
                  ))}
                  <Text className="text-body-sm text-text-muted">
                    Filtered out by stated avoid list.
                  </Text>
                </View>
              </CardBody>
            </Card>
          )}
        </View>
      )}
    </Sheet>
  );
}
