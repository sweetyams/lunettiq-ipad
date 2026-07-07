import { View } from 'react-native';

export function LoadingState() {
  return (
    <View className="flex-1 bg-offWhite p-lg justify-center">
      <View className="space-y-md">
        {/* Header skeleton */}
        <View className="bg-warmGrey h-8 w-3/4 rounded-md animate-pulse" />
        
        {/* Content skeletons */}
        <View className="space-y-sm">
          <View className="bg-warmGrey h-4 w-full rounded-sm animate-pulse" />
          <View className="bg-warmGrey h-4 w-5/6 rounded-sm animate-pulse" />
          <View className="bg-warmGrey h-4 w-4/5 rounded-sm animate-pulse" />
        </View>
        
        {/* Additional content blocks */}
        <View className="space-y-sm mt-lg">
          <View className="bg-warmGrey h-6 w-1/2 rounded-md animate-pulse" />
          <View className="bg-warmGrey h-4 w-full rounded-sm animate-pulse" />
          <View className="bg-warmGrey h-4 w-3/4 rounded-sm animate-pulse" />
        </View>
        
        {/* Card skeleton */}
        <View className="bg-white rounded-lg p-md shadow-sm mt-lg">
          <View className="bg-warmGrey h-6 w-2/3 rounded-md animate-pulse mb-sm" />
          <View className="bg-warmGrey h-4 w-full rounded-sm animate-pulse mb-xs" />
          <View className="bg-warmGrey h-4 w-4/5 rounded-sm animate-pulse" />
        </View>
      </View>
    </View>
  );
}