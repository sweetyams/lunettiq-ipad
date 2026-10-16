import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSignIn, useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { admitAfterClerkLogin } from '@/src/features/auth/AuthProvider';
import { Wordmark } from '@/src/ui/Wordmark';

// Warm up the browser for Android to reduce auth load time
// On iOS, this is a no-op but we call it for consistency
export function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      void WebBrowser.warmUpAsync();
      return () => { void WebBrowser.coolDownAsync(); };
    }
  }, []);
}

WebBrowser.maybeCompleteAuthSession();

type Stage = 'main' | 'password';

export default function LoginScreen() {
  useWarmUpBrowser();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [stage, setStage] = useState<Stage>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSSO = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      // Use AuthSession redirect URI — this generates the correct scheme-based
      // callback URL that works with ASWebAuthenticationSession on iOS
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'lunettiq',
        path: 'auth-callback',
      });
      console.log('[AUTH] Redirect URL:', redirectUrl);
      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
        // Use ephemeral session to avoid iOS 18.4+ ASWebAuthenticationSession
        // HTTP/3 "network connection lost" bug. Clerk types restrict this to
        // showInRecents only, but the runtime passes it through to openAuthSessionAsync.
        authSessionOptions: {
          preferEphemeralSession: true,
        } as any,
      });
      if (createdSessionId && ssoSetActive) {
        await ssoSetActive({ session: createdSessionId });
        admitAfterClerkLogin();
        // Navigation is handled by the root gate once project discovery completes.
      }
    } catch (err: any) {
      Alert.alert('Sign In Error', err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSignIn = async () => {
    if (!isLoaded || !email.trim()) return;
    setIsLoading(true);
    try {
      // Try password first, fall back to email code
      if (password.trim()) {
        const attempt = await signIn.create({ identifier: email, password });
        if (attempt.status === 'complete') {
          await setActive({ session: attempt.createdSessionId });
          admitAfterClerkLogin();
          // Navigation handled by the root gate after project discovery.
        } else {
          Alert.alert('Sign In', `Status: ${attempt.status}`);
        }
      } else {
        // Request email verification code
        const attempt = await signIn.create({ identifier: email });
        if (attempt.status === 'complete') {
          await setActive({ session: attempt.createdSessionId });
          admitAfterClerkLogin();
          // Navigation handled by the root gate after project discovery.
        } else {
          Alert.alert('Check your email', 'A sign-in link or code was sent to your email.');
        }
      }
    } catch (err: any) {
      Alert.alert('Sign In Error', err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 flex-row bg-bg-page">
      {/* Brand panel — same dark ground and wordmark as the splash and PIN lock */}
      <View className="flex-1 bg-bg-inverse items-center justify-center px-2xl">
        <Wordmark tone="inverse" caption="In store" />
      </View>

      {/* Sign-in panel */}
      <View className="flex-1 justify-center items-center px-2xl">
        <View className="w-full max-w-[380px]">
          <View className="mb-2xl">
            <Text className="text-display-md text-text-primary">Sign in</Text>
            <Text className="text-body-md text-text-muted mt-xs">Use your Lunettiq staff account.</Text>
          </View>

          {stage === 'main' ? (
            <View className="gap-md">
              {/* Google SSO — Primary */}
              <Pressable
                onPress={handleGoogleSSO}
                disabled={isLoading}
                className="rounded-lg py-md px-lg min-h-[52px] items-center justify-center border border-border-strong bg-bg-page"
              >
                <Text className="text-body-md font-medium text-text-primary">
                  {isLoading ? 'Signing in...' : 'Continue with Google'}
                </Text>
              </Pressable>

              {/* Divider */}
              <View className="flex-row items-center py-sm">
                <View className="flex-1 h-[1px] bg-border" />
                <Text className="text-caption-md text-text-muted px-md">or</Text>
                <View className="flex-1 h-[1px] bg-border" />
              </View>

              {/* Email fallback */}
              <Pressable
                onPress={() => setStage('password')}
                className="rounded-lg py-md px-lg min-h-[52px] items-center justify-center bg-accent"
              >
                <Text className="text-body-md font-medium text-accent-text">Sign in with email</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-md">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#A3A3A3"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                className="border border-border rounded-lg px-md py-md text-body-md text-text-primary min-h-[44px] bg-bg-page"
                editable={!isLoading}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#A3A3A3"
                secureTextEntry
                autoComplete="current-password"
                className="border border-border rounded-lg px-md py-md text-body-md text-text-primary min-h-[44px] bg-bg-page"
                editable={!isLoading}
                onSubmitEditing={handlePasswordSignIn}
              />

              <Pressable
                onPress={handlePasswordSignIn}
                disabled={!email.trim() || isLoading}
                className={`rounded-lg py-md px-lg min-h-[44px] items-center justify-center ${
                  email.trim() && !isLoading ? 'bg-accent' : 'bg-bg-surface'
                }`}
              >
                <Text className={`text-body-md font-medium ${
                  email.trim() && !isLoading ? 'text-accent-text' : 'text-text-muted'
                }`}>
                  {isLoading ? 'Signing in...' : 'Continue'}
                </Text>
              </Pressable>

              <Pressable onPress={() => { setStage('main'); setPassword(''); }} className="items-center mt-sm min-h-[44px] justify-center">
                <Text className="text-body-sm text-text-muted">Back</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
