import { View, Text, Image, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import type { SessionPhoto } from './fitting.types';

interface ShelfThumbnailProps {
  photo: SessionPhoto;
  isSelected: boolean;
  onPress: () => void;
  onToggleSelect: () => void;
}

export function ShelfThumbnail({ photo, isSelected, onPress, onToggleSelect }: ShelfThumbnailProps) {
  const verdictColors = {
    loved: 'border-green',
    liked: 'border-blue',
    unsure: 'border-warning',
    rejected: 'border-midGrey',
  };

  const verdictBorderClass = photo.verdict ? verdictColors[photo.verdict] : 'border-warmGrey';
  const selectedBorderClass = isSelected ? 'border-green border-2' : 'border border-warmGrey';

  return (
    <View className="mr-sm">
      <Pressable
        onPress={onPress}
        onLongPress={onToggleSelect}
        className={`w-20 h-20 rounded-md overflow-hidden ${selectedBorderClass} ${verdictBorderClass} bg-white`}
        accessibilityRole="button"
        accessibilityLabel={`Photo ${photo.productName ? `of ${photo.productName}` : 'without product'}`}
      >
        <Image
          source={{ uri: photo.thumbnailUri }}
          className="w-full h-full"
          resizeMode="cover"
        />
        
        {/* Upload status indicator */}
        {photo.uploadStatus === 'uploading' && (
          <View className="absolute inset-0 bg-black/30 items-center justify-center">
            <View className="w-6 h-6 bg-white/80 rounded-full" />
          </View>
        )}
        
        {/* Selection indicator */}
        {isSelected && (
          <View className="absolute top-1 right-1 w-5 h-5 bg-green rounded-full items-center justify-center">
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
          </View>
        )}
        
        {/* Verdict indicator */}
        {photo.verdict && (
          <View className="absolute bottom-1 left-1 w-3 h-3 bg-white rounded-full border border-warmGrey" />
        )}
      </Pressable>
      
      {/* Product name */}
      {photo.productName && (
        <Text 
          className="text-caption text-charcoal mt-xs text-center" 
          numberOfLines={1}
        >
          {photo.productName}
        </Text>
      )}
    </View>
  );
}