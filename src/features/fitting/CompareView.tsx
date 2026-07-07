import { View, Text, Image, ScrollView, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { Button } from '@/src/ui/Button';
import { VerdictControl } from './VerdictControl';
import type { SessionPhoto, Verdict } from './fitting.types';

interface CompareViewProps {
  photos: SessionPhoto[];
  onClose: () => void;
  onVerdictChange?: (photoId: string, verdict: Verdict) => void;
}

export function CompareView({ photos, onClose, onVerdictChange }: CompareViewProps) {
  const getGridLayout = (count: number) => {
    if (count <= 2) return { cols: 2, rows: 1 };
    return { cols: 2, rows: 2 };
  };

  const { cols, rows } = getGridLayout(photos.length);

  return (
    <View className="flex-1 bg-offWhite">
      {/* Header */}
      <View className="flex-row items-center justify-between p-lg border-b border-warmGrey bg-white">
        <Text className="text-headline text-charcoal font-semibold">
          Compare Frames
        </Text>
        <Pressable
          onPress={onClose}
          className="w-10 h-10 items-center justify-center rounded-full bg-warmGrey"
          accessibilityRole="button"
          accessibilityLabel="Close comparison"
        >
          <X size={20} color="#2B2B2B" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-lg" contentContainerStyle={{ flexGrow: 1 }}>
        {/* Photo Grid */}
        <View className="flex-1">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <View key={rowIndex} className="flex-row flex-1 gap-md mb-md">
              {Array.from({ length: cols }, (_, colIndex) => {
                const photoIndex = rowIndex * cols + colIndex;
                const photo = photos[photoIndex];
                
                if (!photo) {
                  return <View key={colIndex} className="flex-1" />;
                }

                return (
                  <View key={photo.id} className="flex-1 bg-white rounded-lg p-md border border-warmGrey">
                    {/* Photo */}
                    <View className="aspect-square rounded-lg overflow-hidden mb-md bg-warmGrey">
                      <Image
                        source={{ uri: photo.thumbnailUri }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>

                    {/* Product Info */}
                    <View className="mb-md">
                      <Text className="text-bodyStrong text-charcoal font-medium mb-xs">
                        {photo.productName || 'Unknown Frame'}
                      </Text>
                      {photo.notes && (
                        <Text className="text-caption text-midGrey" numberOfLines={2}>
                          {photo.notes}
                        </Text>
                      )}
                    </View>

                    {/* Verdict Control */}
                    {onVerdictChange && (
                      <VerdictControl
                        value={photo.verdict}
                        onChange={(verdict) => onVerdictChange(photo.id, verdict)}
                        size="small"
                      />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Action Bar */}
        <View className="mt-lg">
          <Button variant="primary" onPress={onClose}>
            Done Comparing
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}