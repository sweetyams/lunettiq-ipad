import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(app)/home');
      } else {
        // Handle other sign-in states if needed
        console.log('Sign-in not complete:', signInAttempt.status);
      }
    } catch (err: any) {
      Alert.alert('Sign In Error', err?.errors?.[0]?.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim() && password.trim();

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-navy"
    >
      <View className="flex-1 justify-center px-8">
        {/* Brand Area */}
        <View className="items-center mb-12">
          <Text className="text-offWhite text-4xl font-bold tracking-wider">
            LUNETTIQ
          </Text>
          <Text className="text-offWhite/70 text-lg mt-2">
            Sales Associate Portal
          </Text>
        </View>

        {/* Login Form */}
        <View className="space-y-6">
          <View>
            <Text className="text-offWhite text-lg font-medium mb-2">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#6B6B6B"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              className="bg-offWhite rounded-lg px-4 py-4 text-charcoal text-lg min-h-[44px]"
              editable={!isLoading}
            />
          </View>

          <View>
            <Text className="text-offWhite text-lg font-medium mb-2">
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#6B6B6B"
              secureTextEntry
              autoComplete="current-password"
              className="bg-offWhite rounded-lg px-4 py-4 text-charcoal text-lg min-h-[44px]"
              editable={!isLoading}
            />
          </View>

          <Pressable
            onPress={handleSignIn}
            disabled={!isFormValid || isLoading}
            className={`rounded-lg py-4 px-6 min-h-[44px] items-center justify-center mt-8 ${
              isFormValid && !isLoading
                ? 'bg-green'
                : 'bg-warmGrey'
            }`}
          >
            <Text className={`text-lg font-semibold ${
              isFormValid && !isLoading
                ? 'text-white'
                : 'text-midGrey'
            }`}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View className="mt-12 items-center">
          <Text className="text-offWhite/50 text-base">
            iPad App • Version 1.0
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}