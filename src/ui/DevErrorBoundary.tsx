import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

interface Props {
  children: ReactNode;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Dev-mode error boundary. Catches render errors and displays them
 * in a readable format on the iPad screen — no need to check Metro.
 *
 * In production, this would report to a crash service and show a
 * branded recovery screen.
 */
export class DevErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // In production: report to crash service
    console.error(`[DevErrorBoundary${this.props.context ? ` · ${this.props.context}` : ''}]`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo } = this.state;

    // Only show detailed info in __DEV__
    if (!__DEV__) {
      return (
        <View className="flex-1 bg-bg-page items-center justify-center p-xl">
          <Text className="text-text-primary text-headline font-semibold mb-md">
            Something went wrong
          </Text>
          <Pressable onPress={this.handleRetry} className="bg-brand rounded-md px-lg py-sm min-h-[44px] justify-center">
            <Text className="text-text-inverse text-body font-medium">Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View className="flex-1 bg-[#1a1a2e]">
        {/* Header */}
        <View className="bg-[#c53030] px-xl py-lg pt-[60px]">
          <Text className="text-text-inverse text-[13px] font-bold tracking-wider mb-xs">
            RENDER ERROR{this.props.context ? ` · ${this.props.context.toUpperCase()}` : ''}
          </Text>
          <Text className="text-text-inverse text-[20px] font-semibold" numberOfLines={3}>
            {error?.message ?? 'Unknown error'}
          </Text>
        </View>

        {/* Body */}
        <ScrollView className="flex-1 p-lg" contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Quick diagnosis */}
          {error?.message && <DiagnosisHint message={error.message} />}

          {/* Stack trace */}
          <Text className="text-[#8888aa] text-[12px] font-bold tracking-wider mb-sm mt-lg">
            COMPONENT STACK
          </Text>
          <View className="bg-[#0d0d1a] rounded-lg p-md">
            <Text className="text-[#ccccdd] text-[13px] font-mono leading-5">
              {errorInfo?.componentStack?.trim() ?? 'No component stack available'}
            </Text>
          </View>

          {/* JS stack */}
          {error?.stack && (
            <>
              <Text className="text-[#8888aa] text-[12px] font-bold tracking-wider mb-sm mt-lg">
                JS STACK
              </Text>
              <View className="bg-[#0d0d1a] rounded-lg p-md">
                <Text className="text-[#ccccdd] text-[13px] font-mono leading-5">
                  {error.stack.split('\n').slice(0, 15).join('\n')}
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Retry button */}
        <View className="absolute bottom-0 left-0 right-0 p-lg pb-[40px] bg-[#1a1a2e]">
          <Pressable
            onPress={this.handleRetry}
            className="bg-accent rounded-md py-md items-center min-h-[44px] justify-center"
          >
            <Text className="text-text-inverse text-body font-semibold">Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

/** Provides actionable hints for common errors */
function DiagnosisHint({ message }: { message: string }) {
  let hint: string | null = null;

  if (message.includes('publishableKey') || message.includes('clerk')) {
    hint = '→ Fix: Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env.local to your real Clerk key (starts with pk_test_ or pk_live_)';
  } else if (message.includes('Network request failed') || message.includes('fetch')) {
    hint = '→ Fix: Check that Foundry dev server is running (cd ../foundry && pnpm dev) and iPad is on same WiFi';
  } else if (message.includes('WatermelonDB') || message.includes('schema')) {
    hint = '→ Fix: Schema mismatch — try pnpm nuke to reset local DB';
  } else if (message.includes('Cannot find module') || message.includes('Unable to resolve')) {
    hint = '→ Fix: Metro cache stale — restart with: npx expo start --clear';
  }

  if (!hint) return null;

  return (
    <View className="bg-[#2d4a8a]/30 rounded-lg p-md mt-md border border-[#2d4a8a]">
      <Text className="text-[#88aaff] text-[14px] font-medium">{hint}</Text>
    </View>
  );
}
