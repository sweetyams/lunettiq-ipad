import { useState, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useSignIn, useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { admitAfterClerkLogin } from '@/src/features/auth/AuthProvider';
import { Wordmark } from '@/src/ui/Wordmark';
import { Button, TextField } from '@/src/ui/kit';

// Warm up the browser for Android to reduce auth load time (no-op on iOS).
export function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      void WebBrowser.warmUpAsync();
      return () => { void WebBrowser.coolDownAsync(); };
    }
  }, []);
}

WebBrowser.maybeCompleteAuthSession();

type Stage = 'main' | 'email' | 'code';

/** Clerk errors carry the useful text in errors[0].longMessage. */
function clerkMessage(err: unknown, fallback: string): string {
  const e = err as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };
  return e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || e?.message || fallback;
}

export default function LoginScreen() {
  useWarmUpBrowser();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [stage, setStage] = useState<Stage>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async (sessionId: string | null | undefined) => {
    if (!sessionId) return;
    await setActive?.({ session: sessionId });
    admitAfterClerkLogin(); // the root gate navigates once the store is known
  };

  const google = async () => {
    if (!isLoaded) return;
    setBusy(true);
    setError(null);
    try {
      const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'lunettiq', path: 'auth-callback' });
      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
        // Ephemeral session avoids the iOS 18.4+ ASWebAuthenticationSession HTTP/3 bug.
        authSessionOptions: { preferEphemeralSession: true } as never,
      });
      if (createdSessionId && ssoSetActive) {
        await ssoSetActive({ session: createdSessionId });
        admitAfterClerkLogin();
      }
    } catch (err) {
      setError(clerkMessage(err, 'Google sign-in didn’t complete. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  /** Password if given; otherwise email a 6-digit code (Clerk email_code). */
  const continueWithEmail = async () => {
    if (!isLoaded || !email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      if (password) {
        const attempt = await signIn.create({ identifier: email.trim(), password });
        if (attempt.status === 'complete') await finish(attempt.createdSessionId);
        else setError('This account needs another step to sign in. Use Google, or ask a manager.');
        return;
      }
      const attempt = await signIn.create({ identifier: email.trim() });
      const factor = attempt.supportedFirstFactors?.find((f) => f.strategy === 'email_code') as { emailAddressId?: string } | undefined;
      if (!factor?.emailAddressId) {
        setError('Email codes aren’t enabled for this account. Enter your password.');
        return;
      }
      await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId });
      setStage('code');
    } catch (err) {
      setError(clerkMessage(err, 'Couldn’t sign in. Check the email and password.'));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    if (!isLoaded || code.trim().length < 6) return;
    setBusy(true);
    setError(null);
    try {
      const attempt = await signIn.attemptFirstFactor({ strategy: 'email_code', code: code.trim() });
      if (attempt.status === 'complete') await finish(attempt.createdSessionId);
      else setError('That code didn’t finish signing in. Request a new one.');
    } catch (err) {
      setError(clerkMessage(err, 'That code didn’t work. Check it, or request a new one.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 flex-row bg-bg-page">
      {/* Brand panel: same dark ground and wordmark as the splash and PIN lock */}
      <View className="flex-1 bg-bg-inverse items-center justify-center px-[48px]">
        <Wordmark tone="inverse" caption="In store" />
      </View>

      <View className="flex-1 justify-center items-center px-[48px]">
        <View className="w-full max-w-[400px] gap-[24px]">
          <View className="gap-[4px]">
            <Text className="text-display-lg text-text-primary">{stage === 'code' ? 'Check your email' : 'Sign in'}</Text>
            <Text className="text-body-md text-text-tertiary">
              {stage === 'code' ? `We sent a 6-digit code to ${email.trim()}.` : 'Use your Lunettiq staff account.'}
            </Text>
          </View>

          {stage === 'main' ? (
            <View className="gap-[12px]">
              <Button label={busy ? 'Signing in…' : 'Continue with Google'} variant="primary" size="lg" block onPress={google} disabled={busy} />
              <Button label="Use email instead" size="lg" block onPress={() => { setStage('email'); setError(null); }} />
            </View>
          ) : stage === 'email' ? (
            <View className="gap-[16px]">
              <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="username" editable={!busy} autoFocus />
              <TextField label="Password" hint="Leave empty to get a code by email instead." value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" editable={!busy} onSubmitEditing={continueWithEmail} />
              <Button label={busy ? 'Signing in…' : password ? 'Sign in' : 'Email me a code'} variant="primary" size="lg" block onPress={continueWithEmail} disabled={!email.trim() || busy} />
              <Pressable onPress={() => { setStage('main'); setPassword(''); setError(null); }} className="items-center min-h-[44px] justify-center" accessibilityRole="button">
                <Text className="text-body-sm text-text-tertiary">Back</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-[16px]">
              <TextField label="Code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" editable={!busy} autoFocus onSubmitEditing={verifyCode} />
              <Button label={busy ? 'Checking…' : 'Sign in'} variant="primary" size="lg" block onPress={verifyCode} disabled={code.length < 6 || busy} />
              <View className="flex-row justify-between">
                <Pressable onPress={() => { setStage('email'); setCode(''); setError(null); }} className="min-h-[44px] justify-center" accessibilityRole="button">
                  <Text className="text-body-sm text-text-tertiary">Use a different email</Text>
                </Pressable>
                <Pressable onPress={() => { setCode(''); void continueWithEmail(); }} className="min-h-[44px] justify-center" accessibilityRole="button" disabled={busy}>
                  <Text className="text-body-sm font-medium text-text-primary">Send a new code</Text>
                </Pressable>
              </View>
            </View>
          )}

          {error ? <Text className="text-body-sm text-error" accessibilityLiveRegion="polite">{error}</Text> : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
