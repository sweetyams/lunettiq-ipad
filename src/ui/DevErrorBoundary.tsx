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
          <Pressable 
            onPress={this.handleRetry} 
            accessibilityRole="button"
            accessibilityLabel="Try again"
            className="bg-brand rounded-md px-lg py-sm min-h-[44px] justify-center"
          >
            <Text className="text-text-inverse text-body font-medium">Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View className="flex-1 bg-chrome-bg">
        {/* Header */}
        <View className="bg-error px-xl py-lg pt-[60px]">
          <Text className="text-text-inverse text-caption-md font-bold tracking-wider mb-xs">
            RENDER ERROR{this.props.context ? ` · ${this.props.context.toUpperCase()}` : ''}
          </Text>
          <Text className="text-text-inverse text-heading-md font-semibold" numberOfLines={3}>
            {error?.message ?? 'Unknown error'}
          </Text>
        </View>

        {/* Body */}
        <ScrollView className="flex-1 p-lg" contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Quick diagnosis */}
          {error?.message && <DiagnosisHint message={error.message} />}

          {/* Stack trace */}
          <Text className="text-text-muted text-caption-md font-bold tracking-wider mb-sm mt-lg">
            COMPONENT STACK
          </Text>
          <View className="bg-chrome-bg rounded-lg p-md">
            <Text className="text-text-inverse text-caption-md font-mono leading-5">
              {errorInfo?.componentStack?.trim() ?? 'No component stack available'}
            </Text>
          </View>

          {/* JS stack */}
          {error?.stack && (
            <>
              <Text className="text-text-muted text-caption-md font-bold tracking-wider mb-sm mt-lg">
                JS STACK
              </Text>
              <View className="bg-chrome-bg rounded-lg p-md">
                <Text className="text-text-inverse text-caption-md font-mono leading-5">
                  {error.stack.split('\n').slice(0, 15).join('\n')}
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Retry button */}
        <View className="absolute bottom-0 left-0 right-0 p-lg pb-[40px] bg-chrome-bg">
          <Pressable
            onPress={this.handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry after error"
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
    <View className="bg-brand/30 rounded-lg p-md mt-md border border-brand">
      <Text className="text-brand text-body-sm font-medium">{hint}</Text>
    </View>
  );
}
