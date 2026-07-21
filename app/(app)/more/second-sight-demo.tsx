import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function SecondSightDemo() {
  const router = useRouter();

  const startSecondSight = (clientId: string, clientName: string, clientTier: string) => {
    router.push({
      pathname: '/more/second-sight',
      params: { clientId, clientName, clientTier },
    });
  };

  return (
    <View className="flex-1 bg-bg-page p-lg justify-center">
      <Text className="text-displayLg text-text-primary font-bold text-center mb-xl">
        Second Sight Demo
      </Text>
      
      <Text className="text-body text-text-muted text-center mb-lg">
        Test the Second Sight intake flow with sample clients
      </Text>

      <View className="gap-md">
        <Pressable
          onPress={() => startSecondSight('demo-1', 'Marie Dubois', 'cult')}
          className="bg-bg-elevated border border-border rounded-lg p-lg"
        >
          <Text className="text-headline text-text-primary font-semibold">Marie Dubois</Text>
          <Text className="text-body text-text-muted">Cult Member • 1.15x multiplier</Text>
        </Pressable>

        <Pressable
          onPress={() => startSecondSight('demo-2', 'Jean Baptiste', 'essential')}
          className="bg-bg-elevated border border-border rounded-lg p-lg"
        >
          <Text className="text-headline text-text-primary font-semibold">Jean Baptiste</Text>
          <Text className="text-body text-text-muted">Essential • 1.0x multiplier</Text>
        </Pressable>

        <Pressable
          onPress={() => startSecondSight('demo-3', 'Sophie Laurent', 'vault')}
          className="bg-bg-elevated border border-border rounded-lg p-lg"
        >
          <Text className="text-headline text-text-primary font-semibold">Sophie Laurent</Text>
          <Text className="text-body text-text-muted">Vault Member • 1.25x multiplier</Text>
        </Pressable>
      </View>
    </View>
  );
}