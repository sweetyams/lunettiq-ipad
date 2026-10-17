import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Check, Heart } from 'lucide-react-native';
import { kitColors } from '@/src/ui/kit';
import type { SessionPhoto } from './fitting.types';

interface ShelfThumbnailProps {
  photo: SessionPhoto;
  isSelected: boolean;
  onPress: () => void;
  onToggleSelect: () => void;
}

/** Shelf photo: tap opens detail; the corner circle selects it for Compare. */
export function ShelfThumbnail({ photo, isSelected, onPress, onToggleSelect }: ShelfThumbnailProps) {
  const loved = photo.verdict === 'loved' || photo.verdict === 'liked';
  return (
    <View className="w-[88px] gap-[4px]">
      <Pressable
        onPress={onPress}
        onLongPress={onToggleSelect}
        accessibilityRole="button"
        accessibilityLabel={`Photo${photo.productName ? ` of ${photo.productName}` : ''}${photo.verdict ? `, ${photo.verdict}` : ''}`}
        className={`w-[88px] h-[88px] rounded-md overflow-hidden ${isSelected ? 'border-2 border-accent' : 'border border-border'}`}
      >
        <Image source={{ uri: photo.thumbnailUri }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
        {loved ? (
          <View className="absolute bottom-[6px] left-[6px] w-[22px] h-[22px] rounded-full bg-bg-page items-center justify-center">
            <Heart size={12} color={kitColors.text} fill={kitColors.text} />
          </View>
        ) : null}
      </Pressable>
      <Pressable
        onPress={onToggleSelect}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel="Select to compare"
        className={`absolute top-[6px] right-[6px] w-[24px] h-[24px] rounded-full items-center justify-center border ${isSelected ? 'bg-accent border-accent' : 'bg-bg-page border-border'}`}
      >
        {isSelected ? <Check size={14} color={kitColors.inverse} strokeWidth={3} /> : null}
      </Pressable>
      <Text className="text-body-sm text-text-secondary" numberOfLines={1}>{photo.productName ?? 'Not linked'}</Text>
    </View>
  );
}
