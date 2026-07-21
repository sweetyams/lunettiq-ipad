import { View, Text, Pressable } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useInitialSync } from '@/src/sync';

export default function InitialSyncScreen() {
  const router = useRouter();
  const { progress, status, message, startSync, reset } = useInitialSync();

  useEffect(() => {
    // Auto-start sync when screen mounts
    startSync();
  }, []);

  useEffect(() => {
    // Navigate to home when sync completes
    if (status === 'complete') {
      setTimeout(() => {
        router.replace('/home');
      }, 1000);
    }
  }, [status, router]);

  const handleRetry = (): void => {
    reset();
    startSync();
  };

  return (
    <View className="flex-1 bg-brand justify-center items-center px-2xl">
      {/* Logo area */}
      <View className="mb-2xl">
        <Text className="text-text-inverse text-displayLg font-bold text-center">
          Lunettiq
        </Text>
        <Text className="text-text-inverse text-body text-center mt-sm">
          Preparing your workspace
        </Text>
      </View>

      {/* Progress bar container */}
      <View className="w-full max-w-md mb-lg">
        <View className="bg-border/30 h-2 rounded-full overflow-hidden">
          <View 
            className="bg-accent h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      {/* Status message */}
      <Text className="text-text-inverse text-body text-center mb-sm">
        {message}
      </Text>

      {/* Percentage */}
      <Text className="text-text-inverse text-caption">
        {Math.round(progress)}%
      </Text>

      {/* Error state */}
      {status === 'error' && (
        <View className="mt-xl items-center">
          <Text className="text-error text-body text-center mb-lg">
            Unable to download data. Check your internet connection.
          </Text>
          <Pressable
            onPress={handleRetry}
            className="bg-accent px-lg py-sm rounded-md min-w-[120px] min-h-[44px] justify-center items-center"
          >
            <Text className="text-text-inverse text-bodyStrong">
              Try Again
            </Text>
          </Pressable>
        </View>
      )}

      {/* Success state */}
      {status === 'complete' && (
        <View className="mt-xl items-center">
          <Text className="text-accent text-body text-center">
            Ready! Opening workspace...
          </Text>
        </View>
      )}
    </View>
  );
}