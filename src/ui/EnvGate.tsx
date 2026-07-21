import { View, Text, ScrollView } from 'react-native';
import { validateEnv, type EnvValidationResult } from '@/src/env';

/**
 * Gate component that checks environment before rendering children.
 * Shows clear diagnostics on the iPad screen when config is wrong —
 * prevents cryptic Clerk/API errors.
 *
 * Only active in __DEV__. Production assumes env is correct (set at build time).
 */
export function EnvGate({ children }: { children: React.ReactNode }) {
  if (!__DEV__) return <>{children}</>;

  const result = validateEnv();
  if (result.valid) return <>{children}</>;

  return <EnvErrorScreen result={result} />;
}

function EnvErrorScreen({ result }: { result: EnvValidationResult }) {
  const problems = result.diagnostics.filter((d) => d.status !== 'ok');

  return (
    <View className="flex-1 bg-color-bg-inverse">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 48, paddingTop: 80 }}>
        {/* Header */}
        <Text className="text-color-warning text-caption-sm font-bold tracking-wider mb-xs">
          ENVIRONMENT CHECK FAILED
        </Text>
        <Text className="text-text-inverse text-heading-lg font-bold mb-sm">
          Missing Configuration
        </Text>
        <Text className="text-text-inverse/70 text-body-lg mb-xl leading-6">
          The app can't start because required environment variables are missing or invalid.
          Fix these in your{' '}
          <Text className="font-mono text-color-brand">.env.local</Text> file and restart Metro.
        </Text>

        {/* Problems */}
        {problems.map((d) => (
          <View key={d.key} className="bg-bg-elevated/10 rounded-lg p-lg mb-md border border-white/20">
            <View className="flex-row items-center mb-xs">
              <View className="w-2 h-2 rounded-full bg-color-error mr-sm" />
              <Text className="text-text-inverse/50 text-caption-sm font-bold tracking-wider">
                {d.status === 'missing' ? 'MISSING' : 'INVALID'}
              </Text>
            </View>
            <Text className="text-text-inverse text-body-lg font-mono mb-sm">{d.key}</Text>
            <Text className="text-color-brand text-body-md leading-5">{d.hint}</Text>
          </View>
        ))}

        {/* How to fix */}
        <View className="bg-bg-elevated/5 rounded-lg p-lg mt-lg border border-white/10">
          <Text className="text-text-inverse/50 text-[12px] font-bold tracking-wider mb-sm">
            HOW TO FIX
          </Text>
          <Text className="text-text-inverse/80 text-[15px] font-mono leading-6">
            {'1. Open: .env.local\n'}
            {'2. Set the missing values\n'}
            {'3. Restart Metro: npx expo start --clear\n'}
            {'4. Reload the app (Cmd+R in simulator)'}
          </Text>
        </View>

        {/* Quick reference */}
        <View className="bg-bg-elevated/5 rounded-lg p-lg mt-md border border-white/10">
          <Text className="text-text-inverse/50 text-[12px] font-bold tracking-wider mb-sm">
            REFERENCE — .env.local
          </Text>
          <Text className="text-text-inverse/80 text-[15px] font-mono leading-6">
            {'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxx\n'}
            {'EXPO_PUBLIC_FOUNDRY_BASE_URL=http://lunettiq.localhost:4000'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
