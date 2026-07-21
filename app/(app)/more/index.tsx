import { View, Text, Pressable } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Settings, ArrowUpDown, Palette, LogOut } from 'lucide-react-native';

export default function MoreScreen() {
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="px-xl pt-2xl pb-lg border-b border-border">
        <Text className="text-displayLg text-text-primary">More</Text>
      </View>

      <View className="p-xl gap-sm">
        <View className="bg-bg-surface rounded-lg border border-border">
          <Pressable 
            onPress={() => router.push('/more/second-sight')}
            className="flex-row items-center px-lg py-md border-b border-border min-h-[44px]"
          >
            <ArrowUpDown color="#1A1A1A" size={18} />
            <Text className="text-body text-text-primary ml-md flex-1">Second Sight</Text>
          </Pressable>
          <Pressable 
            onPress={() => router.push('/more/custom-design')}
            className="flex-row items-center px-lg py-md border-b border-border min-h-[44px]"
          >
            <Palette color="#1A1A1A" size={18} />
            <Text className="text-body text-text-primary ml-md flex-1">Custom Designs</Text>
          </Pressable>
          <Pressable 
            onPress={() => router.push('/more/settings')}
            className="flex-row items-center px-lg py-md min-h-[44px]"
          >
            <Settings color="#1A1A1A" size={18} />
            <Text className="text-body text-text-primary ml-md flex-1">Settings</Text>
          </Pressable>
        </View>

        <View className="mt-lg">
          <Pressable
            onPress={() => signOut()}
            className="flex-row items-center px-lg py-md rounded-lg border border-border min-h-[44px]"
          >
            <LogOut color="#DC2626" size={18} />
            <Text className="text-body text-destructive ml-md">Sign Out</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
