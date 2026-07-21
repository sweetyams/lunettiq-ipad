import React from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SecondSightFlow } from '@/src/features/second-sight';

export default function SecondSightScreen() {
  const router = useRouter();
  const { clientId, clientName, clientTier } = useLocalSearchParams<{
    clientId: string;
    clientName: string;
    clientTier: string;
  }>();

  if (!clientId || !clientName) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-page">
        <Text className="text-headline text-text-primary font-semibold">
          Missing client information
        </Text>
        <Text className="text-body text-text-muted mt-sm">
          Please select a client to start Second Sight intake
        </Text>
      </View>
    );
  }

  return (
    <SecondSightFlow
      clientId={clientId}
      clientName={clientName}
      clientTier={clientTier || 'essential'}
      onComplete={() => router.back()}
      onCancel={() => router.back()}
    />
  );
}