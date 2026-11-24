import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Users, ClipboardList, PhoneCall, FileCheck, Lock, Glasses, UserPlus } from 'lucide-react-native';
import { useQuickClient } from '@/src/features/clients/useQuickClient';
import { useAuthContext } from '@/src/features/auth/AuthProvider';
import { useUser } from '@clerk/clerk-expo';
import { t as translate, useLangStore, type TKey } from '@/src/i18n';
import { useOperatorStore } from '@/src/features/auth/useOperatorStore';
import { useDesignTokens } from '@/src/features/design';
import { kitColors } from '@/src/ui/kit/colors';

/**
 * FloatingTabBar — Instagram-style floating bottom tab bar.
 *
 * - Semi-transparent white pill, centered at bottom
 * - Icons only, black. Active = thicker stroke + light grey circle
 * - Profile tab: solid brand circle with white initials
 * - Lock: last item in the pill, after a divider (not an edge tab over content)
 */

interface TabItemConfig {
  key: string;
  label: string;
  icon: typeof Home | null;
}

/** V2 tabs (plan §4). Matched to routes by name; routes not listed here are not tabs. */
const TAB_ITEMS: TabItemConfig[] = [
  { key: 'home', label: 'Floor', icon: Home },
  { key: 'clients', label: 'Clients', icon: Users },
  { key: 'products', label: 'Frames', icon: Glasses },
  { key: 'orders', label: 'Orders', icon: ClipboardList },
  { key: 'follow-ups', label: 'Follow-ups', icon: PhoneCall },
  { key: 'review', label: 'Approvals', icon: FileCheck },
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
  /** Tab keys to leave out (e.g. Review for staff who can't verify prescriptions). */
  hidden?: string[];
}

export function FloatingTabBar({ state, descriptors, navigation, badges, hidden }: FloatingTabBarProps) {
  const { lock } = useAuthContext();
  const { colors } = useDesignTokens();
  const { activeOperator } = useOperatorStore();
  const insets = useSafeAreaInsets();
  const showQuickClient = useQuickClient((st) => st.show);

  const { user } = useUser();
  const uiLang = useLangStore((st) => st.uiLang);
  // No operator = the device owner unlocked (Face ID); show the signed-in user.
  const operatorName = activeOperator?.name || user?.fullName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || '';
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
            backgroundColor: colors.bgElevated,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
            paddingVertical: 12,
            gap: 16,
          }}
          className="flex-row items-center rounded-full"
        >
          {state.routes.map((route, index) => {
            const tabItem = TAB_ITEMS.find((t) => t.key === route.name);
            if (!tabItem || hidden?.includes(tabItem.key)) return null;

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
                accessibilityLabel={(descriptor?.options?.tabBarAccessibilityLabel as string) ?? translate(uiLang, `tabs.${tabItem.key}` as TKey)}
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
                      backgroundColor: isFocused ? colors.brandSoft : 'transparent',
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
                        <Text style={{ color: colors.brandText, fontSize: 14, fontWeight: '700' }}>
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
                        minWidth: 20,
                        height: 20,
                        borderRadius: 10,
                        // Found UI: counts are quiet near-black pills; red is for problems only.
                        backgroundColor: kitColors.primary,
                        borderWidth: 2,
                        borderColor: kitColors.inverse,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: kitColors.inverse }}>
                        {badge > 99 ? '99+' : badge}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}

          {/* Lock lives inside the bar, after a hairline divider (Builder toolbar
              grouping). It used to be an edge tab floating over content, where a tap
              near the right end of a row locked the iPad by accident. */}
          <View style={{ width: 1, height: 28, backgroundColor: kitColors.border }} />
          {/* New client from any screen (gap checklist: "create customer reachable from any page"). */}
          <Pressable
            onPress={() => showQuickClient()}
            accessibilityRole="button"
            accessibilityLabel={translate(uiLang, 'tabs.newClient')}
            hitSlop={4}
            style={({ pressed }) => ({
              width: 52,
              height: 52,
              borderRadius: 26,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? kitColors.subtle : 'transparent',
            })}
          >
            <UserPlus size={24} color={colors.textPrimary} strokeWidth={1.6} />
          </Pressable>
          <Pressable
            onPress={lock}
            accessibilityRole="button"
            accessibilityLabel="Lock the iPad and switch user"
            hitSlop={4}
            style={({ pressed }) => ({
              width: 52,
              height: 52,
              borderRadius: 26,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? kitColors.subtle : 'transparent',
            })}
          >
            <Lock size={22} color={kitColors.icon} strokeWidth={1.6} />
          </Pressable>
        </View>
      </View>

    </View>
  );
}
