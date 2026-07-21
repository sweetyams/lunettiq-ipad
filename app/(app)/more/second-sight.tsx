import React from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SecondSightFlow } from '@/src/features/second-sight';
import { ScreenHeader } from '@/src/ui/ScreenHeader';
import { Button } from '@/src/ui/Button';

export default function SecondSightScreen() {
  const router = useRouter();
  const { clientId, clientName, clientTier } = useLocalSearchParams<{
    clientId: string;
    clientName: string;
    clientTier: string;
  }>();

  if (!clientId || !clientName) {
    return (
      <View className="flex-1 bg-bg-page">
        <ScreenHeader title="Second Sight" subtitle="Trade-in intake, grading, and credit" />
        <View className="flex-1 justify-center items-center px-2xl">
          <Text className="text-headline text-text-primary font-semibold text-center">
            Select a client first
          </Text>
          <Text className="text-body text-text-muted mt-sm text-center">
            Open a client profile and tap "Second Sight" from the sidebar to start an intake.
          </Text>
          <View className="mt-xl">
            <Button variant="primary" onPress={() => router.push('/clients')}>
              Go to Clients
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScreenHeader title="Second Sight" subtitle={`Intake for ${clientName}`} />
      <SecondSightFlow
        clientId={clientId}
        clientName={clientName}
        clientTier={clientTier || 'essential'}
        onComplete={() => router.back()}
        onCancel={() => router.back()}
      />
    </View>
  );
}
