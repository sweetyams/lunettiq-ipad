import React from 'react';
import { View, Text, Modal, ScrollView, Pressable, Image, Alert } from 'react-native'; import { Dimensions } from 'react-native';
import { Button } from '@/src/ui/Button';
import { useMultiPairRecommendations } from '@/src/api/useMultiPair';
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';

interface MultiPairResultsSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

interface BadgeProps {
  variant?: 'success' | 'warning' | 'default';
  children: React.ReactNode;
}

function Badge({ variant = 'default', children }: BadgeProps) {
  const colorClass = variant === 'success' ? 'text-success bg-success/10' : 
                     variant === 'warning' ? 'text-warning bg-warning/10' : 
                     'text-text-secondary bg-bg-muted';
  
  return (
    <View className={`px-sm py-xs rounded-md ${colorClass}`}>
      <Text className={`text-caption-md font-medium`}>
        {children}
      </Text>
    </View>
  );
}

interface ReadinessChipProps {
  label: string;
  status: 'complete' | 'missing' | 'partial';
}

function ReadinessChip({ label, status }: ReadinessChipProps) {
  const Icon = status === 'complete' ? CheckCircle : status === 'missing' ? XCircle : Clock;
  const iconColor = status === 'complete' ? '#16A34A' : status === 'missing' ? '#DC2626' : '#CA8A04';
  const bgClass = status === 'complete' ? 'bg-success/10' : status === 'missing' ? 'bg-error/10' : 'bg-warning/10';

  return (
    <View className={`flex-row items-center px-md py-sm rounded-md ${bgClass}`}>
      <Icon size={16} color={iconColor} />
      <Text className={`text-body-sm ml-xs ${status === 'complete' ? 'text-success' : status === 'missing' ? 'text-error' : 'text-warning'}`}>
        {label}
      </Text>
    </View>
  );
}

interface RecommendationCardProps {
  recommendation: {
    id: string;
    customerId: string;
    products: Array<{
      productId: string;
      productName: string;
      imageUrl?: string;
      reason: string;
      fitScore?: number;
    }>;
    rationale: string;
    category: 'everyday' | 'computer' | 'sun' | 'sport' | 'reading';
    priority: number;
    accepted: boolean;
  };
  onAddToWishlist: (productId: string) => void;
  onAddToSession: (productId: string) => void;
  addingToWishlist: boolean;
}

function RecommendationCard({ 
  recommendation, 
  onAddToWishlist, 
  onAddToSession, 
  addingToWishlist 
}: RecommendationCardProps) {
  // Use the first product from the recommendation
  const product = recommendation.products[0];
  if (!product) return null;

  return (
    <View className="bg-bg-surface rounded-lg border border-border p-md">
      <View className="flex-row gap-md">
        {/* Product Image */}
        <View className="w-20 h-20 rounded-md overflow-hidden bg-bg-muted">
          {product.imageUrl ? (
            <Image 
              source={{ uri: product.imageUrl }} 
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full justify-center items-center">
              <Text className="text-caption-md text-text-muted">No image</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-start justify-between mb-xs">
            <View className="flex-1">
              <Text className="text-heading-sm text-text-primary font-medium">
                {product.productName}
              </Text>
              <Text className="text-body-sm text-text-secondary">
                {recommendation.category}
              </Text>
            </View>
            <Badge variant="default">
              Priority {recommendation.priority}
            </Badge>
          </View>

          <Text className="text-body-sm text-text-secondary mb-md">
            {product.reason || recommendation.rationale}
          </Text>

          <View className="flex-row items-center justify-between">
            {product.fitScore && (
              <Badge variant={product.fitScore > 80 ? 'success' : product.fitScore > 60 ? 'warning' : 'default'}>
                {product.fitScore}% fit
              </Badge>
            )}
            
            <View className="flex-row gap-sm">
              <Button
                variant="ghost"
                className="px-sm py-xs"
                onPress={() => onAddToWishlist(product.productId)}
                loading={addingToWishlist}
              >
                Add to wishlist
              </Button>
              <Button
                variant="secondary"
                className="px-sm py-xs"
                onPress={() => onAddToSession(product.productId)}
              >
                Add to session
              </Button>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export function MultiPairResultsSheet({ clientId, visible, onClose }: MultiPairResultsSheetProps) {
  const { data: recommendations, isLoading, refetch } = useMultiPairRecommendations(clientId);

  const handleAddToWishlist = async (productId: string) => {
    // Placeholder handler - remove the actual API call since hook doesn't exist
    Alert.alert('Feature Coming Soon', 'Add to wishlist functionality will be available soon');
  };

  const handleAddToSession = (productId: string) => {
    // Placeholder implementation - actual session integration to be implemented
    Alert.alert('Success', 'Added to current session');
    onClose();
  };

  const handleRegenerate = () => {
    refetch();
  };

  if (!visible) return null;

  const readinessData = [
    { label: 'Lifestyle', status: 'complete' as const },
    { label: 'Rx', status: 'complete' as const },
    { label: 'Insurance', status: 'missing' as const },
  ];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center p-xl">
        <View className="bg-bg-surface rounded-lg border border-border w-full max-w-[720px]" style={{ flex: 1, maxHeight: 720 }}>
          {/* Header */}
          <View className="p-lg border-b border-border">
            <Text className="text-heading-lg text-text-primary font-medium">
              Multi-Pair Recommendations
            </Text>
            <Text className="text-body-md text-text-secondary mt-xs">
              AI-powered second pair suggestions
            </Text>
            
            {/* Readiness Chips */}
            <View className="flex-row flex-wrap gap-sm mt-md">
              {readinessData.map((item) => (
                <ReadinessChip
                  key={item.label}
                  label={item.label}
                  status={item.status}
                />
              ))}
            </View>
          </View>

          {/* Body */}
          <ScrollView style={{ flexGrow: 1, flexShrink: 1 }} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View className="p-lg">
                <Text className="text-body-md text-text-secondary text-center">
                  Generating recommendations...
                </Text>
              </View>
            ) : recommendations?.length ? (
              <View className="p-lg gap-md">
                {recommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    onAddToWishlist={handleAddToWishlist}
                    onAddToSession={handleAddToSession}
                    addingToWishlist={false}
                  />
                ))}
              </View>
            ) : (
              <View className="p-lg">
                <Text className="text-body-md text-text-secondary text-center">
                  No recommendations available. Complete the lifestyle questionnaire to get started.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View className="p-lg border-t border-border flex-row justify-between">
            <Button variant="ghost" onPress={handleRegenerate}>
              Regenerate
            </Button>
            <Button variant="primary" onPress={onClose}>
              Close
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}