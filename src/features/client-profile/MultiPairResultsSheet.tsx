/**
 * MultiPairResultsSheet — displays generated recommendations grouped by category.
 *
 * API: GET /api/admin/multi-pair/recommend?customerId={id}
 *      POST /api/admin/multi-pair/accept
 */
import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { X, Check, Glasses, Sun, Monitor, BookOpen, Dumbbell } from 'lucide-react-native';
import { useMultiPairRecommendations, useAcceptRecommendation } from '@/src/api/useMultiPair';
import { toast } from '@/src/ui/useToastStore';
import { Card } from '@/src/ui';
import type { MultiPairRecommendation } from '@/src/api/multi-pair.types';

const CATEGORY_META: Record<string, { label: string; icon: typeof Glasses; color: string }> = {
  everyday: { label: 'Everyday', icon: Glasses, color: '#1D1F21' },
  computer: { label: 'Computer / Office', icon: Monitor, color: '#023891' },
  sun: { label: 'Sunglasses', icon: Sun, color: '#B54708' },
  sport: { label: 'Sport / Active', icon: Dumbbell, color: '#067647' },
  reading: { label: 'Reading', icon: BookOpen, color: '#7C6F64' },
};

interface MultiPairResultsSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

export function MultiPairResultsSheet({ clientId, visible, onClose }: MultiPairResultsSheetProps) {
  const { data: recommendations, isLoading, error, refetch } = useMultiPairRecommendations(clientId);
  const acceptMutation = useAcceptRecommendation();
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

  const handleAccept = async (rec: MultiPairRecommendation) => {
    try {
      await acceptMutation.mutateAsync({
        recommendationId: rec.id,
        productIds: rec.products.map((p) => p.productId),
      });
      setAcceptedIds((prev) => new Set([...prev, rec.id]));
      toast.success('Accepted', `${CATEGORY_META[rec.category]?.label ?? rec.category} pair added to wishlist`);
    } catch {
      toast.error('Failed to accept', 'Please try again');
    }
  };

  // Group recommendations by category
  const grouped = (recommendations ?? []).reduce<Record<string, MultiPairRecommendation[]>>((acc, rec) => {
    const key = rec.category;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(rec);
    return acc;
  }, {});

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-bg-page">
        {/* Header */}
        <View className="flex-row items-center justify-between px-xl pt-xl pb-md border-b border-border">
          <Text className="text-displayMd text-text-primary">Multi-Pair Recommendations</Text>
          <Pressable onPress={onClose} className="w-11 h-11 items-center justify-center rounded-full bg-bg-muted" accessibilityRole="button" accessibilityLabel="Close">
            <X size={20} color="#737373" />
          </Pressable>
        </View>

        {/* Content */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#023891" />
            <Text className="text-body text-text-muted mt-lg">Analyzing lifestyle and Rx…</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-xl">
            <Text className="text-body text-text-muted mb-md">Failed to generate recommendations</Text>
            <Pressable onPress={() => refetch()} className="bg-accent rounded-md px-lg py-sm min-h-[44px] items-center justify-center">
              <Text className="text-accent-text text-bodyStrong">Retry</Text>
            </Pressable>
          </View>
        ) : !recommendations || recommendations.length === 0 ? (
          <View className="flex-1 items-center justify-center px-xl">
            <Glasses size={40} color="#D4D4D4" />
            <Text className="text-body text-text-muted mt-md text-center">
              No recommendations available. Ensure the client has a valid Rx and completed lifestyle questionnaire.
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-xl py-lg" showsVerticalScrollIndicator={false}>
            {Object.entries(grouped).map(([category, recs]) => {
              const meta = CATEGORY_META[category] ?? { label: category, icon: Glasses, color: '#737373' };
              const IconComponent = meta.icon;

              return (
                <View key={category} className="mb-xl">
                  {/* Category header */}
                  <View className="flex-row items-center mb-md">
                    <IconComponent size={20} color={meta.color} />
                    <Text className="text-bodyStrong text-text-primary ml-sm">{meta.label}</Text>
                  </View>

                  {/* Recommendation cards */}
                  {recs.map((rec) => {
                    const isAccepted = rec.accepted || acceptedIds.has(rec.id);

                    return (
                      <Card key={rec.id} className="mb-md p-md">
                        {/* Products */}
                        {rec.products.map((product) => (
                          <View key={product.productId} className="flex-row items-center mb-sm">
                            <View className="w-10 h-10 rounded-md bg-bg-muted items-center justify-center mr-md">
                              <Glasses size={18} color="#737373" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-body text-text-primary" numberOfLines={1}>
                                {product.productName}
                              </Text>
                              <Text className="text-caption text-text-muted" numberOfLines={1}>
                                {product.reason}
                              </Text>
                            </View>
                            {product.fitScore != null && (
                              <View className="bg-success/10 rounded-full px-sm py-xs">
                                <Text className="text-caption text-success font-medium">
                                  {Math.round(product.fitScore * 100)}%
                                </Text>
                              </View>
                            )}
                          </View>
                        ))}

                        {/* Rationale */}
                        <Text className="text-caption text-text-muted mt-sm mb-md italic">
                          {rec.rationale}
                        </Text>

                        {/* Accept button */}
                        {isAccepted ? (
                          <View className="flex-row items-center justify-center py-sm min-h-[44px]">
                            <Check size={16} color="#067647" />
                            <Text className="text-body text-success ml-xs font-medium">Added to wishlist</Text>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => handleAccept(rec)}
                            disabled={acceptMutation.isPending}
                            className="bg-accent rounded-md py-sm items-center min-h-[44px] justify-center"
                            accessibilityRole="button"
                            accessibilityLabel={`Accept ${meta.label} recommendation`}
                          >
                            <Text className="text-accent-text text-bodyStrong">Accept & add to wishlist</Text>
                          </Pressable>
                        )}
                      </Card>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
