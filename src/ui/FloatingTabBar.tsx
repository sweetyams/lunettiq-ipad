import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  Users,
  Package,
  Calendar,
  Lock,
} from 'lucide-react-native';
import { useAuthContext } from '@/src/features/auth/AuthProvider';
import { useOperatorStore } from '@/src/features/auth/useOperatorStore';
import { useDesignTokens } from '@/src/features/design';

/**
 * FloatingTabBar — Instagram-style floating bottom tab bar.
 *
 * - Semi-transparent white pill, centered at bottom
 * - Icons only, black. Active = thicker stroke + light grey circle
 * - Profile tab: solid brand circle with white initials
 * - Lock: dark semi-transparent tab attached to right screen edge
 */

interface TabItemConfig {
  key: string;
  label: string;
  icon: typeof Home | null;
}

const TAB_ITEMS: TabItemConfig[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'clients', label: 'Clients', icon: Users },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'appointments', label: 'Schedule', icon: Calendar },
  { key: 'profile', label: 'Profile', icon: null },
];

interface TabBarNavigationState {
  index: number;
  routes: Array<{ key: string; name: string; params?: object }>;
}

interface FloatingTabBarProps {
  state: TabBarNavigationState;
  descriptors: Record<string, { options: Record<string, unknown> }>;
  navigation: {
    emit: (...args: unknown[]) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
  badges?: Record<string, number>;
}

export function FloatingTabBar({ state, descriptors, navigation, badges }: FloatingTabBarProps) {
  const { lock } = useAuthContext();
  const { colors } = useDesignTokens();
  const { activeOperator } = useOperatorStore();
  const insets = useSafeAreaInsets();

  const operatorName = activeOperator?.name ?? '';
  const initials = operatorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const bottomOffset = Math.max(insets.bottom, 12) + 20;

  return (
    <View className="absolute bottom-0 left-0 right-0" pointerEvents="box-none">
      {/* Main navigation pill — centered */}
      <View
        className="items-center"
        style={{ marginBottom: bottomOffset }}
        pointerEvents="box-none"
      >
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.06)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 12,
            paddingHorizontal: 12,
            paddingVertical: 12,
            gap: 16,
          }}
          className="flex-row items-center rounded-full"
        >
          {state.routes.map((route, index) => {
            const tabItem = TAB_ITEMS[index];
            if (!tabItem) return null;

            const descriptor = descriptors[route.key];
            const isFocused = state.index === index;
            const badge = badges?.[tabItem.key] ?? 0;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            const isProfile = tabItem.key === 'profile';

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={(descriptor?.options?.tabBarAccessibilityLabel as string) ?? tabItem.label}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  transform: [{ scale: pressed ? 0.9 : 1 }],
                })}
              >
                <View className="relative items-center justify-center">
                  {/* Active bg circle — always same size */}
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: isFocused ? 'rgba(0, 0, 0, 0.06)' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isProfile ? (
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          backgroundColor: colors.brand,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: colors.brandText, fontSize: 13, fontWeight: '700' }}>
                          {initials}
                        </Text>
                      </View>
                    ) : (
                      tabItem.icon && (
                        <tabItem.icon
                          size={26}
                          color={colors.textPrimary}
                          strokeWidth={isFocused ? 2.4 : 1.6}
                        />
                      )
                    )}
                  </View>

                  {/* Notification badge */}
                  {badge > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: colors.error,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>
                        {badge > 99 ? '99+' : badge}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Lock — semi-transparent black tab, right edge, vertically aligned with pill */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          bottom: bottomOffset + 14,
          backgroundColor: 'rgba(0, 0, 0, 0.50)',
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
          width: 44,
          height: 52,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Pressable
          onPress={lock}
          accessibilityRole="button"
          accessibilityLabel="Lock device and switch user"
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            transform: [{ scale: pressed ? 0.9 : 1 }],
            width: 44,
            height: 52,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Lock size={20} color="#FFFFFF" strokeWidth={1.8} />
        </Pressable>
      </View>
    </View>
  );
}
