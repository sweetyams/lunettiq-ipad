import { Text, View } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 bg-bg-page justify-center items-center p-xl">
      <View className="max-w-md items-center">
        {/* Empty state icon placeholder - clean Foundry style */}
        <View className="w-20 h-20 bg-bg-surface rounded-full mb-lg items-center justify-center border border-border">
          <Text className="text-text-muted text-2xl">📭</Text>
        </View>
        
        <Text className="text-text-primary text-headline font-semibold text-center mb-lg">
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