import { Text, View } from 'react-native';
import { Button } from './Button';

interface ErrorStateProps {
  error: string | Error;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return (
    <View className="flex-1 bg-offWhite justify-center items-center p-xl">
      <View className="max-w-md items-center">
        {/* Error icon placeholder - could be replaced with actual icon */}
        <View className="w-16 h-16 bg-error rounded-full mb-lg items-center justify-center">
          <Text className="text-white text-2xl">⚠</Text>
        </View>
        
        <Text className="text-charcoal text-headline font-semibold text-center mb-md">
          Something went wrong
        </Text>
        
        <Text className="text-midGrey text-body text-center mb-xl">
          {errorMessage}
        </Text>
        
        <Button variant="primary" onPress={onRetry}>
          Try again
        </Button>
      </View>
    </View>
  );
}