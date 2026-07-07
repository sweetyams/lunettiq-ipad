import { Text, View } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 bg-offWhite justify-center items-center p-xl">
      <View className="max-w-md items-center">
        {/* Empty state icon placeholder - could be replaced with actual icon */}
        <View className="w-20 h-20 bg-warmGrey rounded-full mb-lg items-center justify-center">
          <Text className="text-midGrey text-2xl">📭</Text>
        </View>
        
        <Text className="text-charcoal text-headline font-semibold text-center mb-lg">
          {message}
        </Text>
        
        {actionLabel && onAction && (
          <Button variant="primary" onPress={onAction}>
            {actionLabel}
          </Button>
        )}
      </View>
    </View>
  );
}