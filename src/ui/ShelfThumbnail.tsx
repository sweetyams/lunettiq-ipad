import { View, Pressable, Text, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { CameraOff } from 'lucide-react-native';
import { SessionPhoto } from '@/src/features/fitting/fitting.types';

interface ShelfThumbnailProps {
  photo: SessionPhoto;
  isSelected: boolean;
  onPress: (id: string) => void;
}

const verdictColors = {
  loved: '#005D23',
  liked: '#2D4A8A',
  unsure: '#D4A017',
  rejected: '#6B6B6B'
} as const;

export function ShelfThumbnail({ photo, isSelected, onPress }: ShelfThumbnailProps) {
  const verdictColor = photo.verdict ? verdictColors[photo.verdict] : undefined;
  const isUploading = photo.uploadStatus === 'uploading';
  
  return (
    <Pressable
      onPress={() => onPress(photo.id)}
      className="w-[120px] flex-none"
    >
      {/* Photo area with selection outline */}
      <View
        className={`
          w-[120px] h-[88px] rounded-lg bg-warmGrey overflow-hidden relative
          ${isSelected ? 'ring-[3px] ring-green' : ''}
        `}
      >
        {photo.localUri ? (
          <Image
            source={{ uri: photo.localUri }}
            className="w-full h-full"
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <CameraOff size={32} color="#6B6B6B" />
          </View>
        )}

        {/* Verdict dot */}
        {verdictColor && (
          <View
            className="absolute top-2 right-2 w-3 h-3 rounded-full"
            style={{ backgroundColor: verdictColor }}
          />
        )}

        {/* Upload status overlay */}
        {isUploading && (
          <View className="absolute inset-0 bg-black/20 items-center justify-center">
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Product name caption */}
      <Text
        className="text-caption text-midGrey mt-1"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {photo.productName || 'Unknown frame'}
      </Text>

      {/* Unlinked badge */}
      {!photo.productId && (
        <View className="bg-warning/20 rounded px-1 mt-0.5 self-start">
          <Text className="text-[10px] text-warning font-medium">Unlinked</Text>
        </View>
      )}
    </Pressable>
  );
}