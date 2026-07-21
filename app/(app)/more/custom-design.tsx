import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CustomDesignFlow } from '@/src/features/custom-design';
import { ScreenHeader } from '@/src/ui/ScreenHeader';
import { Button } from '@/src/ui/Button';

export default function CustomDesignScreen() {
  const router = useRouter();
  const { clientId, clientName } = useLocalSearchParams<{ 
    clientId: string; 
    clientName: string; 
  }>();

  if (!clientId || !clientName) {
    return (
      <View className="flex-1 bg-bg-page">
        <ScreenHeader title="Custom Designs" subtitle="Capture custom frame orders" />
        <View className="flex-1 justify-center items-center px-2xl">
          <Text className="text-headline font-semibold text-text-primary text-center">
            Select a client first
          </Text>
          <Text className="text-body text-text-muted text-center mt-sm">
            Open a client profile and tap "Custom Design" from the sidebar to start a design.
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
      <ScreenHeader title="Custom Design" subtitle={`For ${clientName}`} />
      <CustomDesignFlow 
        clientId={clientId} 
        clientName={clientName} 
      />
    </View>
  );
}
