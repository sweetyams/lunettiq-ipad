import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CustomDesignFlow } from '@/src/features/custom-design';

export default function CustomDesignScreen() {
  const { clientId, clientName } = useLocalSearchParams<{ 
    clientId: string; 
    clientName: string; 
  }>();

  if (!clientId || !clientName) {
    return (
      <View className="flex-1 bg-bg-page items-center justify-center p-2xl">
        <Text className="text-headline font-semibold text-text-primary text-center">
          Missing Client Information
        </Text>
        <Text className="text-body text-text-muted text-center mt-sm">
          This screen requires a client to be selected.
        </Text>
      </View>
    );
  }

  return (
    <CustomDesignFlow 
      clientId={clientId} 
      clientName={clientName} 
    />
  );
}