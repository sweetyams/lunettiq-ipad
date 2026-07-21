import { View, Text, Pressable } from 'react-native';
import { Users, Plus, Package, ArrowUpDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  route: string;
  accessibilityLabel: string;
}

export function QuickActionsGrid() {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      label: 'Search clients',
      icon: <Users color="#1A1A1A" size={20} />,
      route: '/clients',
      accessibilityLabel: 'Search clients',
    },
    {
      label: 'New client',
      icon: <Plus color="#1A1A1A" size={20} />,
      route: '/clients',
      accessibilityLabel: 'Create new client',
    },
    {
      label: 'Browse products',
      icon: <Package color="#1A1A1A" size={20} />,
      route: '/products',
      accessibilityLabel: 'Browse product catalogue',
    },
    {
      label: 'Second Sight',
      icon: <ArrowUpDown color="#1A1A1A" size={20} />,
      route: '/more',
      accessibilityLabel: 'Open Second Sight trade-in',
    },
  ];

  return (
    <View className="bg-bg-surface border border-border rounded-lg p-md">
      <Text className="text-captionStrong text-text-muted uppercase tracking-wider mb-md">
        Quick Actions
      </Text>

      <View className="flex-row flex-wrap gap-sm">
        {actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => router.push(action.route as any)}
            className="bg-bg-page border border-border rounded-md p-md items-center justify-center min-h-[80px] min-w-[44px]"
            style={{ width: '48%' }}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
          >
            {action.icon}
            <Text className="text-caption text-text-primary font-medium mt-sm text-center">
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
